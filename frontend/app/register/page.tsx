"use client";

import Link from "next/link";
import RegisterForm from "../../components/RegisterForm";

export default function RegisterPage() {
    return (
        <main className="flex flex-col items-center justify-center min-h-screen bg-[#f8fafc] px-4 relative overflow-hidden">
            {/* Visual background glowing accents */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="relative z-10 w-full max-w-xl flex flex-col items-center space-y-6">
                <RegisterForm />
                <p className="text-sm text-slate-600 font-medium">
                    Already registered?{" "}
                    <Link href="/login" className="text-orange-600 hover:text-orange-700 font-semibold transition-colors">
                        Sign In
                    </Link>
                </p>
            </div>
        </main>
    );
}