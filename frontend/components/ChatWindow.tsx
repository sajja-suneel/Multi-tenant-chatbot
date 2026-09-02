"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, AlertCircle, Trash2, Paperclip, CheckCircle2, Menu } from "lucide-react";
import { Message } from "../types";
import MessageComponent from "./Message";
import api from "../services/api";

interface ChatWindowProps {
    messages: Message[];
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
    companyName: string;
    onClearChat?: () => void;
    activeSessionId?: string;
    onToggleSidebar?: () => void;
}

export default function ChatWindow({ 
    messages, 
    setMessages, 
    companyName, 
    onClearChat,
    activeSessionId = "default",
    onToggleSidebar
}: ChatWindowProps) {
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [uploadingDocs, setUploadingDocs] = useState(false);
    const [error, setError] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUploadFromChat = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const files = e.target.files;
        setUploadingDocs(true);
        setError("");

        try {
            const res = await api.uploadDocument(files);
            const count = res.total_uploaded !== undefined ? res.total_uploaded : (res.document_name ? 1 : files.length);
            const failedCount = res.total_failed || 0;
            
            let statusText = `📄 **Document Upload Complete**: Successfully indexed ${count} PDF document(s) into ${companyName} policy memory!`;
            if (failedCount > 0) {
                statusText += ` (Skipped ${failedCount} duplicate file(s) already in memory).`;
            }
            
            const sysMessage: Message = {
                id: Date.now().toString(),
                role: "assistant",
                text: statusText,
                timestamp: new Date(),
                session_id: activeSessionId
            } as any;
            setMessages(prev => [...prev, sysMessage]);
        } catch (err: any) {
            setError(err.message || "Failed to upload document(s). Admin permissions may be required.");
        } finally {
            setUploadingDocs(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userText = input.trim();
        setInput("");
        setError("");

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            text: userText,
            timestamp: new Date(),
            session_id: activeSessionId
        } as any;
        setMessages(prev => [...prev, userMessage]);
        setLoading(true);

        try {
            const response = await api.chat(userText, activeSessionId);

            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                text: response.answer,
                sources: response.sources,
                timestamp: new Date(),
                session_id: activeSessionId
            } as any;
            setMessages(prev => [...prev, botMessage]);
        } catch (err: any) {
            setError(err.message || "Failed to retrieve answer. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col h-screen h-[100dvh] max-h-[100dvh] overflow-hidden bg-gray-950 text-gray-100">
            <header className="px-4 sm:px-6 py-4 bg-gray-900 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    {onToggleSidebar && (
                        <button
                            onClick={onToggleSidebar}
                            className="p-2 rounded-xl bg-gray-800 hover:bg-gray-750 text-gray-300 hover:text-white md:hidden transition-colors shrink-0"
                            title="Toggle Sidebar"
                        >
                            <Menu className="w-5 h-5 text-orange-500" />
                        </button>
                    )}
                    <div className="w-8 h-8 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <Bot className="w-4 h-4" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-white">{companyName} Policy Assistant</h2>
                        <div className="flex items-center space-x-1.5 mt-0.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-[10px] text-gray-400">RAG isolation active</span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto text-center space-y-4">
                        <div className="w-14 h-14 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/5">
                            <Bot className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-white">Ask your company policy questions</h3>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            I can answer queries regarding your specific organization's leaves, handbooks, and documents.
                            Queries about other topics or unprovided documents will be filtered.
                        </p>
                    </div>
                ) : (
                    messages.map(msg => (
                        <MessageComponent key={msg.id} message={msg} />
                    ))
                )}

                {loading && (
                    <div className="flex w-full mt-4 space-x-3 max-w-3xl">
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                            <Bot className="w-5 h-5 animate-pulse" />
                        </div>
                        <div className="bg-gray-900 border border-gray-800 text-gray-300 p-4 rounded-2xl rounded-tl-none flex items-center space-x-2">
                            <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                            <span className="text-xs text-gray-400">Policy Assistant is typing...</span>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="flex w-full mt-4 space-x-3 max-w-lg mx-auto bg-red-950/20 border border-red-900/40 rounded-xl p-4 text-sm text-red-400 items-start space-x-3">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
                        <div>
                            <p className="font-bold text-white">Error Processing Query</p>
                            <p className="mt-0.5 text-gray-400">{error}</p>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            <footer className="p-4 bg-gray-900/60 border-t border-gray-800">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUploadFromChat}
                    accept=".pdf,.docx,.txt,.md,.png,.jpg,.jpeg,.tiff,.bmp"
                    multiple
                    className="hidden"
                />
                <form onSubmit={handleSend} className="max-w-4xl mx-auto relative flex items-center">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={loading || uploadingDocs}
                        className="absolute left-3.5 p-2 rounded-xl text-gray-400 hover:text-indigo-400 hover:bg-gray-800/80 transition-colors disabled:opacity-50"
                        title="Upload multiple policy PDFs into memory"
                    >
                        {uploadingDocs ? (
                            <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                        ) : (
                            <Paperclip className="w-4 h-4" />
                        )}
                    </button>
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        disabled={loading || uploadingDocs}
                        placeholder={uploadingDocs ? "Indexing uploaded document(s)..." : `Message ${companyName} Policy Assistant...`}
                        className="w-full pl-12 pr-14 py-4 bg-gray-950 border border-gray-850 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-sm disabled:opacity-50"
                    />
                    <button
                        type="submit"
                        disabled={loading || uploadingDocs || !input.trim()}
                        className="absolute right-3.5 p-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors active:scale-[0.96]"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            </footer>
        </div>
    );
}