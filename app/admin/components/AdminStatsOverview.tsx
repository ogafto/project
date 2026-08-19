"use client";

import React, { useState } from "react";
import { 
  Users, 
  CreditCard, 
  Store, 
  TrendingUp, 
  ExternalLink,
  ChevronDown,
  Search,
  BarChart2
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getStoreUrl } from "@/lib/cookies";

interface AdminStatsOverviewProps {
  waitlistCount: number;
}

// Avatar Fallback Helper Function (Clean Initials Circle)
function renderUserInitials(name: string | null, email: string) {
  const displayName = name || email || "Użytkownik";
  const parts = displayName.trim().split(" ");
  let initials = "";
  if (parts.length >= 2) {
    initials = (parts[0][0] + parts[1][0]).toUpperCase();
  } else {
    initials = displayName.substring(0, 2).toUpperCase();
  }

  return (
    <div className="w-8 h-8 rounded-full bg-[#1A1C23] border border-[#FF5B28]/30 text-[#FF5B28] flex items-center justify-center font-extrabold text-xs shrink-0 shadow-sm">
      {initials}
    </div>
  );
}

const formatCurrencyPLN = (amountPLN: number) => {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountPLN);
};

export default function AdminStatsOverview({ waitlistCount }: AdminStatsOverviewProps) {
  const {
    allUsers,
    platformTotalGMVCents,
    platformTotalStoresCount,
    packageRevenueTotal,
  } = useAuth();

  const [tableSearch, setTableSearch] = useState("");
  const [timeframe, setTimeframe] = useState<"1D" | "1W" | "1M" | "1Y">("1W");
  const [activeBarIndex, setActiveBarIndex] = useState<number>(0);

  // Calculate active stores from real database state
  let totalActiveStores = 0;
  allUsers.forEach((u) => {
    const uStores = u.stores || (u.store ? [u.store] : []);
    uStores.forEach((st) => {
      if (st.status !== "suspended" && st.planStatus !== "suspended") {
        totalActiveStores++;
      }
    });
  });

  const totalUsersCount = allUsers.length;
  const formattedGMV = formatCurrencyPLN(platformTotalGMVCents / 100);

  // Dynamic Chart Points Calculation for 1D, 1W, 1M, 1Y
  const getChartData = () => {
    const now = new Date();
    
    if (timeframe === "1D") {
      const blocks = ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"];
      return blocks.map((timeLabel, i) => {
        const blockStart = new Date(now);
        blockStart.setHours(i * 4, 0, 0, 0);
        const blockEnd = new Date(now);
        blockEnd.setHours((i + 1) * 4, 0, 0, 0);

        let revCents = 0;
        let ordersCount = 0;

        allUsers.forEach((u) => {
          (u.stores || []).forEach((st) => {
            (st.orders || []).forEach((o) => {
              if (o.status === "paid") {
                const oDate = new Date(o.createdAt || now);
                if (oDate >= blockStart && oDate < blockEnd) {
                  revCents += o.amountTotalCents;
                  ordersCount++;
                }
              }
            });
          });
        });

        return { day: timeLabel, label: `Godzina ${timeLabel}`, revenue: revCents / 100, orders: ordersCount };
      });
    }

    if (timeframe === "1W") {
      const days = [
        { day: "Nie", label: "Niedziela" },
        { day: "Pon", label: "Poniedziałek" },
        { day: "Wt", label: "Wtorek" },
        { day: "Śr", label: "Środa" },
        { day: "Czw", label: "Czwartek" },
        { day: "Pt", label: "Piątek" },
        { day: "Sob", label: "Sobota" },
      ];
      return days.map((d, dayIdx) => {
        let revCents = 0;
        let ordersCount = 0;

        allUsers.forEach((u) => {
          (u.stores || []).forEach((st) => {
            (st.orders || []).forEach((o) => {
              if (o.status === "paid") {
                const oDate = new Date(o.createdAt || now);
                if (oDate.getDay() === dayIdx) {
                  revCents += o.amountTotalCents;
                  ordersCount++;
                }
              }
            });
          });
        });

        return { day: d.day, label: d.label, revenue: revCents / 100, orders: ordersCount };
      });
    }

    if (timeframe === "1M") {
      const weeks = ["Tydź 1", "Tydź 2", "Tydź 3", "Tydź 4"];
      return weeks.map((wLabel, wIdx) => {
        let revCents = 0;
        let ordersCount = 0;

        allUsers.forEach((u) => {
          (u.stores || []).forEach((st) => {
            (st.orders || []).forEach((o) => {
              if (o.status === "paid") {
                const oDate = new Date(o.createdAt || now);
                const dayOfMonth = oDate.getDate();
                if (dayOfMonth >= wIdx * 7 + 1 && dayOfMonth <= (wIdx + 1) * 7) {
                  revCents += o.amountTotalCents;
                  ordersCount++;
                }
              }
            });
          });
        });

        return { day: wLabel, label: `Tydzień ${wIdx + 1}`, revenue: revCents / 100, orders: ordersCount };
      });
    }

    // 1Y
    const months = ["Sty", "Lut", "Mar", "Kwi", "Maj", "Cze", "Lip", "Sie", "Wrz", "Paź", "Lis", "Gru"];
    return months.map((mLabel, mIdx) => {
      let revCents = 0;
      let ordersCount = 0;

      allUsers.forEach((u) => {
        (u.stores || []).forEach((st) => {
          (st.orders || []).forEach((o) => {
            if (o.status === "paid") {
              const oDate = new Date(o.createdAt || now);
              if (oDate.getMonth() === mIdx) {
                revCents += o.amountTotalCents;
                ordersCount++;
              }
            }
          });
        });
      });

      return { day: mLabel, label: mLabel, revenue: revCents / 100, orders: ordersCount };
    });
  };

  const chartData = getChartData();
  const maxRevenue = Math.max(...chartData.map((d) => d.revenue), 1);
  const safeActiveIndex = activeBarIndex < chartData.length ? activeBarIndex : 0;
  const activePoint = chartData[safeActiveIndex] || chartData[0];
  const activeAOV = activePoint.orders > 0 ? (activePoint.revenue / activePoint.orders).toFixed(2) : "0.00";

  // Real Store Leaderboard data using Intl.NumberFormat
  const storeLeaderboard = allUsers.flatMap((u) => {
    const uStores = u.stores || (u.store ? [u.store] : []);
    return uStores.map((st) => {
      const storeOrders = st.orders || [];
      const paidOrders = storeOrders.filter((o) => o.status === "paid");
      const salesTotalCents = paidOrders.reduce((sum, o) => sum + (o.amountTotalCents || 0), 0);
      const salesTotalPLN = salesTotalCents / 100;

      return {
        id: st.id || u.id,
        name: u.name || "Właściciel Sklepu",
        email: u.email,
        storeName: st.name || `Sklep ${u.name}`,
        subdomain: st.subdomain,
        plan: st.planType || u.plan || "Start",
        gmvCents: salesTotalCents,
        gmv: formatCurrencyPLN(salesTotalPLN),
      };
    });
  });

  storeLeaderboard.sort((a, b) => b.gmvCents - a.gmvCents);

  const filteredLeaderboard = storeLeaderboard.filter(
    (item) =>
      item.name.toLowerCase().includes(tableSearch.toLowerCase()) ||
      item.email.toLowerCase().includes(tableSearch.toLowerCase()) ||
      item.storeName.toLowerCase().includes(tableSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      
      {/* 1. 4 KOMPAKTOWE KARTY KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        
        {/* KPI 1: NOWI UŻYTKOWNICY */}
        <div className="p-5 bg-[#111216] border border-white/5 rounded-xl flex flex-col justify-between hover:border-white/10 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-zinc-400 uppercase tracking-wider">👥 Nowi Użytkownicy</span>
            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 text-cyan-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-white tracking-tight">
              {totalUsersCount} <span className="text-xs font-semibold text-zinc-400">kont</span>
            </div>
            <p className="mt-1 text-[11px] text-emerald-400 font-medium">
              Zarejestrowane konta użytkowników
            </p>
          </div>
        </div>

        {/* KPI 2: AKTYWNE SKLEPY */}
        <div className="p-5 bg-[#111216] border border-white/5 rounded-xl flex flex-col justify-between hover:border-white/10 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-zinc-400 uppercase tracking-wider">🏬 Aktywne Sklepy</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-white tracking-tight">
              {totalActiveStores} <span className="text-xs font-semibold text-zinc-400">sklepów</span>
            </div>
            <p className="mt-1 text-[11px] text-emerald-400 font-medium">
              Działające sklepy na platformie
            </p>
          </div>
        </div>

        {/* KPI 3: PRZYCHÓD Z PAKIETÓW */}
        <div className="p-5 bg-[#111216] border border-white/5 rounded-xl flex flex-col justify-between hover:border-white/10 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-zinc-400 uppercase tracking-wider">💳 Przychód z Pakietów</span>
            <div className="w-8 h-8 rounded-lg bg-[#FF5B28]/10 border border-[#FF5B28]/20 text-[#FF5B28] flex items-center justify-center font-bold">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-white tracking-tight">
              {packageRevenueTotal}
            </div>
            <p className="mt-1 text-[11px] text-[#FF5B28] font-medium">
              Przychód z opłaconych pakietów SaaS
            </p>
          </div>
        </div>

        {/* KPI 4: PRZYCHÓD CAŁEJ PLATFORMY */}
        <div className="p-5 bg-[#111216] border border-white/5 rounded-xl flex flex-col justify-between hover:border-white/10 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-zinc-400 uppercase tracking-wider">📈 Przychód Całej Platformy</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-white tracking-tight">
              {formattedGMV}
            </div>
            <p className="mt-1 text-[11px] text-purple-400 font-medium">
              Łączny GMV obrót wszystkich sklepów
            </p>
          </div>
        </div>

      </div>

      {/* 2. ANALITYKA OBROTÓW I PRZYCHODÓW W CZASIE */}
      <div className="p-6 sm:p-8 bg-[#111216] border border-white/5 rounded-2xl flex flex-col gap-6 w-full">
        
        {/* Nagłówek i Kontrolki Wykresu */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#FF5B28]/10 border border-[#FF5B28]/20 text-[#FF5B28] flex items-center justify-center font-bold">
                <BarChart2 className="w-4 h-4" />
              </div>
              <h2 className="text-base font-extrabold text-white">Analityka Przychodów i Obrotów w Czasie</h2>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Podział obrotów sklepów oraz subskrypcji platformy.
            </p>
          </div>

          {/* Timeframe Filter Pills */}
          <div className="flex items-center p-1 bg-[#090A0C] border border-white/10 rounded-full text-xs font-bold">
            {(["1D", "1W", "1M", "1Y"] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => {
                  setTimeframe(tf);
                  setActiveBarIndex(0);
                }}
                className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                  timeframe === tf
                    ? "bg-[#FF5B28] text-white shadow-md font-black"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {tf === "1D" ? "Dziś (1D)" : tf === "1W" ? "7 Dni (1W)" : tf === "1M" ? "1 Miesiąc (1M)" : "1 Rok (1Y)"}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamiczny Panel Statystyk Aktywnego Słupka */}
        <div className="p-4 bg-[#090A0C] border border-white/5 rounded-xl grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Okres</span>
            <span className="text-sm font-extrabold text-[#FF5B28]">{activePoint?.label || "-"}</span>
          </div>

          <div>
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Obrót Dzienny (GMV)</span>
            <span className="text-sm font-extrabold text-white">{formatCurrencyPLN(activePoint?.revenue || 0)}</span>
          </div>

          <div>
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Liczba Zamówień</span>
            <span className="text-sm font-extrabold text-emerald-400">{activePoint?.orders || 0} szt.</span>
          </div>

          <div>
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Średnia Wartość (AOV)</span>
            <span className="text-sm font-extrabold text-cyan-400">{formatCurrencyPLN(parseFloat(activeAOV))}</span>
          </div>
        </div>

        {/* Wykres Słupkowy */}
        <div className="relative h-64 w-full flex items-end justify-between px-2 pt-6 gap-2 sm:gap-4">
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8 text-[10px] text-zinc-600 font-mono">
            <div className="border-b border-white/5 w-full flex justify-between"><span>{formatCurrencyPLN(maxRevenue)}</span></div>
            <div className="border-b border-white/5 w-full flex justify-between"><span>{formatCurrencyPLN(maxRevenue * 0.6)}</span></div>
            <div className="border-b border-white/5 w-full flex justify-between"><span>{formatCurrencyPLN(maxRevenue * 0.3)}</span></div>
            <div className="border-b border-white/5 w-full flex justify-between"><span>0,00 zł</span></div>
          </div>

          {chartData.map((d, i) => {
            const isActive = i === safeActiveIndex;
            const heightPct = maxRevenue > 0 ? Math.max(15, Math.round((d.revenue / maxRevenue) * 100)) : 15;

            return (
              <div
                key={`${d.day}-${i}`}
                onClick={() => setActiveBarIndex(i)}
                onMouseEnter={() => setActiveBarIndex(i)}
                className="flex flex-col items-center gap-2 flex-1 group/bar cursor-pointer z-20 h-full justify-end"
              >
                <span className={`text-[10px] font-mono font-bold transition-all ${isActive ? "text-[#FF5B28] scale-110" : "text-zinc-500 group-hover/bar:text-white"}`}>
                  {formatCurrencyPLN(d.revenue)}
                </span>
                
                <div className="w-full max-w-[48px] h-44 bg-[#090A0C] rounded-xl p-1 border border-white/5 flex items-end overflow-hidden">
                  <div
                    className={`w-full rounded-lg transition-all duration-300 ${
                      isActive
                        ? "bg-[#FF5B28] shadow-lg shadow-[#FF5B28]/25"
                        : "bg-white/10 group-hover/bar:bg-white/20"
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />
                </div>
                
                <span className={`text-xs font-bold transition-colors ${isActive ? "text-[#FF5B28]" : "text-zinc-400"}`}>
                  {d.day}
                </span>
              </div>
            );
          })}
        </div>

      </div>

      {/* 3. TABELA TOPKA SKLEPÓW Z FORMATOWANIEM INTL.NUMBERFORMAT */}
      <div className="p-6 bg-[#111216] border border-white/5 rounded-2xl flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h3 className="text-xs font-extrabold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
            <Store className="w-4 h-4 text-[#FF5B28]" />
            <span>Tabela Sklepów (Według Wygenerowanego Obrotu)</span>
          </h3>

          <div className="relative w-full sm:w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Szukaj sklepów..."
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#090A0C] border border-white/5 focus:border-[#FF5B28] rounded-full text-xs text-white outline-none font-medium"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/5 bg-[#090A0C]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#18191E] text-zinc-400 uppercase tracking-wider font-extrabold text-[10px] border-b border-white/5">
              <tr>
                <th className="p-4">WŁAŚCICIEL</th>
                <th className="p-4">SKLEP</th>
                <th className="p-4">PAKIET</th>
                <th className="p-4">OBRÓT (SUMA ZAMÓWIEŃ)</th>
                <th className="p-4 text-right">PRZEJDŹ DO SKLEPU</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-white">
              {filteredLeaderboard.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-zinc-400 text-xs">
                    Brak sklepów odpowiadających wyszukiwaniu.
                  </td>
                </tr>
              ) : (
                filteredLeaderboard.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 font-medium">
                      <div className="flex items-center gap-2.5">
                        {renderUserInitials(item.name, item.email)}
                        <div>
                          <span className="block font-extrabold text-white text-xs leading-tight">{item.name}</span>
                          <span className="text-[10px] text-zinc-400 font-mono">{item.email}</span>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 font-bold">
                      <span className="block text-white leading-tight">{item.storeName}</span>
                      <a
                        href={getStoreUrl(item.subdomain)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-400 hover:underline font-mono text-[11px]"
                      >
                        {item.subdomain}.iskral.pl
                      </a>
                    </td>

                    <td className="p-4">
                      <span className="px-2.5 py-0.5 bg-[#FF5B28]/10 text-[#FF5B28] border border-[#FF5B28]/20 rounded-full text-[10px] font-extrabold uppercase">
                        {item.plan}
                      </span>
                    </td>

                    <td className="p-4 font-extrabold text-white font-mono">{item.gmv}</td>

                    <td className="p-4 text-right">
                      <a
                        href={getStoreUrl(item.subdomain)}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 rounded-full text-[11px] font-extrabold transition-all inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Przejdź do sklepu</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
