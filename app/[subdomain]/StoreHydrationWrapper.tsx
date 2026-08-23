"use client";

import React, { useEffect, useState } from "react";

export function StoreHydrationWrapper({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Render clean dark container with zero interactive JS to prevent any hydration mismatch
    return (
      <div className="min-h-screen w-full bg-[#0E0E11] text-white flex flex-col items-center justify-center p-6 font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-white/10 border-t-[#D0FF00] rounded-full animate-spin" />
          <span className="text-xs font-mono text-zinc-400">Ładowanie sklepu internetowego...</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
