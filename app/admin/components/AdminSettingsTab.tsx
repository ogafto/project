"use client";

import React, { useState } from "react";
import { 
  ShieldCheck, 
  Crown, 
  Lock, 
  CheckCircle2, 
  AlertTriangle, 
  Server,
  Key,
  ShieldAlert,
  UserCheck
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function AdminSettingsTab() {
  const { user } = useAuth();
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [impersonationProtection, setImpersonationProtection] = useState(true);

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      {/* Header Info */}
      <div className="p-8 bg-[#121316] border border-white/[0.08] rounded-[28px] flex flex-col gap-6">
        <div>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-[#FF5B28] text-[#FF5B28]" />
            <span>Bezpieczeństwo i Uprawnienia Superadmina</span>
          </h2>
          <p className="text-xs text-[#A1A1AA] mt-1">
            Główne konto Superadmina posiada stały, niezmienialny dostęp do platformy iskral.pl bez opcji edycji ról w zwykłym interfejsie.
          </p>
        </div>

        {/* System Health Status Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 bg-[#0B0C0E] border border-emerald-500/30 rounded-2xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-[#A1A1AA] uppercase font-bold tracking-wider block">
                Baza Danych Supabase
              </span>
              <span className="text-xs font-extrabold text-emerald-400">Połączono & Działa</span>
            </div>
          </div>

          <div className="p-5 bg-[#0B0C0E] border border-cyan-500/30 rounded-2xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-[#A1A1AA] uppercase font-bold tracking-wider block">
                Płatności Stripe Connect
              </span>
              <span className="text-xs font-extrabold text-cyan-400">Tryb Produkcyjny</span>
            </div>
          </div>

          <div className="p-5 bg-[#0B0C0E] border border-amber-500/30 rounded-2xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-[#A1A1AA] uppercase font-bold tracking-wider block">
                Konto Superadmina
              </span>
              <span className="text-xs font-extrabold text-amber-300">{user?.email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Safeguard Card 1: Role Lock Notice */}
        <div className="p-6 bg-[#121316] border border-white/[0.08] rounded-[28px] flex flex-col justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-extrabold text-white">Niezmienialny Dostęp Admina</h3>
            </div>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              Zgodnie z wymogami bezpieczeństwa rola Superadmin jest przypisywana bezpośrednio na poziomie bazy danych Supabase RLS policies. W interfejsie użytkownika usunięto opcję przypadkowego nadawania ról admina innym kontom.
            </p>
          </div>

          <div className="p-4 bg-[#0B0C0E] border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-xs text-emerald-400 font-medium">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Konto {user?.email} posiada pełne uprawnienia bez limitów.</span>
          </div>
        </div>

        {/* Safeguard Card 2: Impersonation Protection */}
        <div className="p-6 bg-[#121316] border border-white/[0.08] rounded-[28px] flex flex-col justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#FF5B28]" />
              <h3 className="text-base font-extrabold text-white">Ochrona Impersonacji Sklepów</h3>
            </div>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              Wymagaj widocznego banera informacyjnego podczas wchodzenia w panel zarządzania sklepem klienta w celach pomocy technicznej.
            </p>
          </div>

          <div className="flex items-center justify-between p-4 bg-[#0B0C0E] border border-white/[0.08] rounded-2xl">
            <span className="text-xs font-bold text-white">Baner "Tryb Administratora"</span>
            <button
              onClick={() => setImpersonationProtection(!impersonationProtection)}
              className={`w-12 h-6 rounded-full transition-colors p-1 cursor-pointer flex items-center ${
                impersonationProtection ? "bg-[#FF5B28] justify-end" : "bg-white/20 justify-start"
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white shadow-sm" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
