"use client";

import { useState } from "react";

const MASTER_PROMPT_TEXT = `SYSTEM SPECIFICATION & MASTER PROMPT DLA AI:

Rola: Jesteś starszym inżynierem oprogramowania i architektem Full-Stack tworzącym zaawansowaną platformę E-Commerce (SaaS) nowej generacji.

### 1. Architektura i Wygląd (Design System):
- Ciemny motyw premium: Tło #0E0E11, Karty #17171B z border border-white/[0.08] i backdrop-blur-xl (Glassmorphism).
- Gówny akcent kolorystyczny: Elektryczny pomarańcz #FF5B28 z promieniami i cieniami shadow-[#FF5B28]/25.
- Nowoczesny, boczny układy nawigacji (Sidebar Layout) z ergonomicznym podziałem na sekcje.

### 2. Autoryzacja i Baza Użytkowników:
- Rejestracja bez gotowych danych domyślnych w polach formularza.
- Rejestracja z weryfikacją e-mail (6-cyfrowy kod OTP).
- Autoryzacja Dwuskładnikowa 2FA Authenticator (Google Authenticator / Authy 6 cyfr).
- Izolacja Ról:
  - Admin (rola: 'admin') trafia wyłącznie do Panelu Administratora.
  - Klient (rola: 'client') widz wyłącznie swój sklep i swoje dane.

### 3. Logika "1 Kupiony Pakiet = 1 Sklep":
- Klient z pakietem 'Brak' widzi ekran blokady ("Kup pakiet, aby stworzyć swój sklep").
- Zakup pakietu (Start, Creator, Brand) inicjalizuje sklep i odblokowuje 9 modułów operacyjnych.

### 4. Moduły Operacyjne Sklepu:
1. Edytor: Nazwa sklepu, wybiór szablonu (Dark Vibe, Minimalist, Streetwear Drop), akcent kolorystyczny, Social Media (IG, TikTok), pasek ogłoszeń top-bar z podglądem na żywo.
2. Saldo & Stripe Connect: Weryfikacja konta Stripe Connect, saldo do wypłaty, środki w drodze, formularz wypłat na konto bankowe z wymogiem IBAN oraz Historia Wypłat (Kwota, Data, Godzina:Minuta, Status, Zamaskowany IBAN).
3. Tryb Drop/y: Konfigurator premiery z wyborem szablonu Drop Page, datą i godziną premiery oraz tykającym zegarem odliczającym (Dni:Godz:Min:Sek) automatycznie otwierającym sklep o zadanej godzinie.
4. Produkty: Produkty Fizyczne i Cyfrowe. Dla produktów cyfrowych: upload i aktualizacja wersji pliku (PDF, ZIP, MP4, MP3) dla kupujących. Ceny promocyjne (chwyt marketingowy).
5. Statystyki: Obrót, średni koszyk, konwersja.
6. Kampania E-mail: Newsletter i mailing do kupujących.
7. Baza Klientów: Lista kupujących z historią zamówień.
8. Domena: Subdomena .iskral.pl, własna domena i weryfikator rekordów DNS (Rekord A, CNAME).
9. Team Collaboration: Dodawanie współpracowników z uprawnieniami (Edytor, Produkty, Statystyki, Obsługa Zamówień, Finanse).

### 5. Panel Administratora:
- Śledzenie rejestracji i stanu weryfikacji e-mail w czasie rzeczywistym.
- Licznik Użytkowników Online na żywo.
- Ranking Topowych Sklepów (Leaderboard Miejsca #1-#5 z obrotami i zamówieniami).
- Zarządzanie rolami (Klient <-> Admin) oraz natychmiastowe zmienianie pakietów klientom.
`;

export default function MasterPromptModal({ onClose }: { onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(MASTER_PROMPT_TEXT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-[#17171B] border border-white/10 rounded-[24px] p-6 sm:p-8 flex flex-col gap-4 shadow-2xl max-h-[85vh]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-[#FF5B28]/20 text-[#FF5B28] text-xs font-bold rounded-full border border-[#FF5B28]/30">
              AI PROMPT SPEC
            </span>
            <h2 className="text-xl font-bold">Master AI Prompt Specification</h2>
          </div>
          <button onClick={onClose} className="text-xs text-[#707070] hover:text-white">
            Zamknij ✕
          </button>
        </div>

        <p className="text-xs text-[#707070]">
          Skopiuj poniższy kompletny prompt dla AI, aby wygenerować bazę danych i backend dla tej platformy w dowolnym środowisku.
        </p>

        <textarea
          readOnly
          value={MASTER_PROMPT_TEXT}
          className="w-full h-80 p-4 bg-[#0E0E11] border border-white/10 rounded-[12px] text-xs font-mono text-[#A1A1AA] focus:outline-none resize-none leading-relaxed"
        />

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-emerald-400 font-medium">
            {copied ? "✓ Skopiowano do schowka!" : "Gotowe do użycia w ChatGPT / Claude / Antigravity"}
          </span>
          <button
            onClick={handleCopy}
            className="px-6 py-2.5 bg-[#FF5B28] hover:bg-[#e04f20] text-white font-semibold rounded-[10px] text-xs transition-colors shadow-lg shadow-[#FF5B28]/20 cursor-pointer"
          >
            {copied ? "Skopiowano!" : "Kopiuj Prompt"}
          </button>
        </div>
      </div>
    </div>
  );
}
