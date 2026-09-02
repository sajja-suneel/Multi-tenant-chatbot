"use client";

import Link from "next/link";
import LoginForm from "../../components/LoginForm";

export default function LoginPage() {
    return (
        <main className="flex flex-col items-center justify-center min-h-screen bg-[#f8fafc] px-4 relative overflow-hidden">
            {/* Visual background glowing accents */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="relative z-10 w-full max-w-xl flex flex-col items-center space-y-6">
                <LoginForm />
                <p className="text-sm text-slate-600 font-medium">
                    Need a company account?{" "}
                    <Link href="/register" className="text-orange-600 hover:text-orange-700 font-semibold transition-colors">
                        Register Company
                    </Link>
                </p>
            </div>
        </main>
    );
}