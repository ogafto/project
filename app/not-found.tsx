import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0A0B0D] text-white flex flex-col items-center justify-center px-4 relative overflow-hidden font-['Bricolage_Grotesque',sans-serif]">
      {/* Subtle Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#D0FF00]/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 max-w-md w-full text-center space-y-6 bg-[#111319]/90 border border-[#1C1E26] p-8 rounded-3xl backdrop-blur-xl shadow-2xl">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#D0FF00]/10 border border-[#D0FF00]/20 text-[#D0FF00] text-2xl font-extrabold mb-2">
          404
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-white font-['Bricolage_Grotesque',sans-serif]">
          Strona lub sklep nie istnieje
        </h1>

        <p className="text-zinc-400 text-xs leading-relaxed">
          Przepraszamy, ale podany adres URL lub subdomena nie istnieje w naszej bazie danych lub konto sklepu zostało zawieszone.
        </p>

        <div className="pt-2 flex flex-col gap-3">
          <Link
            href="/dashboard"
            className="w-full py-3.5 px-6 rounded-xl bg-[#D0FF00] text-black font-semibold text-xs hover:bg-[#bce600] transition shadow-lg flex items-center justify-center gap-2 text-center"
          >
            Przejdź do Panelu Klienta
          </Link>
          <Link
            href="/"
            className="w-full py-3 px-6 rounded-xl bg-white/5 border border-white/10 text-zinc-300 font-medium text-xs hover:bg-white/10 hover:text-white transition flex items-center justify-center text-center"
          >
            Strona główna platformy
          </Link>
        </div>
      </div>
    </div>
  );
}
