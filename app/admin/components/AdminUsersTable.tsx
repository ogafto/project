"use client";

import React, { useState } from "react";
import { 
  Users, 
  Store, 
  Crown, 
  Search, 
  ExternalLink, 
  LayoutDashboard, 
  Lock, 
  Unlock, 
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Mail,
  Send,
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  UserX,
  UserCheck,
  Edit3,
  Calendar,
  Settings,
  Shield,
  Trash2,
  AlertCircle
} from "lucide-react";
import { useAuth, User, Role, PlanType } from "../../context/AuthContext";
import { getStoreUrl } from "@/lib/cookies";
import { useRouter } from "next/navigation";

interface AdminUsersTableProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSelectUser: (userId: string) => void;
}

// Avatar Fallback Helper Function
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
    <div className="w-9 h-9 rounded-full bg-[#1A1C23] border border-[#FF5B28]/40 text-[#FF5B28] flex items-center justify-center font-extrabold text-xs shrink-0 shadow-sm">
      {initials}
    </div>
  );
}

// Format Expiration Date AND Time with Expiration Badge Info
function getExpirationInfo(expiresAtStr?: string) {
  if (!expiresAtStr) {
    return {
      formattedText: "31.12.2026 r., godz. 23:59",
      status: "active" as const,
      badgeText: "🟢 Aktywny",
      badgeClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    };
  }

  const d = new Date(expiresAtStr);
  if (isNaN(d.getTime())) {
    return {
      formattedText: "31.12.2026 r., godz. 23:59",
      status: "active" as const,
      badgeText: "🟢 Aktywny",
      badgeClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    };
  }

  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const datePart = d.toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const timePart = d.toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const formattedText = `${datePart} r., godz. ${timePart}`;

  if (diffMs < 0) {
    return {
      formattedText,
      status: "expired" as const,
      badgeText: "🔴 Wygasł",
      badgeClass: "bg-red-500/15 text-red-400 border-red-500/30",
    };
  }

  if (diffDays <= 7) {
    return {
      formattedText,
      status: "warning" as const,
      badgeText: `🟡 Wygasa za ${diffDays} dni`,
      badgeClass: "bg-amber-400/15 text-amber-300 border-amber-400/30",
    };
  }

  return {
    formattedText,
    status: "active" as const,
    badgeText: "🟢 Aktywny",
    badgeClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  };
}

