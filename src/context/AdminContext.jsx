// src/context/AdminContext.jsx
// Bridges admin panel controls (maintenance, announcements, feature flags, etc.)
// to the rest of the app so regular users are actually affected.
//
// CROSS-TAB + SAME-TAB SYNC:
//   - 'storage' event fires in OTHER tabs when localStorage changes (cross-tab)
//   - A 2-second poll re-reads localStorage and syncs state in the SAME tab
//     (e.g. admin panel open in one tab, user dashboard in another same-origin tab,
//      or testing by opening both routes in the same browser session)

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

// ─── Default feature flags ────────────────────────────────────────────────────
const DEFAULT_FLAGS = {
  aiChat: true, summarizer: true, ocr: true, tableExtract: true, pptGen: true,
  docUpload: true, apiAccess: true, registration: true, login: true,
  newDashboard: false, experimental: false, betaFeatures: false, maintenanceBanner: false,
};

// ─── localStorage readers ────────────────────────────────────────────────────
function readMaintenance() {
  try { return JSON.parse(localStorage.getItem('admin_maintenance') || 'null'); } catch { return null; }
}
function readFlags() {
  try { return { ...DEFAULT_FLAGS, ...JSON.parse(localStorage.getItem('admin_flags') || '{}') }; }
  catch { return { ...DEFAULT_FLAGS }; }
}
function readAnnouncements() {
  try { return JSON.parse(localStorage.getItem('admin_announcements') || '[]'); } catch { return []; }
}

// ─── Context ──────────────────────────────────────────────────────────────────
const AdminContext = createContext(null);

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used inside <AdminProvider>');
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AdminProvider({ children }) {
  // ── Maintenance ─────────────────────────────────────────────────────────────
  const [maintenance, _setMaintenance] = useState(readMaintenance);

  const setMaintenance = useCallback((data) => {
    _setMaintenance(data);
    if (data) localStorage.setItem('admin_maintenance', JSON.stringify(data));
    else localStorage.removeItem('admin_maintenance');
  }, []);

  // ── Feature flags ────────────────────────────────────────────────────────────
  const [featureFlags, _setFeatureFlags] = useState(readFlags);

  const toggleFlag = useCallback((key) => {
    _setFeatureFlags(prev => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem('admin_flags', JSON.stringify(next));
      return next;
    });
  }, []);

  const setFlag = useCallback((key, value) => {
    _setFeatureFlags(prev => {
      const next = { ...prev, [key]: value };
      localStorage.setItem('admin_flags', JSON.stringify(next));
      return next;
    });
  }, []);

  // ── Announcements ────────────────────────────────────────────────────────────
  const [announcements, setAnnouncements] = useState(readAnnouncements);

  const publishAnnouncement = useCallback((item) => {
    setAnnouncements(prev => {
      const next = [item, ...prev.filter(x => x.id !== item.id)];
      localStorage.setItem('admin_announcements', JSON.stringify(next));
      return next;
    });
  }, []);

  const removeAnnouncement = useCallback((id) => {
    setAnnouncements(prev => {
      const next = prev.filter(x => x.id !== id);
      localStorage.setItem('admin_announcements', JSON.stringify(next));
      return next;
    });
  }, []);

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

  // ── Sync: storage event (cross-tab) + polling (same-tab fallback) ────────────
  useEffect(() => {
    // Cross-tab: browser fires 'storage' on all OTHER tabs when localStorage changes
    const onStorage = (e) => {
      if (e.key === 'admin_maintenance')   _setMaintenance(readMaintenance());
      else if (e.key === 'admin_flags')    _setFeatureFlags(readFlags());
      else if (e.key === 'admin_announcements') setAnnouncements(readAnnouncements());
    };
    window.addEventListener('storage', onStorage);

    // Same-tab fallback: poll every 2 seconds and update state if localStorage changed.
    // This handles the case where admin and user are in the same tab/session context,
    // and the 'storage' event doesn't fire (it only fires in OTHER tabs).
    const poll = setInterval(() => {
      _setMaintenance(prev => {
        const next = readMaintenance();
        // Only trigger re-render if value actually changed
        return JSON.stringify(prev) !== JSON.stringify(next) ? next : prev;
      });
      _setFeatureFlags(prev => {
        const next = readFlags();
        return JSON.stringify(prev) !== JSON.stringify(next) ? next : prev;
      });
      setAnnouncements(prev => {
        const next = readAnnouncements();
        return JSON.stringify(prev) !== JSON.stringify(next) ? next : prev;
      });
    }, 2000);

    return () => {
      window.removeEventListener('storage', onStorage);
      clearInterval(poll);
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