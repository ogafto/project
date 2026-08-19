"use client";

import { useState } from "react";
import Badge from "./badge";
import { useAuth, PlanType } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { PLANS } from "@/lib/plans";

const CheckIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="flex-shrink-0 text-[#FF5B28]"
  >
    <path
      d="M13.3332 4L5.99984 11.3333L2.6665 8"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

interface PlanDisplay {
  id: PlanType;
  name: string;
  description: string;
  buttonText: string;
  priceMonthly: string;
  priceYearly: string;
  priceSubtitle: string;
  commissionBadge: string;
  isPopular?: boolean;
  features: string[];
}

const plans: PlanDisplay[] = [
  {
    id: "Start",
    name: "Pakiet Start",
    description: "Trial 14 dni za darmo. Bez ryzyka – wypróbuj sprzedaż i stwórz pierwszy sklep.",
    buttonText: "Zacznij 14 Dni za Darmo",
    priceMonthly: "0.00 PLN",
    priceYearly: "0.00 PLN",
    priceSubtitle: "przez pierwsze 14 dni",
    commissionBadge: "Prowizja 2.0%",
    isPopular: false,
    features: [
      "Prowizja: 2.0% od sprzedaży",
      "Subdomena nazwa.iskral.pl (chroniona 14d + 30d karencji)",
      "Podstawowe szablony e-commerce",
      "Nielimitowane produkty fizyczne i cyfrowe",
      "Podstawowe statystyki sprzedaży",
      "Prosty i szybki checkout Stripe",
    ],
  },
  {
    id: "Creator",
    name: "Pakiet Creator",
    description: "Dla twórców i marek uruchamiających dropy i budujących bazę fanów.",
    buttonText: "Wybierz Pakiet Creator",
    priceMonthly: "29,99 PLN",
    priceYearly: "14,99 PLN",
    priceSubtitle: "/miesięcznie",
    commissionBadge: "Prowizja 1.0%",
    isPopular: true,
    features: [
      "Prowizja: 1.0% od sprzedaży",
      "Szablony VIP + Podstawowe",
      "🚀 Moduł Dropu & Odliczanie Premier",
      "📧 Wbudowany E-mail Newsletter & Subskrybenci",
      "👥 Współpraca zespołowa (zapraszanie członków)",
      "Nielimitowane produkty & pliki cyfrowe",
    ],
  },
  {
    id: "Brand",
    name: "Pakiet Brand",
    description: "Dla rozwiniętych marek e-commerce wymagających własnej domeny i najniższej prowizji.",
    buttonText: "Wybierz Pakiet Brand",
    priceMonthly: "59,99 PLN",
    priceYearly: "29,99 PLN",
    priceSubtitle: "/miesięcznie",
    commissionBadge: "Prowizja 0.5%",
    isPopular: false,
    features: [
      "Prowizja: 0.5% od sprzedaży (Najniższa)",
      "🌐 Podpinanie własnej domeny zewnętrznej (twojadomena.pl)",
      "🎨 Pełny wizualny edytor sklepu & Wszystkie szablony",
      "Zaawansowane kampanie e-mail i automatyzacje",
      "Priorytetowy support & Zaawansowana analityka",
      "Bez limitu członków zespołu i sklepów",
    ],
  },
];