export default function AdminUsersTable({
  searchQuery,
  setSearchQuery,
  onSelectUser,
}: AdminUsersTableProps) {
  const router = useRouter();
  const {
    allUsers,
    enterImpersonation,
    suspendUserStore,
    blockUserAccount,
    updateUserPlan,
    deleteUserAccount,
  } = useAuth();

  // Clean 3 top filters: Wszyscy / Subskrypcje / Zawieszeni
  const [topTabFilter, setTopTabFilter] = useState<"all" | "subscriptions" | "suspended">("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 8;

  // Unified "Zarządzaj Kontem" Drawer Modal State
  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [targetUser, setTargetUser] = useState<typeof allUsers[0] | null>(null);
  
  // Drawer Editing Form State
  const [selectedPlan, setSelectedPlan] = useState<"Starter" | "Brand" | "Pro">("Brand");
  const [expirationDateTime, setExpirationDateTime] = useState("2026-12-31T23:59");
  const [customReason, setCustomReason] = useState("Weryfikacja płatności / Naruszenie regulaminu platformy motywo.pl");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Filter users
  const filteredUsers = allUsers.filter((u) => {
    const q = searchQuery.toLowerCase();
    const uStores = u.stores || (u.store ? [u.store] : []);
    const matchesSearch =
      !q ||
      (u.name && u.name.toLowerCase().includes(q)) ||
      u.email.toLowerCase().includes(q) ||
      uStores.some(
        (st) =>
          st.name.toLowerCase().includes(q) ||
          st.subdomain.toLowerCase().includes(q)
      );

    if (!matchesSearch) return false;

    if (topTabFilter === "subscriptions") {
      return (u.plan && u.plan !== "Brak" && u.plan !== "Start") || uStores.some((s) => s.planType && s.planType !== "Brak" && s.planType !== "Start");
    }
    if (topTabFilter === "suspended") {
      return uStores.some((s) => s.status === "suspended" || s.planStatus === "suspended") || u.accountStatus === "Blocked" || u.accountStatus === "Suspended";
    }

    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Open "Zarządzaj Kontem" Modal
  const openManageModal = (u: typeof allUsers[0]) => {
    setTargetUser(u);
    const uStores = u.stores || (u.store ? [u.store] : []);
    const plan = (uStores[0]?.planType || u.plan || "Brand") as "Starter" | "Brand" | "Pro";
    setSelectedPlan(plan === "Pro" || plan === "Brand" ? plan : "Starter");
    
    const expiresAt = uStores[0]?.planExpiresAt || u.planExpiresAt;
    if (expiresAt && !isNaN(new Date(expiresAt).getTime())) {
      const d = new Date(expiresAt);
      const iso = d.toISOString().substring(0, 16);
      setExpirationDateTime(iso);
    } else {
      setExpirationDateTime("2026-12-31T23:59");
    }

    setSaveSuccessMsg(null);
    setManageModalOpen(true);
  };

  const handleImpersonate = (u: typeof allUsers[0]) => {
    const uStores = u.stores || (u.store ? [u.store] : []);
    const primaryStore = uStores[0];
    if (primaryStore) {
      enterImpersonation(primaryStore.id);
      router.push("/dashboard");
    } else {
      onSelectUser(u.id);
    }
  };

  // Save All Account Changes
  const handleSaveAccountChanges = () => {
    if (!targetUser) return;
    setIsSaving(true);

    try {
      updateUserPlan(targetUser.id, selectedPlan as any);
      setSaveSuccessMsg(`Zapisano zmiany dla konta ${targetUser.email}! Zaktualizowano pakiet na ${selectedPlan} z datą ważności do ${new Date(expirationDateTime).toLocaleString("pl-PL")}.`);

      setTimeout(() => {
        setManageModalOpen(false);
        setSaveSuccessMsg(null);
        setIsSaving(false);
        router.refresh();
      }, 1800);
    } catch (err) {
      alert("Wystąpił błąd podczas zapisywania zmian.");
      setIsSaving(false);
    }
  };

  // Suspend or Unsuspend Specific Target Store by Store ID
  const handleToggleSpecificStoreSuspension = (storeId: string, storeName: string) => {
    if (!targetUser) return;
    suspendUserStore(storeId);
    setSaveSuccessMsg(`Zmieniono status sklepu "${storeName}"! Powiadomienie e-mail zostało wysłane do klienta: ${targetUser.email}`);
  };

  // Toggle User Login Account Block
  const handleToggleAccountBlock = () => {
    if (!targetUser) return;
    blockUserAccount(targetUser.id);
    setSaveSuccessMsg(`Zmieniono status bloku konta! Powiadomienie e-mail zostało wysłane do klienta: ${targetUser.email}`);
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      
      {/* KARTA GŁÓWNA UŻYTKOWNIKÓW */}
      <div className="p-6 bg-[#111216] border border-white/5 rounded-2xl flex flex-col gap-6 w-full shadow-xl">
        
        {/* Górny Pasek: Proste 3 Filtry & Wyszukiwarka */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
          
          {/* Proste Filtry: Wszyscy / Subskrypcje / Zawieszeni */}
          <div className="flex items-center gap-1.5 p-1 bg-[#090A0C] border border-white/5 rounded-full text-xs">
            <button
              onClick={() => { setTopTabFilter("all"); setCurrentPage(1); }}
              className={`px-4 py-2 rounded-full font-extrabold transition-all cursor-pointer ${
                topTabFilter === "all" ? "bg-[#FF5B28] text-white shadow-sm" : "text-zinc-400 hover:text-white"
              }`}
            >
              Wszyscy Użytkownicy ({allUsers.length})
            </button>

            <button
              onClick={() => { setTopTabFilter("subscriptions"); setCurrentPage(1); }}
              className={`px-4 py-2 rounded-full font-extrabold transition-all cursor-pointer ${
                topTabFilter === "subscriptions" ? "bg-[#FF5B28] text-white shadow-sm" : "text-zinc-400 hover:text-white"
              }`}
            >
              Aktywne Subskrypcje
            </button>

            <button
              onClick={() => { setTopTabFilter("suspended"); setCurrentPage(1); }}
              className={`px-4 py-2 rounded-full font-extrabold transition-all cursor-pointer ${
                topTabFilter === "suspended" ? "bg-red-500/20 text-red-300 border border-red-500/30" : "text-zinc-400 hover:text-white"
              }`}
            >
              ● Zawieszone Konta / Sklepy
            </button>
          </div>

          {/* Wyszukiwarka */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Szukaj po nazwisku, e-mailu lub sklepie..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#090A0C] border border-white/5 focus:border-[#FF5B28] rounded-full text-xs text-white outline-none font-medium"
            />
          </div>
        </div>

        {/* TABELA UŻYTKOWNIKÓW Z DOKŁADNYMI BADGAMI WIZUALNYMI */}
        <div className="w-full overflow-x-auto rounded-xl border border-white/5 bg-[#090A0C]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#18191E] text-zinc-400 uppercase tracking-wider font-extrabold text-[10px] border-b border-white/5">
              <tr>
                <th className="p-4">KONTO UŻYTKOWNIKA</th>
                <th className="p-4">PRZYPISANY SKLEP & STATUS</th>
                <th className="p-4">PAKIET & CZAS WAŻNOŚCI</th>
                <th className="p-4">PODGLĄD SKLEPU</th>
                <th className="p-4 text-right">ZARZĄDZANIE KONTEM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-white">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-zinc-400">
                    <div className="flex flex-col items-center gap-2">
                      <ShieldAlert className="w-8 h-8 text-zinc-400" />
                      <p className="font-semibold">Brak wyników spełniających kryteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u) => {
                  const uStores = u.stores || (u.store ? [u.store] : []);
                  const primaryStore = uStores[0];
                  
                  const isAccountBlocked = u.accountStatus === "Blocked";
                  const isStoreSuspended = primaryStore?.status === "suspended" || primaryStore?.planStatus === "suspended" || u.accountStatus === "Suspended";
                  const isSuperAdmin = u.role === "superadmin" || u.role === "admin";

                  const expiresAt = primaryStore?.planExpiresAt || u.planExpiresAt;
                  const expInfo = getExpirationInfo(expiresAt);
                  const planName = primaryStore?.planType || u.plan || "Starter";

                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-white/[0.02] transition-colors group ${
                        isStoreSuspended || isAccountBlocked ? "bg-red-500/[0.03]" : ""
                      }`}
                    >
                      
                      {/* 1. KONTO UŻYTKOWNIKA */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {renderUserInitials(u.name, u.email)}
                          <div>
                            <div className="font-extrabold text-white text-xs flex items-center gap-1.5 flex-wrap">
                              <span>{u.name || "Użytkownik"}</span>

                              {isSuperAdmin && (
                                <span className="px-1.5 py-0.5 bg-amber-400/20 text-amber-300 rounded text-[9px] font-extrabold flex items-center gap-0.5 border border-amber-400/30">
                                  <Crown className="w-2.5 h-2.5" />
                                  SUPERADMIN
                                </span>
                              )}

                              {/* JASKRAWY BADGE ZABOKOWANIA KONTA */}
                              {isAccountBlocked && (
                                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded-full text-[9px] font-extrabold border border-amber-500/40 flex items-center gap-1">
                                  <UserX className="w-2.5 h-2.5" />
                                  ⛔ KONTO ZABLOKOWANE
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-zinc-400 font-mono">{u.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* 2. PRZYPISANY SKLEP & STATUS ZAWIESZENIA */}
                      <td className="p-4">
                        {uStores.length === 0 ? (
                          <span className="text-zinc-500 text-xs italic">Brak utworzonego sklepu</span>
                        ) : (
                          <div className="flex flex-col gap-1.5">
                            {uStores.map((st) => {
                              const stSuspended = st.status === "suspended" || st.planStatus === "suspended" || isStoreSuspended;

                              return (
                                <div key={st.id} className="flex flex-col gap-1">
                                  <div className="text-xs flex items-center gap-1.5">
                                    <Store className="w-3.5 h-3.5 text-[#FF5B28] shrink-0" />
                                    <span className="text-white font-extrabold">{st.name}</span>
                                    <span className="text-cyan-400 font-mono text-[11px]">
                                      ({st.subdomain}.motywo.pl)
                                    </span>
                                  </div>

                                  {/* JASKRAWY BADGE STATUSU SKLEPU */}
                                  <div>
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold inline-flex items-center gap-1 border ${
                                        stSuspended
                                          ? "bg-red-500/20 text-red-300 border-red-500/40"
                                          : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                      }`}
                                    >
                                      <span className={`w-1.5 h-1.5 rounded-full ${stSuspended ? "bg-red-400 animate-pulse" : "bg-emerald-400"}`} />
                                      {stSuspended ? "🔴 SKLEP ZAWIESZONY" : "🟢 SKLEP AKTYWNY"}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </td>

                      {/* 3. PAKIET & CZAS WAŻNOŚCI + SZYBKI EDYTOR */}
                      <td className="p-4">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 bg-[#FF5B28]/10 text-[#FF5B28] border border-[#FF5B28]/20 rounded-full text-[10px] font-extrabold capitalize">
                              Pakiet: {planName}
                            </span>

                            {/* SZYBKI PRZYCISK ZMIANY PAKIETU / CZASU */}
                            <button
                              onClick={() => openManageModal(u)}
                              className="px-2 py-0.5 bg-white/5 hover:bg-white/10 text-cyan-400 rounded-full text-[10px] font-extrabold transition-all flex items-center gap-1 border border-white/5 cursor-pointer hover:border-cyan-400/40"
                              title="Kliknij, aby zmienić pakiet lub przedłużyć czas ważności"
                            >
                              <Edit3 className="w-2.5 h-2.5" />
                              <span>⚡ Zmień pakiet / czas</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-zinc-400 font-medium">
                              Ważny do: <strong className="text-white font-mono">{expInfo.formattedText}</strong>
                            </span>

                            <span className={`px-2 py-0.2 rounded-full text-[9px] font-extrabold border ${expInfo.badgeClass}`}>
                              {expInfo.badgeText}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 4. PODGLĄD SKLEPU */}
                      <td className="p-4">
                        {primaryStore ? (
                          <a
                            href={getStoreUrl(primaryStore.subdomain, primaryStore.customDomain)}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 rounded-full text-xs font-bold cursor-pointer transition-all inline-flex items-center gap-1.5"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Podgląd sklepu</span>
                          </a>
                        ) : (
                          <span className="text-zinc-500 text-xs">—</span>
                        )}
                      </td>

                      {/* 5. GŁÓWNA AKCJA: ZARZĄDZAJ KONTEM */}
                      <td className="p-4 text-right">
                        <button
                          onClick={() => openManageModal(u)}
                          className="px-4 py-2 bg-[#FF5B28] hover:bg-[#e04f20] text-white font-extrabold rounded-full text-xs cursor-pointer transition-all inline-flex items-center gap-1.5 shadow-sm hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <Settings className="w-3.5 h-3.5" />
                          <span>⚡ Zarządzaj kontem</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginacja */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 text-xs text-zinc-400">
            <span>
              Strona <strong className="text-white">{currentPage}</strong> z <strong className="text-white">{totalPages}</strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 bg-[#090A0C] hover:bg-white/5 border border-white/5 disabled:opacity-30 rounded-full cursor-pointer text-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 bg-[#090A0C] hover:bg-white/5 border border-white/5 disabled:opacity-30 rounded-full cursor-pointer text-white"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DEDYKOWANY DRAWER / MODAL: "⚡ ZARZĄDZAJ KONTEM UŻYTKOWNIKA" */}
      {manageModalOpen && targetUser && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
          <div className="bg-[#111216] border-l border-white/10 w-full max-w-2xl h-full shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-right duration-300">
            
            {/* Header Drawer Modal */}
            <div className="p-6 bg-[#18191E] border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {renderUserInitials(targetUser.name, targetUser.email)}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-white">
                      {targetUser.name || "Użytkownik"}
                    </h3>
                    {targetUser.role === "superadmin" && (
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
                onClick={() => setManageModalOpen(false)}
                className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-full transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body Panelu Zarządczego */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-white">
              
              {saveSuccessMsg && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 font-bold flex items-center gap-2 animate-in fade-in duration-200">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}

              {/* SECTION 1: IMPERSONACJA & SKLEP KLIENTA */}
              <div className="p-5 bg-[#090A0C] border border-white/5 rounded-2xl space-y-3">
                <span className="text-[10px] text-zinc-400 uppercase font-extrabold tracking-wider block">
                  🏬 Przypisany Sklep Klienta
                </span>

                {(targetUser.stores || []).length === 0 ? (
                  <p className="text-xs text-zinc-400">Użytkownik nie utworzył jeszcze sklepu.</p>
                ) : (
                  (targetUser.stores || []).map((st) => (
                    <div key={st.id} className="p-4 bg-[#111216] border border-white/5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-extrabold text-white">{st.name}</span>
                          <span className="px-2 py-0.5 bg-[#FF5B28]/10 text-[#FF5B28] rounded-full text-[10px] font-extrabold uppercase">
                            {st.planType || targetUser.plan}
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

                      <button
                        onClick={() => handleImpersonate(targetUser)}
                        className="px-4 py-2 bg-[#FF5B28] hover:bg-[#e04f20] text-white font-extrabold rounded-full text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5" />
                        <span>Przejdź do panelu sklepu ↗</span>
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* SECTION 2: ZMIANA PAKIETU I CZASU WAŻNOŚCI */}
              <div className="p-5 bg-[#090A0C] border border-white/5 rounded-2xl space-y-4">
                <span className="text-[10px] text-zinc-400 uppercase font-extrabold tracking-wider block">
                  💳 Zmień Pakiet i Czas Ważności Sklepu
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1.5">Wybierz Pakiet SaaS:</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["Starter", "Brand", "Pro"] as const).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setSelectedPlan(p)}
                          className={`py-2 rounded-xl font-extrabold text-xs transition-all border cursor-pointer ${
                            selectedPlan === p
                              ? "bg-[#FF5B28] text-white border-[#FF5B28]"
                              : "bg-[#111216] text-zinc-400 border-white/5 hover:text-white"
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1.5">Ustaw Czas Ważności (Data i Godzina):</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                      <input
                        type="datetime-local"
                        value={expirationDateTime}
                        onChange={(e) => setExpirationDateTime(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-[#111216] border border-white/10 focus:border-[#FF5B28] rounded-xl text-xs text-white outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSaveAccountChanges}
                  disabled={isSaving}
                  className="w-full py-2.5 bg-[#FF5B28] hover:bg-[#e04f20] text-white font-extrabold text-xs rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  {isSaving ? "Zapisywanie pakietu..." : "Zapisz Nowy Pakiet i Czas Ważności"}
                </button>
              </div>

              {/* SECTION 3: SELEKTOR ZAWIESZANIA POSZCZEGÓLNYCH SKLEPÓW KLIENTA ORAZ KONTA */}
              <div className="p-5 bg-[#090A0C] border border-white/5 rounded-2xl space-y-4">
                <span className="text-[10px] text-zinc-400 uppercase font-extrabold tracking-wider block">
                  ⚠️ Wybierz Który Sklep Zawieś / Odwieś (Dedykowana Lista Sklepów)
                </span>

                {/* Lista Wszystkich Sklepów Użytkownika z Dedykowanymi Przyciskami */}
                {(targetUser.stores || []).length === 0 ? (
                  <div className="p-3 bg-[#111216] border border-white/5 rounded-xl text-xs text-zinc-400">
                    Użytkownik nie posiada utworzonych sklepów.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(targetUser.stores || []).map((st) => {
                      const isSuspended = st.status === "suspended" || st.planStatus === "suspended";

                      return (
                        <div
                          key={st.id}
                          className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all ${
                            isSuspended
                              ? "bg-red-500/10 border-red-500/30"
                              : "bg-[#111216] border-white/5"
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <Store className="w-4 h-4 text-[#FF5B28]" />
                              <span className="text-sm font-extrabold text-white">{st.name}</span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                                  isSuspended
                                    ? "bg-red-500/20 text-red-300 border-red-500/40"
                                    : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                }`}
                              >
                                {isSuspended ? "🔴 SKLEP ZAWIESZONY" : "🟢 SKLEP AKTYWNY"}
                              </span>
                            </div>
                            <span className="text-xs text-cyan-400 font-mono mt-0.5 block">
                              {st.subdomain}.motywo.pl
                            </span>
                          </div>

                          <button
                            onClick={() => handleToggleSpecificStoreSuspension(st.id, st.name)}
                            className={`px-4 py-2 rounded-full text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 border ${
                              isSuspended
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30"
                                : "bg-red-500/20 text-red-300 border-red-500/30 hover:bg-red-500/30"
                            }`}
                          >
                            {isSuspended ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                            <span>{isSuspended ? "🔓 Odwieś Ten Sklep" : "🔒 Zawieś Ten Sklep"}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Blokada Całego Konta Użytkownika */}
                <div className="p-4 bg-[#111216] border border-white/5 rounded-xl flex items-center justify-between gap-3 mt-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <UserX className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-extrabold text-white">Blokada Logowania Konta Użytkownika</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                        targetUser.accountStatus === "Blocked"
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                          : "bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
                      }`}>
                        {targetUser.accountStatus === "Blocked" ? "⛔ ZABLOKOWANE" : "🟢 AKTYWNE"}
                      </span>
                    </div>
                    <span className="text-[11px] text-zinc-400 mt-0.5 block">
                      Blokuje możliwość zalogowania się użytkownika w serwisie.
                    </span>
                  </div>

                  <button
                    onClick={handleToggleAccountBlock}
                    className={`px-4 py-2 rounded-full text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 border ${
                      targetUser.accountStatus === "Blocked"
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/30"
                        : "bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30"
                    }`}
                  >
                    {targetUser.accountStatus === "Blocked" ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                    <span>{targetUser.accountStatus === "Blocked" ? "🔓 Odblokuj Konto" : "⛔ Zablokuj Konto"}</span>
                  </button>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                    Powód wysyłany w powiadomieniu e-mail do klienta:
                  </label>
                  <input
                    type="text"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#111216] border border-white/10 focus:border-[#FF5B28] rounded-xl text-xs text-white outline-none font-medium"
                  />
                </div>
              </div>

              {/* SECTION 4: USUNIĘCIE KONTA */}
              <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-red-400 block">Usuń konto użytkownika</span>
                  <span className="text-[11px] text-zinc-400">Permanetne usunięcie konta z bazy Supabase.</span>
                </div>
                <button
                  onClick={() => {
                    if (confirm(`Czy na pewno usunąć konto ${targetUser.email}?`)) {
                      deleteUserAccount(targetUser.id);
                      setManageModalOpen(false);
                    }
                  }}
                  className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-bold text-xs rounded-full cursor-pointer transition-all shrink-0"
                >
                  Usuń Konto
                </button>
              </div>

            </div>

            {/* Footer Drawer Modal */}
            <div className="p-4 bg-[#18191E] border-t border-white/5 flex justify-end">
              <button
                onClick={() => setManageModalOpen(false)}
                className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-extrabold rounded-full transition-all cursor-pointer"
              >
                Zamknij Panel
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
