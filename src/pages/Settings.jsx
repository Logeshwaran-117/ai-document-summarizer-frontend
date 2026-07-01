import { useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";

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

    const tabs = [
        { id: "profile", label: "👤 Profile", },
        { id: "password", label: "🔒 Password" },
        { id: "danger", label: "⚠️ Danger Zone" },
    ];

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Settings</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Manage your account preferences</p>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 text-sm font-medium rounded-t-lg transition ${
                            activeTab === tab.id
                                ? "bg-white dark:bg-gray-900 border border-b-white dark:border-b-gray-900 border-gray-200 dark:border-gray-700 text-blue-600 dark:text-blue-400 -mb-px"
                                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Profile Tab */}
            {activeTab === "profile" && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 space-y-5 transition-colors duration-300">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                            {name ? name[0].toUpperCase() : "U"}
                        </div>
                        <div>
                            <p className="font-semibold text-gray-800 dark:text-white">{name || "User"}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
                            {user?.googleId && (
                                <span className="text-xs bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded-full">Google Account</span>
                            )}
                        </div>
                    </div>

                    {profileMsg && <p className="text-green-600 dark:text-green-300 bg-green-50 dark:bg-green-900/30 px-4 py-2 rounded-lg text-sm">{profileMsg}</p>}
                    {profileError && <p className="text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-900/30 px-4 py-2 rounded-lg text-sm">{profileError}</p>}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Your name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                        <input
                            type="email"
                            value={user?.email || ""}
                            disabled
                            className="w-full border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                        />
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Email cannot be changed.</p>
                    </div>

                    <button
                        onClick={handleUpdateProfile}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium transition"
                    >
                        Save Changes
                    </button>
                </div>
            )}

            {/* Password Tab */}
            {activeTab === "password" && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 space-y-5 transition-colors duration-300">
                    <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Change Password</h2>

                    {user?.googleId && !user?.password && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-sm text-yellow-700 dark:text-yellow-400">
                            ⚠️ You signed up with Google. You can set a password to also enable email login.
                        </div>
                    )}

                    {passwordMsg && <p className="text-green-600 dark:text-green-300 bg-green-50 dark:bg-green-900/30 px-4 py-2 rounded-lg text-sm">{passwordMsg}</p>}
                    {passwordError && <p className="text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-900/30 px-4 py-2 rounded-lg text-sm">{passwordError}</p>}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Password</label>
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={e => setCurrentPassword(e.target.value)}
                            className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Current password"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="New password"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Confirm new password"
                        />
                    </div>

                    <button
                        onClick={handleChangePassword}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium transition"
                    >
                        Update Password
                    </button>
                </div>
            )}

            {/* Danger Zone Tab */}
            {activeTab === "danger" && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 space-y-5 border border-red-100 dark:border-red-900/40 transition-colors duration-300">
                    <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">⚠️ Danger Zone</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Deleting your account is permanent. All your documents, summaries, and history will be erased and cannot be recovered.
                    </p>

                    {deleteError && <p className="text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-900/30 px-4 py-2 rounded-lg text-sm">{deleteError}</p>}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Type <span className="font-bold text-red-600 dark:text-red-400">DELETE</span> to confirm
                        </label>
                        <input
                            type="text"
                            value={deleteConfirm}
                            onChange={e => setDeleteConfirm(e.target.value)}
                            className="w-full border border-red-300 dark:border-red-800 rounded-lg p-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-400"
                            placeholder="Type DELETE"
                        />
                    </div>

                    <button
                        onClick={handleDeleteAccount}
                        className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 font-medium transition"
                    >
                        Delete My Account
                    </button>
                </div>
            )}
        </div>
    );
}

export default Settings;
