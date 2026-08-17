"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BackgroundVideo from "../components/BackgroundVideo";
import AuthHeader from "../components/AuthHeader";
import Badge from "../components/badge";
import { useAuth } from "../context/AuthContext";

export default function PotwierdzenieEmailPage() {
  const router = useRouter();
  const { pendingEmail, verifyEmail } = useAuth();
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [timer, setTimer] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pasted)) {
      const split = pasted.split("");
      setDigits(split);
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = digits.join("");
    if (code.length !== 6) {
      setError("Wprowadź pełny 6-cyfrowy kod weryfikacyjny.");
      return;
    }

    const ok = verifyEmail(code);
    if (ok) {
      setSuccessMsg("Kod prawidłowy! Przekierowywanie do panelu...");
      setTimeout(() => {
        router.push("/dashboard");
      }, 1200);
    } else {
      setError("Nieprawidłowy kod weryfikacyjny. Spróbuj użyć kodu: 123456.");
    }
  };

  const handleResend = () => {
    if (timer === 0) {
      setTimer(60);
      setSuccessMsg("Nowy kod został wysłany na Twój e-mail!");
      setTimeout(() => setSuccessMsg(""), 3000);
    }
  };

  const displayEmail = pendingEmail || "jan@kowalski.pl";

  return (
    <main className="relative min-h-screen w-full bg-[#0E0E11] text-white flex flex-col overflow-hidden pb-20">
      <BackgroundVideo />

      <div className="relative z-10 flex flex-col w-full px-6 xl:px-[220px] pt-4">
        <AuthHeader />

        <div className="mt-16 sm:mt-24 w-full flex justify-center items-center">
          <div className="w-full max-w-[480px] bg-[#17171B]/90 backdrop-blur-xl border border-white/[0.08] rounded-[24px] p-8 sm:p-10 shadow-2xl shadow-black/80 flex flex-col items-center">
            
            <Badge tag="Weryfikacja" text="Potwierdzenie adresu e-mail" />

            <h1 className="mt-4 text-[30px] sm:text-[34px] font-semibold text-white tracking-tight text-center leading-tight">
              Wpisz 6-cyfrowy kod
            </h1>

            <p className="mt-2 text-[14px] sm:text-[15px] font-medium text-[#707070] text-center leading-relaxed">
              Kod weryfikacyjny został wysłany na adres:
              <br />
              <strong className="text-white font-semibold">{displayEmail}</strong>
            </p>

            {error && (
              <div className="mt-6 w-full p-4 bg-red-500/10 border border-red-500/30 rounded-[12px] text-red-400 text-sm text-center font-medium">
                {error}
              </div>
            )}

            {successMsg && (
              <div className="mt-6 w-full p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-[12px] text-emerald-400 text-sm text-center font-medium">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-8 w-full flex flex-col items-center gap-6">
              <div className="flex gap-2 sm:gap-3 justify-center w-full" onPaste={handlePaste}>
                {digits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { inputRefs.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className="w-11 h-14 sm:w-12 sm:h-16 text-center text-xl font-bold bg-[#0E0E11] border border-white/[0.1] rounded-[12px] text-white focus:outline-none focus:border-[#FF5B28] focus:ring-2 focus:ring-[#FF5B28]/30 transition-all"
                  />
                ))}
              </div>

              <div className="p-3 w-full bg-[#0E0E11]/60 border border-white/[0.05] rounded-[10px] text-center text-xs text-[#909095]">
                Wskazówka testowa: Wprowadź dowolne 6 cyfr (np. <strong className="text-white">123456</strong>)
              </div>

              <button
                type="submit"
                className="w-full h-12 bg-[#FF5B28] hover:bg-[#e04f20] text-white font-medium rounded-[10px] transition-all shadow-lg shadow-[#FF5B28]/25 text-base cursor-pointer"
              >
                Potwierdź kod i zaloguj
              </button>
            </form>

            <div className="mt-6 flex flex-col items-center gap-2 text-center text-sm">
              <button
                onClick={handleResend}
                disabled={timer > 0}
                className={`font-medium transition-colors ${
                  timer > 0 ? "text-[#505055] cursor-not-allowed" : "text-[#FF5B28] hover:underline cursor-pointer"
                }`}
              >
                {timer > 0 ? `Wyślij kod ponownie za ${timer}s` : "Wyślij nowy kod OTP"}
              </button>
              
              <Link href="/rejestracja" className="text-[#707070] text-xs hover:text-white mt-1">
                Zmień adres e-mail
              </Link>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
