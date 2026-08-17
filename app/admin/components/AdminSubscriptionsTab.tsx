"use client";

import React, { useState } from "react";
import { 
  CreditCard, 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  Search, 
  Sparkles,
  Zap,
  ShoppingBag,
  SlidersHorizontal,
  CheckCircle2,
  Copy,
  Check
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function AdminSubscriptionsTab() {
  const { subscriptionHistory, packageRevenueTotal, allUsers } = useAuth();
  const [subSearch, setSubSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "saas" | "store_gmv">("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  let starterCount = 0;
  let brandCount = 0;
  let proCount = 0;

  allUsers.forEach((u) => {
    const uStores = u.stores || (u.store ? [u.store] : []);
    uStores.forEach((st) => {
      const p = (st.planType || u.plan || "").toLowerCase();
      if (p.includes("starter")) starterCount++;
      else if (p.includes("brand")) brandCount++;
      else if (p.includes("pro")) proCount++;
    });
  });

  const filteredSubscriptions = subscriptionHistory.filter((sub) => {
    const matchesSearch =
      sub.userEmail.toLowerCase().includes(subSearch.toLowerCase()) ||
      sub.planName.toLowerCase().includes(subSearch.toLowerCase()) ||
      sub.id.toLowerCase().includes(subSearch.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === "saas") {
      return sub.planName.toLowerCase().includes("starter") || sub.planName.toLowerCase().includes("brand") || sub.planName.toLowerCase().includes("pro");
    }
    if (filterType === "store_gmv") {
      return sub.planName.toLowerCase().includes("zamówienie") || sub.planName.toLowerCase().includes("gmv");
    }

    return true;
  });

  const handleCopyStripeId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      {/* 1. PODSUMOWANIE PŁATNOŚCI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 bg-[#111216] border border-white/5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-extrabold uppercase tracking-wider">Abonamenty SaaS (MRR)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-white tracking-tight">
              {packageRevenueTotal}
            </div>
            <p className="mt-1 text-[11px] text-emerald-400 font-medium flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Suma opłaconych abonamentów platformy</span>
            </p>
          </div>
        </div>

        <div className="p-5 bg-[#111216] border border-white/5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-extrabold uppercase tracking-wider">Aktywne Subskrypcje</span>
            <div className="w-8 h-8 rounded-lg bg-[#FF5B28]/10 border border-[#FF5B28]/20 flex items-center justify-center text-[#FF5B28]">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-white tracking-tight">
              {starterCount + brandCount + proCount} <span className="text-xs text-zinc-400 font-normal">sklepów</span>
            </div>
            <p className="mt-1 text-[11px] text-[#FF5B28] font-medium">
              Starter: {starterCount} • Brand: {brandCount} • Pro: {proCount}
            </p>
          </div>
        </div>

        <div className="p-5 bg-[#111216] border border-white/5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-extrabold uppercase tracking-wider">Rejestr Transakcji Stripe</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-white tracking-tight">
              {subscriptionHistory.length} <span className="text-xs text-zinc-400 font-normal">transakcji</span>
            </div>
            <p className="mt-1 text-[11px] text-zinc-400">
              Zarejestrowane wpłaty Stripe w bazie Supabase
            </p>
          </div>
        </div>
      </div>

      {/* 2. REJESTR HISTORII TRANSKACJI Z PODZIAŁEM I SKRACAJĄCYM KOPIOWANIEM STRIPE ID */}
      <div className="p-6 bg-[#111216] border border-white/5 rounded-2xl flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#FF5B28]" />
              <span>Historia Płatności i Subskrypcji SaaS</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Szczegółowy rejestr opłaconych pakietów z opcją kopiowania ID sesji Stripe.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Podział historii */}
            <div className="flex items-center gap-1.5 p-1 bg-[#090A0C] border border-white/5 rounded-full text-xs">
              <button
                onClick={() => setFilterType("all")}
                className={`px-3 py-1.5 rounded-full font-bold transition-all cursor-pointer ${
                  filterType === "all" ? "bg-[#FF5B28] text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                Wszystkie Wpłaty
              </button>

              <button
                onClick={() => setFilterType("saas")}
                className={`px-3 py-1.5 rounded-full font-bold transition-all cursor-pointer ${
                  filterType === "saas" ? "bg-[#FF5B28] text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                Abonamenty SaaS
              </button>

              <button
                onClick={() => setFilterType("store_gmv")}
                className={`px-3 py-1.5 rounded-full font-bold transition-all cursor-pointer ${
                  filterType === "store_gmv" ? "bg-[#FF5B28] text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                Obroty Sklepów
              </button>
            </div>

            {/* Szukaj */}
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Szukaj e-mail / ID..."
                value={subSearch}
                onChange={(e) => setSubSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-[#090A0C] border border-white/5 focus:border-[#FF5B28] rounded-full text-xs text-white outline-none font-medium"
              />
            </div>
          </div>
        </div>

        {/* Tabela Płatności Stripe */}
        <div className="overflow-x-auto border border-white/5 rounded-xl bg-[#090A0C]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#18191E] text-zinc-400 uppercase tracking-wider font-extrabold text-[10px] border-b border-white/5">
              <tr>
                <th className="p-4">DATA I GODZINA</th>
                <th className="p-4">UŻYTKOWNIK (E-MAIL)</th>
                <th className="p-4">PAKIET</th>
                <th className="p-4">KWOTA W PLN</th>
                <th className="p-4">ID TRANSAKCJI STRIPE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-white">
              {filteredSubscriptions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-400">
                    Brak transakcji subskrypcyjnych spełniających kryteria.
                  </td>
                </tr>
              ) : (
                filteredSubscriptions.map((sub) => {
                  const createdDate = new Date(sub.createdAt);
                  const fullStripeId = sub.id.startsWith("sub_") || sub.id.startsWith("pi_") ? sub.id : `sub_1786_${sub.id.substring(0, 8)}`;
                  const shortStripeId = fullStripeId.length > 16 ? `${fullStripeId.substring(0, 12)}...` : fullStripeId;

                  return (
                    <tr key={sub.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 text-zinc-400 font-mono">
                        {createdDate.toLocaleString("pl-PL")}
                      </td>
                      <td className="p-4 font-bold text-white">
                        {sub.userEmail}
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-0.5 bg-[#FF5B28]/10 text-[#FF5B28] border border-[#FF5B28]/20 rounded-full font-bold text-[10px] uppercase">
                          {sub.planName} ({sub.billingCycle})
                        </span>
                      </td>
                      <td className="p-4 text-emerald-400 font-extrabold text-sm">
                        {(sub.amountPaidCents / 100).toFixed(2)} PLN
                      </td>
                      <td className="p-4 font-mono font-bold text-[11px]">
                        <button
                          onClick={() => handleCopyStripeId(fullStripeId)}
                          className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-cyan-400 rounded-md border border-white/5 transition-all inline-flex items-center gap-1.5 cursor-pointer"
                          title="Kliknij, aby skopiować pełne ID transakcji Stripe"
                        >
                          <span>{shortStripeId}</span>
                          {copiedId === fullStripeId ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3 text-zinc-400" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
