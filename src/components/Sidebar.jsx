// src/components/Sidebar.jsx
// Enhanced: dims nav items whose feature flag is OFF so users know at a glance.
// Fix applied: collapsed-state tooltip uses a custom CSS tooltip instead of the
// native `title` attribute (which shows after a 1 s browser delay and looks ugly).

import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Upload, Table2, Landmark, History,
  CreditCard, Settings, ShieldCheck, BarChart3,
  ChevronRight, Sparkles, Lock,
} from "lucide-react";
import UsageBadge from "./UsageBadge";
import { useFeatureFlags } from "../hooks/useFeatureFlag";

// Map each nav route to the feature flag that controls it
const ROUTE_FLAGS = {
  "/upload":  "summarizer",
  "/excel":   "tableExtract",
  "/banking": "summarizer",
};

const USER_LINKS = [
  { to: "/",         icon: LayoutDashboard, label: "Dashboard",      sub: "Overview & stats"   },
  { to: "/upload",   icon: Upload,          label: "Summarize",       sub: "Upload & summarize" },
  { to: "/excel",    icon: Table2,          label: "Table Generator", sub: "Extract data tables"},
  { to: "/banking",  icon: Landmark,        label: "Banking",         sub: "Financial analysis" },
  { to: "/history",  icon: History,         label: "History",         sub: "Past summaries"     },
  { to: "/pricing",  icon: CreditCard,      label: "Plans & Billing", sub: "Upgrade your plan"  },
  { to: "/settings", icon: Settings,        label: "Settings",        sub: "Account & prefs"    },
];

const ADMIN_LINKS = [
  { to: "/admin",           icon: ShieldCheck, label: "Admin Panel",   sub: "Manage users"     },
  { to: "/usage-dashboard", icon: BarChart3,   label: "API Key Usage", sub: "Gemini key stats" },
];

// ── Custom tooltip that shows instantly with no browser delay ─────────────────
//
// Rendered as an absolutely-positioned pill to the right of the icon.
// Only appears when `show` is true (sidebar collapsed + mouse hovering the item).
//
function NavTooltip({ label, show }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.span
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -4 }}
          transition={{ duration: 0.12 }}
          className="pointer-events-none absolute left-full ml-3 z-[200] whitespace-nowrap
                     px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow-lg"
          style={{
            background: "var(--tooltip-bg)",
            color: "var(--text)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-md)",
            // vertically centre against the icon
            top: "50%",
            transform: "translateY(-50%)",
          }}
        >
          {label}
          {/* Arrow pointing left */}
          <span
            className="absolute right-full top-1/2 -translate-y-1/2"
            style={{
              borderWidth: "4px 4px 4px 0",
              borderStyle: "solid",
              borderColor: "transparent var(--border) transparent transparent",
              marginRight: "-1px",
            }}
          />
        </motion.span>
      )}
    </AnimatePresence>
  );
}

function NavItem({ to, icon: Icon, label, sub, collapsed, isActive, accent, disabled }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      to={disabled ? "#" : to}
      // REMOVED: title={collapsed ? label : undefined}
      // title causes the browser's ugly delayed native tooltip. We use NavTooltip instead.
      onClick={disabled ? e => e.preventDefault() : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`
        relative flex items-center gap-3 rounded-xl text-sm font-medium
        transition-all duration-150 group overflow-visible
        ${collapsed ? "justify-center p-3" : "px-3 py-2.5"}
        ${disabled
          ? "opacity-40 cursor-not-allowed"
          : isActive
          ? accent === "amber"
            ? "bg-amber-500/15 text-amber-400"
            : "text-white"
          : accent === "amber"
          ? "text-amber-500/60 hover:bg-amber-500/10 hover:text-amber-400"
          : "text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/5"
        }
      `}
    >
      {/* Active pill */}
      {isActive && !disabled && accent !== "amber" && (
        <span
          className="absolute inset-0 rounded-xl"
          style={{ background: "linear-gradient(135deg, var(--primary), rgba(var(--primary-rgb),.7))" }}
        />
      )}

      {/* Hover glow */}
      {!isActive && !disabled && (
        <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: "rgba(255,255,255,.04)" }} />
      )}

      <Icon
        size={18}
        className={`relative z-10 shrink-0 transition-transform ${!disabled ? "group-hover:scale-110" : ""}
          ${isActive && !disabled && accent !== "amber" ? "text-white" : ""}`}
      />

      {/* Custom tooltip — only when collapsed, replaces title= */}
      {collapsed && (
        <NavTooltip label={label} show={hovered && !disabled} />
      )}

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            className="relative z-10 overflow-hidden flex-1"
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2 }}
          >
            <p className="leading-tight whitespace-nowrap">{label}</p>
            <p className="text-[11px] leading-tight font-normal opacity-50 whitespace-nowrap">{sub}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Disabled lock icon */}
      {!collapsed && disabled && (
        <Lock size={11} className="relative z-10 ml-auto opacity-60 shrink-0" />
      )}

      {!collapsed && isActive && !disabled && accent !== "amber" && (
        <ChevronRight size={14} className="relative z-10 ml-auto opacity-60 text-white shrink-0" />
      )}
    </Link>
  );
}

