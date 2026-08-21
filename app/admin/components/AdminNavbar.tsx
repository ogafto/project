"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  Crown, 
  Search, 
  LogOut, 
  LayoutDashboard, 
  AlertTriangle, 
  X,
  ExternalLink
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

interface AdminNavbarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeTab?: string;
  setActiveTab?: (tab: any) => void;
}

export default function AdminNavbar({
  searchQuery,
  setSearchQuery,
}: AdminNavbarProps) {
  const { 
    user, 
    allUsers,
    logout, 
    onlineUsersCount, 
    isImpersonating, 
    impersonatedStoreId, 
    exitImpersonation 
  } = useAuth();

  let impersonatedStore = null;
  if (isImpersonating && impersonatedStoreId) {
    for (const u of allUsers) {
      const uStores = u.stores || (u.store ? [u.store] : []);
      const found = uStores.find((s) => s.id === impersonatedStoreId);
      if (found) {
        impersonatedStore = found;
        break;
      }
    }
  }

  return (
    <header className="w-full flex flex-col gap-4 z-40">
      {/* Top Banner if Impersonating a Client Store */}
      {isImpersonating && (
        <div className="w-full px-5 py-3 bg-gradient-to-r from-amber-500/20 via-amber-600/30 to-orange-500/20 border border-amber-500/50 rounded-2xl backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shadow-lg animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-xl text-amber-400 border border-amber-500/40 shrink-0">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Tryb Impersonacji Aktywny
              </span>
              <p className="text-xs text-amber-100/90 font-medium">
                Zarządzasz obecnie sklepem: <strong className="text-white">{impersonatedStore ? impersonatedStore.name : impersonatedStoreId}</strong> {impersonatedStore ? `(${impersonatedStore.subdomain}.iskral.pl)` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Otwórz Panel Sklepu</span>
            </Link>
            <button
              onClick={exitImpersonation}
              className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition-all border border-white/10 flex items-center gap-1.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Wyjdź z trybu</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Admin Header Bar */}
      <div className="w-full bg-[#111216] border border-white/5 p-4 rounded-2xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Brand & Admin Badge */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
          <Link href="/admin" className="flex items-center gap-3 shrink-0">
            <Image
              src="/logo.svg"
              alt="Iskral Logo"
              width={140}
              height={32}
              className="w-[130px] h-auto object-contain"
              priority
            />
            <span className="px-2.5 py-1 bg-[#FF5B28]/10 border border-[#FF5B28]/20 text-[#FF5B28] text-[10px] font-extrabold uppercase tracking-widest rounded-lg flex items-center gap-1">
              <Crown className="w-3 h-3 text-[#FF5B28]" />
              Superadmin
            </span>
          </Link>
        </div>

        {/* Center: Global Search Bar */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Szukaj użytkowników, e-mail, sklepów..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-8 py-2 bg-[#090A0C] border border-white/5 focus:border-[#FF5B28] rounded-full text-xs text-white placeholder-zinc-400 transition-all outline-none font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white rounded-md cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right Actions: Dashboard link & Profile */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-[#FF5B28] hover:bg-[#e04f20] text-white text-xs font-bold rounded-full transition-all flex items-center gap-2 shrink-0 shadow-sm"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Panel Sklepu (Klienta)</span>
          </Link>

          <button
            onClick={logout}
            className="p-2 bg-[#090A0C] hover:bg-red-500/20 hover:text-red-400 border border-white/5 text-zinc-400 rounded-full transition-all shrink-0 cursor-pointer"
            title="Wyloguj administratora"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
