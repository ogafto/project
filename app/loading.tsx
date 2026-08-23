import React from "react";

export default function GlobalLoading() {
  return (
    <div className="min-h-screen w-full bg-[#0A0B0D] flex flex-col items-center justify-center p-6 text-white font-sans">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-12 h-12">
          <div className="w-12 h-12 rounded-full border-2 border-white/10 border-t-[#D0FF00] animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-[#D0FF00]">
            ⚡
          </div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-sm font-bold tracking-wide text-white">Ładowanie platformy...</span>
          <span className="text-xs text-zinc-500 font-mono">Synchronizacja danych</span>
        </div>
      </div>
    </div>
  );
}
