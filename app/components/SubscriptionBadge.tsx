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

      const pad = (n: number) => String(n).padStart(2, '0');

      if (days > 0) {
        setTimeLeft(`${days} ${days === 1 ? 'dzień' : 'dni'}, ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
      } else {
        setTimeLeft(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
      }
    };

    updateCounter();
    const interval = setInterval(updateCounter, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpireChange]);

  return (
    <span
      className={`text-xs font-semibold font-mono tracking-tight ${
        isExpired
          ? 'px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold'
          : 'text-white'
      } ${className || ''}`}
    >
      {timeLeft}
    </span>
  );
}

export { SubscriptionTimer } from './SubscriptionTimer';
export default SubscriptionBadge;
