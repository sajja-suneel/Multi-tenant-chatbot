"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, User as UserIcon, Mail, Lock, Loader2, ArrowRight } from "lucide-react";
import api from "../services/api";

export default function RegisterForm() {
    const [companyName, setCompanyName] = useState("");
    const [adminName, setAdminName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await api.registerCompany({
                company_name: companyName,
                admin_name: adminName,
                email,
                password,
            });

            await api.login({ email, password });
            router.push("/chat");
        } catch (err: any) {
            setError(err.message || "Failed to register company. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-2xl p-6 sm:p-8 bg-white border border-slate-200/90 rounded-2xl shadow-xl shadow-slate-200/50">
            <div className="flex flex-col items-center mb-6 text-center">
                <div className="flex items-center justify-center w-12 h-12 mb-3 bg-orange-50 rounded-xl border border-orange-200/80 shadow-xs">
                    <Building2 className="w-6 h-6 text-orange-600" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Create Tenant Workspace</h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-md">
                    Register your company to access the isolated RAG engine
                </p>
            </div>

            {error && (
                <div className="p-3.5 mb-5 text-sm text-red-700 border border-red-200 bg-red-50 rounded-xl font-medium">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                            Company Name
                        </label>
                        <div className="relative">
                            <Building2 className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                required
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                placeholder="Acme Corporation"
                                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                            Admin Name
                        </label>
                        <div className="relative">
                            <UserIcon className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                required
                                value={adminName}
                                onChange={(e) => setAdminName(e.target.value)}
                                placeholder="John Doe"
                                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                            Admin Email Address
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@company.com"
                                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                            Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                            />
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="group relative w-full flex items-center justify-center py-3.5 px-5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm sm:text-base rounded-xl transition-all duration-200 shadow-lg shadow-orange-500/20 active:scale-[0.98] mt-2"
                >
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            Register & Login
                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}