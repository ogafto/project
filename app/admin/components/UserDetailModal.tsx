"use client";

import React from "react";
import { 
  X, 
  Crown, 
  Store, 
  ShieldCheck, 
  ExternalLink, 
  LayoutDashboard,
  Mail,
  User,
  AlertTriangle,
  CreditCard,
  Ban,
  TrendingUp,
  ShoppingBag,
  CheckCircle2,
  Lock,
  Unlock,
  Trash2
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getStoreUrl } from "@/lib/cookies";
import { useRouter } from "next/navigation";

interface UserDetailModalProps {
  userId: string | null;
  onClose: () => void;
}

// Avatar Fallback Helper Function (Clean Initials Circle, No Broken <img>)
function renderUserInitials(name: string | null, email: string) {
  const displayName = name || email || "Użytkownik";
  const parts = displayName.trim().split(" ");
  let initials = "";
  if (parts.length >= 2) {
    initials = (parts[0][0] + parts[1][0]).toUpperCase();
  } else {
    initials = displayName.substring(0, 2).toUpperCase();
  }

  return (
    <div className="w-10 h-10 rounded-full bg-[#1A1C23] border border-[#FF5B28]/40 text-[#FF5B28] flex items-center justify-center font-extrabold text-sm shrink-0 shadow-sm">
      {initials}
    </div>
  );
}

