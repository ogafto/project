"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BackgroundVideo from "../components/BackgroundVideo";
import AuthHeader from "../components/AuthHeader";
import Badge from "../components/badge";
import { useAuth } from "../context/AuthContext";

export default function ZapomnialemHaslaPage() {
  const router = useRouter();
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Wprowadź swój adres e-mail.");
      return;
    }

    sendPasswordReset(email);
    router.push("/nowe-haslo");
  };

  return (
    <main className="relative min-h-screen w-full bg-[#0E0E11] text-white flex flex-col overflow-hidden pb-20">
      <BackgroundVideo />

      <div className="relative z-10 flex flex-col w-full px-6 xl:px-[220px] pt-4">
        <AuthHeader />

        <div className="mt-20 sm:mt-28 w-full flex justify-center items-center">
          <div className="w-full max-w-[480px] bg-[#17171B]/90 backdrop-blur-xl border border-white/[0.08] rounded-[24px] p-8 sm:p-10 shadow-2xl shadow-black/80 flex flex-col items-center">
            
            <Badge tag="Odzyskiwanie" text="Zresetuj swoje hasło" />

            <h1 className="mt-4 text-[30px] sm:text-[34px] font-semibold text-white tracking-tight text-center leading-tight">
              Zapomniałem hasła
            </h1>

            <p className="mt-2 text-[14px] sm:text-[15px] font-medium text-[#707070] text-center leading-relaxed">
              Podaj swój adres e-mail, a wyślemy Ci 6-cyfrowy kod potrzebny do ustawienia nowego hasła.
            </p>

            {error && (
              <div className="mt-6 w-full p-4 bg-red-500/10 border border-red-500/30 rounded-[12px] text-red-400 text-sm text-center font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 w-full flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#A1A1AA]">Adres e-mail</label>
                <input
                  type="email"
                  placeholder="jan@kowalski.pl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 px-4 bg-[#0E0E11] border border-white/[0.1] rounded-[10px] text-white placeholder-[#505055] focus:outline-none focus:border-[#FF5B28] focus:ring-1 focus:ring-[#FF5B28] transition-all text-sm"
                />
              </div>

              <button
                type="submit"
                className="mt-4 w-full h-12 bg-[#FF5B28] hover:bg-[#e04f20] text-white font-medium rounded-[10px] transition-all shadow-lg shadow-[#FF5B28]/25 text-base cursor-pointer"
              >
                Wyślij kod do zresetowania hasła
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-[#707070]">
              Pamiętasz swoje hasło?{" "}
              <Link href="/logowanie" className="text-white font-medium hover:text-[#FF5B28] transition-colors">
                Powrót do logowania
              </Link>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
