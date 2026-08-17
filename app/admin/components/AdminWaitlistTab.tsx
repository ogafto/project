"use client";

import React, { useState, useEffect } from "react";
import { 
  Mail, 
  Search, 
  Copy, 
  Check, 
  Calendar,
  Users,
  Send,
  X,
  CheckCircle2,
  Clock,
  Sparkles
} from "lucide-react";

interface WaitlistLead {
  id: string;
  email: string;
  createdAt: string;
  notifiedAt: string | null;
}

export default function AdminWaitlistTab() {
  const [waitlist, setWaitlist] = useState<WaitlistLead[]>([]);
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  const [isMailingModalOpen, setIsMailingModalOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState("Odpalamy motywo.pl! Twój kod na start: MOTYWO2026");
  const [emailContent, setEmailContent] = useState(
    "Cześć! Platforma motywo.pl oficjalnie wystartowała. Twój 14-dniowy darmowy dostęp oraz specjalny rabat powitalny czekają na Ciebie."
  );
  const [sendingMailing, setSendingMailing] = useState(false);
  const [mailingSuccessMessage, setMailingSuccessMessage] = useState<string | null>(null);

  const fetchWaitlist = () => {
    setLoading(true);
    fetch("/api/newsletter")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.subscribers) {
          setWaitlist(data.subscribers);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchWaitlist();
  }, []);

  const unnotifiedLeads = waitlist.filter((l) => !l.notifiedAt);

  const filteredWaitlist = waitlist.filter((sub) =>
    sub.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleCopyEmails = () => {
    const emailsString = waitlist.map((w) => w.email).join(", ");
    navigator.clipboard.writeText(emailsString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendMassMailing = async () => {
    setSendingMailing(true);
    setMailingSuccessMessage(null);

    try {
      const res = await fetch("/api/admin/waitlist/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: emailSubject,
          content: emailContent,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMailingSuccessMessage(data.message);
        fetchWaitlist();
        setTimeout(() => {
          setIsMailingModalOpen(false);
          setMailingSuccessMessage(null);
        }, 2200);
      } else {
        alert(data.error || "Wystąpił błąd podczas wysyłania mailingu.");
      }
    } catch (err) {
      alert("Nie udało się nawiązać połączenia z serwerem.");
    } finally {
      setSendingMailing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      {/* 1. TOP CARD Z LICZNIKIEM LEADOW (100% DARK MODE #111216) */}
      <div className="p-6 sm:p-8 bg-[#111216] border border-white/5 rounded-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-[#FF5B28]/10 text-[#FF5B28] border border-[#FF5B28]/20 rounded-full text-xs font-bold flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              Baza Waitlisty & Leads
            </span>
            <span className="px-3 py-1 bg-amber-400/10 text-amber-300 border border-amber-400/20 rounded-full text-xs font-bold">
              {waitlist.length} Zebranych Adresów E-mail
            </span>
          </div>
          <h2 className="mt-3 text-xl sm:text-2xl font-extrabold text-white">
            Lista Oczekujących (waitlist_leads)
          </h2>
          <p className="mt-1 text-xs text-zinc-400">
            Oczekujących na powiadomienie premierowe: <strong className="text-[#FF5B28] font-bold">{unnotifiedLeads.length} leadów</strong> (gdzie notified_at IS NULL).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={() => setIsMailingModalOpen(true)}
            className="px-5 py-3 bg-[#FF5B28] hover:bg-[#e04f20] text-white font-extrabold rounded-full text-xs transition-all shadow-sm flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <Send className="w-4 h-4" />
            <span> Wyślij mailing o starcie</span>
          </button>

          <button
            onClick={handleCopyEmails}
            disabled={waitlist.length === 0}
            className="px-4 py-3 bg-[#090A0C] hover:bg-white/5 border border-white/5 text-zinc-300 font-bold rounded-full text-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-zinc-400" />}
            <span>{copied ? "Skopiowano!" : "Kopiuj e-maile"}</span>
          </button>
        </div>
      </div>

      {/* 2. TABELA LEADOW WAITLISTY (100% DARK MODE #111216) */}
      <div className="p-6 bg-[#111216] border border-white/5 rounded-2xl flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-[#FF5B28]" />
              <span>Zapisani Subskrybenci ({filteredWaitlist.length})</span>
            </h3>
            <span className="px-2.5 py-0.5 bg-amber-400/10 text-amber-300 rounded-full text-xs font-bold">
              {unnotifiedLeads.length} Oczekuje na mailing
            </span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Szukaj adresu e-mail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#090A0C] border border-white/5 focus:border-[#FF5B28] rounded-full text-xs text-white outline-none font-medium"
            />
          </div>
        </div>

        <div className="overflow-x-auto border border-white/5 rounded-xl bg-[#090A0C]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#18191E] text-zinc-400 uppercase tracking-wider font-extrabold text-[10px] border-b border-white/5">
              <tr>
                <th className="p-4 w-12 text-center">#</th>
                <th className="p-4">ADRES E-MAIL</th>
                <th className="p-4">DATA ZAPISU (created_at)</th>
                <th className="p-4">STATUS POWIADOMIENIA (notified_at)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-white">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-zinc-400">
                    Ładowanie bazy waitlist_leads z Supabase...
                  </td>
                </tr>
              ) : filteredWaitlist.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-zinc-400">
                    Brak adresów e-mail w bazie waitlisty.
                  </td>
                </tr>
              ) : (
                filteredWaitlist.map((sub, idx) => {
                  const isNotified = Boolean(sub.notifiedAt);

                  return (
                    <tr key={sub.id || idx} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 text-zinc-500 font-mono text-center">{idx + 1}</td>
                      <td className="p-4 text-white font-bold font-mono text-xs">{sub.email}</td>
                      <td className="p-4 text-zinc-400 font-mono">
                        {new Date(sub.createdAt).toLocaleString("pl-PL")}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-full font-extrabold text-[10px] inline-flex items-center gap-1.5 border ${
                            isNotified
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                              : "bg-amber-400/15 text-amber-300 border-amber-400/30"
                          }`}
                        >
                          {isNotified ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              Wysłano: {new Date(sub.notifiedAt!).toLocaleDateString("pl-PL")}
                            </>
                          ) : (
                            <>
                              <Clock className="w-3.5 h-3.5 text-amber-300" />
                              ⏳ Oczekuje (notified_at IS NULL)
                            </>
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. MODAL PODGLĄDU MAILINGU (100% DARK MODE #111216) */}
      {isMailingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#111216] border border-white/10 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 bg-[#18191E] border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#FF5B28]/10 text-[#FF5B28] flex items-center justify-center font-bold">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">Podgląd Mailingu Startowego</h3>
                  <p className="text-[11px] text-zinc-400">
                    Odbiorców: <strong className="text-[#FF5B28]">{unnotifiedLeads.length || waitlist.length} oczekujących leadów</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsMailingModalOpen(false)}
                className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-full transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {mailingSuccessMessage ? (
                <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <h4 className="text-base font-bold text-white">Mailing Wysłany Pomyślnie!</h4>
                  <p className="text-xs text-emerald-300">{mailingSuccessMessage}</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                      Temat Wiadomości E-mail
                    </label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      className="w-full px-3.5 py-2 bg-[#090A0C] border border-white/10 focus:border-[#FF5B28] rounded-xl text-xs text-white outline-none font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                      Podgląd Treści Wiadomości
                    </label>
                    <textarea
                      rows={5}
                      value={emailContent}
                      onChange={(e) => setEmailContent(e.target.value)}
                      className="w-full p-3.5 bg-[#090A0C] border border-white/10 focus:border-[#FF5B28] rounded-xl text-xs text-white outline-none font-mono leading-relaxed resize-none"
                    />
                  </div>

                  <div className="p-3.5 bg-amber-400/10 border border-amber-400/20 rounded-xl text-[11px] text-amber-300 leading-relaxed">
                    ℹ️ Server Action zaktualizuje rekordy w Supabase w tabeli <code className="text-white font-mono">waitlist_leads</code> (ustawiając <code className="text-white font-mono">notified_at = NOW()</code>).
                  </div>
                </>
              )}
            </div>

            {!mailingSuccessMessage && (
              <div className="p-4 bg-[#18191E] border-t border-white/5 flex items-center justify-end gap-3">
                <button
                  onClick={() => setIsMailingModalOpen(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-bold rounded-full transition-all cursor-pointer"
                >
                  Anuluj
                </button>

                <button
                  onClick={handleSendMassMailing}
                  disabled={sendingMailing}
                  className="px-5 py-2 bg-[#FF5B28] hover:bg-[#e04f20] disabled:opacity-50 text-white font-extrabold text-xs rounded-full shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{sendingMailing ? "Wysyłanie..." : "Wyślij Powiadomienia"}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