export default function Cennik() {
  const [billingCycle, setBillingCycle] = useState<"miesiac" | "rok">("miesiac");
  const { user, buyPlan, createStripeCheckout } = useAuth();
  const router = useRouter();

  const handlePlanClick = async (planId: PlanType) => {
    if (!user) {
      router.push("/rejestracja");
      return;
    }

    if (planId === "Start" || planId === "trial_14d") {
      await buyPlan(planId, billingCycle);
      router.push("/dashboard");
    } else {
      const priceCents = planId === "Creator"
        ? (billingCycle === "rok" ? 17988 : 2999)
        : (billingCycle === "rok" ? 35988 : 5999);

      const checkoutUrl = await createStripeCheckout({
        planType: planId,
        title: `Subskrypcja Iskral SaaS - Pakiet ${planId} (${billingCycle})`,
        priceCents,
      });

      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        await buyPlan(planId, billingCycle);
        router.push("/dashboard");
      }
    }
  };

  return (
    <section className="flex flex-col items-center text-center w-full max-w-[1240px] mx-auto px-4 py-12">
      <Badge tag="Cennik SaaS" text="Wybierz elastyczny plan dla Twojego sklepu" />

      <h2 className="mt-3 text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight text-center">
        Zacznij od 14 dni Trialu.
        <br />
        Skaluj sprzedaż bez limitów.
      </h2>

      <p className="mt-4 text-sm sm:text-base font-medium text-zinc-400 text-center leading-relaxed">
        Stwórz sklep w pakiecie Start za darmo. Przejdź na Creator lub Brand, gdy potrzebujesz własnej domeny, dropów i niższej prowizji.
      </p>

      {/* Billing Cycle Switcher */}
      <div className="mt-8 inline-flex items-center p-1.5 bg-[#0E0E11]/90 backdrop-blur-md border border-white/10 rounded-2xl">
        <button
          onClick={() => setBillingCycle("miesiac")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
            billingCycle === "miesiac"
              ? "bg-[#FF5B28] text-white shadow-lg shadow-[#FF5B28]/20"
              : "bg-transparent text-zinc-400 hover:text-white"
          }`}
        >
          Płatność Miesięczna
        </button>

        <button
          onClick={() => setBillingCycle("rok")}
          className={`px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
            billingCycle === "rok"
              ? "bg-[#FF5B28] text-white shadow-lg shadow-[#FF5B28]/20"
              : "bg-transparent text-zinc-400 hover:text-white"
          }`}
        >
          <span>Płatność Roczna</span>
          <span className="bg-emerald-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded uppercase">
            -50% Taniej
          </span>
        </button>
      </div>

      {/* Plans Grid */}
      <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-6 w-full text-left items-stretch">
        {plans.map((plan) => {
          const isPopular = plan.isPopular;

          return (
            <div
              key={plan.id}
              className={`rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all relative overflow-hidden ${
                isPopular
                  ? "bg-[#111216] border-2 border-[#FF5B28] shadow-2xl shadow-[#FF5B28]/10"
                  : "bg-[#111216]/80 border border-white/10 hover:border-white/20"
              }`}
            >
              {isPopular && (
                <div className="absolute top-4 right-4">
                  <span className="px-3 py-1 bg-[#FF5B28] text-white font-black text-[10px] uppercase rounded-full tracking-wider shadow-md">
                    NAJPOPULARNIEJSZY
                  </span>
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 bg-[#FF5B28]/10 text-[#FF5B28] border border-[#FF5B28]/20 rounded-full text-[10px] font-extrabold uppercase">
                    {plan.commissionBadge}
                  </span>
                </div>

                <h3 className="text-2xl font-black text-white tracking-tight">
                  {plan.name}
                </h3>
                <p className="mt-2 text-xs text-zinc-400 leading-relaxed min-h-[36px]">
                  {plan.description}
                </p>

                <div className="mt-6 pt-6 border-t border-white/5 flex items-baseline justify-between">
                  <div>
                    <span className="text-3xl font-black text-white font-mono leading-none">
                      {billingCycle === "miesiac"
                        ? plan.priceMonthly
                        : plan.priceYearly}
                    </span>
                    <span className="ml-1.5 text-xs text-zinc-400">
                      {plan.priceSubtitle}
                    </span>
                  </div>
                </div>

                <div className="mt-6 space-y-3 pt-6 border-t border-white/5">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-zinc-300">
                      <CheckIcon />
                      <span className="leading-snug">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/5">
                <button
                  onClick={() => handlePlanClick(plan.id)}
                  className={`w-full py-3.5 px-6 rounded-xl font-extrabold text-xs transition-all shadow-lg cursor-pointer ${
                    isPopular
                      ? "bg-gradient-to-r from-[#FF5B28] to-[#FF8C38] hover:from-[#e04f20] hover:to-[#e07520] text-white shadow-[#FF5B28]/20"
                      : "bg-white/10 hover:bg-white/20 text-white border border-white/10"
                  }`}
                >
                  {plan.buttonText}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
