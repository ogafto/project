"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BackgroundVideo from "../components/BackgroundVideo";
import AuthHeader from "../components/AuthHeader";
import Badge from "../components/badge";
import { useAuth } from "../context/AuthContext";

export default function RejestracjaPage() {
  const router = useRouter();
  const { register, message } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formattedEmail = email.trim().toLowerCase();
    const formattedName = name.trim();

    if (!formattedName || !formattedEmail || !password || !confirmPassword) {
      setError("Wypełnij wszystkie pola formularza.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Podane hasła nie są identyczne.");
      return;
    }
    if (password.length < 6) {
      setError("Hasło musi mieć co najmniej 6 znaków.");
      return;
    }
    if (!acceptTerms) {
      setError("Zaakceptuj regulamin i politykę prywatności.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("iskra_pending_email", formattedEmail);
      }
      const ok = await register(formattedName, formattedEmail, password);
      if (ok) {
        router.push("/potwierdzenie-email");
      } else {
        setError(message?.text || "Konto o tym adresie e-mail już istnieje lub wystąpił błąd.");
      }
    } catch (err: any) {
      setError("Błąd rejestracji: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen w-full bg-[#0E0E11] text-white flex flex-col overflow-hidden pb-20">
      <BackgroundVideo />

      <div className="relative z-10 flex flex-col w-full px-6 xl:px-[220px] pt-4">
        <AuthHeader />

        <div className="mt-16 sm:mt-24 w-full flex justify-center items-center">
          <div className="w-full max-w-[480px] bg-[#17171B]/90 backdrop-blur-xl border border-white/[0.08] rounded-[24px] p-8 sm:p-10 shadow-2xl shadow-black/80 flex flex-col items-center">
            
            <Badge tag="Rejestracja" text="Dołącz do platformy" />

            <h1 className="mt-4 text-[32px] sm:text-[36px] font-semibold text-white tracking-tight text-center leading-tight">
              Załóż konto
            </h1>

            <p className="mt-2 text-[15px] font-medium text-[#707070] text-center">
              Rozpocznij sprzedaż swoich produktów w minutę.
            </p>

            {error && (
              <div className="mt-6 w-full p-4 bg-red-500/10 border border-red-500/30 rounded-[12px] text-red-400 text-sm text-center font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 w-full flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#A1A1AA]">Imię i nazwisko</label>
                <input
                  type="text"
                  placeholder="Jan Kowalski"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-12 px-4 bg-[#0E0E11] border border-white/[0.1] rounded-[10px] text-white placeholder-[#505055] focus:outline-none focus:border-[#FF5B28] focus:ring-1 focus:ring-[#FF5B28] transition-all text-sm"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#A1A1AA]">Adres e-mail</label>
                <input
                  type="email"
                  placeholder="Podaj swój adres e-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 px-4 bg-[#0E0E11] border border-white/[0.1] rounded-[10px] text-white placeholder-[#505055] focus:outline-none focus:border-[#FF5B28] focus:ring-1 focus:ring-[#FF5B28] transition-all text-sm"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#A1A1AA]">Hasło</label>
                <input
                  type="password"
                  placeholder="Podaj swoje hasło"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 px-4 bg-[#0E0E11] border border-white/[0.1] rounded-[10px] text-white placeholder-[#505055] focus:outline-none focus:border-[#FF5B28] focus:ring-1 focus:ring-[#FF5B28] transition-all text-sm"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#A1A1AA]">Powtórz hasło</label>
                <input
                  type="password"
                  placeholder="Podaj swoje hasło"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-12 px-4 bg-[#0E0E11] border border-white/[0.1] rounded-[10px] text-white placeholder-[#505055] focus:outline-none focus:border-[#FF5B28] focus:ring-1 focus:ring-[#FF5B28] transition-all text-sm"
                />
              </div>

              <label className="mt-2 flex items-start gap-3 cursor-pointer text-xs text-[#A1A1AA] leading-relaxed">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-0.5 accent-[#FF5B28] rounded cursor-pointer w-4 h-4"
                />
                <span>
                  Oświadczam, że znam i akceptuję{" "}
                  <a href="#" className="text-white underline hover:text-[#FF5B28]">
                    Regulamin
                  </a>{" "}
                  oraz{" "}
                  <a href="#" className="text-white underline hover:text-[#FF5B28]">
                    Politykę Prywatności
                  </a>
                  .
                </span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="mt-4 w-full h-12 bg-[#FF5B28] hover:bg-[#e04f20] disabled:opacity-50 text-white font-medium rounded-[10px] transition-all shadow-lg shadow-[#FF5B28]/25 text-base cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? "Tworzenie konta..." : "Utwórz darmowe konto"}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-[#707070]">
              Masz już konto?{" "}
              <Link href="/logowanie" className="text-white font-medium hover:text-[#FF5B28] transition-colors">
                Zaloguj się
              </Link>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
