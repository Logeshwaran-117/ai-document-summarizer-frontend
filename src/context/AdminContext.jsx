// src/context/AdminContext.jsx
// Syncs maintenance mode, feature flags and announcements from the BACKEND
// so every user's browser is affected when an admin makes a change.
//
// Strategy:
//   - Admin writes  → POST /api/admin/app-settings   (persisted server-side)
//   - All users read → GET  /api/admin/app-settings  (polled every 4 seconds)
//   - localStorage is kept as a fast local cache / fallback for instant UI updates
//     in the admin's own tab, but the backend is always the source of truth.

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../api';

// ─── Default feature flags ────────────────────────────────────────────────────
const DEFAULT_FLAGS = {
  aiChat: true, summarizer: true, ocr: true, tableExtract: true, pptGen: true,
  docUpload: true, apiAccess: true, registration: true, login: true,
  newDashboard: false, experimental: false, betaFeatures: false, maintenanceBanner: false,
};

// ─── localStorage helpers (fast local cache) ─────────────────────────────────
const LS = {
  getMaintenance: () => { try { return JSON.parse(localStorage.getItem('admin_maintenance') || 'null'); } catch { return null; } },
  getFlags:       () => { try { return { ...DEFAULT_FLAGS, ...JSON.parse(localStorage.getItem('admin_flags') || '{}') }; } catch { return { ...DEFAULT_FLAGS }; } },
  getAnnouncements: () => { try { return JSON.parse(localStorage.getItem('admin_announcements') || '[]'); } catch { return []; } },
  setMaintenance: (v) => v ? localStorage.setItem('admin_maintenance', JSON.stringify(v)) : localStorage.removeItem('admin_maintenance'),
  setFlags:       (v) => localStorage.setItem('admin_flags', JSON.stringify(v)),
  setAnnouncements: (v) => localStorage.setItem('admin_announcements', JSON.stringify(v)),
};

// ─── Context ──────────────────────────────────────────────────────────────────
const AdminContext = createContext(null);

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used inside <AdminProvider>');
  return ctx;
}

// ─── Push settings to backend ─────────────────────────────────────────────────
async function pushToBackend(patch) {
  try {
    await api.post('/admin/app-settings', patch);
  } catch (err) {
    // Non-fatal: local state is already updated; backend will catch up on next poll
    console.warn('[AdminContext] Failed to push settings to backend:', err?.response?.status);
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AdminProvider({ children }) {
  // Initialise from localStorage cache for instant render, backend poll will correct it
  const [maintenance,   _setMaintenance]   = useState(LS.getMaintenance);
  const [featureFlags,  _setFeatureFlags]  = useState(LS.getFlags);
  const [announcements, _setAnnouncements] = useState(LS.getAnnouncements);

  // ── Emergency alert ──────────────────────────────────────────────────────────
  const [emergencyAlert, setEmergencyAlert] = useState(null);

  // ── Broadcasts ───────────────────────────────────────────────────────────────
  const [broadcasts, setBroadcasts] = useState([]);
  const pushBroadcast = useCallback((msg) => {
    setBroadcasts(prev => [{ ...msg, id: Date.now(), receivedAt: new Date(), dismissed: false }, ...prev]);
  }, []);
  const dismissBroadcast = useCallback((id) => {
    setBroadcasts(prev => prev.map(x => x.id === id ? { ...x, dismissed: true } : x));
  }, []);

  // ── Maintenance ─────────────────────────────────────────────────────────────
  const setMaintenance = useCallback((data) => {
    // 1. Update local state immediately (instant UI feedback for admin)
    _setMaintenance(data);
    LS.setMaintenance(data);
    // 2. Push to backend so ALL users are affected
    pushToBackend({ maintenance: data });
  }, []);

  // ── Feature flags ────────────────────────────────────────────────────────────
  const toggleFlag = useCallback((key) => {
    _setFeatureFlags(prev => {
      const next = { ...prev, [key]: !prev[key] };
      LS.setFlags(next);
      pushToBackend({ featureFlags: next });
      return next;
    });
  }, []);

  const setFlag = useCallback((key, value) => {
    _setFeatureFlags(prev => {
      const next = { ...prev, [key]: value };
      LS.setFlags(next);
      pushToBackend({ featureFlags: next });
      return next;
    });
  }, []);

  // ── Announcements ────────────────────────────────────────────────────────────
  const publishAnnouncement = useCallback((item) => {
    _setAnnouncements(prev => {
      const next = [item, ...prev.filter(x => x.id !== item.id)];
      LS.setAnnouncements(next);
      pushToBackend({ announcements: next });
      return next;
    });
  }, []);

  const removeAnnouncement = useCallback((id) => {
    _setAnnouncements(prev => {
      const next = prev.filter(x => x.id !== id);
      LS.setAnnouncements(next);
      pushToBackend({ announcements: next });
      return next;
    });
  }, []);

  // ── Backend polling (source of truth for ALL users) ──────────────────────────
  // Polls every 4 seconds. Compares JSON to avoid needless re-renders.
  const prevRef = useRef({ maintenance: null, featureFlags: {}, announcements: [] });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await api.get('/admin/app-settings');

        // Maintenance
        if (JSON.stringify(data.maintenance) !== JSON.stringify(prevRef.current.maintenance)) {
          prevRef.current.maintenance = data.maintenance;
          _setMaintenance(data.maintenance);
          LS.setMaintenance(data.maintenance);
        }

        // Feature flags (merge with defaults)
        const mergedFlags = { ...DEFAULT_FLAGS, ...data.featureFlags };
        if (JSON.stringify(mergedFlags) !== JSON.stringify(prevRef.current.featureFlags)) {
          prevRef.current.featureFlags = mergedFlags;
          _setFeatureFlags(mergedFlags);
          LS.setFlags(mergedFlags);
        }

        // Announcements
        if (JSON.stringify(data.announcements) !== JSON.stringify(prevRef.current.announcements)) {
          prevRef.current.announcements = data.announcements || [];
          _setAnnouncements(data.announcements || []);
          LS.setAnnouncements(data.announcements || []);
        }
      } catch {
        // Backend unreachable — fall back to localStorage cache silently
      }
    };

    // Fetch immediately on mount, then every 4 seconds
    fetchSettings();
    const poll = setInterval(fetchSettings, 4000);

    // Also handle cross-tab localStorage changes (same browser, different tab)
    const onStorage = (e) => {
      if (e.key === 'admin_maintenance')    _setMaintenance(LS.getMaintenance());
      else if (e.key === 'admin_flags')     _setFeatureFlags(LS.getFlags());
      else if (e.key === 'admin_announcements') _setAnnouncements(LS.getAnnouncements());
    };
    window.addEventListener('storage', onStorage);

    return () => {
      clearInterval(poll);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  // ── Computed ─────────────────────────────────────────────────────────────────
  const isMaintenanceActive = maintenance?.enabled === true;
  const activeAnnouncements = announcements.filter(a => {
    if (a.status !== 'active') return false;
    if (a.expiresAt && new Date(a.expiresAt) < new Date()) return false;
    return true;
  });
  const activeBroadcasts = broadcasts.filter(b => !b.dismissed);

  return (
    <AdminContext.Provider value={{
      maintenance, setMaintenance, isMaintenanceActive,
      featureFlags, toggleFlag, setFlag,
      announcements, activeAnnouncements, publishAnnouncement, removeAnnouncement,
      broadcasts, activeBroadcasts, pushBroadcast, dismissBroadcast,
      emergencyAlert, setEmergencyAlert,
    }}>
      {children}
    </AdminContext.Provider>
  );
}