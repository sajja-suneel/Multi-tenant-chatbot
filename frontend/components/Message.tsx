"use client";

import React, { useState } from "react";
import { MessageSquare, Bot, User as UserIcon, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { Message } from "../types";

interface MessageProps {
    message: Message;
}

export default function MessageComponent({ message }: MessageProps) {
    const isUser = message.role === "user";
    const [showSources, setShowSources] = useState(false);

    return (
        <div className={`flex w-full mt-4 space-x-3 max-w-3xl ${isUser ? "ml-auto justify-end" : ""}`}>
            {/* Bot Icon */}
            {!isUser && (
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Bot className="w-5 h-5" />
                </div>
            )}

            {/* Message Bubble Wrapper */}
            <div className="max-w-[78%] sm:max-w-[85%] space-y-2">
                <div
                    className={`p-4 rounded-2xl text-sm leading-relaxed break-words overflow-hidden ${isUser
                        ? "bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-600/10"
                        : "bg-gray-900 border border-gray-800 text-gray-100 rounded-tl-none shadow-md shadow-black/10"
                        }`}
                >
                    {/* Answer Text - break-words added here */}
                    <div className="whitespace-pre-line break-words">{message.text}</div>

                    <div className="mt-2 text-[10px] opacity-40 text-right">
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>

                {/* Collapsible Source Citation Drawer */}
                {!isUser && message.sources && message.sources.length > 0 && (
                    <div className="bg-gray-950/40 border border-gray-900/60 rounded-xl overflow-hidden transition-all duration-300">
                        <button
                            onClick={() => setShowSources(!showSources)}
                            className="w-full flex items-center justify-between px-3.5 py-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                            <div className="flex items-center space-x-1.5">
                                <BookOpen className="w-3.5 h-3.5" />
                                <span>Sources used ({message.sources.length})</span>
                            </div>
                            {showSources ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>

                        {showSources && (
                            <div className="px-3.5 pb-3.5 pt-1.5 space-y-2 border-t border-gray-900/50 division-y division-gray-900/50">
                                {message.sources.map((source, index) => (
                                    <div key={index} className="text-[11px] text-gray-400 pt-2 first:pt-0">
                                        <div className="flex justify-between items-center font-bold text-gray-300 mb-1">
                                            <span className="truncate max-w-[200px] text-indigo-300/80">{source.document_name}</span>
                                            {source.page_number && (
                                                <span className="bg-gray-900 px-1.5 py-0.5 rounded text-[10px] text-gray-500">
                                                    Page {source.page_number}
                                                </span>
                                            )}
                                        </div>
                                        <blockquote className="border-l border-indigo-500/20 pl-2.5 py-1 italic bg-gray-900/10 text-gray-400 rounded-r">
                                            "{source.text}"
                                        </blockquote>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* User Icon */}
            {isUser && (
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-800 border border-gray-700/50 flex items-center justify-center text-gray-400">
                    <UserIcon className="w-5 h-5" />
                </div>
            )}
        </div>
    );
}