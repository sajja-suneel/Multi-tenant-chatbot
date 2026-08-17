import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PolicyRAG - Multi-Tenant RAG AI Platform",
  description: "Enterprise multi-tenant RAG chatbot platform with vector search, tenant isolation, and intelligent policy assistance.",
  keywords: ["RAG", "Multi-tenant", "AI Chatbot", "Enterprise AI", "Vector Search", "Policy Assistant"],
};

export const viewport: Viewport = {
  themeColor: "#ff6600",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#f6f8fc] text-[#0f172a] selection:bg-orange-500/20 selection:text-orange-700">
        {children}
      </body>
    </html>
  );
}

