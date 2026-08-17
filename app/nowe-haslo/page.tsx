"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BackgroundVideo from "../components/BackgroundVideo";
import AuthHeader from "../components/AuthHeader";
import Badge from "../components/badge";
import { useAuth } from "../context/AuthContext";

export default function NoweHasloPage() {
  const router = useRouter();
  const { resetPassword } = useAuth();
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const getStrength = (pass: string) => {
    if (!pass) return { label: "", color: "w-0 bg-transparent" };
    if (pass.length < 6) return { label: "Słabe", color: "w-1/3 bg-red-500" };
    if (pass.length < 10) return { label: "Średnie", color: "w-2/3 bg-amber-500" };
    return { label: "Silne", color: "w-full bg-emerald-500" };
  };

  const strength = getStrength(password);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.length !== 6) {
      setError("Wprowadź 6-cyfrowy kod z wiadomości e-mail.");
      return;
    }
    if (!password || !confirmPassword) {
      setError("Wypełnij oba pola z hasłem.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Podane hasła nie są takie same.");
      return;
    }
    if (password.length < 6) {
      setError("Nowe hasło musi mieć co najmniej 6 znaków.");
      return;
    }

    const ok = resetPassword(code, password);
    if (ok) {
      setError("");
      setSuccess("Hasło zostało zmienione! Przekierowywanie do logowania...");
      setTimeout(() => {
        router.push("/logowanie");
      }, 1500);
    } else {
      setError("Nieprawidłowy kod weryfikacyjny.");
    }
  };

  return (
    <main className="relative min-h-screen w-full bg-[#0E0E11] text-white flex flex-col overflow-hidden pb-20">
      <BackgroundVideo />

      <div className="relative z-10 flex flex-col w-full px-6 xl:px-[220px] pt-4">
        <AuthHeader />

        <div className="mt-16 sm:mt-24 w-full flex justify-center items-center">
          <div className="w-full max-w-[480px] bg-[#17171B]/90 backdrop-blur-xl border border-white/[0.08] rounded-[24px] p-8 sm:p-10 shadow-2xl shadow-black/80 flex flex-col items-center">
            
            <Badge tag="Resetowanie" text="Nowe bezpieczne hasło" />

            <h1 className="mt-4 text-[30px] sm:text-[34px] font-semibold text-white tracking-tight text-center leading-tight">
              Podaj nowe hasło
            </h1>

            <p className="mt-2 text-[14px] sm:text-[15px] font-medium text-[#707070] text-center leading-relaxed">
              Wprowadź 6-cyfrowy kod z wiadomości e-mail oraz nowe hasło do swojego konta.
            </p>

            {error && (
              <div className="mt-6 w-full p-4 bg-red-500/10 border border-red-500/30 rounded-[12px] text-red-400 text-sm text-center font-medium">
                {error}
              </div>
            )}

            {success && (
              <div className="mt-6 w-full p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-[12px] text-emerald-400 text-sm text-center font-medium">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 w-full flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#A1A1AA]">6-cyfrowy kod z e-maila</label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full h-12 px-4 bg-[#0E0E11] border border-white/[0.1] rounded-[10px] text-white tracking-widest text-center text-lg font-bold placeholder-[#505055] focus:outline-none focus:border-[#FF5B28] focus:ring-1 focus:ring-[#FF5B28] transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#A1A1AA]">Nowe hasło</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 px-4 bg-[#0E0E11] border border-white/[0.1] rounded-[10px] text-white placeholder-[#505055] focus:outline-none focus:border-[#FF5B28] focus:ring-1 focus:ring-[#FF5B28] transition-all text-sm"
                />
                {password && (
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-1.5 flex-1 bg-white/10 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-300 ${strength.color}`} />
                    </div>
                    <span className="text-xs text-[#909095]">{strength.label}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#A1A1AA]">Powtórz nowe hasło</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-12 px-4 bg-[#0E0E11] border border-white/[0.1] rounded-[10px] text-white placeholder-[#505055] focus:outline-none focus:border-[#FF5B28] focus:ring-1 focus:ring-[#FF5B28] transition-all text-sm"
                />
              </div>

              <button
                type="submit"
                className="mt-4 w-full h-12 bg-[#FF5B28] hover:bg-[#e04f20] text-white font-medium rounded-[10px] transition-all shadow-lg shadow-[#FF5B28]/25 text-base cursor-pointer"
              >
                Zapisz nowe hasło
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-[#707070]">
              Wróć do{" "}
              <Link href="/logowanie" className="text-white font-medium hover:text-[#FF5B28] transition-colors">
                Logowania
              </Link>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
