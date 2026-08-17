"use client";

import { useState } from "react";
import Badge from "./badge";
import { useAuth, PlanType } from "../context/AuthContext";
import { useRouter } from "next/navigation";

// Checkmark SVG Icon (#FFFFFF)
const CheckIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="flex-shrink-0 text-white"
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

interface Plan {
  id: PlanType;
  name: string;
  description: string;
  buttonText: string;
  priceMonthly: string;
  priceYearly: string;
  priceSubtitle: string;
  isPopular?: boolean;
  features: string[];
}

const plans: Plan[] = [
  {
    id: "Start",
    name: "Pakiet Start",
    description:
      "Dla osoby, która chce stworzyć pierwszy sklep i sprawdzić swój pomysł.",
    buttonText: "Kup Pakiet Start",
    priceMonthly: "0.00 PLN",
    priceYearly: "0.00 PLN",
    priceSubtitle: "Za darmo na 14 dni",
    isPopular: false,
    features: [
      "1 gotowy szablon",
      "do 5 produktów",
      "produkty fizyczne i cyfrowe",
      "2,5% prowizji od sprzedaży",
      "podstawowe statystyki",
    ],
  },
  {
    id: "Creator",
    name: "Pakiet Creator",
    description:
      "Dla twórców i marek, które zaczynają regularnie sprzedawać.",
    buttonText: "Kup Pakiet Creator",
    priceMonthly: "49,99 PLN",
    priceYearly: "24,99 PLN",
    priceSubtitle: "/miesięcznie",
    isPopular: true,
    features: [
      "wszystko ze Start",
      "nielimitowane produkty",
      "wszystkie szablony",
      "własna domena",
      "dropy i countdown",
      "kody rabatowe",
      "1,0% prowizji od sprzedaży",
    ],
  },
  {
    id: "Brand",
    name: "Pakiet Brand",
    description: "Dla marek, które chcą mocniej rozwijać sprzedaż.",
    buttonText: "Kup Pakiet Brand",
    priceMonthly: "99,99 PLN",
    priceYearly: "49,99 PLN",
    priceSubtitle: "/miesięcznie",
    isPopular: false,
    features: [
      "wszystko z Creator",
      "3 konta zespołowe",
      "automatyczne kampanie e-mail",
      "0,5% prowizji od sprzedaży",
      "priorytetowe wsparcie",
      "zaawansowane statystyki sprzedaży",
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
        ? (billingCycle === "rok" ? 29900 : 4990)
        : (billingCycle === "rok" ? 59900 : 9990);

      const checkoutUrl = await createStripeCheckout({
        planType: planId,
        title: `Subskrypcja Motywo SaaS - Pakiet ${planId} (${billingCycle})`,
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
      {/* Badge Component */}
      <Badge tag="Cennik" text="Wybierz swój pakiet" />

      {/* Main Title */}
      <h2 className="mt-[12px] text-[48px] font-semibold text-white tracking-tight leading-[1.15] text-center">
        Zacznij bez ryzyka. Rozwijaj
        <br />
        sklep, kiedy chcesz.
      </h2>

      {/* Subtitle / Description */}
      <p className="mt-[24px] text-[16px] font-medium text-[#707070] text-center leading-relaxed">
        Stwórz sklep za darmo, a na wyższy plan przejdź
        <br />
        wtedy, gdy zaczniesz sprzedawać więcej.
      </p>

      {/* Billing Cycle Switcher */}
      <div className="mt-[32px] inline-flex items-center p-[8px] bg-[#0E0E11]/75 backdrop-blur-md border border-white/[0.08] rounded-[12px]">
        <button
          onClick={() => setBillingCycle("miesiac")}
          className={`px-[16px] py-[8px] rounded-[6px] text-[16px] transition-all duration-200 cursor-pointer ${
            billingCycle === "miesiac"
              ? "bg-white/[0.05] border border-white/[0.10] text-white font-medium"
              : "bg-transparent border border-transparent text-[#707070] hover:text-white"
          }`}
        >
          Miesiąc
        </button>

        <button
          onClick={() => setBillingCycle("rok")}
          className={`px-[16px] py-[8px] rounded-[6px] text-[16px] inline-flex items-center gap-[4px] transition-all duration-200 cursor-pointer ${
            billingCycle === "rok"
              ? "bg-white/[0.05] border border-white/[0.10] text-white font-medium"
              : "bg-transparent border border-transparent text-[#707070] hover:text-white"
          }`}
        >
          <span>Rok</span>
          <span className="bg-[#FF5A28] text-white text-[10px] font-bold px-[6px] py-[2px] rounded-[4px] leading-none inline-flex items-center justify-center">
            -50%
          </span>
        </button>
      </div>

      {/* Plans Grid */}
      <div className="mt-[64px] grid grid-cols-1 lg:grid-cols-3 gap-[24px] w-full text-left items-end">
        {plans.map((plan) => {
          const isCreator = plan.isPopular;

          const cardInnerContent = (
            <div className="flex flex-col">
              <div className="bg-[#17171B] border border-white/[0.05] rounded-[20px] p-[32px] flex flex-col">
                <div>
                  <h3 className="text-[24px] font-semibold text-white tracking-tight">
                    {plan.name}
                  </h3>
                  <p className="mt-[8px] text-[16px] text-[#707070] leading-snug">
                    {plan.description}
                  </p>
                </div>

                <div className="mt-[32px] flex items-center justify-between gap-[16px]">
                  <button
                    onClick={() => handlePlanClick(plan.id)}
                    className={`px-[24px] py-[12px] text-[16px] rounded-[10px] transition-all duration-200 whitespace-nowrap cursor-pointer ${
                      isCreator
                        ? "bg-[#FF5A28] text-white font-medium hover:bg-[#ff6c3e]"
                        : "bg-[#0E0E11] text-[#A1A1AA] border border-white/[0.08] hover:text-white hover:border-white/[0.15]"
                    }`}
                  >
                    {plan.buttonText}
                  </button>

                  <div className="text-right flex flex-col items-end justify-center">
                    <span className="text-[20px] font-semibold text-white leading-none">
                      {billingCycle === "miesiac"
                        ? plan.priceMonthly
                        : plan.priceYearly}
                    </span>
                    <span className="mt-[2px] text-[14px] text-[#707070] leading-none">
                      {plan.priceSubtitle}
                    </span>
                  </div>
                </div>
              </div>

              <div className="py-[32px] px-[32px] flex flex-col gap-[14px]">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-[12px]">
                    <CheckIcon />
                    <span className="text-[16px] text-[#707070]">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );

          if (isCreator) {
            return (
              <div
                key={plan.id}
                className="bg-[#FF5A28] rounded-[24px] p-[4px] pt-0 flex flex-col"
              >
                <div className="py-[24px] text-center text-[16px] font-medium text-white">
                  Najbardziej wybierany
                </div>
                <div className="bg-[#0E0E11] border border-white/[0.08] rounded-[20px] p-[4px]">
                  {cardInnerContent}
                </div>
              </div>
            );
          }

          return (
            <div
              key={plan.id}
              className="bg-[#0E0E11] border border-white/[0.08] rounded-[24px] p-[4px] flex flex-col"
            >
              {cardInnerContent}
            </div>
          );
        })}
      </div>
    </section>
  );
}
