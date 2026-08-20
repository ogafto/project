"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BackgroundVideo from "../components/BackgroundVideo";
import AuthHeader from "../components/AuthHeader";
import Badge from "../components/badge";
import { useAuth } from "../context/AuthContext";

export default function LogowaniePage() {
  const router = useRouter();
  const { login, verify2FA, pending2FAUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authenticatorCode, setAuthenticatorCode] = useState("");
  const [step2FA, setStep2FA] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedEmail = email.trim().toLowerCase();

    if (!formattedEmail) {
      setError("Wprowadź swój adres e-mail.");
      return;
    }

    setError("");
    const res = login(formattedEmail, password);
    if (res.requiresOTP) {
      setSuccess("Adres e-mail wymaga weryfikacji. Przekierowywanie do weryfikacji OTP...");
      setTimeout(() => {
        router.push("/potwierdzenie-email");
      }, 800);
      return;
    }

    if (!res.success) {
      setError(res.message || "Błąd logowania. Sprawdź wprowadzone dane.");
    } else if (res.requires2FA) {
      setStep2FA(true);
      setSuccess("Konto posiada aktywny Authenticator 2FA. Wprowadź 6-cyfrowy kod.");
    } else {
      setSuccess("Logowanie pomyślne! Przekierowywanie...");
      setTimeout(() => {
        if (formattedEmail.includes("projekt@motywo.pl") || formattedEmail.includes("projekt@iskral.pl") || formattedEmail.includes("admin")) {
          router.push("/admin");
        } else {
          router.push("/dashboard");
        }
      }, 600);
    }
  };

  const handle2FASubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authenticatorCode.length !== 6) {
      setError("Wprowadź 6-cyfrowy kod z aplikacji Authenticator.");
      return;
    }

    const ok = verify2FA(authenticatorCode);
    if (ok) {
      setError("");
      setSuccess("Kod 2FA pomyślnie zweryfikowany!");
      setTimeout(() => {
        router.push("/dashboard");
      }, 600);
    } else {
      setError("Nieprawidłowy kod 2FA. Użyj kodu testowego (np. 123456).");
    }
  };

  const fillQuickAccount = (userEmail: string, userPass: string) => {
    setEmail(userEmail);
    setPassword(userPass);
    setError("");
    setStep2FA(false);
  };

  return (
    <main className="relative min-h-screen w-full bg-[#0E0E11] text-white flex flex-col overflow-hidden pb-20">
      <BackgroundVideo />

      <div className="relative z-10 flex flex-col w-full px-6 xl:px-[220px] pt-4">
        <AuthHeader />

        <div className="mt-16 sm:mt-24 w-full flex justify-center items-center">
          <div className="w-full max-w-[480px] bg-[#17171B]/90 backdrop-blur-xl border border-white/[0.08] rounded-[24px] p-8 sm:p-10 shadow-2xl shadow-black/80 flex flex-col items-center">
            
            <Badge tag="Logowanie" text="Dostęp do Twojego konta" />

            <h1 className="mt-4 text-[30px] sm:text-[34px] font-semibold text-white tracking-tight text-center leading-tight">
              {step2FA ? "Kod Authenticator (2FA)" : "Zaloguj się"}
            </h1>

            <p className="mt-2 text-[14px] sm:text-[15px] font-medium text-[#707070] text-center leading-relaxed">
              {step2FA
                ? `Wprowadź 6-cyfrowy kod z aplikacji Authenticator dla ${pending2FAUser?.email}`
                : "Wprowadź swoje dane, aby uzyskać dostęp do panelu."}
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

            {!step2FA ? (
              <form onSubmit={handleLoginSubmit} className="mt-6 w-full flex flex-col gap-4">
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
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-[#A1A1AA]">Hasło</label>
                    <Link href="/zapomnialem-hasla" className="text-xs text-[#FF5B28] hover:underline">
                      Zapomniałeś hasła?
                    </Link>
                  </div>
                  <input
                    type="password"
                    placeholder="Podaj swoje hasło"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-12 px-4 bg-[#0E0E11] border border-white/[0.1] rounded-[10px] text-white placeholder-[#505055] focus:outline-none focus:border-[#FF5B28] focus:ring-1 focus:ring-[#FF5B28] transition-all text-sm"
                  />
                </div>

                <button
                  type="submit"
                  className="mt-2 w-full h-12 bg-[#FF5B28] hover:bg-[#e04f20] text-white font-medium rounded-[10px] transition-all shadow-lg shadow-[#FF5B28]/25 text-base cursor-pointer"
                >
                  Zaloguj się
                </button>
              </form>
            ) : (
              <form onSubmit={handle2FASubmit} className="mt-6 w-full flex flex-col gap-4">
                <div className="flex flex-col gap-1.5 items-center">
                  <label className="text-sm font-medium text-[#A1A1AA] self-start">
                    Kod dwuskładnikowy (6 cyfr)
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={authenticatorCode}
                    onChange={(e) => setAuthenticatorCode(e.target.value)}
                    className="w-full h-14 px-4 bg-[#0E0E11] border border-white/[0.1] rounded-[10px] text-white tracking-widest text-center text-2xl font-bold placeholder-[#505055] focus:outline-none focus:border-[#FF5B28] focus:ring-2 focus:ring-[#FF5B28]/30 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  className="mt-4 w-full h-12 bg-[#FF5B28] hover:bg-[#e04f20] text-white font-medium rounded-[10px] transition-all shadow-lg shadow-[#FF5B28]/25 text-base cursor-pointer"
                >
                  Zweryfikuj i zaloguj
                </button>

                <button
                  type="button"
                  onClick={() => setStep2FA(false)}
                  className="w-full py-2 text-xs text-[#909095] hover:text-white transition-colors"
                >
                  Wróć do logowania
                </button>
              </form>
            )}

            <div className="mt-6 text-center text-sm text-[#707070]">
              Nie masz jeszcze konta?{" "}
              <Link href="/rejestracja" className="text-white font-medium hover:text-[#FF5B28] transition-colors">
                Zarejestruj się za darmo
              </Link>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
