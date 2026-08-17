"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { 
  Home, 
  Users, 
  CreditCard, 
  Mail, 
  Sliders, 
  Crown, 
  ArrowLeft,
  Sparkles,
  LayoutDashboard,
  LogOut,
  ChevronDown
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  
  const [waitlistCount, setWaitlistCount] = useState<number>(0);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/newsletter")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && typeof data.count === "number") {
          setWaitlistCount(data.count);
        }
      })
      .catch(() => {});
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Access Control Guard
  if (!mounted) {
    return (
      <main className="min-h-screen w-full bg-[#090A0C] text-white flex flex-col items-center justify-center p-6">
        <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
      </main>
    );
  }

  if (!user || (user.role !== "superadmin" && user.role !== "admin")) {
    return (
      <main className="min-h-screen w-full bg-[#090A0C] text-white flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#111216] border border-white/5 rounded-2xl p-8 text-center flex flex-col items-center">
          <div className="w-14 h-14 rounded-xl bg-[#FF5B28]/10 border border-[#FF5B28]/20 flex items-center justify-center text-[#FF5B28] mb-4">
            <Crown className="w-7 h-7" />
          </div>
          <span className="px-3 py-1 bg-[#FF5B28]/10 text-[#FF5B28] rounded-full text-xs font-bold uppercase tracking-wider border border-[#FF5B28]/20">
            Ograniczony Dostęp
          </span>
          <h1 className="mt-4 text-xl font-extrabold text-white tracking-tight">Wymagane Uprawnienia Admina</h1>
          <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
            Dostęp do tej sekcji posiadają wyłącznie konta z uprawnieniami Właściciel / Superadmin w serwisie motywo.pl.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 w-full py-3 bg-[#FF5B28] hover:bg-[#e04f20] text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Wróć do Dashboardu Sklepu</span>
          </Link>
        </div>
      </main>
    );
  }

  // Determine active tab route
  const getIsActive = (path: string) => {
    if (path === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(path);
  };

  const getPageTitle = () => {
    if (pathname.startsWith("/admin/users")) return "Użytkownicy";
    if (pathname.startsWith("/admin/subscriptions")) return "Płatności";
    if (pathname.startsWith("/admin/waitlist")) return "Waitlist";
    if (pathname.startsWith("/admin/settings")) return "Ustawienia";
    return "Strona główna";
  };

  const handleLogout = () => {
    logout();
    router.push("/logowanie");
  };

  return (
    <main className="min-h-screen w-full bg-[#090A0C] text-white flex flex-col font-sans pb-20 selection:bg-[#FF5B28] selection:text-white">
      {/* Header Bar */}
      <header className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#111216] p-3 px-6 rounded-2xl border border-white/5 shadow-xl">
          
          {/* Left: motywo.pl Brand Logo (Official /logo.svg) */}
          <Link href="/admin" className="flex items-center shrink-0">
            <img
              src="/logo.svg"
              alt="motywo.pl"
              className="h-8 sm:h-9 w-auto object-contain cursor-pointer"
            />
          </Link>

          {/* Center: Floating Dark Pill Navigation Bar (DOKŁADNE NAZWY ZPROSZONE PRZEZ UŻYTKOWNIKA) */}
          <div className="bg-[#18191E] border border-white/5 text-white p-1 rounded-full flex items-center gap-1 overflow-x-auto max-w-full">
            <Link
              href="/admin"
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                getIsActive("/admin")
                  ? "bg-[#FF5B28] text-white shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Strona główna</span>
            </Link>

            <Link
              href="/admin/users"
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                getIsActive("/admin/users")
                  ? "bg-[#FF5B28] text-white shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Użytkownicy</span>
            </Link>

            <Link
              href="/admin/subscriptions"
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                getIsActive("/admin/subscriptions")
                  ? "bg-[#FF5B28] text-white shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Płatności</span>
            </Link>

            <Link
              href="/admin/waitlist"
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                getIsActive("/admin/waitlist")
                  ? "bg-[#FF5B28] text-white shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Waitlist</span>
              {waitlistCount > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-400/20 text-amber-300 rounded-full text-[10px] font-extrabold border border-amber-400/30">
                  {waitlistCount}
                </span>
              )}
            </Link>

            <Link
              href="/admin/settings"
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                getIsActive("/admin/settings")
                  ? "bg-[#FF5B28] text-white shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Ustawienia</span>
            </Link>
          </div>

          {/* Right: Premium Tier-1 User Profile Badge */}
          <div className="relative shrink-0" ref={profileMenuRef}>
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-3 p-1.5 px-3 bg-[#090A0C] hover:bg-white/5 rounded-full border border-white/5 transition-all cursor-pointer shadow-sm"
            >
              <div className="w-8 h-8 rounded-full bg-[#1A1C23] border border-[#FF5B28]/50 text-[#FF5B28] flex items-center justify-center font-extrabold text-xs shrink-0 shadow-sm">
                👑
              </div>

              <div className="flex flex-col text-left pr-1">
                <span className="text-xs font-extrabold text-white leading-tight flex items-center gap-1.5">
                  <span>{user.name || "Rafał Albert"}</span>
                  <span className="px-1.5 py-0.2 bg-amber-400/20 text-amber-300 rounded text-[9px] font-extrabold border border-amber-400/30">
                    Superadmin
                  </span>
                </span>
                <span className="text-[10px] text-zinc-400 font-mono leading-tight">
                  {user.email}
                </span>
              </div>

              <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${isProfileMenuOpen ? "rotate-180 text-[#FF5B28]" : ""}`} />
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2 w-60 bg-[#18191E] border border-white/10 rounded-2xl p-2 shadow-2xl z-50 flex flex-col gap-1 animate-in fade-in duration-150">
                <div className="px-3.5 py-2.5 border-b border-white/5 mb-1 bg-[#090A0C] rounded-xl">
                  <span className="text-[10px] uppercase font-extrabold text-amber-400 block tracking-wider">
                    👑 Właściciel / Superadmin
                  </span>
                  <span className="text-xs font-bold text-white truncate block mt-0.5">{user.email}</span>
                </div>

                <Link
                  href="/dashboard"
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="px-3.5 py-2.5 hover:bg-white/5 rounded-xl text-xs font-bold text-white flex items-center gap-2.5 transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4 text-[#FF5B28]" />
                  <span>Przełącz do Panelu Sklepu</span>
                </Link>

                <Link
                  href="/admin/settings"
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="px-3.5 py-2.5 hover:bg-white/5 rounded-xl text-xs text-zinc-400 hover:text-white font-medium flex items-center gap-2.5 transition-colors"
                >
                  <Sliders className="w-4 h-4 text-zinc-400" />
                  <span>Ustawienia Systemu</span>
                </Link>

                <div className="border-t border-white/5 pt-1 mt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full px-3.5 py-2.5 hover:bg-red-500/10 text-red-400 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-red-400" />
                    <span>Wyloguj się</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Clean View Title Bar */}
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            {getPageTitle()}
          </h1>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        {children}
      </div>
    </main>
  );
}
