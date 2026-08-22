"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import AeuxDashboard from "../components/AeuxDashboard";
import { X } from "lucide-react";

export default function DashboardPage() {
  const { user, logout, message, setMessage } = useAuth();
  const router = useRouter();

  return (
    <div className="min-h-screen w-full bg-[#0E1510]">
      {/* AEUSER GLOBAL DASHBOARD MATCHING MOCKUP DESIGN */}
      <AeuxDashboard
        userName={user?.name || "Alex Williamson"}
        userTag={`#${user?.email ? user.email.split("@")[0] : "dela-1974"}`}
        userAvatar={
          user?.avatarUrl ||
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80"
        }
        onLogout={() => {
          logout();
          router.push("/logowanie");
        }}
      />

      {/* SLEEK SLIDE-IN TOAST NOTIFICATION */}
      {message && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-right-8 fade-in duration-200">
          <div
            className={`p-4 pr-5 rounded-2xl text-xs font-bold flex items-center gap-3 border shadow-2xl ${
              message.type === "success"
                ? "bg-[#0C130E] text-emerald-300 border-emerald-500/40"
                : "bg-[#0C130E] text-red-300 border-red-500/40"
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                message.type === "success"
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-red-500/20 text-red-400"
              }`}
            >
              {message.type === "success" ? "✓" : "!"}
            </div>
            <span className="max-w-xs">{message.text}</span>
            <button
              onClick={() => setMessage(null)}
              className="p-1 text-zinc-500 hover:text-white rounded-lg cursor-pointer ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
