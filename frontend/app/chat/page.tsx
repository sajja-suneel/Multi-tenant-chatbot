"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import ChatWindow from "../../components/ChatWindow";
import { User, Message } from "../../types";
import api from "../../services/api";

const CHAT_STORAGE_KEY_PREFIX = "policyrag_chat_history_";

export default function ChatPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>("default");
  const router = useRouter();

  // 1. Initial Load: Fetch authenticated user, then load local storage cache + sync with MongoDB
  useEffect(() => {
    const initChatPage = async () => {
      try {
        const userData = await api.getMe();
        setUser(userData);

        const userStorageKey = `${CHAT_STORAGE_KEY_PREFIX}${userData.user_id}`;
        
        // Cleanup old shared legacy key if present
        localStorage.removeItem("policyrag_chat_history");

        // Try loading from user-specific local storage cache first for instant UI response
        try {
          const savedLocal = localStorage.getItem(userStorageKey);
          if (savedLocal) {
            const parsed = JSON.parse(savedLocal);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setMessages(parsed);
              const sortedLogs = [...parsed].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
              const latestSessionId = (sortedLogs[0] as any).session_id || "default";
              setActiveSessionId(latestSessionId);
            }
          }
        } catch (e) {
          console.error("Error parsing local chat history:", e);
        }

        // Fetch persisted conversation history from MongoDB backend to overwrite and sync
        try {
          const historyLogs = await api.getChatHistory();
          const loadedMessages: Message[] = [];
          
          if (Array.isArray(historyLogs)) {
            historyLogs.forEach((log: any) => {
              const sId = log.session_id || "default";
              if (log.question) {
                loadedMessages.push({
                  id: log.log_id ? `${log.log_id}_user` : Math.random().toString(),
                  role: "user",
                  text: log.question,
                  timestamp: log.timestamp ? new Date(log.timestamp) : new Date(),
                  session_id: sId
                } as any);
              }
              if (log.answer) {
                loadedMessages.push({
                  id: log.log_id ? `${log.log_id}_assistant` : Math.random().toString(),
                  role: "assistant",
                  text: log.answer,
                  sources: log.sources,
                  timestamp: log.timestamp ? new Date(log.timestamp) : new Date(),
                  session_id: sId
                } as any);
              }
            });
          }

          // Always set the messages state to align exactly with backend (empty or populated)
          setMessages(loadedMessages);
          localStorage.setItem(userStorageKey, JSON.stringify(loadedMessages));

          if (loadedMessages.length > 0) {
            const sortedLogs = [...loadedMessages].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            const latestSessionId = (sortedLogs[0] as any).session_id || "default";
            setActiveSessionId(latestSessionId);
          }
        } catch (historyErr) {
          console.error("Failed to load chat history from server:", historyErr);
        }
      } catch (err) {
        api.logout();
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    initChatPage();
  }, [router]);

  // 2. Persist messages to localStorage under user-specific key whenever messages change
  useEffect(() => {
    if (user && messages.length > 0) {
      try {
        const userStorageKey = `${CHAT_STORAGE_KEY_PREFIX}${user.user_id}`;
        localStorage.setItem(userStorageKey, JSON.stringify(messages));
      } catch (e) {
        console.error("Failed to save chat to localStorage:", e);
      }
    }
  }, [messages, user]);

  const handleClearChat = async () => {
    try {
      await api.clearChatHistory();
    } catch (err) {
      console.error("Failed to clear chat history from server:", err);
    }
    if (user) {
      const userStorageKey = `${CHAT_STORAGE_KEY_PREFIX}${user.user_id}`;
      localStorage.removeItem(userStorageKey);
    }
    // Also clean up any legacy key
    localStorage.removeItem("policyrag_chat_history");
    setMessages([]);
    setActiveSessionId("default");
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await api.deleteChatSession(sessionId);
    } catch (err) {
      console.error("Failed to delete chat session from server:", err);
    }

    const remaining = messages.filter(msg => ((msg as any).session_id || "default") !== sessionId);
    setMessages(remaining);

    if (user) {
      const userStorageKey = `${CHAT_STORAGE_KEY_PREFIX}${user.user_id}`;
      localStorage.setItem(userStorageKey, JSON.stringify(remaining));
    }

    if (activeSessionId === sessionId) {
      if (remaining.length > 0) {
        const sorted = [...remaining].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setActiveSessionId((sorted[0] as any).session_id || "default");
      } else {
        setActiveSessionId("default");
      }
    }
  };

  const handleNewChat = () => {
    const newSessionId = `sess_${Math.random().toString(36).substring(2, 11)}`;
    setActiveSessionId(newSessionId);
  };

  // Derive conversation sessions directly from messages list
  const getSessions = (): { id: string; title: string; timestamp: Date }[] => {
    const sessionsMap = new Map<string, { id: string; title: string; timestamp: Date }>();
    
    // Sort chronologically to capture the first user query as the thread title
    const sorted = [...messages].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    sorted.forEach(msg => {
      const sId = (msg as any).session_id || "default";
      if (!sessionsMap.has(sId)) {
        sessionsMap.set(sId, {
          id: sId,
          title: msg.role === "user" ? msg.text : "New Chat",
          timestamp: new Date(msg.timestamp)
        });
      } else {
        const sess = sessionsMap.get(sId)!;
        sess.timestamp = new Date(msg.timestamp);
        if (sess.title === "New Chat" && msg.role === "user") {
          sess.title = msg.text;
        }
      }
    });

    // Ensure the current active session is present in the list
    if (activeSessionId && !sessionsMap.has(activeSessionId)) {
      sessionsMap.set(activeSessionId, {
        id: activeSessionId,
        title: "New Chat",
        timestamp: new Date()
      });
    }

    if (sessionsMap.size === 0) {
      sessionsMap.set("default", {
        id: "default",
        title: "New Chat",
        timestamp: new Date()
      });
    }

    // Sort latest conversations to the top
    return Array.from(sessionsMap.values()).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };

  if (loading && messages.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-sm text-gray-400 font-medium">Loading chat assistant...</p>
        </div>
      </div>
    );
  }

  // Filter messages belonging to the current active chat session/thread
  const activeMessages = messages.filter(msg => ((msg as any).session_id || "default") === activeSessionId);

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      <Sidebar 
        user={user} 
        onClearChat={handleClearChat} 
        messages={messages} 
        activeSessionId={activeSessionId}
        onSelectSession={setActiveSessionId}
        onDeleteSession={handleDeleteSession}
        onNewChat={handleNewChat}
        sessions={getSessions()}
      />
      <ChatWindow
        messages={activeMessages}
        setMessages={setMessages}
        companyName={user?.company || "Company"}
        onClearChat={handleClearChat}
        activeSessionId={activeSessionId}
      />
    </div>
  );
}
