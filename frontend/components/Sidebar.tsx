"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { MessageSquare, LayoutDashboard, LogOut, User as UserIcon, Trash2, ShieldAlert, History, Clock, Plus, X } from "lucide-react";
import { User, Message } from "../types";
import api from "../services/api";

interface SidebarProps {
    user: User | null;
    onClearChat?: () => void;
    messages?: Message[];
    onSelectMessage?: (messageId: string) => void;
    activeSessionId?: string;
    onSelectSession?: (sessionId: string) => void;
    onDeleteSession?: (sessionId: string) => void;
    onNewChat?: () => void;
    sessions?: { id: string; title: string; timestamp: Date }[];
    isOpen?: boolean;
    onClose?: () => void;
}

export default function Sidebar({ 
    user, 
    onClearChat, 
    messages = [], 
    onSelectMessage,
    activeSessionId = "default",
    onSelectSession,
    onDeleteSession,
    onNewChat,
    sessions = [],
    isOpen = false,
    onClose
}: SidebarProps) {
    const router = useRouter();
    const pathname = usePathname();

    const handleLogout = () => {
        api.logout();
        router.push("/login");
        if (onClose) onClose();
    };

    const isAdmin = user?.role === "admin";

    const handleSelectSession = (sessionId: string) => {
        if (onSelectSession) onSelectSession(sessionId);
        if (onClose) onClose();
    };

    const handleNewChatAction = () => {
        if (onNewChat) onNewChat();
        if (onClose) onClose();
    };

    const handleNavClick = (path: string) => {
        router.push(path);
        if (onClose) onClose();
    };

    return (
        <>
            {/* Backdrop Overlay for Mobile Drawer */}
            {isOpen && (
                <div 
                    onClick={onClose} 
                    className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 md:hidden transition-opacity"
                />
            )}

            <aside className={`fixed md:relative inset-y-0 left-0 z-50 w-72 md:w-64 bg-gray-950 border-r border-gray-900 flex flex-col justify-between h-screen text-gray-300 transition-transform duration-300 ease-in-out shrink-0 ${
                isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            }`}>
                <div className="flex flex-col flex-1 p-4 overflow-y-auto space-y-6">
                    <div className="flex items-center justify-between px-2 py-1">
                        <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 bg-gradient-to-tr from-orange-500 via-rose-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-white text-lg shadow-md shadow-orange-500/20">
                                R
                            </div>
                            <div>
                                <h1 className="font-bold text-white text-base leading-tight">PolicyRAG</h1>
                                <span className="text-[10px] text-orange-500 font-semibold tracking-wider uppercase">Multi-Tenant v1.0</span>
                            </div>
                        </div>

                        {/* Close button for Mobile */}
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-900 md:hidden transition-colors"
                                title="Close Menu"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    {pathname === "/chat" && onNewChat && (
                        <button
                            onClick={handleNewChatAction}
                            className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/20 transition-all duration-200 hover:scale-[1.01] active:scale-[0.98]"
                        >
                            <Plus className="w-4 h-4" />
                            <span>New Chat</span>
                        </button>
                    )}

                    <div className="space-y-1">
                        <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2 mb-2">
                            Navigation
                        </span>
                        <button
                            onClick={() => handleNavClick("/chat")}
                            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${pathname === "/chat"
                                    ? "bg-orange-50/80 text-orange-600 border border-orange-200/60 font-semibold shadow-sm"
                                    : "hover:bg-gray-900 hover:text-white"
                                }`}
                        >
                            <MessageSquare className="w-5 h-5 text-orange-500" />
                            <span>Chat Assistant</span>
                        </button>

                        {isAdmin && (
                            <button
                                onClick={() => handleNavClick("/dashboard")}
                                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${pathname === "/dashboard"
                                        ? "bg-orange-50/80 text-orange-600 border border-orange-200/60 font-semibold shadow-sm"
                                        : "hover:bg-gray-900 hover:text-white"
                                    }`}
                            >
                                <LayoutDashboard className="w-5 h-5 text-orange-500" />
                                <span>Admin Dashboard</span>
                            </button>
                        )}
                    </div>

                    {/* Chat History List Section */}
                    {pathname === "/chat" && sessions.length > 0 && (
                        <div className="space-y-1 pt-3 border-t border-gray-900 flex-1 overflow-hidden flex flex-col">
                            <div className="flex items-center justify-between px-2 mb-2">
                                <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center space-x-1">
                                    <History className="w-3.5 h-3.5 text-orange-500 inline mr-1" />
                                    Chat Conversations
                                </span>
                            </div>
                            <div className="space-y-1 overflow-y-auto flex-1 pr-1 custom-scrollbar">
                                {sessions.map((sess) => (
                                    <div
                                        key={sess.id}
                                        className={`group flex items-center justify-between rounded-xl transition-all duration-150 ${
                                            activeSessionId === sess.id
                                                ? "bg-gray-900 text-white font-semibold"
                                                : "hover:bg-gray-900/60 text-gray-400 hover:text-gray-200"
                                        }`}
                                    >
                                        <button
                                            onClick={() => handleSelectSession(sess.id)}
                                            className="flex-1 text-left flex items-center space-x-3 px-3 py-2 text-xs truncate"
                                            title={sess.title}
                                        >
                                            <MessageSquare className={`w-4 h-4 flex-shrink-0 ${
                                                activeSessionId === sess.id ? "text-indigo-500" : "text-gray-500 group-hover:text-gray-400"
                                            }`} />
                                            <span className="truncate">{sess.title}</span>
                                        </button>
                                        {onDeleteSession && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDeleteSession(sess.id);
                                                }}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 hover:text-red-500 text-gray-500 rounded-lg hover:bg-gray-800 transition-all mr-1.5"
                                                title="Delete conversation"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {pathname === "/chat" && onClearChat && (
                        <div className="space-y-1 pt-3 border-t border-gray-900">
                            <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2 mb-2">
                                Actions
                            </span>
                            <button
                                onClick={() => {
                                    onClearChat();
                                    if (onClose) onClose();
                                }}
                                className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-orange-50 hover:text-orange-600 border border-transparent hover:border-orange-200/50 transition-all duration-200"
                            >
                                <Trash2 className="w-5 h-5 text-orange-500" />
                                <span>Clear Chat History</span>
                            </button>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-900 bg-gray-950/50 space-y-4">
                    {user && (
                        <div className="flex items-center space-x-3 p-2 bg-gray-900/40 rounded-xl border border-gray-900/50">
                            <div className="w-9 h-9 bg-purple-600/10 border border-purple-500/20 rounded-lg flex items-center justify-center text-purple-600">
                                {isAdmin ? <ShieldAlert className="w-5 h-5 text-orange-500" /> : <UserIcon className="w-5 h-5 text-purple-600" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-white truncate" title={user.email}>
                                    {user.email}
                                </p>
                                <p className="text-[10px] text-orange-500 font-medium capitalize">
                                    {user.role} role
                                </p>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center space-x-2 py-2.5 bg-gray-900 hover:bg-gray-850 text-gray-400 hover:text-white text-sm font-semibold rounded-xl border border-gray-800 hover:border-gray-750 transition-all duration-200 active:scale-[0.98]"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>
        </>
    );
}