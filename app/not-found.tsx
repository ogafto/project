import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0E0E11] text-white flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#FF5B28]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-md w-full text-center space-y-6 bg-white/[0.03] border border-white/10 p-8 rounded-3xl backdrop-blur-xl shadow-2xl">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-[#FF5B28]/10 border border-[#FF5B28]/20 text-[#FF5B28] text-3xl font-extrabold mb-2">
          404
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Sklep nie istnieje lub jest nieaktywny
        </h1>

        <p className="text-zinc-400 text-sm leading-relaxed">
          Przepraszamy, ale podana subdomena sklepu nie istnieje w naszej bazie danych lub konto sklepu zostało tymczasowo zawieszone.
        </p>

        <div className="pt-4 flex flex-col gap-3">
          <a
            href="https://iskral.pl"
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#FF5B28] to-[#FF8C38] text-white font-semibold text-sm hover:opacity-90 transition shadow-lg shadow-[#FF5B28]/20 flex items-center justify-center gap-2 text-center"
          >
            Strona główna platformy
          </a>
          <a
            href="https://iskral.pl/logowanie"
            className="w-full py-3 px-6 rounded-xl bg-white/5 border border-white/10 text-zinc-300 font-medium text-sm hover:bg-white/10 hover:text-white transition flex items-center justify-center text-center"
          >
            Zaloguj się do swojego panelu
          </a>
        </div>
      </div>
    </div>
  );
}
