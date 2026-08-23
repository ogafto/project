"use client";

import { useState, useEffect } from "react";
import { safeGetItem, safeSetItem } from "@/lib/storage";

export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = safeGetItem("cookie_consent_accepted");
    if (!consent) {
      // Small delay for smooth appearance
      const timer = setTimeout(() => setShow(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    safeSetItem("cookie_consent_accepted", "true");
    setShow(false);
  };

  const handleReject = () => {
    safeSetItem("cookie_consent_accepted", "essential_only");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 sm:right-auto sm:max-w-md z-50 p-5 bg-[#17171B]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-6 duration-300">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#FF5B28]/15 border border-[#FF5B28]/30 flex items-center justify-center shrink-0 text-xl">
          🍪
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-white">Dbamy o Twoją prywatność</h3>
          <p className="mt-1 text-xs text-[#A1A1AA] leading-relaxed">
            Używamy plików cookies, aby zapewnić prawidłowe działanie platformy, zapamiętać Twoje sesje oraz w celach analitycznych.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 justify-end">
        <button
          onClick={handleReject}
          className="px-3.5 py-2 rounded-xl text-xs font-medium text-[#A1A1AA] bg-white/[0.05] border border-white/[0.08] hover:text-white hover:bg-white/[0.1] transition-colors"
        >
          Niezbędne
        </button>
        <button
          onClick={handleAccept}
          className="px-4 py-2 rounded-xl text-xs font-medium text-white bg-[#FF5B28] hover:bg-[#e04f20] transition-colors"
        >
          Akceptuję wszystkie
        </button>
      </div>
    </div>
  );
}
