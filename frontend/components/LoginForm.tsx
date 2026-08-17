"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, Loader2, ArrowRight } from "lucide-react";
import api from "../services/api";

export default function LoginForm() {
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
            await api.login({ email, password });
            router.push("/chat");
        } catch (err: any) {
            setError(err.message || "Failed to log in. Please check your credentials.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md p-8 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl backdrop-blur-md bg-opacity-95">
            <div className="flex flex-col items-center mb-8">
                <div className="flex items-center justify-center w-12 h-12 mb-4 bg-indigo-500 rounded-xl bg-opacity-10 border border-indigo-500/20">
                    <Lock className="w-6 h-6 text-indigo-400" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-white">Welcome Back</h2>
                <p className="mt-2 text-sm text-gray-400 text-center">
                    Sign in to access your company's policy chatbot
                </p>
            </div>

            {error && (
                <div className="p-4 mb-6 text-sm text-red-400 border border-red-900/50 bg-red-950/20 rounded-xl">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        Work Email Address
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-500" />
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@company.com"
                            className="w-full pl-11 pr-4 py-3 bg-gray-950/50 border border-gray-850 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        Password
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-500" />
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full pl-11 pr-4 py-3 bg-gray-950/50 border border-gray-850 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="group relative w-full flex items-center justify-center py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
                >
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            Sign In
                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}