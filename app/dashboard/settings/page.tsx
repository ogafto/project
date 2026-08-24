"use client";

export const dynamic = "force-dynamic";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import AeuxDashboard from "../../components/AeuxDashboard";
import { X } from "lucide-react";

export default function DashboardSettingsPage() {
  const {
    user,
    allUsers,
    activeStore,
    userStores,
    setActiveStoreId,
    logout,
    buyPlan,
    updateUserProfile,
    toggle2FA,
    updateStoreConfig,
    addProduct,
    updateProduct,
    deleteProduct,
    toggleProductStatus,
    requestPayoutWithIBAN,
    createOrUpdateStoreFull,
    createStripeCheckout,
    message,
    setMessage,
  } = useAuth();
  const router = useRouter();

  // Auto-dismiss Toast notification after 4 seconds
  React.useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [message, setMessage]);

  return (
    <div className="min-h-screen w-full bg-[#0A0B0D]">
      <AeuxDashboard
        initialTab="profil"
        user={user}
        allUsers={allUsers}
        activeStore={activeStore}
        userStores={userStores}
        setActiveStoreId={setActiveStoreId}
        logout={() => {
          logout();
          router.push("/logowanie");
        }}
        buyPlan={buyPlan}
        updateUserProfile={updateUserProfile}
        toggle2FA={toggle2FA}
        updateStoreConfig={updateStoreConfig}
        addProduct={addProduct}
        updateProduct={updateProduct}
        deleteProduct={deleteProduct}
        toggleProductStatus={toggleProductStatus}
        requestPayoutWithIBAN={requestPayoutWithIBAN}
        createOrUpdateStoreFull={createOrUpdateStoreFull}
        createStripeCheckout={createStripeCheckout}
        message={message}
        setMessage={setMessage}
      />

      {/* MINIMALISTYCZNE POWIADOMIENIE TOAST */}
      {message && (
        <div className="fixed top-6 right-6 z-50 transition-all ease-out duration-500 animate-in slide-in-from-right-8 fade-in">
          <div
            className={`px-4 py-3.5 rounded-2xl text-[14px] font-medium font-['Bricolage_Grotesque',sans-serif] flex items-center gap-3 border backdrop-blur-xl bg-[#0E1015]/95 ${
              message.type === "success"
                ? "text-white border-[#D0FF00]/30"
                : message.type === "warning"
                ? "text-white border-amber-500/30"
                : "text-white border-rose-500/30"
            }`}
          >
            <div
              className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs ${
                message.type === "success"
                  ? "bg-[#D0FF00]/15 text-[#D0FF00] border border-[#D0FF00]/30"
                  : message.type === "warning"
                  ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                  : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
              }`}
            >
              {message.type === "success" ? "✓" : "!"}
            </div>
            <span className="max-w-sm text-zinc-200 leading-snug">{message.text}</span>
            <button
              onClick={() => setMessage(null)}
              className="p-1 text-zinc-500 hover:text-white rounded-lg cursor-pointer ml-2 transition-colors hover:bg-white/5"
              aria-label="Zamknij powiadomienie"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
