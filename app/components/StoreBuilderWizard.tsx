"use client";

import React, { useState } from "react";
import Badge from "./badge";
import { useAuth, PlanType } from "../context/AuthContext";

interface StoreBuilderWizardProps {
  onComplete: () => void;
  initialStep?: number;
}

const TEMPLATES = [
  {
    id: "Dark Vibe",
    name: "Dark Vibe",
    badge: "Bestseller",
    description: "Głębokie ciemne tło z neonowym pomarańczowym akcentem. Świetny dla marek odzieżowych, streetwearu i dropów.",
    accent: "#FF5B28",
    previewIcon: "🔥",
  },
  {
    id: "Minimalist",
    name: "Minimalist Luxury",
    badge: "Elegancja",
    description: "Przestronny układ, czysta typografia, wyeksponowane duże zdjęcia produktów i wysoka konwersja.",
    accent: "#3B82F6",
    previewIcon: "💎",
  },
  {
    id: "Cyberpunk Launch",
    name: "Cyberpunk Hype",
    badge: "Drop & Timer",
    description: "Agresywny styl z licznikiem odliczania (drop mode), podświetleniami i efektem pilnej sprzedaży.",
    accent: "#10B981",
    previewIcon: "⚡",
  },
  {
    id: "Digital Creator",
    name: "Digital Creator",
    badge: "Pliki & Kursy",
    description: "Idealny pod e-booki, szablony, pliki cyfrowe i kursy wideo z natychmiastowym pobieraniem po płatności.",
    accent: "#8B5CF6",
    previewIcon: "🚀",
  },
];

const ACCENT_COLORS = [
  { name: "Neon Orange", code: "#FF5B28" },
  { name: "Electric Blue", code: "#3B82F6" },
  { name: "Emerald Green", code: "#10B981" },
  { name: "Royal Purple", code: "#8B5CF6" },
  { name: "Hot Pink", code: "#EC4899" },
];

const PRESET_NICHES = [
  "Moda & Streetwear",
  "E-booki & Produkty Cyfrowe",
  "Kursy & Szkolenia Wideo",
  "Elektronika & Gadżety",
  "Akcesoria & High-Ticket",
  "Kosmetyki & Beauty",
];

