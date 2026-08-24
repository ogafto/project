"use client";

import React from "react";
import Link from "next/link";

export default function SubdomainNotFound() {
  return (
    <div className="min-h-screen bg-[#0E0E11] text-white flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="w-16 h-16 rounded-2xl bg-[#18181B] border border-white/10 flex items-center justify-center text-3xl mb-4 shadow-xl">
        🏪
      </div>
      <h1 className="text-2xl font-bold font-['Bricolage_Grotesque',sans-serif]">Sklep nie został odnaleziony</h1>
      <p className="text-xs text-zinc-400 mt-2 max-w-md font-['Bricolage_Grotesque',sans-serif] leading-relaxed">
        Podana subdomena nie jest jeszcze powiązana z aktywnym sklepem lub oczekuje na dokończenie konfiguracji przez właściciela.
      </p>
      <div className="mt-6 flex flex-col sm:flex-row items-center gap-3 font-['Bricolage_Grotesque',sans-serif]">
        <Link
          href="/dashboard"
          className="px-6 py-3 bg-[#D0FF00] hover:bg-[#bce600] text-black text-xs font-semibold rounded-xl transition shadow-lg"
        >
          Przejdź do Panelu Użytkownika
        </Link>
        <Link
          href="/"
          className="px-6 py-3 bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-medium rounded-xl border border-white/10 transition"
        >
          Strona Główna
        </Link>
      </div>
    </div>
  );
}
