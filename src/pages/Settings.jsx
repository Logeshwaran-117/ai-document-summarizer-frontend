import { useState } from "react";
import api from "../api";
import { Link, useNavigate } from "react-router-dom";
import { User, Lock, CreditCard, AlertTriangle } from "lucide-react";

function Settings({ user, setIsAuthenticated }) {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("profile");

    // Profile state
    const [name, setName] = useState(user?.name || user?.displayName || "");
    const [profileMsg, setProfileMsg] = useState("");
    const [profileError, setProfileError] = useState("");

    // Password state
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordMsg, setPasswordMsg] = useState("");
    const [passwordError, setPasswordError] = useState("");

    // Delete state
    const [deleteConfirm, setDeleteConfirm] = useState("");
    const [deleteError, setDeleteError] = useState("");

    async function handleUpdateProfile() {
        setProfileMsg(""); setProfileError("");
        try {
            await api.put("/auth/update-profile", { name });
            setProfileMsg("Profile updated successfully!");
        } catch (err) {
            setProfileError(err.response?.data?.message || "Failed to update profile.");
        }
    }

    async function handleChangePassword() {
        setPasswordMsg(""); setPasswordError("");
        if (newPassword !== confirmPassword) {
            setPasswordError("New passwords do not match.");
            return;
        }
        if (newPassword.length < 6) {
            setPasswordError("Password must be at least 6 characters.");
            return;
        }
        try {
            await api.put("/auth/change-password", { currentPassword, newPassword });
            setPasswordMsg("Password changed successfully!");
            setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
        } catch (err) {
            setPasswordError(err.response?.data?.message || "Failed to change password.");
        }
    }

    async function handleDeleteAccount() {
        if (deleteConfirm !== "DELETE") {
            setDeleteError("Type DELETE to confirm.");
            return;
        }
        try {
            await api.delete("/auth/delete-account");
            setIsAuthenticated(false);
            navigate("/login");
        } catch (err) {
            setDeleteError(err.response?.data?.message || "Failed to delete account.");
        }
    }

    // Tabs now use Lucide icons — no emoji in navigation
    const tabs = [
        { id: "profile",  label: "Profile",     icon: User          },
        { id: "password", label: "Password",     icon: Lock          },
        { id: "billing",  label: "Billing",      icon: CreditCard    },
        { id: "danger",   label: "Danger Zone",  icon: AlertTriangle },
    ];

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--text)" }}>Settings</h1>
            <p className="mb-6" style={{ color: "var(--muted)" }}>Manage your account preferences</p>

            {/* Tabs — icon + label, no emoji */}
            <div className="flex gap-2 mb-6 border-b" style={{ borderColor: "var(--border)" }}>
                {tabs.map(tab => {
                    const TabIcon = tab.icon;
                    const active = activeTab === tab.id;
                    const isDanger = tab.id === "danger";
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-t-lg transition -mb-px"
                            style={
                                active
                                    ? {
                                        background: "var(--card)",
                                        border: "1px solid var(--border)",
                                        borderBottomColor: "var(--card)",
                                        color: isDanger ? "var(--danger)" : "var(--primary)",
                                      }
                                    : { color: "var(--muted)" }
                            }
                        >
                            <TabIcon
                                size={13}
                                style={{ color: active && isDanger ? "var(--danger)" : undefined }}
                            />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Profile Tab */}
            {activeTab === "profile" && (
                <div className="rounded-2xl shadow p-6 space-y-5 transition-colors duration-300"
                    style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold"
                            style={{ background: "var(--primary)" }}>
                            {name ? name[0].toUpperCase() : "U"}
                        </div>
                        <div>
                            <p className="font-semibold" style={{ color: "var(--text)" }}>{name || "User"}</p>
                            <p className="text-sm" style={{ color: "var(--muted)" }}>{user?.email}</p>
                            {user?.googleId && (
                                <span className="text-xs px-2 py-0.5 rounded-full"
                                    style={{ background: "rgba(var(--primary-rgb),.1)", color: "var(--primary)" }}>
                                    Google Account
                                </span>
                            )}
                        </div>
                    </div>

                    {profileMsg && (
                        <p className="px-4 py-2 rounded-lg text-sm"
                            style={{ color: "var(--success)", background: "rgba(16,185,129,.1)" }}>
                            {profileMsg}
                        </p>
                    )}
                    {profileError && (
                        <p className="px-4 py-2 rounded-lg text-sm"
                            style={{ color: "var(--danger)", background: "rgba(239,68,68,.1)" }}>
                            {profileError}
                        </p>
                    )}

                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: "var(--muted)" }}>Full Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full rounded-lg p-3 focus:outline-none focus:ring-2 text-sm"
                            style={{
                                border: "1px solid var(--border)",
                                background: "var(--secondary)",
                                color: "var(--text)",
                                "--tw-ring-color": "var(--primary)",
                            }}
                            placeholder="Your name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: "var(--muted)" }}>Email</label>
                        <input
                            type="email"
                            value={user?.email || ""}
                            disabled
                            className="w-full rounded-lg p-3 text-sm cursor-not-allowed"
                            style={{ border: "1px solid var(--border)", background: "var(--secondary)", color: "var(--muted)" }}
                        />
                        <p className="text-xs mt-1" style={{ color: "var(--muted)", opacity: 0.7 }}>
                            Email cannot be changed.
                        </p>
                    </div>

                    <button
                        onClick={handleUpdateProfile}
                        className="w-full py-3 rounded-lg text-white font-medium transition hover:opacity-90"
                        style={{ background: "var(--primary)" }}
                    >
                        Save Changes
                    </button>
                </div>
            )}

            {/* Password Tab */}
            {activeTab === "password" && (
                <div className="rounded-2xl shadow p-6 space-y-5 transition-colors duration-300"
                    style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                    <h2 className="text-lg font-semibold" style={{ color: "var(--text)" }}>Change Password</h2>

                    {user?.googleId && !user?.password && (
                        <div className="rounded-lg p-4 text-sm"
                            style={{ background: "rgba(245,158,11,.1)", border: "1px solid rgba(245,158,11,.3)", color: "var(--warning)" }}>
                            You signed up with Google. You can set a password to also enable email login.
                        </div>
                    )}

                    {passwordMsg && (
                        <p className="px-4 py-2 rounded-lg text-sm"
                            style={{ color: "var(--success)", background: "rgba(16,185,129,.1)" }}>
                            {passwordMsg}
                        </p>
                    )}
                    {passwordError && (
                        <p className="px-4 py-2 rounded-lg text-sm"
                            style={{ color: "var(--danger)", background: "rgba(239,68,68,.1)" }}>
                            {passwordError}
                        </p>
                    )}

                    {[
                        { label: "Current Password", value: currentPassword, setter: setCurrentPassword, placeholder: "Current password" },
                        { label: "New Password",     value: newPassword,     setter: setNewPassword,     placeholder: "New password"     },
                        { label: "Confirm New Password", value: confirmPassword, setter: setConfirmPassword, placeholder: "Confirm new password" },
                    ].map(({ label, value, setter, placeholder }) => (
                        <div key={label}>
                            <label className="block text-sm font-medium mb-1" style={{ color: "var(--muted)" }}>{label}</label>
                            <input
                                type="password"
                                value={value}
                                onChange={e => setter(e.target.value)}
                                className="w-full rounded-lg p-3 focus:outline-none focus:ring-2 text-sm"
                                style={{
                                    border: "1px solid var(--border)",
                                    background: "var(--secondary)",
                                    color: "var(--text)",
                                }}
                                placeholder={placeholder}
                            />
                        </div>
                    ))}

                    <button
                        onClick={handleChangePassword}
                        className="w-full py-3 rounded-lg text-white font-medium transition hover:opacity-90"
                        style={{ background: "var(--primary)" }}
                    >
                        Update Password
                    </button>
                </div>
            )}

            {/* Billing Tab */}
            {activeTab === "billing" && (
                <div className="rounded-2xl shadow p-6 space-y-5 transition-colors duration-300"
                    style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold" style={{ color: "var(--text)" }}>Billing &amp; Plan</h2>
                        <Link to="/pricing"
                            className="text-sm px-4 py-2 rounded-xl font-medium text-white transition hover:opacity-90"
                            style={{ background: "var(--primary)" }}>
                            Manage Plan →
                        </Link>
                    </div>
                    <p className="text-sm" style={{ color: "var(--muted)" }}>
                        View your current plan, usage limits, and upgrade options on the Plans &amp; Billing page.
                    </p>
                    <div className="rounded-xl p-4 flex items-center gap-3"
                        style={{ background: "var(--secondary)" }}>
                        <CreditCard size={20} style={{ color: "var(--primary)" }} />
                        <div>
                            <p className="font-semibold capitalize" style={{ color: "var(--text)" }}>
                                {user?.plan || "Free"} Plan
                            </p>
                            <p className="text-xs" style={{ color: "var(--muted)" }}>
                                Click "Manage Plan" to see usage and upgrade
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Danger Zone Tab */}
            {activeTab === "danger" && (
                <div className="rounded-2xl shadow p-6 space-y-5 transition-colors duration-300"
                    style={{
                        background: "var(--card)",
                        border: "1px solid rgba(239,68,68,.3)",
                    }}>
                    <div className="flex items-center gap-2">
                        <AlertTriangle size={16} style={{ color: "var(--danger)" }} />
                        <h2 className="text-lg font-semibold" style={{ color: "var(--danger)" }}>Danger Zone</h2>
                    </div>
                    <p className="text-sm" style={{ color: "var(--muted)" }}>
                        Deleting your account is permanent. All your documents, summaries, and history will be erased and cannot be recovered.
                    </p>

                    {deleteError && (
                        <p className="px-4 py-2 rounded-lg text-sm"
                            style={{ color: "var(--danger)", background: "rgba(239,68,68,.1)" }}>
                            {deleteError}
                        </p>
                    )}

                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: "var(--muted)" }}>
                            Type <span className="font-bold" style={{ color: "var(--danger)" }}>DELETE</span> to confirm
                        </label>
                        <input
                            type="text"
                            value={deleteConfirm}
                            onChange={e => setDeleteConfirm(e.target.value)}
                            className="w-full rounded-lg p-3 focus:outline-none focus:ring-2 text-sm"
                            style={{
                                border: "1px solid rgba(239,68,68,.4)",
                                background: "var(--secondary)",
                                color: "var(--text)",
                            }}
                            placeholder="Type DELETE"
                        />
                    </div>

                    <button
                        onClick={handleDeleteAccount}
                        className="w-full py-3 rounded-lg text-white font-medium transition hover:opacity-90"
                        style={{ background: "var(--danger)" }}
                    >
                        Delete My Account
                    </button>
                </div>
            )}
        </div>
    );
}

export default Settings;