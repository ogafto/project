"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import AeuxDashboard from "../components/AeuxDashboard";
import { X } from "lucide-react";

export default function DashboardPage() {
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
    message,
    setMessage,
  } = useAuth();
  const router = useRouter();

  return (
    <div className="min-h-screen w-full bg-[#090E0A]">
      {/* GLÓWNY DASHBOARD PLATFORMY TWORZENIA SKLEPÓW (POLSKI INTERFEJS & DESIGN AEUX) */}
      <AeuxDashboard
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
        message={message}
        setMessage={setMessage}
      />

      {/* POWIADOMIENIE TOAST */}
      {message && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-right-8 fade-in duration-200">
          <div
            className={`p-4 pr-5 rounded-2xl text-xs font-bold flex items-center gap-3 border shadow-2xl ${
              message.type === "success"
                ? "bg-[#0C130E] text-emerald-300 border-emerald-500/40"
                : "bg-[#0C130E] text-red-300 border-red-500/40"
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                message.type === "success"
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-red-500/20 text-red-400"
              }`}
            >
              {message.type === "success" ? "✓" : "!"}
            </div>
            <span className="max-w-xs">{message.text}</span>
            <button
              onClick={() => setMessage(null)}
              className="p-1 text-zinc-500 hover:text-white rounded-lg cursor-pointer ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
