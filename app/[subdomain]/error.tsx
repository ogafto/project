"use client";

import React, { useEffect } from "react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function SubdomainError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Błąd ładowania sklepu (Error Boundary):", error);
  }, [error]);

  return (
    <main className="min-h-screen w-full bg-[#090A0C] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans selection:bg-[#FF5B28] selection:text-white">
      {/* Glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#FF5B28]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 max-w-lg w-full bg-[#121316]/95 border border-white/10 p-8 sm:p-10 rounded-3xl backdrop-blur-2xl text-center shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 text-3xl shadow-lg">
          ⚠️
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 bg-red-500/15 text-red-400 border border-red-500/30 rounded-full text-[11px] font-extrabold uppercase tracking-wider">
            BŁĄD ŁADOWANIA SKLEPU
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight pt-2">
            Przepraszamy, coś poszło nie tak
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
            Nie udało się prawidłowo załadować widoku tego sklepu. Może to być chwilowy problem z połączeniem z bazą danych lub konfiguracją sklepu.
          </p>
        </div>

        {error?.message && (
          <div className="p-3 bg-[#090A0C] border border-white/5 rounded-xl text-left">
            <span className="text-[10px] text-zinc-500 font-mono block uppercase">Szczegóły błędu:</span>
            <p className="text-xs text-red-300 font-mono break-words mt-0.5">{error.message}</p>
          </div>
        )}

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center font-['Poppins',sans-serif]">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto px-6 py-3 bg-[#D0FF00] hover:bg-[#bce600] text-black font-semibold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>🔄 Spróbuj ponownie</span>
          </button>

          <a
            href="/"
            className="w-full sm:w-auto px-6 py-3 bg-white/5 hover:bg-white/10 text-zinc-300 font-medium text-xs rounded-xl border border-white/10 transition-all flex items-center justify-center text-center"
          >
            Strona główna platformy
          </a>
        </div>
      </div>
    </main>
  );
}
