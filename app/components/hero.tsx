"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Badge from "./badge";

export default function Hero() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatus("success");
        setToastMessage(data.message || "Dziękujemy! Twój adres e-mail został zapisany na listę oczekujących.");
        setShowToast(true);
        setEmail("");

        // Auto hide toast after 6s
        setTimeout(() => setShowToast(false), 6000);
      } else {
        setStatus("error");
        setToastMessage(data.error || "Wystąpił błąd. Spróbuj ponownie.");
        setShowToast(true);
      }
    } catch {
      setStatus("error");
      setToastMessage("Coś poszło nie tak. Sprawdź połączenie z siecią.");
      setShowToast(true);
    } finally {
      setStatus("idle");
    }
  };

  return (
    <section className="flex flex-col items-center text-center w-full max-w-4xl mx-auto px-4">
      {/* Centered Platform Logo */}
      <div className="mb-6 flex justify-center">
        <Image
          src="/logo.svg"
          alt="Logo"
          width={220}
          height={44}
          className="w-[170px] sm:w-[200px] md:w-[220px] h-auto object-contain"
          priority
        />
      </div>

      {/* Badge Component */}
      <Badge tag="W budowie" text="Platforma w przygotowaniu" />

      {/* Main Title */}
      <h1 className="mt-4 sm:mt-6 text-[34px] xs:text-[44px] sm:text-[56px] md:text-[64px] lg:text-[72px] font-semibold tracking-tight leading-[1.1] text-center">
        <span className="text-white block">Prace nad platformą</span>
        <span className="text-[#FF5B28] block">jeszcze trwają</span>
      </h1>

      {/* Subtitle / Description */}
      <p className="mt-4 sm:mt-6 text-[15px] sm:text-[16px] font-medium text-[#A1A1AA] text-center max-w-2xl leading-relaxed">
        Intensywnie pracujemy nad wdrożeniem serwisu. Zapisz się na listę oczekujących, aby otrzymać powiadomienie o starcie i 14 dni darmowego dostępu!
      </p>

      {/* Embedded Input Field with Submit Button Inside */}
      <div className="mt-8 w-full max-w-lg mx-auto">
        <form
          onSubmit={handleSubmit}
          className="p-1.5 sm:p-2 bg-[#17171B] border border-white/10 rounded-2xl flex items-center gap-2 transition-all focus-within:border-[#FF5B28] shadow-inner"
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Wpisz swój adres e-mail..."
            className="w-full bg-transparent px-3.5 sm:px-4 py-2 text-white placeholder-[#707070] outline-none text-sm font-normal"
            required
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="px-5 sm:px-6 py-2.5 bg-[#FF5B28] hover:bg-[#e04f20] text-white font-medium rounded-xl text-sm transition-colors shrink-0 disabled:opacity-50"
          >
            {status === "loading" ? "Zapisywanie..." : "Zapisz się za darmo"}
          </button>
        </form>
      </div>

      {/* Secondary Action Buttons (Discord & Login) */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3 w-full">
        <a
          href="https://discord.gg"
          target="_blank"
          rel="noopener noreferrer"
          className="px-5 py-2.5 rounded-xl text-sm text-white bg-[#5865F2] hover:bg-[#4752C4] font-medium transition-colors inline-flex items-center gap-2"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 127.14 96.36">
            <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a74.77,74.77,0,0,0,64.3,0c.87.69,1.76,1.37,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1,105.25,105.25,0,0,0,32.19-16.14c2.64-27.38-4.51-51.11-18.93-72.15ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,45.91,53.87,53,48.8,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,45.91,96.1,53,91.08,65.69,84.69,65.69Z" />
          </svg>
          <span>Dołącz do Discorda</span>
        </a>

        <Link
          href="/logowanie"
          className="px-5 py-2.5 rounded-xl text-sm text-[#A1A1AA] hover:text-white bg-[#17171B] border border-white/[0.08] hover:border-white/20 transition-all"
        >
          Masz już konto? Zaloguj się
        </Link>
      </div>

      {/* Floating Premium Toast Notification Component (High Top-Right Position with Elastic Slide-in) */}
      {showToast && (
        <div className="fixed top-8 right-6 sm:top-10 sm:right-8 z-50 max-w-sm w-[calc(100%-3rem)] bg-[#17171B]/95 backdrop-blur-2xl border border-[#FF5B28]/40 p-5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex items-start gap-3.5 text-left animate-toast-slide-in overflow-hidden">
          {/* Animated shrinking progress timer bar at bottom */}
          <div className="absolute bottom-0 left-0 h-[3px] bg-[#FF5B28] animate-toast-progress" />

          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FF5B28]/25 to-[#FF5B28]/5 border border-[#FF5B28]/40 flex items-center justify-center shrink-0 text-[#FF5B28] shadow-md">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div className="flex-1 pr-1">
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>Dziękujemy za zapis!</span>
              <span className="text-base">🎉</span>
            </h4>
            <p className="mt-1 text-xs text-[#A1A1AA] leading-relaxed">{toastMessage}</p>
          </div>

          <button
            onClick={() => setShowToast(false)}
            className="text-[#707070] hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
            aria-label="Zamknij"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </section>
  );
}






