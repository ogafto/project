'use client';

import { useEffect, useState } from 'react';

export function SubscriptionBadge({
  expiresAt,
  className,
  onExpireChange,
}: {
  expiresAt?: string | Date | null;
  className?: string;
  onExpireChange?: (isExpired: boolean) => void;
}) {
  const [timeLeft, setTimeLeft] = useState<string>('Ładowanie...');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!expiresAt) return;

    const targetDate = new Date(expiresAt).getTime();
    if (isNaN(targetDate)) return;

    const updateCounter = () => {
      const now = Date.now();
      const diff = targetDate - now;

      if (diff <= 0) {
        setTimeLeft('Wygasł');
        setIsExpired(true);
        if (onExpireChange) onExpireChange(true);
        return;
      }

      setIsExpired(false);
      if (onExpireChange) onExpireChange(false);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeLeft(`Pozostało: ${days} dni, ${hours} godz. ${minutes} min. ${seconds}s`);
      } else {
        setTimeLeft(`Pozostało: ${hours} godz. ${minutes} min. ${seconds}s`);
      }
    };

    updateCounter();
    const interval = setInterval(updateCounter, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpireChange]);

  return (
    <span
      className={`text-xs font-medium font-['Poppins',sans-serif] px-2 py-0.5 rounded-md ${
        isExpired
          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold'
          : 'text-zinc-300'
      } ${className || ''}`}
    >
      {timeLeft}
    </span>
  );
}

export { SubscriptionTimer } from './SubscriptionTimer';
export default SubscriptionBadge;
