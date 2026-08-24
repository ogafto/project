"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { RefreshCw, LayoutDashboard, AlertTriangle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Global Error Boundary]:", error);
  }, [error]);

  return (
    <div className="min-h-screen w-full bg-[#0A0B0D] text-white flex flex-col items-center justify-center p-6 font-['Bricolage_Grotesque',sans-serif] relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#D0FF00]/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 max-w-md w-full bg-[#111319]/90 border border-[#1C1E26] rounded-3xl p-8 text-center shadow-2xl backdrop-blur-xl">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-rose-500/10">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <h1 className="text-xl font-bold text-white tracking-tight mb-2">
          Wystąpił problem z ładowaniem strony
        </h1>
        <p className="text-xs text-zinc-400 leading-relaxed mb-6">
          Aplikacja napotkała błąd podczas renderowania. Twoje dane sklepu i pakiety są w pełni bezpieczne.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => reset()}
            className="w-full py-3.5 px-6 rounded-xl bg-[#D0FF00] hover:bg-[#b8e600] text-black font-semibold text-[15px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#D0FF00]/10"
          >
            <RefreshCw className="w-4 h-4" />
            Spróbuj ponownie
          </button>

          <Link
            href="/dashboard"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.location.href = "/dashboard";
              }
            }}
            className="w-full py-3.5 px-6 rounded-xl bg-[#181A22] hover:bg-[#202430] border border-[#2A2E3D] text-zinc-200 font-medium text-[15px] transition-colors flex items-center justify-center gap-2"
          >
            <LayoutDashboard className="w-4 h-4 text-[#D0FF00]" />
            Wróć do Pulpitu
          </Link>

          <Link
            href="/"
            className="w-full py-2.5 px-6 text-xs text-zinc-500 hover:text-zinc-300 font-medium transition-colors"
          >
            Przejdź do strony głównej
          </Link>
        </div>
      </div>
    </div>
  );
}
