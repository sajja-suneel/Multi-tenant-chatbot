"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Bot, ShieldCheck } from "lucide-react";
import api, { getAuthToken } from "../services/api";

export default function Home() {
  const router = useRouter();
  const [statusMessage, setStatusMessage] = useState("Verifying session...");

  useEffect(() => {
    const checkSession = async () => {
      const token = getAuthToken();
      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        setStatusMessage("Loading tenant workspace...");
        const user = await api.getMe();
        if (user.role === "admin") {
          router.replace("/dashboard");
        } else {
          router.replace("/chat");
        }
      } catch (err) {
        api.logout();
        router.replace("/login");
      }
    };

    checkSession();
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 px-4 relative overflow-hidden">
      {/* Visual background glowing accents */}
      <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="relative z-10 flex flex-col items-center space-y-6 text-center max-w-sm">
        <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/30 animate-pulse">
          <Bot className="w-9 h-9 text-white" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-white tracking-tight">PolicyRAG Workspace</h1>
          <div className="flex items-center justify-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Multi-Tenant Enterprise AI</span>
          </div>
        </div>

        <div className="flex items-center space-x-3 px-4 py-2.5 bg-gray-900/80 border border-gray-800 rounded-full shadow-inner">
          <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
          <p className="text-xs text-gray-300 font-medium">{statusMessage}</p>
        </div>
      </div>
    </div>
  );
}