"use client";

import Link from "next/link";
import RegisterForm from "../../components/RegisterForm";

export default function RegisterPage() {
    return (
        <main className="flex flex-col items-center justify-center min-h-screen bg-gray-950 px-4 relative overflow-hidden">
            {/* Visual background glowing accents */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="relative z-10 w-full max-w-md flex flex-col items-center space-y-6">
                <RegisterForm />
                <p className="text-sm text-gray-400">
                    Already registered?{" "}
                    <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
                        Sign In
                    </Link>
                </p>
            </div>
        </main>
    );
}