function Sidebar({ user }) {
  const location  = useLocation();
  const [collapsed, setCollapsed] = useState(true);
  const isAdmin   = user?.role === "admin";
  const flags     = useFeatureFlags();

  return (
    <motion.aside
      animate={{ width: collapsed ? 68 : 240 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="h-screen flex flex-col shrink-0 overflow-hidden"
      style={{
        background: "var(--card)",
        borderRight: "1px solid var(--border)",
        boxShadow: "var(--shadow-md)",
      }}
    >
      {/* Logo / collapse toggle */}
      <div
        className={`flex items-center h-16 border-b shrink-0 ${collapsed ? "justify-center px-0" : "px-4 gap-3"}`}
        style={{ borderColor: "var(--border)" }}
      >
        <button
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="w-9 h-9 flex items-center justify-center rounded-xl transition-all hover:scale-105"
          style={{ background: "var(--secondary)", color: "var(--muted)" }}
        >
          <motion.svg
            viewBox="0 0 20 20" fill="none" stroke="currentColor"
            strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
            className="w-4 h-4"
            animate={{ rotate: collapsed ? 0 : 180 }}
            transition={{ duration: 0.25 }}
          >
            <rect x="2" y="3" width="16" height="14" rx="2.5" />
            <line x1="13" y1="3" x2="13" y2="17" />
            <polyline points="6,7 10,10 6,13" />
          </motion.svg>
        </button>

        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18 }}
              className="flex items-center gap-2 overflow-hidden"
            >
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg, var(--primary), #818cf8)" }}>
                <Sparkles size={14} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold leading-tight whitespace-nowrap" style={{ color: "var(--text)" }}>
                  DocAI
                </p>
                <p className="text-[10px] leading-tight whitespace-nowrap" style={{ color: "var(--muted)" }}>
                  Powered by Gemini
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {!collapsed && (
          <p className="text-[10px] uppercase tracking-widest font-semibold px-2 pb-2 pt-1"
            style={{ color: "var(--muted)", opacity: 0.6 }}>
            Main
          </p>
        )}
        {USER_LINKS.map(l => {
          const flagKey = ROUTE_FLAGS[l.to];
          const isDisabled = !isAdmin && flagKey && flags[flagKey] === false;
          return (
            <NavItem
              key={l.to}
              {...l}
              collapsed={collapsed}
              isActive={location.pathname === l.to}
              accent="blue"
              disabled={isDisabled}
            />
          );
        })}

        {isAdmin && (
          <>
            {!collapsed
              ? <p className="text-[10px] uppercase tracking-widest font-semibold px-2 pb-2 pt-4"
                  style={{ color: "var(--muted)", opacity: 0.6 }}>Admin</p>
              : <div className="my-2 mx-2 border-t" style={{ borderColor: "var(--border)" }} />
            }
            {ADMIN_LINKS.map(l => (
              <NavItem
                key={l.to}
                {...l}
                collapsed={collapsed}
                isActive={location.pathname === l.to}
                accent="amber"
                disabled={false}
              />
            ))}
          </>
        )}
      </nav>

      {/* Usage badge */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-3 border-t shrink-0"
            style={{ borderColor: "var(--border)" }}
          >
            <UsageBadge user={user} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}

export default Sidebar;