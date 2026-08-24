'use client';

import { useEffect, useState } from 'react';

export function SubscriptionBadge({ expiresAt, className }: { expiresAt?: string | null; className?: string }) {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!expiresAt) return;

    const targetTime = new Date(expiresAt).getTime();
    if (isNaN(targetTime)) return;

    const tick = () => {
      const diff = targetTime - Date.now();

      if (diff <= 0) {
        setTimeLeft('Wygasł');
        setIsExpired(true);
        return;
      }

      setIsExpired(false);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeLeft(`${days} dni, ${hours} godz. ${minutes} min. ${seconds}s`);
      } else {
        setTimeLeft(`${hours} godz. ${minutes} min. ${seconds}s`);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (!mounted || !expiresAt) {
    return <span className="text-xs text-zinc-500">Ładowanie ważności...</span>;
  }

  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-md ${
        isExpired
          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
          : 'text-zinc-300'
      } ${className || ''}`}
    >
      {isExpired ? 'Ważność: Wygasł' : `Ważność: Pozostało: ${timeLeft}`}
    </span>
  );
}

export { SubscriptionBadge as SubscriptionTimer };
export default SubscriptionBadge;
