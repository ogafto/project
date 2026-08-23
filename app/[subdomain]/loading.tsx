import React from "react";

export default function SubdomainLoading() {
  return (
    <div className="min-h-screen w-full bg-[#0E0E11] text-white flex flex-col items-center justify-center p-6 font-sans">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-white/10 border-t-[#D0FF00] animate-spin" />
        <span className="text-xs font-mono text-zinc-400">Ładowanie sklepu internetowego...</span>
      </div>
    </div>
  );
}
