"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Server,
  Database,
  ShieldCheck,
  CreditCard,
  Mail,
  Store,
  Package,
  ShoppingCart,
  ArrowLeft,
  Clock,
} from "lucide-react";

interface DiagnosticTest {
  category: string;
  name: string;
  status: "success" | "error" | "warning";
  latencyMs?: number;
  details: string;
  errorLog?: string;
}

interface HealthResponse {
  overallStatus: "operational" | "warning" | "error";
  timestamp: string;
  testsCount: number;
  tests: Record<string, DiagnosticTest>;
}

export default function StatusPage() {
  const [data, setData] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const fetchHealth = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      const json = await res.json();
      setData(json);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error("Failed to fetch health status:", err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(() => fetchHealth(), 30000);
    return () => clearInterval(interval);
  }, []);

  const getIconForCategory = (key: string) => {
    switch (key) {
      case "database":
        return <Database className="w-5 h-5 text-[#FF5B28]" />;
      case "auth":
        return <ShieldCheck className="w-5 h-5 text-indigo-400" />;
      case "storage":
        return <Server className="w-5 h-5 text-cyan-400" />;
      case "stripe":
        return <CreditCard className="w-5 h-5 text-emerald-400" />;
      case "email":
        return <Mail className="w-5 h-5 text-amber-400" />;
      case "stores":
        return <Store className="w-5 h-5 text-purple-400" />;
      case "products":
        return <Package className="w-5 h-5 text-pink-400" />;
      case "orders":
        return <ShoppingCart className="w-5 h-5 text-yellow-400" />;
      default:
        return <Activity className="w-5 h-5 text-white" />;
    }
  };

  const getStatusBadge = (status: "success" | "warning" | "error") => {
    if (status === "success") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3.5 h-3.5" /> Sprawny
        </span>
      );
    }
    if (status === "warning") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <AlertTriangle className="w-3.5 h-3.5" /> Ostrzeżenie
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
        <XCircle className="w-3.5 h-3.5" /> Awaria
      </span>
    );
  };

  const overall = data?.overallStatus || "operational";

  return (
    <main className="min-h-screen bg-[#0E0E11] text-white flex flex-col items-center px-4 sm:px-6 lg:px-8 py-10">
      {/* Top bar */}
      <div className="w-full max-w-5xl flex items-center justify-between pb-8 border-b border-white/[0.08]">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-[#A1A1AA] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Powrót do strony głównej
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/logowanie"
            className="px-4 py-2 text-xs font-medium text-[#A1A1AA] hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-[8px] transition-all"
          >
            Zaloguj się
          </Link>
          <Link
            href="/dashboard"
            className="px-4 py-2 text-xs font-medium text-white bg-[#FF5B28] hover:bg-[#e04f20] rounded-[8px] transition-all shadow-lg shadow-[#FF5B28]/20"
          >
            Przejdź do Panelu
          </Link>
        </div>
      </div>

      <div className="w-full max-w-5xl mt-10">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white flex items-center gap-3">
              Centrum Diagnostyki i Statusu
            </h1>
            <p className="mt-2 text-sm text-[#707070]">
              Automatyczny monitoring End-to-End wszystkich 8 filarów infrastruktury platformy.
            </p>
          </div>

          <button
            onClick={() => fetchHealth(true)}
            disabled={refreshing}
            className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 bg-[#17171B] hover:bg-[#202025] border border-white/[0.1] rounded-[10px] text-xs font-semibold text-white transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-[#FF5B28] ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Diagnozowanie..." : "Uruchom ponowny test"}
          </button>
        </div>

        {/* Global Banner */}
        <div className="mt-8">
          {loading ? (
            <div className="w-full p-8 bg-[#17171B] border border-white/[0.08] rounded-[20px] animate-pulse flex items-center justify-center">
              <span className="text-sm text-[#707070]">Uruchamianie diagnostyki systemowej...</span>
            </div>
          ) : (
            <div
              className={`w-full p-6 sm:p-8 rounded-[20px] border backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6 transition-all ${
                overall === "operational"
                  ? "bg-emerald-500/[0.06] border-emerald-500/20 text-emerald-400"
                  : overall === "warning"
                  ? "bg-amber-500/[0.06] border-amber-500/20 text-amber-400"
                  : "bg-red-500/[0.06] border-red-500/20 text-red-400"
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    overall === "operational"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : overall === "warning"
                      ? "bg-amber-500/20 text-amber-400"
                      : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {overall === "operational" ? (
                    <CheckCircle2 className="w-7 h-7" />
                  ) : overall === "warning" ? (
                    <AlertTriangle className="w-7 h-7" />
                  ) : (
                    <XCircle className="w-7 h-7" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {overall === "operational"
                      ? "Wszystkie systemy działają prawidłowo"
                      : overall === "warning"
                      ? "Wykryto drobne ostrzeżenia systemowe"
                      : "Wykryto zakłócenia w działaniu platformy"}
                  </h2>
                  <p className="text-xs text-[#A1A1AA] mt-1">
                    {overall === "operational"
                      ? "Wszystkie 8 modułów i integracji zewnętrznych pomyślnie przeszło autodiagnostykę."
                      : "Jeden lub więcej modułów wymaga uwagi administratora."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-[#707070] self-start sm:self-center">
                <Clock className="w-4 h-4" />
                Ostatni test: {lastRefreshed ? lastRefreshed.toLocaleTimeString() : "teraz"}
              </div>
            </div>
          )}
        </div>

        {/* Diagnostic Tests Grid */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-36 bg-[#17171B] border border-white/[0.06] rounded-[16px] animate-pulse"
                />
              ))
            : data &&
              Object.entries(data.tests).map(([key, test]) => (
                <div
                  key={key}
                  className="bg-[#17171B]/90 border border-white/[0.08] hover:border-white/[0.15] rounded-[18px] p-6 transition-all shadow-xl shadow-black/40 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white/[0.04] border border-white/[0.06] rounded-[10px]">
                          {getIconForCategory(key)}
                        </div>
                        <div>
                          <span className="text-[11px] font-semibold tracking-wider text-[#707070] uppercase">
                            {test.category}
                          </span>
                          <h3 className="text-sm font-semibold text-white mt-0.5">{test.name}</h3>
                        </div>
                      </div>
                      {getStatusBadge(test.status)}
                    </div>

                    <p className="mt-4 text-xs text-[#A1A1AA] leading-relaxed">{test.details}</p>

                    {test.errorLog && (
                      <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-[8px] text-[11px] font-mono text-red-400 break-all">
                        {test.errorLog}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-between text-[11px] text-[#707070]">
                    <span>Status komunikacji</span>
                    {test.latencyMs !== undefined ? (
                      <span className="font-mono text-[#D0FF00] font-medium">
                        {test.latencyMs} ms
                      </span>
                    ) : (
                      <span className="font-mono text-emerald-400 font-medium">Gotowy</span>
                    )}
                  </div>
                </div>
              ))}
        </div>

        {/* Footer info */}
        <div className="mt-12 text-center text-xs text-[#505055] pb-12">
          IskraL Cloud Engine • Autodiagnostyka odświeża się automatycznie co 30 sekund.
        </div>
      </div>
    </main>
  );
}
