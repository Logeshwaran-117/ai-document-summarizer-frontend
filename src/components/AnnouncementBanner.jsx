// src/components/AnnouncementBanner.jsx
// Reads active announcements from AdminContext and renders them
// as banners, toasts, or popups depending on their display setting.
//
// Add <AnnouncementBanner user={user} /> just inside the <main> tag in Dashboard.jsx
// (right above <Routes>)

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdmin } from '../context/AdminContext';
import {
  X, Info, CheckCircle, AlertTriangle, XCircle,
  Star, Wrench, Package, Bell,
} from 'lucide-react';

const TYPE_CONFIG = {
  Information:    { icon: Info,         color: '#06b6d4', bg: 'rgba(6,182,212,0.12)',   border: 'rgba(6,182,212,0.3)'  },
  Success:        { icon: CheckCircle,  color: '#10b981', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.3)' },
  Warning:        { icon: AlertTriangle,color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)' },
  Error:          { icon: XCircle,      color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.3)'  },
  Promotion:      { icon: Star,         color: '#ec4899', bg: 'rgba(236,72,153,0.12)',  border: 'rgba(236,72,153,0.3)' },
  Maintenance:    { icon: Wrench,       color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)' },
  'Release Notes':{ icon: Package,      color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.3)' },
};

// ─── Individual dismissible toast/banner ──────────────────────────────────────
function AnnouncementItem({ item, onDismiss }) {
  const cfg = TYPE_CONFIG[item.type] || { icon: Bell, color: '#6366f1', bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.3)' };
  const Ic = cfg.icon;

  if (item.display === 'Toast') {
    return (
      <motion.div
        initial={{ opacity: 0, x: 60 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 60 }}
        className="flex items-start gap-3 p-4 rounded-2xl max-w-sm pointer-events-auto"
        style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)' }}>
        <Ic size={16} style={{ color: cfg.color, marginTop: 2, flexShrink: 0 }} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: '#f1f5f9' }}>{item.title}</p>
          {item.content && <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>{item.content}</p>}
        </div>
        <button onClick={() => onDismiss(item.id)} className="shrink-0 opacity-50 hover:opacity-100 transition-opacity">
          <X size={14} style={{ color: '#94a3b8' }} />
        </button>
      </motion.div>
    );
  }

  // Banner (default for all other display types at the top)
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="overflow-hidden"
      style={{ borderBottom: `1px solid ${cfg.border}` }}>
      <div className="flex items-center gap-3 px-4 py-2.5"
        style={{ background: cfg.bg }}>
        <Ic size={14} style={{ color: cfg.color, flexShrink: 0 }} />
        <p className="flex-1 text-sm font-medium" style={{ color: '#f1f5f9' }}>
          <span className="font-semibold" style={{ color: cfg.color }}>{item.title}:</span>{' '}
          {item.content}
        </p>
        <button onClick={() => onDismiss(item.id)} className="shrink-0 opacity-60 hover:opacity-100 transition-opacity">
          <X size={14} style={{ color: '#94a3b8' }} />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Popup modal announcement ─────────────────────────────────────────────────
function AnnouncementPopup({ item, onDismiss }) {
  if (!item) return null;
  const cfg = TYPE_CONFIG[item.type] || { icon: Bell, color: '#6366f1', bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.3)' };
  const Ic = cfg.icon;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => onDismiss(item.id)} />
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-md rounded-2xl p-6 text-center"
        style={{ background: '#0d1626', border: `1px solid ${cfg.border}`, boxShadow: '0 40px 80px rgba(0,0,0,0.6)' }}
        onClick={e => e.stopPropagation()}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: cfg.bg }}>
          <Ic size={24} style={{ color: cfg.color }} />
        </div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: cfg.color }}>{item.type}</p>
        <h3 className="text-lg font-bold mb-3" style={{ color: '#f1f5f9' }}>{item.title}</h3>
        {item.content && <p className="text-sm mb-6" style={{ color: '#94a3b8' }}>{item.content}</p>}
        <button onClick={() => onDismiss(item.id)}
          className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
          style={{ background: cfg.color, color: '#fff' }}>
          Got it
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AnnouncementBanner({ user }) {
  const { activeAnnouncements } = useAdmin();
  const [dismissed, setDismissed] = useState(new Set());

  const dismiss = (id) => setDismissed(prev => new Set([...prev, id]));

  const visible = activeAnnouncements.filter(a => !dismissed.has(a.id));
  const banners = visible.filter(a => !['Toast','Popup','Modal'].includes(a.display));
  const toasts  = visible.filter(a => a.display === 'Toast');
  const popup   = visible.find(a => ['Popup','Modal'].includes(a.display));

  return (
    <>
      {/* Top banners — rendered above the main content */}
      <AnimatePresence>
        {banners.map(item => (
          <AnnouncementItem key={item.id} item={item} onDismiss={dismiss} />
        ))}
      </AnimatePresence>

      {/* Toast stack — bottom right */}
      <div className="fixed bottom-6 right-6 z-[140] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(item => (
            <AnnouncementItem key={item.id} item={item} onDismiss={dismiss} />
          ))}
        </AnimatePresence>
      </div>

      {/* Popup/Modal */}
      <AnimatePresence>
        {popup && <AnnouncementPopup key={popup.id} item={popup} onDismiss={dismiss} />}
      </AnimatePresence>
    </>
  );
}