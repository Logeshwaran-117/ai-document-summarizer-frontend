import { useState, useEffect, useCallback } from "react";
import api from "../api";

// ── Colour maps ───────────────────────────────────────────────────────────────
const PLAN_COLOR  = { free: "bg-gray-700 text-gray-300", pro: "bg-blue-900 text-blue-300", enterprise: "bg-purple-900 text-purple-300" };
const STATUS_COLOR= { active: "bg-green-900 text-green-300", suspended: "bg-red-900 text-red-300" };
const ROLE_COLOR  = { admin: "bg-yellow-900 text-yellow-300", user: "bg-gray-700 text-gray-400" };

function Badge({ text, map }) {
  const key = (text || "").toLowerCase();
  const cls = map[key] || "bg-gray-700 text-gray-300";
  return <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${cls}`}>{text || "—"}</span>;
}

function StatCard({ label, value, sub, icon, accent }) {
  return (
    <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${accent}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-white">{value ?? "—"}</p>
        <p className="text-sm text-gray-400">{label}</p>
        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function MiniBar({ data, valueKey, labelKey, color = "bg-blue-500" }) {
  const max = Math.max(...(data || []).map(d => d[valueKey] || 0), 1);
  return (
    <div className="flex items-end gap-1.5 h-20 mt-2">
      {(data || []).map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[10px] text-gray-500">{d[valueKey] > 0 ? d[valueKey] : ""}</span>
          <div className={`w-full ${color} rounded-t-sm transition-all`}
            style={{ height: `${Math.max((d[valueKey] / max) * 52, d[valueKey] > 0 ? 4 : 0)}px` }} />
          <span className="text-[9px] text-gray-600">{d[labelKey]}</span>
        </div>
      ))}
    </div>
  );
}

// ── Document list inside modal (paginated) ────────────────────────────────────
function UserDocuments({ userId, totalDocs }) {
  const [docs, setDocs]     = useState([]);
  const [page, setPage]     = useState(1);
  const [pages, setPages]   = useState(1);
  const [total, setTotal]   = useState(totalDocs || 0);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (p) => {
    setLoading(true);
    try {
      const r = await api.get(`/api/admin/users/${userId}/documents`, { params: { page: p, limit: 10 } });
      setDocs(r.data.docs);
      setPage(r.data.page);
      setPages(r.data.pages);
      setTotal(r.data.total);
    } catch(e) { console.error(e); }
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(1); }, [load]);

  const deleteDoc = async (docId) => {
    if (!window.confirm("Delete this document permanently?")) return;
    await api.delete(`/api/admin/documents/${docId}`);
    load(page);
  };

  return (
    <div className="space-y-2">
      {loading && <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"/></div>}
      {!loading && docs.length === 0 && <p className="text-gray-500 text-sm text-center py-8">No documents</p>}
      {!loading && docs.map(doc => (
        <div key={doc._id} className="flex items-center justify-between bg-gray-700/50 rounded-xl p-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-200 truncate">{doc.filename}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {new Date(doc.uploadedAt).toLocaleDateString()} &middot; {doc.stats?.words || 0} words
              {doc.summary && <span className="ml-2 text-green-500 text-[10px]">✓ summarized</span>}
            </p>
          </div>
          <button onClick={() => deleteDoc(doc._id)}
            className="ml-4 text-red-400 hover:text-red-300 text-xs font-semibold shrink-0 px-2 py-1 rounded-lg hover:bg-red-900/30">
            Delete
          </button>
        </div>
      ))}
      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-gray-500">Page {page}/{pages} &middot; {total} total</p>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => load(page - 1)}
              className="px-3 py-1 rounded-lg bg-gray-700 text-gray-300 text-xs disabled:opacity-40 hover:bg-gray-600">← Prev</button>
            <button disabled={page >= pages} onClick={() => load(page + 1)}
              className="px-3 py-1 rounded-lg bg-gray-700 text-gray-300 text-xs disabled:opacity-40 hover:bg-gray-600">Next →</button>
          </div>
        </div>
      )}
      {pages <= 1 && total > 0 && <p className="text-xs text-gray-600 text-center pt-1">Total: {total} document{total !== 1 ? "s" : ""}</p>}
    </div>
  );
}

// ── User Detail Modal ─────────────────────────────────────────────────────────
function UserModal({ userId, onClose, onRefresh }) {
  const [user, setUser]           = useState(null);
  const [tab, setTab]             = useState("info");
  const [editRole, setEditRole]   = useState("");
  const [editPlan, setEditPlan]   = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editName, setEditName]   = useState("");
  const [suspendReason, setSuspendReason] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving]       = useState(false);
  const [msg, setMsg]             = useState("");

  useEffect(() => {
    api.get(`/api/admin/users/${userId}`).then(r => {
      const u = r.data;
      setUser(u);
      setEditRole(u.role || "user");
      setEditPlan(u.plan || "free");
      setEditStatus(u.status || "active");
      setEditName(u.name || "");
      setSuspendReason(u.suspendedReason || "");
    });
  }, [userId]);

  const save = async () => {
    setSaving(true); setMsg("");
    try {
      await api.put(`/api/admin/users/${userId}`, {
        role: editRole, plan: editPlan, status: editStatus,
        name: editName, suspendedReason: suspendReason
      });
      setMsg("✅ Saved successfully");
      onRefresh();
    } catch(e) { setMsg("❌ " + (e.response?.data?.message || "Failed")); }
    setSaving(false);
  };

  const resetPassword = async () => {
    if (!newPassword || newPassword.length < 6) { setMsg("❌ Min 6 characters"); return; }
    setSaving(true);
    try {
      await api.post(`/api/admin/users/${userId}/reset-password`, { newPassword });
      setMsg("✅ Password reset"); setNewPassword("");
    } catch(e) { setMsg("❌ " + (e.response?.data?.message || "Failed")); }
    setSaving(false);
  };

  const deleteUser = async () => {
    if (!window.confirm("Permanently delete this user and ALL their data? Cannot be undone.")) return;
    try {
      await api.delete(`/api/admin/users/${userId}`);
      onRefresh(); onClose();
    } catch(e) { setMsg("❌ Delete failed"); }
  };

  if (!user) return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-2xl p-10"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"/></div>
    </div>
  );

  const TABS = ["info","permissions","documents","danger"];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
              {(user.name || user.email || "?")[0].toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{user.name || "—"}</h2>
              <p className="text-sm text-gray-400">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge text={user.role || "user"} map={ROLE_COLOR}/>
            <Badge text={user.plan || "free"} map={PLAN_COLOR}/>
            <Badge text={user.status || "active"} map={STATUS_COLOR}/>
            <button onClick={onClose} className="ml-2 text-gray-500 hover:text-gray-300 text-2xl leading-none">×</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700 px-6 shrink-0">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`py-3 px-4 text-sm font-medium capitalize border-b-2 transition-colors ${tab === t ? "border-blue-500 text-blue-400" : "border-transparent text-gray-500 hover:text-gray-300"}`}>
              {t}{t === "documents" ? ` (${user.docCount})` : ""}
            </button>
          ))}
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {msg && <div className={`mb-4 text-sm font-medium px-3 py-2 rounded-xl ${msg.startsWith("✅") ? "bg-green-900/40 text-green-400" : "bg-red-900/40 text-red-400"}`}>{msg}</div>}

          {/* INFO */}
          {tab === "info" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["User ID", user._id],
                  ["Email", user.email],
                  ["Created", user.createdAt ? new Date(user.createdAt).toLocaleString() : "—"],
                  ["Last Login", user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "Never"],
                  ["Documents", user.docCount],
                  ["Tables", user.tableCount],
                  ["Auth", user.googleId ? "Google OAuth" : "Email/Password"],
                ].map(([k,v]) => (
                  <div key={k} className="bg-gray-700/50 rounded-xl p-3">
                    <p className="text-gray-500 text-xs">{k}</p>
                    <p className="text-gray-200 font-medium mt-0.5 break-all text-sm">{String(v)}</p>
                  </div>
                ))}
              </div>
              {user.suspendedReason && (
                <div className="bg-red-900/30 border border-red-800 rounded-xl p-3 text-sm text-red-300">
                  <strong>Suspension reason:</strong> {user.suspendedReason}
                </div>
              )}
            </div>
          )}

          {/* PERMISSIONS */}
          {tab === "permissions" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                {[
                  { label: "Display Name", val: editName, set: setEditName, type: "text", placeholder: "Name" },
                ].map(f => (
                  <label key={f.label} className="block">
                    <span className="text-sm font-medium text-gray-400">{f.label}</span>
                    <input value={f.val} onChange={e => f.set(e.target.value)} type={f.type} placeholder={f.placeholder}
                      className="mt-1 w-full rounded-xl border border-gray-600 bg-gray-700 px-3 py-2.5 text-sm text-white placeholder-gray-500"/>
                  </label>
                ))}
                <div className="grid grid-cols-3 gap-3">
                  <label className="block">
                    <span className="text-sm font-medium text-gray-400">Role</span>
                    <select value={editRole} onChange={e => setEditRole(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-gray-600 bg-gray-700 px-3 py-2.5 text-sm text-white">
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-gray-400">Plan</span>
                    <select value={editPlan} onChange={e => setEditPlan(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-gray-600 bg-gray-700 px-3 py-2.5 text-sm text-white">
                      <option value="free">Free</option>
                      <option value="pro">Pro</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-gray-400">Status</span>
                    <select value={editStatus} onChange={e => setEditStatus(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-gray-600 bg-gray-700 px-3 py-2.5 text-sm text-white">
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </label>
                </div>
                {editStatus === "suspended" && (
                  <label className="block">
                    <span className="text-sm font-medium text-gray-400">Suspension Reason</span>
                    <input value={suspendReason} onChange={e => setSuspendReason(e.target.value)}
                      placeholder="Reason shown to user on login..."
                      className="mt-1 w-full rounded-xl border border-gray-600 bg-gray-700 px-3 py-2.5 text-sm text-white placeholder-gray-500"/>
                  </label>
                )}
              </div>
              <button onClick={save} disabled={saving}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 font-semibold text-sm disabled:opacity-60">
                {saving ? "Saving…" : "Save Changes"}
              </button>
              <div className="border-t border-gray-700 pt-4">
                <p className="text-sm font-medium text-gray-400 mb-2">Reset Password</p>
                <div className="flex gap-2">
                  <input value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    type="password" placeholder="New password (min 6 chars)"
                    className="flex-1 rounded-xl border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white placeholder-gray-500"/>
                  <button onClick={resetPassword} disabled={saving}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-4 rounded-xl text-sm font-semibold disabled:opacity-60">Reset</button>
                </div>
              </div>
            </div>
          )}

          {/* DOCUMENTS — full paginated */}
          {tab === "documents" && (
            <UserDocuments userId={userId} totalDocs={user.docCount} />
          )}

          {/* DANGER */}
          {tab === "danger" && (
            <div className="bg-red-900/20 border border-red-800 rounded-xl p-5">
              <h3 className="font-semibold text-red-400 mb-1">Delete User Account</h3>
              <p className="text-sm text-red-400/80 mb-4">Permanently deletes this user and all their documents, tables, and chat history. Cannot be undone.</p>
              <button onClick={deleteUser}
                className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-xl text-sm font-semibold">
                Delete User Permanently
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Admin Panel ──────────────────────────────────────────────────────────
export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats]         = useState(null);
  const [users, setUsers]         = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading]     = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [migrateMsg, setMigrateMsg] = useState("");

  // filters
  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter]     = useState("all");
  const [planFilter, setPlanFilter]     = useState("all");
  const [sort, setSort]                 = useState("newest");
  const [page, setPage]                 = useState(1);

  // admin tools form
  const [newEmail, setNewEmail]       = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName]         = useState("");
  const [adminMsg, setAdminMsg]       = useState("");

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try { const r = await api.get("/api/admin/stats"); setStats(r.data); }
    catch(e) { console.error(e); }
    setStatsLoading(false);
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get("/api/admin/users", {
        params: { page, search, status: statusFilter, role: roleFilter, plan: planFilter, sort, limit: 15 }
      });
      setUsers(r.data.users);
      setPagination({ total: r.data.total, page: r.data.page, pages: r.data.pages });
    } catch(e) { console.error(e); }
    setLoading(false);
  }, [page, search, statusFilter, roleFilter, planFilter, sort]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { if (activeTab === "users") fetchUsers(); }, [activeTab, fetchUsers]);

  const quickAction = async (userId, action, reason) => {
    try {
      await api.post(`/api/admin/users/${userId}/${action}`, { reason });
      fetchUsers();
    } catch(e) { alert("Action failed"); }
  };

  const createAdmin = async () => {
    setAdminMsg("");
    try {
      const r = await api.post("/api/admin/create-admin", { email: newEmail, password: newPassword, name: newName });
      setAdminMsg("✅ " + r.data.message);
      setNewEmail(""); setNewPassword(""); setNewName("");
      fetchUsers();
    } catch(e) { setAdminMsg("❌ " + (e.response?.data?.message || "Failed")); }
  };

  const runMigration = async () => {
    try {
      const r = await api.post("/api/admin/migrate-defaults");
      setMigrateMsg(`✅ Done — updated ${r.data.r1} roles, ${r.data.r2} statuses, ${r.data.r3} plans`);
      fetchStats(); fetchUsers();
    } catch(e) { setMigrateMsg("❌ Migration failed"); }
  };

  const TABS = [
    { id: "overview", label: "Overview",    icon: "📊" },
    { id: "users",    label: "Users",        icon: "👥" },
    { id: "admins",   label: "Admin Tools",  icon: "🔑" },
  ];

  return (
    <div className="min-h-full bg-gray-900 text-white">
      {/* ── Header ── */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center text-lg">🛡️</div>
          <div>
            <h1 className="text-xl font-bold">Admin Panel</h1>
            <p className="text-sm text-gray-400">Manage users, plans and platform activity</p>
          </div>
        </div>
        <div className="flex gap-1 flex-wrap">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === t.id ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-700 hover:text-white"}`}>
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">

        {/* ══ OVERVIEW ══════════════════════════════════════════════════════════ */}
        {activeTab === "overview" && (
          statsLoading ? (
            <div className="flex items-center justify-center py-20"><div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"/></div>
          ) : stats ? (
          <div className="space-y-5">
            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Users"   value={stats.totalUsers}    sub={`+${stats.newUsersThisWeek} this week`} icon="👥" accent="bg-blue-900/60 text-blue-400"/>
              <StatCard label="Active Users"  value={stats.activeUsers}   sub={`${stats.suspendedUsers} suspended`}    icon="✅" accent="bg-green-900/60 text-green-400"/>
              <StatCard label="Documents"     value={stats.totalDocuments} sub={`+${stats.docsThisWeek} this week`}   icon="📄" accent="bg-purple-900/60 text-purple-400"/>
              <StatCard label="Admins"        value={stats.adminCount}    sub="with full access"                       icon="🛡️" accent="bg-yellow-900/60 text-yellow-400"/>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Free Plan"      value={stats.plans?.free}       icon="🆓" accent="bg-gray-700 text-gray-400"/>
              <StatCard label="Pro Plan"       value={stats.plans?.pro}        icon="⭐" accent="bg-blue-900/60 text-blue-400"/>
              <StatCard label="Enterprise"     value={stats.plans?.enterprise} icon="🏢" accent="bg-purple-900/60 text-purple-400"/>
              <StatCard label="Table Extractions" value={stats.totalTables}   icon="📊" accent="bg-teal-900/60 text-teal-400"/>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard label="Total Revenue"    value={stats.totalRevenue != null ? `₹${Number(stats.totalRevenue).toLocaleString('en-IN')}` : '₹0'}    sub={`${stats.totalTransactions || 0} transactions`} icon="💰" accent="bg-green-900/60 text-green-400"/>
              <StatCard label="Revenue This Month" value={stats.revenueThisMonth != null ? `₹${Number(stats.revenueThisMonth).toLocaleString('en-IN')}` : '₹0'} icon="📅" accent="bg-emerald-900/60 text-emerald-400"/>
              <StatCard label="Paying Users"     value={(stats.plans?.pro || 0) + (stats.plans?.enterprise || 0)} sub="Pro + Enterprise" icon="💳" accent="bg-yellow-900/60 text-yellow-400"/>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
                <h3 className="font-semibold text-gray-300 text-sm">Signups — Last 7 Days</h3>
                <MiniBar data={stats.dailySignups} valueKey="count" labelKey="day" color="bg-blue-500"/>
              </div>
              <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
                <h3 className="font-semibold text-gray-300 text-sm">Documents — Last 7 Days</h3>
                <MiniBar data={stats.dailyDocs} valueKey="count" labelKey="day" color="bg-purple-500"/>
              </div>
            </div>

            {/* Plan bar */}
            <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
              <h3 className="font-semibold text-gray-300 text-sm mb-4">Plan Distribution</h3>
              <div className="grid grid-cols-3 gap-6">
                {[
                  { label:"Free", value: stats.plans?.free, bar:"bg-gray-500" },
                  { label:"Pro",  value: stats.plans?.pro,  bar:"bg-blue-500" },
                  { label:"Enterprise", value: stats.plans?.enterprise, bar:"bg-purple-500" },
                ].map(p => (
                  <div key={p.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">{p.label}</span>
                      <span className="text-white font-semibold">{p.value}</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-700 overflow-hidden">
                      <div className={`h-full ${p.bar} rounded-full transition-all`}
                        style={{ width: `${stats.totalUsers > 0 ? ((p.value / stats.totalUsers) * 100) : 0}%` }}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top uploaders + recent signups */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
                <h3 className="font-semibold text-gray-300 text-sm mb-3">🏆 Top Uploaders</h3>
                {(stats.topUploaders || []).length === 0 && <p className="text-gray-600 text-sm">No data yet</p>}
                {(stats.topUploaders || []).map((u, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-gray-500 text-xs w-4">{i+1}</span>
                      <div className="min-w-0">
                        <p className="text-sm text-gray-200 truncate">{u.name || "—"}</p>
                        <p className="text-xs text-gray-500 truncate">{u.email}</p>
                      </div>
                    </div>
                    <span className="text-blue-400 font-bold text-sm ml-3 shrink-0">{u.count} docs</span>
                  </div>
                ))}
              </div>
              <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
                <h3 className="font-semibold text-gray-300 text-sm mb-3">🆕 Recent Signups</h3>
                {(stats.recentSignups || []).length === 0 && <p className="text-gray-600 text-sm">No users yet</p>}
                {(stats.recentSignups || []).map((u, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {(u.name || u.email || "?")[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-gray-200 truncate">{u.name || u.email}</p>
                        <p className="text-xs text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0 ml-2">
                      <Badge text={u.role || "user"} map={ROLE_COLOR}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          ) : <p className="text-gray-500 text-center py-20">Failed to load stats</p>
        )}

        {/* ══ USERS ════════════════════════════════════════════════════════════ */}
        {activeTab === "users" && (
          <div className="space-y-4">
            {/* Filters bar */}
            <div className="bg-gray-800 rounded-2xl p-4 border border-gray-700 space-y-3">
              <div className="flex flex-wrap gap-3">
                <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                  placeholder="🔍  Search by name or email…"
                  className="flex-1 min-w-[200px] rounded-xl border border-gray-600 bg-gray-700 px-4 py-2.5 text-sm text-white placeholder-gray-500"/>
                {[
                  { label:"Status", val: statusFilter, set: setStatusFilter, opts: ["all","active","suspended"] },
                  { label:"Role",   val: roleFilter,   set: setRoleFilter,   opts: ["all","user","admin"] },
                  { label:"Plan",   val: planFilter,   set: setPlanFilter,   opts: ["all","free","pro","enterprise"] },
                  { label:"Sort",   val: sort,         set: setSort,         opts: ["newest","oldest","name","email"] },
                ].map(f => (
                  <select key={f.label} value={f.val} onChange={e => { f.set(e.target.value); setPage(1); }}
                    className="rounded-xl border border-gray-600 bg-gray-700 px-3 py-2.5 text-sm text-white">
                    {f.opts.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase()+o.slice(1)}</option>)}
                  </select>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{pagination.total} user{pagination.total !== 1 ? "s" : ""} found</span>
                <span>Page {pagination.page} of {pagination.pages}</span>
              </div>
            </div>

            {/* Table */}
            <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"/></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-700/60 border-b border-gray-700">
                        <th className="text-left px-5 py-3.5 font-semibold text-gray-400 text-xs uppercase tracking-wide">User</th>
                        <th className="text-left px-4 py-3.5 font-semibold text-gray-400 text-xs uppercase tracking-wide">Role</th>
                        <th className="text-left px-4 py-3.5 font-semibold text-gray-400 text-xs uppercase tracking-wide">Plan</th>
                        <th className="text-left px-4 py-3.5 font-semibold text-gray-400 text-xs uppercase tracking-wide">Status</th>
                        <th className="text-left px-4 py-3.5 font-semibold text-gray-400 text-xs uppercase tracking-wide">Docs</th>
                        <th className="text-left px-4 py-3.5 font-semibold text-gray-400 text-xs uppercase tracking-wide">Joined</th>
                        <th className="text-left px-4 py-3.5 font-semibold text-gray-400 text-xs uppercase tracking-wide">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/50">
                      {users.length === 0 && (
                        <tr><td colSpan={7} className="text-center py-14 text-gray-500">No users found</td></tr>
                      )}
                      {users.map(u => (
                        <tr key={u._id} className="hover:bg-gray-700/30 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                {(u.name || u.email || "?")[0].toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-gray-200 truncate max-w-[160px]">{u.name || "—"}</p>
                                <p className="text-xs text-gray-500 truncate max-w-[160px]">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5"><Badge text={u.role || "user"} map={ROLE_COLOR}/></td>
                          <td className="px-4 py-3.5"><Badge text={u.plan || "free"} map={PLAN_COLOR}/></td>
                          <td className="px-4 py-3.5"><Badge text={u.status || "active"} map={STATUS_COLOR}/></td>
                          <td className="px-4 py-3.5 text-gray-400 font-medium">{u.docCount}</td>
                          <td className="px-4 py-3.5 text-gray-500 text-xs whitespace-nowrap">
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-1">
                              <button onClick={() => setSelectedUser(u._id)}
                                className="text-blue-400 hover:text-blue-300 text-xs font-semibold px-2 py-1 rounded-lg hover:bg-blue-900/30 transition-colors">Edit</button>
                              <button onClick={() => {
                                const isSuspended = (u.status || "active") === "suspended";
                                if (isSuspended) { quickAction(u._id, "unsuspend"); }
                                else {
                                  const r = window.prompt("Suspension reason (optional):") ?? null;
                                  if (r !== null) quickAction(u._id, "suspend", r);
                                }
                              }}
                                className={`text-xs font-semibold px-2 py-1 rounded-lg transition-colors ${
                                  (u.status||"active") === "suspended"
                                    ? "text-green-400 hover:bg-green-900/30"
                                    : "text-orange-400 hover:bg-orange-900/30"
                                }`}>
                                {(u.status||"active") === "suspended" ? "Unsuspend" : "Suspend"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between bg-gray-800 rounded-2xl border border-gray-700 px-5 py-3">
                <p className="text-sm text-gray-500">
                  Showing {((pagination.page-1)*15)+1}–{Math.min(pagination.page*15, pagination.total)} of {pagination.total}
                </p>
                <div className="flex items-center gap-2">
                  <button disabled={page <= 1} onClick={() => setPage(1)}
                    className="px-2 py-1.5 rounded-lg bg-gray-700 text-gray-400 text-xs disabled:opacity-30 hover:bg-gray-600">«</button>
                  <button disabled={page <= 1} onClick={() => setPage(p => p-1)}
                    className="px-3 py-1.5 rounded-lg bg-gray-700 text-gray-300 text-xs disabled:opacity-30 hover:bg-gray-600">← Prev</button>
                  {/* Page number buttons */}
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    const start = Math.max(1, Math.min(page - 2, pagination.pages - 4));
                    const p = start + i;
                    return p <= pagination.pages ? (
                      <button key={p} onClick={() => setPage(p)}
                        className={`w-8 h-8 rounded-lg text-xs font-medium ${p === page ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-400 hover:bg-gray-600"}`}>{p}</button>
                    ) : null;
                  })}
                  <button disabled={page >= pagination.pages} onClick={() => setPage(p => p+1)}
                    className="px-3 py-1.5 rounded-lg bg-gray-700 text-gray-300 text-xs disabled:opacity-30 hover:bg-gray-600">Next →</button>
                  <button disabled={page >= pagination.pages} onClick={() => setPage(pagination.pages)}
                    className="px-2 py-1.5 rounded-lg bg-gray-700 text-gray-400 text-xs disabled:opacity-30 hover:bg-gray-600">»</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ ADMIN TOOLS ══════════════════════════════════════════════════════ */}
        {activeTab === "admins" && (
          <div className="max-w-2xl space-y-5">
            {/* Create admin */}
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              <h2 className="font-bold text-white mb-1">Create / Promote Admin</h2>
              <p className="text-sm text-gray-400 mb-5">Create a new admin, or promote an existing user by email.</p>
              {adminMsg && <div className={`mb-4 text-sm font-medium px-3 py-2 rounded-xl ${adminMsg.startsWith("✅") ? "bg-green-900/40 text-green-400" : "bg-red-900/40 text-red-400"}`}>{adminMsg}</div>}
              <div className="space-y-3">
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Display name (optional)"
                  className="w-full rounded-xl border border-gray-600 bg-gray-700 px-3 py-2.5 text-sm text-white placeholder-gray-500"/>
                <input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="Email address *"
                  className="w-full rounded-xl border border-gray-600 bg-gray-700 px-3 py-2.5 text-sm text-white placeholder-gray-500"/>
                <input value={newPassword} onChange={e => setNewPassword(e.target.value)} type="password"
                  placeholder="Password (required for new users)"
                  className="w-full rounded-xl border border-gray-600 bg-gray-700 px-3 py-2.5 text-sm text-white placeholder-gray-500"/>
                <button onClick={createAdmin}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-xl py-2.5 text-sm">
                  Create / Promote Admin
                </button>
              </div>
            </div>

            {/* Migration utility */}
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              <h2 className="font-bold text-white mb-1">Fix Missing Fields (Migration)</h2>
              <p className="text-sm text-gray-400 mb-4">
                Users created before admin controls was added may be missing <code className="bg-gray-700 px-1 rounded text-xs">role</code>, <code className="bg-gray-700 px-1 rounded text-xs">status</code>, and <code className="bg-gray-700 px-1 rounded text-xs">plan</code> fields.
                Run this once to set defaults on all existing users so badges show correctly.
              </p>
              {migrateMsg && <div className={`mb-4 text-sm font-medium px-3 py-2 rounded-xl ${migrateMsg.startsWith("✅") ? "bg-green-900/40 text-green-400" : "bg-red-900/40 text-red-400"}`}>{migrateMsg}</div>}
              <button onClick={runMigration}
                className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl px-5 py-2.5 text-sm font-semibold">
                Run Migration
              </button>
            </div>

            {/* Capabilities list */}
            <div className="bg-blue-900/20 border border-blue-800 rounded-2xl p-5 text-sm text-blue-300">
              <h3 className="font-semibold mb-2">Admin Capabilities</h3>
              <ul className="space-y-1.5 list-disc list-inside text-blue-300/80">
                <li>View platform-wide stats, signups, and document activity</li>
                <li>Search, filter, and paginate all users</li>
                <li>Edit any user's role, plan, status, and name</li>
                <li>Suspend / unsuspend accounts (blocks login)</li>
                <li>Reset any user's password</li>
                <li>View and delete any user's documents</li>
                <li>Delete user accounts and all associated data</li>
                <li>Create new admin accounts or promote existing users</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* User modal */}
      {selectedUser && (
        <UserModal userId={selectedUser} onClose={() => setSelectedUser(null)} onRefresh={fetchUsers}/>
      )}
    </div>
  );
}
