'use client';

import { useEffect } from 'react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('BŁĄD SUBDOMENY:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0E0E11] text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-2xl max-w-lg">
        <h2 className="text-lg font-bold text-red-400 mb-2">Wystąpił błąd podczas ładowania sklepu</h2>
        <p className="text-xs text-zinc-400 font-mono bg-black/50 p-3 rounded-lg mb-4 text-left overflow-x-auto">
          {error?.message || 'Nieznany błąd'}
        </p>
        <button
          onClick={() => reset()}
          className="px-4 py-2 bg-[#FF5B28] text-white text-xs font-semibold rounded-lg"
        >
          Spróbuj ponownie
        </button>
      </div>
    </div>
  );
}