export default function StoreBuilderWizard({ onComplete, initialStep = 1 }: StoreBuilderWizardProps) {
  const { user, buyPlan, createOrUpdateStoreFull, createStripeCheckout } = useAuth();

  const [step, setStep] = useState<number>(initialStep);
  const [billingCycle, setBillingCycle] = useState<"miesiac" | "rok">("miesiac");

  // Step 1 State: Plan Selection
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("Creator");

  // Step 2 State: Store Identity, Subdomain, Custom Domain, Niche & Logo
  const [storeName, setStoreName] = useState(user?.name ? `Sklep ${user.name}` : "Mój Nowy Sklep");
  const [subdomain, setSubdomain] = useState(() => {
    const raw = (user?.name || "sklep").toLowerCase().replace(/[^a-z0-9]/g, "");
    return raw || "mojsklep";
  });
  const [customDomain, setCustomDomain] = useState("");
  const [niche, setNiche] = useState("Moda & Streetwear");
  const [customNiche, setCustomNiche] = useState("");

  // Logo upload state
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [logoFileName, setLogoFileName] = useState<string>("");
  const [logoDragActive, setLogoDragActive] = useState(false);

  // Step 3 State: Template & Branding
  const [selectedTemplate, setSelectedTemplate] = useState("Dark Vibe");
  const [accentColor, setAccentColor] = useState("#FF5B28");
  const [announcement, setAnnouncement] = useState("🎉 Darmowa dostawa od 150 PLN | Pierwsza kolekcja już dostępna!");

  // Step 4 State: Initial Product with Photo Upload & Digital File Upload
  const [addSampleProduct, setAddSampleProduct] = useState(true);
  const [prodTitle, setProdTitle] = useState("T-Shirt 'Limitowana Edycja 2026'");
  const [prodDescription, setProdDescription] = useState("Unikalny produkt z najnowszej kolekcji. Najwyższa jakość wykonania.");
  const [prodPrice, setProdPrice] = useState("149.00");
  const [prodComparePrice, setProdComparePrice] = useState("199.00");
  const [prodType, setProdType] = useState<"Fizyczny" | "Cyfrowy">("Fizyczny");

  // Product Photo upload state
  const [prodImageUrl, setProdImageUrl] = useState<string>("");
  const [prodImageFileName, setProdImageFileName] = useState<string>("");
  const [prodImageDragActive, setProdImageDragActive] = useState(false);

  // Digital File upload state (for Digital Products)
  const [digitalFileName, setDigitalFileName] = useState<string>("");
  const [digitalFileSize, setDigitalFileSize] = useState<string>("");
  const [digitalFileUrl, setDigitalFileUrl] = useState<string>("");
  const [digitalDragActive, setDigitalDragActive] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Logo file handler (Drag & Drop or File Input)
  const handleLogoFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Wybierz plik graficzny (PNG, JPG, SVG, WebP).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setLogoUrl(e.target.result as string);
        setLogoFileName(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  // Product image handler
  const handleProductImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Wybierz plik ze zdjęciem (PNG, JPG, WebP).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setProdImageUrl(e.target.result as string);
        setProdImageFileName(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  // Digital File handler (PDF, ZIP, MP3, MP4, etc.)
  const handleDigitalFile = (file: File) => {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    const formattedSize = file.size > 1024 * 1024 ? `${sizeMB} MB` : `${Math.round(file.size / 1024)} KB`;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setDigitalFileUrl(e.target.result as string);
        setDigitalFileName(file.name);
        setDigitalFileSize(formattedSize);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleNextStep1 = () => {
    setStep(2);
  };

  const handleNextStep2 = () => {
    if (!storeName.trim()) {
      alert("Wprowadź nazwę sklepu.");
      return;
    }
    if (!subdomain.trim()) {
      alert("Wprowadź subdomenę sklepu.");
      return;
    }
    setStep(3);
  };

  const handleNextStep3 = () => {
    setStep(4);
  };

  const handleFinalize = async () => {
    setIsSubmitting(true);
    try {
      const cleanSub = subdomain.toLowerCase().replace(/[^a-z0-9]/g, "") || "sklep";
      const cleanPrice = String(prodPrice || "").replace(",", ".").replace(/[^0-9.]/g, "");
      const priceNum = parseFloat(cleanPrice) || 149;
      const priceCents = Math.round(priceNum * 100);

      const finalNiche = customNiche.trim() || niche;

      // 1. Atomically create or update store in state & localStorage
      const createdStore = createOrUpdateStoreFull({
        name: storeName,
        subdomain: cleanSub,
        customDomain: customDomain.trim(),
        niche: finalNiche,
        logoUrl: logoUrl,
        template: selectedTemplate,
        accentColor,
        announcement,
        plan: selectedPlan,
        billingCycle,
        initialProduct: addSampleProduct && prodTitle ? {
          name: prodTitle,
          description: prodDescription,
          price: `${priceNum.toFixed(2)} PLN`,
          priceCents,
          type: prodType,
          image: prodImageUrl || undefined,
          digitalFileName: prodType === "Cyfrowy" ? (digitalFileName || "Poradnik_Cyfrowy.pdf") : undefined,
          digitalFileSize: prodType === "Cyfrowy" ? (digitalFileSize || "12.4 MB") : undefined,
          digitalFileUrl: prodType === "Cyfrowy" ? (digitalFileUrl || "data:application/pdf;base64,demo") : undefined,
        } : undefined,
      });

      // Synchronizacja sklepu do Supabase API
      try {
        await fetch("/api/stores/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ store: createdStore }),
        });
      } catch (syncErr) {
        console.warn("Store sync API notice:", syncErr);
      }

      // 2. Check if Stripe Checkout is required for Paid SaaS plan (Creator or Brand)
      const isPaidPlan = selectedPlan === "Creator" || selectedPlan === "Brand";

      if (isPaidPlan) {
        const saasPriceCents = selectedPlan === "Creator"
          ? (billingCycle === "rok" ? 29900 : 4990)
          : (billingCycle === "rok" ? 59900 : 9990);

        const checkoutUrl = await createStripeCheckout({
          planType: selectedPlan,
          title: `Subskrypcja Iskral SaaS - Pakiet ${selectedPlan} (${billingCycle})`,
          priceCents: saasPriceCents,
          tenantId: createdStore.id,
        });

        if (checkoutUrl) {
          window.location.href = checkoutUrl;
          return;
        }
      } else {
        // Send free trial confirmation email
        if (user?.email) {
          fetch("/api/auth/send-plan-confirmation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: user.email,
              planName: "Pakiet Start (Darmowy Trial 14 dni)",
              amountFormatted: "0.00 PLN (Okres Próbny)",
              expiresAtFormatted: "14 dni",
              dashboardUrl: "https://iskral.pl/dashboard",
            }),
          }).catch(console.warn);
        }
      }

      // Complete wizard callback for Start (14d trial) plan or fallback
      onComplete();
    } catch (err) {
      console.error("Wizard finalization error:", err);
      alert("Wystąpił błąd podczas zapisywania sklepu. Spróbuj ponownie.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center">
      {/* Wizard Progress Stepper Header */}
      <div className="w-full bg-[#17171B]/90 backdrop-blur-xl border border-white/[0.08] rounded-[24px] p-6 sm:p-8 shadow-2xl mb-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FF5B28]/20 border border-[#FF5B28]/40 flex items-center justify-center text-[#FF5B28] font-bold text-lg">
              {step}
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {step === 1 && "Krok 1: Wybór Pakietu Subskrypcji"}
                {step === 2 && "Krok 2: Nazwa Sklepu, Logo & Domena"}
                {step === 3 && "Krok 3: Wygląd & Szablon Graficzny"}
                {step === 4 && "Krok 4: Pierwszy Produkt & Pliki Cyfrowe"}
              </h2>
              <p className="text-xs sm:text-sm text-[#707070]">
                Kreator Sklepu Internetowego Iskral — skonfiguruj sklep w mniej niż 2 minuty.
              </p>
            </div>
          </div>

          <Badge tag="Kreator 2.0" text={`Krok ${step} z 4`} />
        </div>

        {/* Stepper Dots & Bar */}
        <div className="grid grid-cols-4 gap-2 mt-6">
          {[
            { num: 1, label: "Pakiet" },
            { num: 2, label: "Logo & Domena" },
            { num: 3, label: "Design" },
            { num: 4, label: "Produkt & Pliki" },
          ].map((s) => (
            <button
              key={s.num}
              onClick={() => setStep(s.num)}
              className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                step === s.num
                  ? "bg-[#FF5B28]/15 border-[#FF5B28] text-white"
                  : step > s.num
                  ? "bg-white/[0.04] border-emerald-500/40 text-emerald-400"
                  : "bg-white/[0.02] border-white/[0.06] text-[#707070]"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === s.num
                    ? "bg-[#FF5B28] text-white"
                    : step > s.num
                    ? "bg-emerald-500 text-black"
                    : "bg-white/10 text-[#707070]"
                }`}
              >
                {step > s.num ? "✓" : s.num}
              </div>
              <span className="text-xs sm:text-sm font-medium hidden xs:inline">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* STEP 1: PAKIER */}
      {step === 1 && (
        <div className="w-full flex flex-col items-center animate-in fade-in duration-300">
          <div className="text-center mb-8">
            <h3 className="text-2xl sm:text-3xl font-bold text-white">Wybierz plan dla swojego sklepu</h3>
            <p className="text-[#A1A1AA] text-sm mt-2">
              Możesz wybrać **Pakiet Start (14 dni darmowego testu)** bez karty lub od razu pełną moc **Creator**.
            </p>

            {/* Billing switcher */}
            <div className="mt-6 inline-flex items-center p-1 bg-[#0E0E11] border border-white/10 rounded-xl">
              <button
                type="button"
                onClick={() => setBillingCycle("miesiac")}
                className={`px-4 py-2 rounded-lg text-sm transition-all ${
                  billingCycle === "miesiac"
                    ? "bg-white/10 text-white font-medium"
                    : "text-[#707070] hover:text-white"
                }`}
              >
                Rozliczenie Miesięczne
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("rok")}
                className={`px-4 py-2 rounded-lg text-sm flex items-center gap-1.5 transition-all ${
                  billingCycle === "rok"
                    ? "bg-white/10 text-white font-medium"
                    : "text-[#707070] hover:text-white"
                }`}
              >
                <span>Roczne</span>
                <span className="bg-[#FF5B28] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                  -50% Taniej
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-8">
            {/* Start Plan */}
            <div
              onClick={() => setSelectedPlan("Start")}
              className={`cursor-pointer rounded-2xl p-6 border transition-all flex flex-col justify-between ${
                selectedPlan === "Start"
                  ? "bg-[#17171B] border-[#FF5B28] ring-2 ring-[#FF5B28]/40 shadow-xl"
                  : "bg-[#17171B]/60 border-white/10 hover:border-white/20"
              }`}
            >
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-semibold text-[#FF5B28] uppercase tracking-wider">Testowy</span>
                  {selectedPlan === "Start" && <span className="text-emerald-400 font-bold text-sm">Wybrano ✓</span>}
                </div>
                <h4 className="text-xl font-bold text-white">Pakiet Start</h4>
                <p className="text-xs text-[#707070] mt-1">Sprawdź swój pomysł na sklep bez ryzyka.</p>
                <div className="mt-4 text-3xl font-extrabold text-white">
                  0 PLN <span className="text-xs font-normal text-[#707070]">/ 14 dni darmowo</span>
                </div>
                <ul className="mt-6 space-y-2 text-xs text-[#A1A1AA]">
                  <li className="flex items-center gap-2">✓ 1 Szablon standardowy</li>
                  <li className="flex items-center gap-2">✓ Do 5 produktów</li>
                  <li className="flex items-center gap-2">✓ Produkty cyfrowe i fizyczne</li>
                  <li className="flex items-center gap-2">✓ Prowizja 2,5%</li>
                </ul>
              </div>
              <button
                type="button"
                className={`mt-6 w-full py-3 rounded-xl text-sm font-semibold transition-all ${
                  selectedPlan === "Start"
                    ? "bg-[#FF5B28] text-white shadow-lg shadow-[#FF5B28]/30"
                    : "bg-white/5 border border-white/10 text-[#A1A1AA]"
                }`}
              >
                Wybierz Start (Darmowy)
              </button>
            </div>

            {/* Creator Plan */}
            <div
              onClick={() => setSelectedPlan("Creator")}
              className={`relative cursor-pointer rounded-2xl p-6 border transition-all flex flex-col justify-between ${
                selectedPlan === "Creator"
                  ? "bg-[#17171B] border-[#FF5B28] ring-2 ring-[#FF5B28]/40 shadow-xl"
                  : "bg-[#17171B]/60 border-white/10 hover:border-white/20"
              }`}
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FF5B28] text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Najpopularniejszy
              </div>
              <div>
                <div className="flex justify-between items-center mb-4 mt-2">
                  <span className="text-xs font-semibold text-[#FF5B28] uppercase tracking-wider">Bestseller</span>
                  {selectedPlan === "Creator" && <span className="text-emerald-400 font-bold text-sm">Wybrano ✓</span>}
                </div>
                <h4 className="text-xl font-bold text-white">Pakiet Creator</h4>
                <p className="text-xs text-[#707070] mt-1">Dla regularnie sprzedających twórców.</p>
                <div className="mt-4 text-3xl font-extrabold text-white">
                  {billingCycle === "miesiac" ? "49,99 PLN" : "24,99 PLN"}{" "}
                  <span className="text-xs font-normal text-[#707070]">/miesiąc</span>
                </div>
                <ul className="mt-6 space-y-2 text-xs text-[#A1A1AA]">
                  <li className="flex items-center gap-2 font-medium text-white">✓ Nielimitowane produkty</li>
                  <li className="flex items-center gap-2">✓ Wszystkie szablony graficzne</li>
                  <li className="flex items-center gap-2">✓ Własna domena .pl / .com</li>
                  <li className="flex items-center gap-2">✓ Dropy, odliczanie & kody rabatowe</li>
                  <li className="flex items-center gap-2 text-emerald-400">✓ Prowizja tylko 1,0%</li>
                </ul>
              </div>
              <button
                type="button"
                className={`mt-6 w-full py-3 rounded-xl text-sm font-semibold transition-all ${
                  selectedPlan === "Creator"
                    ? "bg-[#FF5B28] text-white shadow-lg shadow-[#FF5B28]/30"
                    : "bg-white/5 border border-white/10 text-[#A1A1AA]"
                }`}
              >
                Wybierz Creator
              </button>
            </div>

            {/* Brand Plan */}
            <div
              onClick={() => setSelectedPlan("Brand")}
              className={`cursor-pointer rounded-2xl p-6 border transition-all flex flex-col justify-between ${
                selectedPlan === "Brand"
                  ? "bg-[#17171B] border-[#FF5B28] ring-2 ring-[#FF5B28]/40 shadow-xl"
                  : "bg-[#17171B]/60 border-white/10 hover:border-white/20"
              }`}
            >
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Pro Brand</span>
                  {selectedPlan === "Brand" && <span className="text-emerald-400 font-bold text-sm">Wybrano ✓</span>}
                </div>
                <h4 className="text-xl font-bold text-white">Pakiet Brand</h4>
                <p className="text-xs text-[#707070] mt-1">Dla rozwijających się marek i zespołów.</p>
                <div className="mt-4 text-3xl font-extrabold text-white">
                  {billingCycle === "miesiac" ? "99,99 PLN" : "49,99 PLN"}{" "}
                  <span className="text-xs font-normal text-[#707070]">/miesiąc</span>
                </div>
                <ul className="mt-6 space-y-2 text-xs text-[#A1A1AA]">
                  <li className="flex items-center gap-2 font-medium text-white">✓ Wszystko z Creator</li>
                  <li className="flex items-center gap-2">✓ 3 konta dla zespołu</li>
                  <li className="flex items-center gap-2">✓ Automatyczne maile & marketing</li>
                  <li className="flex items-center gap-2 text-emerald-400 font-bold">✓ Prowizja tylko 0,5%</li>
                  <li className="flex items-center gap-2">✓ Priorytetowy VIP Support</li>
                </ul>
              </div>
              <button
                type="button"
                className={`mt-6 w-full py-3 rounded-xl text-sm font-semibold transition-all ${
                  selectedPlan === "Brand"
                    ? "bg-[#FF5B28] text-white shadow-lg shadow-[#FF5B28]/30"
                    : "bg-white/5 border border-white/10 text-[#A1A1AA]"
                }`}
              >
                Wybierz Brand
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleNextStep1}
            className="px-8 py-4 bg-[#FF5B28] hover:bg-[#e04f20] text-white font-bold rounded-xl text-base shadow-xl shadow-[#FF5B28]/30 transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>Dalej: Nazwa, Logo i Domena</span>
            <span>→</span>
          </button>
        </div>
      )}

      {/* STEP 2: STORE IDENTITY, DOMAINS, NICHE & LOGO DRAG & DROP */}
      {step === 2 && (
        <div className="w-full max-w-2xl bg-[#17171B] border border-white/10 rounded-[24px] p-8 shadow-2xl animate-in fade-in duration-300">
          <h3 className="text-2xl font-bold text-white text-center">Tożsamość Sklepu, Logo & Domena</h3>
          <p className="text-sm text-[#707070] text-center mt-1">
            Skonfiguruj nazwę, dodaj swoje logo oraz ustaw adresy domenowe.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleNextStep2();
            }}
            className="mt-8 space-y-6"
          >
            {/* Store Name */}
            <div>
              <label className="block text-sm font-medium text-[#A1A1AA] mb-2">
                Nazwa Sklepu / Marki *
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => {
                  const val = e.target.value;
                  setStoreName(val);
                  const autoSlug = val.toLowerCase().replace(/[^a-z0-9]/g, "");
                  if (autoSlug) {
                    setSubdomain(autoSlug);
                  }
                }}
                placeholder="np. CyberWear Studio"
                className="w-full h-12 px-4 bg-[#0E0E11] border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#FF5B28] transition-all text-sm font-medium"
              />
            </div>

            {/* Subdomain & Custom Domain */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-[#A1A1AA]">
                    Darmowa Subdomena Iskral *
                  </label>
                  {subdomain && (
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Dostępna
                    </span>
                  )}
                </div>
                <div className="flex items-center bg-[#0E0E11] border border-white/10 rounded-xl overflow-hidden focus-within:border-[#FF5B28]">
                  <input
                    type="text"
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""))}
                    placeholder="mojsklep"
                    className="flex-1 h-11 px-3 bg-transparent text-white text-xs font-mono font-bold focus:outline-none"
                  />
                  <span className="px-2.5 text-[11px] font-semibold text-[#FF5B28] bg-white/5 border-l border-white/10 h-11 flex items-center">
                    .iskral.pl
                  </span>
                </div>
                <p className="text-[10px] text-cyan-400 font-mono mt-1.5">
                  🔗 Twój adres sklepu: https://{subdomain || "twojanazwa"}.iskral.pl
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A1A1AA] mb-2">
                  Własna Domena Autorska (Opcjonalnie)
                </label>
                <input
                  type="text"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value.toLowerCase())}
                  placeholder="np. mojastrona.pl"
                  className="w-full h-11 px-4 bg-[#0E0E11] border border-white/10 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-[#FF5B28]"
                />
              </div>
            </div>

            {/* Main Niche Input + Preset Chips */}
            <div>
              <label className="block text-sm font-medium text-[#A1A1AA] mb-2">
                Główna Branża Sklepu
              </label>
              <input
                type="text"
                value={customNiche || niche}
                onChange={(e) => setCustomNiche(e.target.value)}
                placeholder="Wpisz dowolną branżę (np. Akcesoria do gier, Kosmetyki bio...)"
                className="w-full h-11 px-4 bg-[#0E0E11] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF5B28] mb-3"
              />
              <div className="flex flex-wrap gap-2">
                {PRESET_NICHES.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => {
                      setNiche(n);
                      setCustomNiche(n);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      (customNiche || niche) === n
                        ? "bg-[#FF5B28]/20 border-[#FF5B28] text-white"
                        : "bg-[#0E0E11] border-white/10 text-[#707070] hover:text-white"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* LOGO DRAG & DROP FILE UPLOAD ZONE */}
            <div>
              <label className="block text-sm font-medium text-[#A1A1AA] mb-2">
                Logo Sklepu (Wgraj plik lub przeciągnij)
              </label>

              {logoUrl ? (
                <div className="p-4 bg-[#0E0E11] border border-emerald-500/40 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-lg bg-white/5 border border-white/10 p-2 flex items-center justify-center overflow-hidden">
                      <img src={logoUrl} alt="Logo Preview" className="max-h-full max-w-full object-contain" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">{logoFileName || "logo_sklepu.png"}</span>
                      <span className="text-[10px] text-emerald-400 font-semibold">✓ Logo zapisane dla Twojego sklepu</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setLogoUrl("");
                      setLogoFileName("");
                    }}
                    className="px-3 py-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg text-xs font-bold transition-all"
                  >
                    Usuń / Zmień Logo
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setLogoDragActive(true);
                  }}
                  onDragLeave={() => setLogoDragActive(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setLogoDragActive(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleLogoFile(e.dataTransfer.files[0]);
                    }
                  }}
                  className={`relative p-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                    logoDragActive
                      ? "border-[#FF5B28] bg-[#FF5B28]/10"
                      : "border-white/15 bg-[#0E0E11] hover:border-white/30"
                  }`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleLogoFile(e.target.files[0]);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-2xl mb-2">
                    🖼️
                  </div>
                  <span className="text-xs font-bold text-white">Przeciągnij plik logo lub kliknij, aby wybrać</span>
                  <span className="text-[11px] text-[#707070] mt-1">Obsługiwane formaty: PNG, JPG, SVG, WebP</span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-[#A1A1AA] font-medium rounded-xl text-sm transition-all"
              >
                ← Wróć do wyboru planu
              </button>

              <button
                type="submit"
                className="px-8 py-3.5 bg-[#FF5B28] hover:bg-[#e04f20] text-white font-bold rounded-xl text-sm shadow-lg shadow-[#FF5B28]/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Dalej: Wybierz szablon</span>
                <span>→</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 3: TEMPLATE & BRANDING */}
      {step === 3 && (
        <div className="w-full flex flex-col items-center animate-in fade-in duration-300">
          <div className="text-center mb-8">
            <h3 className="text-2xl sm:text-3xl font-bold text-white">Wybierz Szablon Graficzny Sklepu</h3>
            <p className="text-[#A1A1AA] text-sm mt-2">
              Każdy szablon dostosowany jest pod szybkie ładowanie i najwyższą konwersję sprzedaży.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-8">
            {TEMPLATES.map((tmpl) => (
              <div
                key={tmpl.id}
                onClick={() => {
                  setSelectedTemplate(tmpl.id);
                  setAccentColor(tmpl.accent);
                }}
                className={`cursor-pointer rounded-2xl p-6 border transition-all flex flex-col justify-between ${
                  selectedTemplate === tmpl.id
                    ? "bg-[#17171B] border-[#FF5B28] ring-2 ring-[#FF5B28]/40 shadow-xl"
                    : "bg-[#17171B]/60 border-white/10 hover:border-white/20"
                }`}
              >
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-2xl">{tmpl.previewIcon}</span>
                    <span className="bg-white/10 border border-white/10 text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                      {tmpl.badge}
                    </span>
                  </div>
                  <h4 className="text-xl font-bold text-white">{tmpl.name}</h4>
                  <p className="text-xs text-[#707070] mt-2 leading-relaxed">{tmpl.description}</p>
                </div>

                <div className="mt-6 p-4 rounded-xl bg-gradient-to-br border border-white/10 flex items-center justify-between">
                  <span className="text-xs text-[#A1A1AA]">Kolor akcentu:</span>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full border border-white/20"
                      style={{ backgroundColor: tmpl.accent }}
                    />
                    <span className="text-xs font-mono text-white">{tmpl.accent}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Accent Color Customizer */}
          <div className="w-full max-w-xl bg-[#17171B] border border-white/10 rounded-2xl p-6 mb-8 text-center">
            <label className="block text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider mb-3">
              Dostosuj Główny Kolor Neonu / Przycisków
            </label>
            <div className="flex justify-center items-center gap-3">
              {ACCENT_COLORS.map((col) => (
                <button
                  key={col.code}
                  type="button"
                  onClick={() => setAccentColor(col.code)}
                  className={`w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center ${
                    accentColor === col.code ? "border-white scale-110 shadow-lg" : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: col.code }}
                  title={col.name}
                >
                  {accentColor === col.code && <span className="text-white font-bold text-xs">✓</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center w-full max-w-xl">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-[#A1A1AA] font-medium rounded-xl text-sm transition-all"
            >
              ← Wróć do nazwy sklepu
            </button>

            <button
              type="button"
              onClick={handleNextStep3}
              className="px-8 py-3.5 bg-[#FF5B28] hover:bg-[#e04f20] text-white font-bold rounded-xl text-sm shadow-lg shadow-[#FF5B28]/30 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Dalej: Dodaj pierwszy produkt & pliki</span>
              <span>→</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: FIRST PRODUCT WITH PHOTO UPLOAD & DIGITAL FILE UPLOAD DRAG & DROP */}
      {step === 4 && (
        <div className="w-full max-w-2xl bg-[#17171B] border border-white/10 rounded-[24px] p-8 shadow-2xl animate-in fade-in duration-300">
          <h3 className="text-2xl font-bold text-white text-center">Dodaj Pierwszy Produkt & Plik Cyfrowy</h3>
          <p className="text-sm text-[#707070] text-center mt-1">
            Ustaw pełne dane produktu, dodaj zdjęcia oraz wgraj plik dla produktów cyfrowych.
          </p>

          <div className="mt-6 p-4 bg-[#0E0E11] border border-white/10 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold text-white">Stwórz produkt przykładowy na start</span>
              <p className="text-xs text-[#707070]">Pozwoli to od razu przetestować wygląd sklepu oraz automatyczne pobieranie plików.</p>
            </div>
            <input
              type="checkbox"
              checked={addSampleProduct}
              onChange={(e) => setAddSampleProduct(e.target.checked)}
              className="w-5 h-5 accent-[#FF5B28] rounded cursor-pointer"
            />
          </div>

          {addSampleProduct && (
            <div className="mt-6 space-y-5 p-6 bg-[#0E0E11]/90 border border-white/10 rounded-2xl">
              {/* Product Title */}
              <div>
                <label className="block text-xs font-semibold text-[#A1A1AA] mb-1.5">Nazwa Produktu *</label>
                <input
                  type="text"
                  value={prodTitle}
                  onChange={(e) => setProdTitle(e.target.value)}
                  placeholder="np. Kurs E-commerce 2026 / T-Shirt Streetwear"
                  className="w-full h-11 px-4 bg-[#17171B] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF5B28]"
                />
              </div>

              {/* Product Description */}
              <div>
                <label className="block text-xs font-semibold text-[#A1A1AA] mb-1.5">Opis Produktu</label>
                <textarea
                  value={prodDescription}
                  onChange={(e) => setProdDescription(e.target.value)}
                  rows={2}
                  placeholder="Szczegółowy opis przedmiotu..."
                  className="w-full p-3 bg-[#17171B] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-[#FF5B28]"
                />
              </div>

              {/* Prices & Product Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#A1A1AA] mb-1.5">Cena (PLN) *</label>
                  <input
                    type="text"
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    placeholder="149.00"
                    className="w-full h-11 px-3 bg-[#17171B] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF5B28]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#A1A1AA] mb-1.5">Cena Przed Promocją</label>
                  <input
                    type="text"
                    value={prodComparePrice}
                    onChange={(e) => setProdComparePrice(e.target.value)}
                    placeholder="199.00"
                    className="w-full h-11 px-3 bg-[#17171B] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF5B28]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#A1A1AA] mb-1.5">Typ Produktu *</label>
                  <select
                    value={prodType}
                    onChange={(e) => setProdType(e.target.value as "Fizyczny" | "Cyfrowy")}
                    className="w-full h-11 px-3 bg-[#17171B] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF5B28]"
                  >
                    <option value="Fizyczny">📦 Fizyczny (Wysyłka)</option>
                    <option value="Cyfrowy">⚡ Cyfrowy (E-book / Plik / Kurs)</option>
                  </select>
                </div>
              </div>

              {/* PRODUCT PHOTO DRAG & DROP ZONE */}
              <div>
                <label className="block text-xs font-semibold text-[#A1A1AA] mb-1.5">
                  Zdjęcie Produktu (Przeciągnij plik)
                </label>

                {prodImageUrl ? (
                  <div className="p-3 bg-[#17171B] border border-emerald-500/40 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={prodImageUrl} alt="Product" className="w-12 h-12 object-cover rounded-lg border border-white/10" />
                      <div>
                        <span className="text-xs font-bold text-white block">{prodImageFileName || "zdjecie_produktu.png"}</span>
                        <span className="text-[10px] text-emerald-400 font-semibold">✓ Zdjęcie wczytane</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setProdImageUrl("");
                        setProdImageFileName("");
                      }}
                      className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs font-bold"
                    >
                      Usuń
                    </button>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setProdImageDragActive(true);
                    }}
                    onDragLeave={() => setProdImageDragActive(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setProdImageDragActive(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleProductImageFile(e.dataTransfer.files[0]);
                      }
                    }}
                    className={`relative p-5 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                      prodImageDragActive
                        ? "border-[#FF5B28] bg-[#FF5B28]/10"
                        : "border-white/15 bg-[#17171B] hover:border-white/30"
                    }`}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleProductImageFile(e.target.files[0]);
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-white">📸 Upuść zdjęcie produktu lub kliknij</span>
                    <span className="text-[10px] text-[#707070] mt-0.5">PNG, JPG, WebP</span>
                  </div>
                )}
              </div>

              {/* DIGITAL FILE DRAG & DROP ZONE (Shown when Product Type is Cyfrowy) */}
              {prodType === "Cyfrowy" && (
                <div className="p-4 bg-purple-950/30 border border-purple-500/40 rounded-xl space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                      <span>⚡ PLIK CYFROWY DLA KUPUJĄCEGO</span>
                    </span>
                    <span className="text-[10px] bg-purple-500/20 text-purple-200 px-2 py-0.5 rounded font-bold">
                      Automatyczne Pobieranie Po Zakupie
                    </span>
                  </div>

                  {digitalFileUrl ? (
                    <div className="p-3 bg-[#17171B] border border-emerald-500/40 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold text-xs">
                          📄
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white block">{digitalFileName}</span>
                          <span className="text-[10px] text-emerald-400 font-semibold">
                            ✓ Rozmiar: {digitalFileSize} | Gotowy do automatycznej wysyłki
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setDigitalFileUrl("");
                          setDigitalFileName("");
                          setDigitalFileSize("");
                        }}
                        className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs font-bold"
                      >
                        Zmień Plik
                      </button>
                    </div>
                  ) : (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDigitalDragActive(true);
                      }}
                      onDragLeave={() => setDigitalDragActive(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDigitalDragActive(false);
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          handleDigitalFile(e.dataTransfer.files[0]);
                        }
                      }}
                      className={`relative p-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                        digitalDragActive
                          ? "border-purple-400 bg-purple-500/20"
                          : "border-purple-500/30 bg-[#17171B] hover:border-purple-400"
                      }`}
                    >
                      <input
                        type="file"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleDigitalFile(e.target.files[0]);
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center text-xl mb-1">
                        📁
                      </div>
                      <span className="text-xs font-bold text-white">Przeciągnij plik cyfrowy dla klienta (PDF, ZIP, MP3, MP4 itp.)</span>
                      <span className="text-[10px] text-purple-300 mt-1">System automatycznie zapisze plik i wyśle pobieranie klientowi po opłaceniu Stripe.</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Store Summary Card */}
          <div className="mt-6 p-4 bg-[#FF5B28]/10 border border-[#FF5B28]/30 rounded-xl space-y-1 text-xs">
            <span className="font-bold text-[#FF5B28] block text-sm mb-2">📋 Podsumowanie nowego sklepu:</span>
            <p className="text-white">• Nazwa Sklepu: <strong className="text-emerald-400">{storeName}</strong></p>
            <p className="text-white">• Logo: <strong className="text-emerald-400">{logoUrl ? "Wgrane ze zbioru plików ✓" : "Brak (Domyślny inicjał)"}</strong></p>
            <p className="text-white">• Domena: <strong className="text-emerald-400">https://{subdomain}.iskral.pl</strong></p>
            <p className="text-white">• Wybrany Pakiet: <strong className="text-emerald-400">{selectedPlan} ({billingCycle})</strong></p>
            <p className="text-white">• Szablon: <strong className="text-emerald-400">{selectedTemplate}</strong></p>
          </div>

          <div className="flex justify-between items-center pt-6 mt-6 border-t border-white/10">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-[#A1A1AA] font-medium rounded-xl text-sm transition-all"
            >
              ← Wróć do szablonu
            </button>

            <button
              type="button"
              onClick={handleFinalize}
              disabled={isSubmitting}
              className="px-8 py-4 bg-[#FF5B28] hover:bg-[#e04f20] text-white font-bold rounded-xl text-base shadow-xl shadow-[#FF5B28]/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Przygotowywanie sklepu...</span>
              ) : selectedPlan === "Start" ? (
                <>
                  <span>🚀 Uruchom 14-Dniowy Darmowy Sklep (Bez Karty)</span>
                  <span>→</span>
                </>
              ) : (
                <>
                  <span>💳 Przejdź do Płatności Stripe ({selectedPlan})</span>
                  <span>→</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
