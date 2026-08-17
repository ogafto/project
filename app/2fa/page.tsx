"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BackgroundVideo from "../components/BackgroundVideo";
import AuthHeader from "../components/AuthHeader";
import Badge from "../components/badge";
import { useAuth } from "../context/AuthContext";

export default function TwoFactorPage() {
  const router = useRouter();
  const { user, toggle2FA, verify2FA } = useAuth();
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError("Podaj pełny 6-cyfrowy kod z aplikacji Authenticator.");
      return;
    }
    const ok = verify2FA(code);
    if (ok) {
      setError("");
      setMsg("Kod weryfikacyjny 2FA jest prawidłowy!");
    } else {
      setMsg("");
      setError("Nieprawidłowy kod 2FA.");
    }
  };

  return (
    <main className="relative min-h-screen w-full bg-[#0E0E11] text-white flex flex-col overflow-hidden pb-20">
      <BackgroundVideo />

      <div className="relative z-10 flex flex-col w-full px-6 xl:px-[220px] pt-4">
        <AuthHeader />

        <div className="mt-16 sm:mt-20 w-full flex justify-center items-center">
          <div className="w-full max-w-[540px] bg-[#17171B]/90 backdrop-blur-xl border border-white/[0.08] rounded-[24px] p-8 sm:p-10 shadow-2xl shadow-black/80 flex flex-col items-center">
            
            <Badge tag="Autoryzacja 2FA" text="Google Authenticator / Authy" />

            <h1 className="mt-4 text-[30px] sm:text-[34px] font-semibold text-white tracking-tight text-center leading-tight">
              Weryfikacja dwuskładnikowa
            </h1>

            <p className="mt-2 text-[14px] sm:text-[15px] font-medium text-[#707070] text-center leading-relaxed">
              Zabezpiecz swoje konto 6-cyfrowym kodem jednorazowym z aplikacji mobilnej.
            </p>

            {/* Status card */}
            <div className="mt-6 w-full p-4 bg-[#0E0E11] border border-white/[0.08] rounded-[14px] flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs text-[#909095]">Status 2FA Twojego konta:</span>
                <span className="text-sm font-semibold text-white mt-0.5">
                  {user?.is2FAEnabled ? (
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Włączone
                    </span>
                  ) : (
                    <span className="text-amber-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400" /> Wyłączone
                    </span>
                  )}
                </span>
              </div>
              <button
                onClick={toggle2FA}
                className="px-4 py-2 bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.1] rounded-[8px] text-xs font-medium text-white transition-colors cursor-pointer"
              >
                {user?.is2FAEnabled ? "Wyłącz 2FA" : "Włącz 2FA"}
              </button>
            </div>

            {/* Mock QR Code visual */}
            <div className="mt-6 w-full p-5 bg-[#0E0E11] border border-white/[0.08] rounded-[16px] flex flex-col items-center text-center">
              <div className="w-36 h-36 bg-white rounded-[12px] p-2 flex items-center justify-center shadow-inner">
                {/* SVG Mock QR Code */}
                <svg className="w-full h-full text-black" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm9-2h8v8h-8V2zm2 2v4h4V4h-4zM2 13h8v8H2v-8zm2 2v4h4v-4H4zm13-2h4v2h-4v-2zm-4 4h2v4h-2v-4zm2-2h4v2h-4v-2zm2 4h4v2h-4v-2zm-6-2h2v2h-2v-2z" />
                </svg>
              </div>
              <span className="mt-3 text-xs text-[#909095]">Zeskanuj kod QR w aplikacji Authenticator lub wpisz klucz:</span>
              <code className="mt-1 px-3 py-1 bg-white/[0.06] rounded border border-white/10 text-xs font-mono text-[#FF5B28]">
                PLATFORMA-2FA-7X9B-2026
              </code>
            </div>

            {error && (
              <div className="mt-6 w-full p-4 bg-red-500/10 border border-red-500/30 rounded-[12px] text-red-400 text-sm text-center font-medium">
                {error}
              </div>
            )}

            {msg && (
              <div className="mt-6 w-full p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-[12px] text-emerald-400 text-sm text-center font-medium">
                {msg}
              </div>
            )}

            <form onSubmit={handleVerify} className="mt-6 w-full flex flex-col items-center gap-4">
              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-sm font-medium text-[#A1A1AA]">
                  Testuj wprowadzanie kodu (6 cyfr):
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full h-14 px-4 bg-[#0E0E11] border border-white/[0.1] rounded-[10px] text-white tracking-widest text-center text-2xl font-bold placeholder-[#505055] focus:outline-none focus:border-[#FF5B28] focus:ring-2 focus:ring-[#FF5B28]/30 transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full h-12 bg-[#FF5B28] hover:bg-[#e04f20] text-white font-medium rounded-[10px] transition-all shadow-lg shadow-[#FF5B28]/25 text-base cursor-pointer"
              >
                Zweryfikuj kod 2FA
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-[#707070]">
              <Link href="/dashboard" className="text-white font-medium hover:text-[#FF5B28] transition-colors">
                 Powrót do Dashboardu
              </Link>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