export default function UserDetailModal({ userId, onClose }: UserDetailModalProps) {
  const router = useRouter();
  const {
    allUsers,
    subscriptionHistory,
    enterImpersonation,
    suspendUserStore,
    deleteUserAccount,
  } = useAuth();

  if (!userId) return null;

  const targetUser = allUsers.find((u) => u.id === userId);
  if (!targetUser) return null;

  const userStores = targetUser.stores || (targetUser.store ? [targetUser.store] : []);
  const isAdmin = targetUser.role === "superadmin" || targetUser.role === "admin";
  const firstStore = userStores[0];
  const isSuspended = firstStore?.status === "suspended" || firstStore?.planStatus === "suspended" || targetUser.accountStatus === "Suspended";

  const userSubs = subscriptionHistory.filter(
    (s) => s.userId === targetUser.id || s.userEmail.toLowerCase() === targetUser.email.toLowerCase()
  );

  const totalStoreSalesCents = userStores.reduce((sum, st) => {
    const ordersSum = (st.orders || []).filter((o) => o.status === "paid").reduce((s, o) => s + o.amountTotalCents, 0);
    return sum + (ordersSum || st.balanceCents || 0);
  }, 0);

  const totalStoreOrdersCount = userStores.reduce((sum, st) => sum + (st.orders?.length || 0), 0);

  const handleImpersonate = (storeId: string) => {
    enterImpersonation(storeId);
    onClose();
    router.push("/dashboard");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      {/* Slide-over Drawer Container (100% Dark Mode #111216) */}
      <div className="bg-[#111216] border-l border-white/10 w-full max-w-xl h-full shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-6 bg-[#18191E] border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {renderUserInitials(targetUser.name, targetUser.email)}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">{targetUser.name || "Użytkownik"}</h3>
                {isAdmin && (
                  <span className="px-2 py-0.5 bg-amber-400/20 text-amber-300 rounded text-[10px] font-extrabold flex items-center gap-1 border border-amber-400/30">
                    <Crown className="w-3 h-3 text-amber-300" />
                    SUPERADMIN
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">{targetUser.email}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-full transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-white">
          
          {/* Security Switch & Status Section */}
          <div className="p-5 bg-[#090A0C] border border-white/5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] text-zinc-400 uppercase font-bold tracking-wider block">
                  Status Sklepu Klienta
                </span>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-extrabold inline-flex items-center gap-1.5 border ${
                      isSuspended
                        ? "bg-red-500/15 text-red-400 border-red-500/30"
                        : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${isSuspended ? "bg-red-400" : "bg-emerald-400 animate-pulse"}`} />
                    {isSuspended ? "ZAWIESZONY" : "AKTYWNY"}
                  </span>
                </div>
              </div>

              {/* Suspension Switch */}
              <button
                onClick={() => suspendUserStore(targetUser.id)}
                className={`px-4 py-2.5 rounded-full text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer border ${
                  isSuspended
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30"
                    : "bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/25"
                }`}
              >
                {isSuspended ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                <span>{isSuspended ? "Odwieś sklep" : "Zawieś sklep"}</span>
              </button>
            </div>

            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Zawieszony sklep wyświetla komunikat: <em className="text-white font-semibold">"Sklep tymczasowo niedostępny"</em> oraz blokuje zakupy.
            </p>
          </div>

          {/* Sales Statistics Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-[#090A0C] border border-white/5 rounded-xl flex flex-col justify-between">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-[10px] uppercase font-bold tracking-wider">Obrót Sklepu</span>
                <TrendingUp className="w-4 h-4 text-[#FF5B28]" />
              </div>
              <div className="mt-3">
                <div className="text-xl font-extrabold text-white">
                  {(totalStoreSalesCents / 100).toFixed(2)} PLN
                </div>
                <span className="text-[10px] text-zinc-400">Łączna wartość sprzedaży</span>
              </div>
            </div>

            <div className="p-4 bg-[#090A0C] border border-white/5 rounded-xl flex flex-col justify-between">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-[10px] uppercase font-bold tracking-wider">Zamówienia</span>
                <ShoppingBag className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="mt-3">
                <div className="text-xl font-extrabold text-cyan-400">
                  {totalStoreOrdersCount} szt.
                </div>
                <span className="text-[10px] text-zinc-400">Zrealizowanych w sklepie</span>
              </div>
            </div>
          </div>

          {/* User's Stores List */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <Store className="w-4 h-4 text-[#FF5B28]" />
              <span>Przypisane Sklepy ({userStores.length})</span>
            </h4>

            {userStores.length === 0 ? (
              <div className="p-4 bg-[#090A0C] border border-white/5 rounded-xl text-xs text-zinc-400 text-center">
                Użytkownik nie posiada jeszcze utworzonego sklepu.
              </div>
            ) : (
              <div className="space-y-3">
                {userStores.map((st) => (
                  <div
                    key={st.id}
                    className="p-4 bg-[#090A0C] border border-white/5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{st.name}</span>
                        <span className="px-2 py-0.5 bg-[#FF5B28]/10 text-[#FF5B28] rounded-full text-[10px] font-bold uppercase">
                          {st.planType || targetUser.plan || "Starter"}
                        </span>
                      </div>
                      <a
                        href={getStoreUrl(st.subdomain, st.customDomain)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-cyan-400 hover:underline font-mono mt-0.5 inline-block"
                      >
                        {st.subdomain}.iskral.pl
                      </a>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={getStoreUrl(st.subdomain, st.customDomain)}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 rounded-full text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Podgląd</span>
                      </a>

                      <button
                        onClick={() => handleImpersonate(st.id)}
                        className="px-3.5 py-1.5 bg-[#FF5B28] hover:bg-[#e04f20] text-white font-bold rounded-full text-xs transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5" />
                        <span>Zarządzaj</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Subscription & Payment History */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span>Historia Subskrypcji & Płatności</span>
            </h4>

            {userSubs.length === 0 ? (
              <div className="p-4 bg-[#090A0C] border border-white/5 rounded-xl text-xs text-zinc-400 text-center">
                Brak wpłat za pakiety SaaS. Użytkownik korzysta z planu próbnego.
              </div>
            ) : (
              <div className="border border-white/5 rounded-xl bg-[#090A0C] overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#18191E] text-zinc-400 uppercase font-extrabold text-[10px]">
                    <tr>
                      <th className="p-3">Pakiet</th>
                      <th className="p-3">Kwota</th>
                      <th className="p-3">Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-white">
                    {userSubs.map((sub) => (
                      <tr key={sub.id} className="hover:bg-white/[0.02]">
                        <td className="p-3 font-bold">{sub.planName} ({sub.billingCycle})</td>
                        <td className="p-3 text-emerald-400 font-extrabold">{(sub.amountPaidCents / 100).toFixed(2)} PLN</td>
                        <td className="p-3 text-zinc-400">{new Date(sub.createdAt).toLocaleDateString("pl-PL")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Danger Zone */}
          <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>Strefa Zagrożenia</span>
            </h4>
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-zinc-400">
                Usuń konto klienta wraz z przypisanymi danymi.
              </span>
              <button
                onClick={() => {
                  if (confirm(`Czy na pewno chcesz usunąć konto ${targetUser.email}?`)) {
                    deleteUserAccount(targetUser.id);
                    onClose();
                  }
                }}
                className="px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-bold rounded-full text-xs transition-all shrink-0 cursor-pointer"
              >
                Usuń Konto
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#18191E] border-t border-white/5 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-bold rounded-full transition-all cursor-pointer"
          >
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
}
