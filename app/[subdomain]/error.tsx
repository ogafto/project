"use client";

import React, { useEffect } from "react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function SubdomainError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("[Subdomain Error Boundary]:", error?.message || error);
  }, [error]);

  return (
    <main className="min-h-screen w-full bg-[#0E0E11] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="relative z-10 max-w-md w-full bg-[#121316] border border-white/10 p-8 rounded-3xl text-center shadow-2xl space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 text-3xl shadow-lg">
          ⚠️
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded-full text-[11px] font-extrabold uppercase tracking-wider">
            STATUS SKLEPU
          </span>
          <h1 className="text-2xl font-bold text-white tracking-tight pt-2 font-['Sora',sans-serif]">
            Chwilowa przerwa w ładowaniu
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed font-['Poppins',sans-serif]">
            Wystąpił problem z pobraniem danych sklepu lub połączeniem sieciowym.
          </p>
        </div>

        {error?.message && (
          <div className="p-3 bg-[#090A0C] border border-white/5 rounded-xl text-left">
            <span className="text-[10px] text-zinc-500 font-mono block uppercase">Szczegóły:</span>
            <p className="text-xs text-zinc-400 font-mono break-words mt-0.5">{error.message}</p>
          </div>
        )}

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center font-['Poppins',sans-serif]">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto px-6 py-3 bg-[#D0FF00] hover:bg-[#bce600] text-black font-semibold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
          >
            <span>🔄 Odśwież widok</span>
          </button>

          <a
            href="https://iskral.pl"
            className="w-full sm:w-auto px-6 py-3 bg-white/5 hover:bg-white/10 text-zinc-300 font-medium text-xs rounded-xl border border-white/10 transition-all flex items-center justify-center text-center"
          >
            Strona główna
          </a>
        </div>
      </div>
    </main>
  );
}
