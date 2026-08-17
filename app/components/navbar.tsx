"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { name: "Strona główna", href: "/" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="w-full flex items-center justify-between gap-4 z-50">
      {/* Left: Logo */}
      <div className="shrink-0">
        <Link href="/">
          <Image
            src="/logo.svg"
            alt="Logo"
            width={180}
            height={36}
            className="w-[140px] sm:w-[170px] md:w-[180px] h-auto object-contain cursor-pointer"
            priority
          />
        </Link>
      </div>

      {/* Center: Navigation Pill (Desktop lg+) */}
      <div className="hidden lg:flex items-center justify-center">
        <nav className="inline-flex items-center p-1.5 bg-[#0E0E11]/80 backdrop-blur-md border border-white/[0.08] rounded-xl">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`px-4 py-2 rounded-lg text-[14px] transition-all duration-200 ${
                  isActive
                    ? "bg-white/[0.08] border border-white/[0.12] text-white font-medium"
                    : "bg-transparent border border-transparent text-[#909095] hover:text-white"
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Right: Action Buttons (Desktop & Mobile) */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {user ? (
          <div className="flex items-center gap-2 sm:gap-3">
            {(user.role === "superadmin" || user.role === "admin") && (
              <Link
                href="/admin"
                className="px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm text-amber-300 bg-amber-500/15 border border-amber-500/30 font-bold hover:bg-amber-500/25 transition-all flex items-center gap-1.5 shadow-sm"
                title="Konsola Administratora"
              >
                <span>👑 Admin</span>
              </Link>
            )}
            <Link
              href="/dashboard"
              className="px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-sm text-white bg-[#FF5B28] font-bold hover:bg-[#e04f20] transition-all flex items-center gap-1.5 shadow-lg shadow-[#FF5B28]/25"
            >
              <span>Panel Sklepu</span>
              <span className="bg-white/20 text-white text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded font-extrabold">
                {user.role === "superadmin" ? "Superadmin" : user.plan}
              </span>
            </Link>
            <button
              onClick={logout}
              className="px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl text-xs sm:text-sm text-[#A1A1AA] bg-[#17171B] border border-white/[0.08] hover:text-white hover:border-white/[0.15] transition-all cursor-pointer"
              title="Wyloguj się"
            >
              Wyloguj
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/logowanie"
              className="px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg text-xs sm:text-sm text-[#A1A1AA] hover:text-white transition-colors"
            >
              Zaloguj się
            </Link>
            <Link
              href="/rejestracja"
              className="hidden xs:inline-flex px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-lg text-xs sm:text-sm text-white bg-[#FF5B28] font-medium hover:bg-[#e04f20] transition-colors"
            >
              Załóż konto
            </Link>
          </div>
        )}

        {/* Mobile Menu Toggle Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 rounded-lg bg-[#17171B] border border-white/[0.08] text-[#A1A1AA] hover:text-white transition-colors"
          aria-label="Menu"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {mobileMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 mt-3 p-4 bg-[#0E0E11]/95 backdrop-blur-xl border border-white/[0.1] rounded-2xl shadow-2xl flex flex-col gap-3 lg:hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-2.5 rounded-xl text-sm transition-all ${
                    isActive
                      ? "bg-white/[0.08] text-white font-medium"
                      : "text-[#A1A1AA] hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="pt-2 border-t border-white/[0.08] flex flex-col gap-2">
            {!user ? (
              <>
                <Link
                  href="/logowanie"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl text-sm text-white bg-white/[0.08] hover:bg-white/[0.12] transition-colors"
                >
                  Zaloguj się
                </Link>
                <Link
                  href="/rejestracja"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl text-sm text-white bg-[#FF5B28] font-medium hover:bg-[#e04f20] transition-colors"
                >
                  Załóż konto
                </Link>
              </>
            ) : (
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl text-sm text-white bg-[#FF5B28] font-medium hover:bg-[#e04f20] transition-colors"
              >
                Przejdź do Dashboardu
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}


