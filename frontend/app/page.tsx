"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bot,
  ShieldCheck,
  Building2,
  Sparkles,
  Cpu,
  FileText,
  Lock,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  Zap,
  Database,
  Users,
  BarChart3,
  Globe,
  HelpCircle,
  LogIn,
  UserPlus,
  Search,
  MessageSquare,
  Server,
  Layers
} from "lucide-react";
import LoginForm from "../components/LoginForm";
import RegisterForm from "../components/RegisterForm";
import api, { getAuthToken } from "../services/api";

export default function Home() {
  const router = useRouter();
  const [authTab, setAuthTab] = useState<"login" | "register">("register");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const token = getAuthToken();
      if (token) {
        setIsLoggedIn(true);
        try {
          const user = await api.getMe();
          setUserRole(user.role);
        } catch {
          setIsLoggedIn(false);
        }
      }
    };
    checkUser();
  }, []);

  const scrollToAuth = (tab: "login" | "register") => {
    setAuthTab(tab);
    const element = document.getElementById("auth-section");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col selection:bg-orange-500/20 selection:text-orange-700 font-sans">
      {/* Background Ambient Glowing Gradients (Light Mode) */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-120px] left-1/4 w-[500px] h-[500px] bg-orange-400/10 rounded-full blur-[140px]" />
        <div className="absolute top-[80px] right-1/4 w-[450px] h-[450px] bg-amber-400/10 rounded-full blur-[140px]" />
        <div className="absolute top-[280px] left-1/3 w-[350px] h-[350px] bg-indigo-400/5 rounded-full blur-[120px]" />
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-slate-200/80 shadow-xs transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-11 h-11 bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform duration-200">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900 flex items-center">
                Policy<span className="text-orange-600">RAG</span>
              </span>
              <span className="text-[10px] font-semibold text-slate-500 block tracking-wider uppercase">
                Multi-Tenant AI Engine
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-orange-600 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-orange-600 transition-colors">
              How It Works
            </a>
            <a href="#architecture" className="hover:text-orange-600 transition-colors">
              Architecture
            </a>
            <a href="#faq" className="hover:text-orange-600 transition-colors">
              FAQ
            </a>
          </nav>

          <div className="flex items-center space-x-3">
            {isLoggedIn && (
              <Link
                href={userRole === "admin" ? "/dashboard" : "/chat"}
                className="inline-flex items-center px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold text-sm shadow-md shadow-orange-500/20 hover:brightness-105 active:scale-[0.98] transition-all"
              >
                Go to Workspace
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-16 pb-20 md:pt-24 md:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-semibold tracking-wide uppercase mb-8 shadow-xs">
          <Sparkles className="w-4 h-4 text-orange-600 animate-pulse" />
          <span>Next-Gen Enterprise RAG & Document Intelligence</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 max-w-5xl mx-auto leading-[1.15]">
          Isolated Multi-Tenant <br />
          <span className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 bg-clip-text text-transparent">
            RAG AI Assistant
          </span>{" "}
          for Enterprises
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto font-normal leading-relaxed">
          Upload policy handbooks, internal documentation, and compliance guides. Get sub-second, context-aware answers backed by high-precision vector search and complete tenant data isolation.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
          {isLoggedIn ? (
            <Link
              href={userRole === "admin" ? "/dashboard" : "/chat"}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-base shadow-xl shadow-orange-500/25 active:scale-[0.98] transition-all flex items-center justify-center"
            >
              Open Your Chatbot
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          ) : (
            <>
              <button
                onClick={() => scrollToAuth("register")}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-base shadow-xl shadow-orange-500/25 active:scale-[0.98] transition-all flex items-center justify-center"
              >
                Create Free Account
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
              <button
                onClick={() => scrollToAuth("login")}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white border border-slate-300 hover:border-slate-400 text-slate-700 font-semibold text-base hover:bg-slate-50 shadow-sm active:scale-[0.98] transition-all flex items-center justify-center"
              >
                Sign In to Workspace
              </button>
            </>
          )}
        </div>

        {/* Highlight Trust Badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-xs font-semibold text-slate-600">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>100% Tenant Vector Isolation</span>
          </div>
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-amber-600" />
            <span>&lt; 100ms FAISS Search Latency</span>
          </div>
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>PDF, TXT & Doc Ingestion</span>
          </div>
        </div>

        {/* Live Interactive UI Preview (Light Theme Container) */}
        <div className="mt-16 relative mx-auto max-w-5xl rounded-2xl border border-slate-200/90 bg-white p-2 sm:p-4 shadow-2xl shadow-slate-300/60 overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/5 via-transparent to-amber-500/5 pointer-events-none" />
          
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-100/90 rounded-t-xl">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <span className="ml-2 text-xs font-mono text-slate-500">policy-rag-demo.company.internal</span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-orange-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Active Tenant Engine</span>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-4 text-left font-sans text-sm bg-slate-50/50">
            {/* User Prompt */}
            <div className="flex items-start space-x-3 justify-end">
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-4 rounded-2xl rounded-tr-none max-w-lg shadow-md">
                <p className="font-medium">What is our company's policy on remote work stipends and travel expenses?</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-slate-200 border border-slate-300 flex items-center justify-center text-xs font-bold text-slate-700 shrink-0">
                You
              </div>
            </div>

            {/* AI Response with RAG citations */}
            <div className="flex items-start space-x-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white shrink-0 shadow-md">
                <Bot className="w-5 h-5" />
              </div>
              <div className="bg-white border border-slate-200/90 text-slate-800 p-5 rounded-2xl rounded-tl-none max-w-2xl space-y-3 shadow-md">
                <div className="flex items-center space-x-2 text-xs text-orange-600 font-semibold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Verified Policy Answer (RAG Context)</span>
                </div>
                <p className="text-slate-700 leading-relaxed">
                  According to your company's <span className="text-orange-600 font-semibold">2026 Employee Handbook</span>:
                </p>
                <ul className="list-disc list-inside space-y-1.5 text-slate-700 pl-1">
                  <li><strong>Remote Work Stipend:</strong> Full-time employees receive a <strong>$150/month</strong> home office utility allowance.</li>
                  <li><strong>Travel Expense:</strong> Business travel requires pre-approval from department heads. Expenses up to <strong>$75/day</strong> for meals do not require receipts.</li>
                </ul>
                <div className="pt-2.5 border-t border-slate-100 flex flex-wrap gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-600 flex items-center">
                    <FileText className="w-3 h-3 mr-1.5 text-orange-600" />
                    HR_Employee_Handbook_2026.pdf (Page 14)
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-600 flex items-center">
                    <CheckCircle2 className="w-3 h-3 mr-1.5 text-emerald-600" />
                    Similarity Score: 98.4%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="features" className="relative z-10 py-20 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-orange-600 mb-2">
              Enterprise Ready Architecture
            </h2>
            <p className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              Built for Security, Speed & Context Accuracy
            </p>
            <p className="mt-4 text-slate-600 text-base">
              Everything your organization needs to deploy an intelligent, isolated AI assistant safely.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:border-orange-300 shadow-md shadow-slate-200/30 hover:shadow-xl transition-all group hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-orange-100/80 border border-orange-200 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Multi-Tenant Isolation</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Strict multi-tenant security architecture ensures vectors and documents for each company are completely separated and encrypted.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:border-amber-300 shadow-md shadow-slate-200/30 hover:shadow-xl transition-all group hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-amber-100/80 border border-amber-200 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Cpu className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">FAISS Vector Search</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                High-dimensional embedding storage with FAISS vector similarity search for sub-second retrieval of pertinent policy clauses.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:border-indigo-300 shadow-md shadow-slate-200/30 hover:shadow-xl transition-all group hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-indigo-100/80 border border-indigo-200 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Automated Ingestion</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Drag-and-drop PDF, TXT, and Doc files. Automatic text extraction, smart chunking, and immediate vector indexing.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-8 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:border-emerald-300 shadow-md shadow-slate-200/30 hover:shadow-xl transition-all group hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-emerald-100/80 border border-emerald-200 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Admin Dashboard & RBAC</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Manage company document knowledgebases, invite users, oversee system health, and inspect ingestion metrics effortlessly.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-8 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:border-purple-300 shadow-md shadow-slate-200/30 hover:shadow-xl transition-all group hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-purple-100/80 border border-purple-200 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Lock className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">JWT Auth & Security</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Secure JWT token handling with role verification (`admin` vs `user`), protecting API endpoints and vector operations.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-8 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:border-sky-300 shadow-md shadow-slate-200/30 hover:shadow-xl transition-all group hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-sky-100/80 border border-sky-200 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-6 h-6 text-sky-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Cited Source References</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Every AI response provides direct citations and exact document snippet references so employees can verify information easily.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-orange-600 mb-2">
            Simple 3-Step Process
          </h2>
          <p className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            How PolicyRAG Works
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          <div className="p-8 rounded-2xl bg-white border border-slate-200/90 shadow-lg shadow-slate-200/40 relative">
            <span className="text-5xl font-extrabold text-orange-500/10 absolute top-4 right-6">01</span>
            <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center text-white font-bold mb-6 shadow-md shadow-orange-500/20">
              1
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Register Company</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Create your company tenant workspace in under a minute. Get dedicated admin credentials and isolated storage space.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-white border border-slate-200/90 shadow-lg shadow-slate-200/40 relative">
            <span className="text-5xl font-extrabold text-orange-500/10 absolute top-4 right-6">02</span>
            <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center text-white font-bold mb-6 shadow-md shadow-amber-500/20">
              2
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Upload Policy Documents</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Upload PDF or TXT policy files. Our engine chunks texts, generates vector embeddings, and builds your private search index.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-white border border-slate-200/90 shadow-lg shadow-slate-200/40 relative">
            <span className="text-5xl font-extrabold text-orange-500/10 absolute top-4 right-6">03</span>
            <div className="w-10 h-10 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-bold mb-6 shadow-md shadow-indigo-500/20">
              3
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Query & Get Instant Answers</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Employees ask natural language questions and receive instant AI answers complete with verifiable document sources.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Auth Section */}
      <section id="auth-section" className="py-12 sm:py-16 bg-slate-100/70 border-t border-slate-200/80 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Get Started with PolicyRAG
            </h2>
            <p className="mt-1.5 text-slate-600 text-sm font-medium">
              Sign in to your existing workspace or register a new company account below.
            </p>

            {/* Auth Tab Toggle Switch (Light Theme) */}
            <div className="mt-5 inline-flex p-1 bg-slate-200/80 border border-slate-300/80 rounded-xl">
              <button
                onClick={() => setAuthTab("register")}
                className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                  authTab === "register"
                    ? "bg-white text-orange-600 shadow-sm border border-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Create Account (Register)
              </button>
              <button
                onClick={() => setAuthTab("login")}
                className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                  authTab === "login"
                    ? "bg-white text-orange-600 shadow-sm border border-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Sign In (Login)
              </button>
            </div>
          </div>

          <div className="flex justify-center items-center">
            {authTab === "register" ? <RegisterForm /> : <LoginForm />}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-4">
          {[
            {
              q: "How does tenant data isolation work?",
              a: "Each registered company is assigned a unique tenant identifier. All uploaded documents and vector embeddings are partitioned into isolated vector stores so data from one company is never accessible by another."
            },
            {
              q: "What file formats are supported for document upload?",
              a: "We currently support PDF and Plain Text (.txt) policy documents. Documents are chunked into optimal passage sizes and stored as 384-dimensional vector embeddings for fast semantic lookup."
            },
            {
              q: "Can I manage multiple user roles within a company?",
              a: "Yes. Company creators are assigned the Admin role, allowing them to upload policy documents and monitor system analytics. Regular employees can log in as Users to ask questions and chat with the AI assistant."
            }
          ].map((faq, idx) => (
            <div key={idx} className="border border-slate-200/90 rounded-xl bg-white overflow-hidden shadow-sm">
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full text-left p-5 font-semibold text-slate-900 flex justify-between items-center hover:bg-slate-50 transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronRight className={`w-5 h-5 text-orange-600 transition-transform ${activeFaq === idx ? "rotate-90" : ""}`} />
              </button>
              {activeFaq === idx && (
                <div className="p-5 pt-0 text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-white border-t border-slate-200/90 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center text-white shadow-xs">
              <Bot className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold text-slate-900">
              Policy<span className="text-orange-600">RAG</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 text-center font-medium">
            © {new Date().getFullYear()} PolicyRAG Inc. All rights reserved. Enterprise Multi-Tenant AI Platform.
          </p>
          <div className="flex space-x-6 text-xs text-slate-600 font-semibold">
            <a href="#features" className="hover:text-orange-600 transition-colors">Features</a>
            <a href="#auth-section" className="hover:text-orange-600 transition-colors">Login</a>
            <a href="#auth-section" className="hover:text-orange-600 transition-colors">Register</a>
          </div>
        </div>
      </footer>
    </div>
  );
}