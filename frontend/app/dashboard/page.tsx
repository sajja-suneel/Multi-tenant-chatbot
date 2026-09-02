"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldAlert, UserPlus, Users, Trash2, Mail, Lock, Shield, CheckCircle2, AlertCircle, Menu } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import DocumentUpload from "../../components/DocumentUpload";
import { User } from "../../types";
import api from "../../services/api";

export default function DashboardPage() {
    const [user, setUser] = useState<User | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [usersLoading, setUsersLoading] = useState(true);
    const router = useRouter();

    const [newEmail, setNewEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [newRole, setNewRole] = useState<"employee" | "admin">("employee");
    const [actionError, setActionError] = useState("");
    const [actionSuccess, setActionSuccess] = useState("");
    const [submittingUser, setSubmittingUser] = useState(false);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    useEffect(() => {
        const checkAdminAuth = async () => {
            try {
                const userData = await api.getMe();
                if (userData.role !== "admin") {
                    router.replace("/chat");
                    return;
                }
                setUser(userData);
                fetchUsers();
            } catch (err) {
                api.logout();
                router.push("/login");
            } finally {
                setLoading(false);
            }
        };
        checkAdminAuth();
    }, [router]);

    const fetchUsers = async () => {
        try {
            setUsersLoading(true);
            const data = await api.getUsers();
            setUsers(data);
        } catch (err: any) {
            setActionError(err.message || "Failed to load company users.");
        } finally {
            setUsersLoading(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionError("");
        setActionSuccess("");
        setSubmittingUser(true);

        try {
            await api.registerUser({
                email: newEmail,
                password: newPassword,
                role: newRole
            });
            setActionSuccess(`Successfully registered new ${newRole} user: "${newEmail}"`);
            setNewEmail("");
            setNewPassword("");
            setNewRole("employee");
            fetchUsers();
        } catch (err: any) {
            setActionError(err.message || "Failed to register new user.");
        } finally {
            setSubmittingUser(false);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        setActionError("");
        setActionSuccess("");
        try {
            await api.deleteUser(userId);
            setActionSuccess("User deleted successfully.");
            setUsers(prev => prev.filter(u => u.user_id !== userId));
        } catch (err: any) {
            setActionError(err.message || "Failed to delete user.");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-950">
                <div className="flex flex-col items-center space-y-3">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                    <p className="text-sm text-gray-400 font-medium">Loading Admin Panel...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-950 overflow-hidden relative">
            <Sidebar user={user} isOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />

            <main className="flex-1 overflow-y-auto bg-gray-950 p-4 sm:p-8">
                <header className="mb-8 flex items-center justify-between pb-5 border-b border-gray-900">
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => setMobileSidebarOpen(prev => !prev)}
                            className="p-2 rounded-xl bg-gray-800 hover:bg-gray-750 text-gray-300 hover:text-white md:hidden transition-colors shrink-0"
                            title="Toggle Sidebar"
                        >
                            <Menu className="w-5 h-5 text-orange-500" />
                        </button>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center space-x-2">
                                <Shield className="w-6 h-6 text-indigo-500" />
                                <span>Admin Console</span>
                            </h1>
                            <p className="text-xs text-gray-400 mt-1">
                                Manage policy memory and company member accounts for Tenant: <span className="font-mono text-indigo-400">{user?.tenant_id}</span>
                            </p>
                        </div>
                    </div>
                </header>

                {actionError && (
                    <div className="flex items-center space-x-3 p-4 mb-6 bg-red-950/20 border border-red-900/40 rounded-xl text-red-400 text-sm">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span>{actionError}</span>
                    </div>
                )}
                {actionSuccess && (
                    <div className="flex items-center space-x-3 p-4 mb-6 bg-emerald-950/20 border border-emerald-900/40 rounded-xl text-emerald-400 text-sm">
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                        <span>{actionSuccess}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    <div className="xl:col-span-2 space-y-8">
                        <DocumentUpload />
                    </div>

                    <div className="space-y-8">
                        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 shadow-xl space-y-5">
                            <h3 className="font-bold text-white text-sm flex items-center space-x-2">
                                <UserPlus className="w-4 h-4 text-indigo-400" />
                                <span>Add Company Member</span>
                            </h3>

                            <form onSubmit={handleCreateUser} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                                        <input
                                            type="email"
                                            required
                                            value={newEmail}
                                            onChange={e => setNewEmail(e.target.value)}
                                            placeholder="employee@company.com"
                                            className="w-full pl-9 pr-4 py-2.5 bg-gray-950 border border-gray-850 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                                        <input
                                            type="password"
                                            required
                                            value={newPassword}
                                            onChange={e => setNewPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full pl-9 pr-4 py-2.5 bg-gray-950 border border-gray-850 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                        Access Role
                                    </label>
                                    <select
                                        value={newRole}
                                        onChange={e => setNewRole(e.target.value as "employee" | "admin")}
                                        className="w-full px-3 py-2.5 bg-gray-950 border border-gray-850 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                                    >
                                        <option value="employee">Employee (Chat Access Only)</option>
                                        <option value="admin">Administrator (Upload & Chat Access)</option>
                                    </select>
                                </div>

                                <button
                                    type="submit"
                                    disabled={submittingUser}
                                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-200 shadow-md shadow-indigo-600/10 active:scale-[0.98]"
                                >
                                    {submittingUser ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Register Member"}
                                </button>
                            </form>
                        </div>

                        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 shadow-xl space-y-4">
                            <h3 className="font-bold text-white text-sm flex items-center space-x-2">
                                <Users className="w-4 h-4 text-indigo-400" />
                                <span>Company Directory</span>
                            </h3>

                            {usersLoading ? (
                                <div className="flex justify-center items-center py-6">
                                    <Loader2 className="w-5 h-5 text-gray-600 animate-spin" />
                                </div>
                            ) : users.length === 0 ? (
                                <p className="text-xs text-gray-500 py-4 text-center">No company members found.</p>
                            ) : (
                                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                                    {users.map(u => {
                                        const targetId = u.user_id || u.id || "";
                                        const currentId = user?.user_id || user?.id || "";
                                        return (
                                            <div
                                                key={targetId}
                                                className="flex justify-between items-center p-3 bg-gray-950/40 border border-gray-850 rounded-xl hover:border-gray-800 transition-all duration-200"
                                            >
                                                <div className="min-w-0 flex-1 pr-2">
                                                    <p className="text-xs font-bold text-white truncate" title={u.email}>
                                                        {u.email}
                                                    </p>
                                                    <p className="text-[10px] text-indigo-400 capitalize mt-0.5 font-semibold">
                                                        {u.role}
                                                    </p>
                                                </div>

                                                {targetId !== currentId && (
                                                    <button
                                                        onClick={() => handleDeleteUser(targetId)}
                                                        className="p-1.5 hover:bg-red-950/20 text-gray-500 hover:text-red-400 rounded-lg transition-colors flex-shrink-0"
                                                        title="Delete Member"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}