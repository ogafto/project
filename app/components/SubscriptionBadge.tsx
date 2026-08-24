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
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (!expiresAt) {
      setTimeLeft('Wygasł');
      setIsExpired(true);
      if (onExpireChange) onExpireChange(true);
      return;
    }

    const targetDate = new Date(expiresAt).getTime();
    if (isNaN(targetDate) || targetDate <= 0) {
      setTimeLeft('Wygasł');
      setIsExpired(true);
      if (onExpireChange) onExpireChange(true);
      return;
    }

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

      const totalSec = Math.floor(diff / 1000);
      const days = Math.floor(totalSec / 86400);
      const hours = Math.floor((totalSec % 86400) / 3600);
      const minutes = Math.floor((totalSec % 3600) / 60);
      const seconds = totalSec % 60;

      if (days > 0) {
        const dayLabel = days === 1 ? 'dzień' : 'dni';
        setTimeLeft(`${days} ${dayLabel}, ${hours} godz. ${minutes} min. ${seconds} sek.`);
      } else {
        setTimeLeft(`${hours} godz. ${minutes} min. ${seconds} sek.`);
      }
    };

    updateCounter();
    const interval = setInterval(updateCounter, 1000);
    return () => clearInterval(interval);
  }, [mounted, expiresAt, onExpireChange]);

  if (!mounted) {
    return (
      <span className={`text-xs font-semibold font-mono tracking-tight text-zinc-400 ${className || ''}`} suppressHydrationWarning>
        Ładowanie...
      </span>
    );
  }

  return (
    <span
      className={`text-xs font-semibold font-mono tracking-tight transition-colors ${
        isExpired
          ? 'px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold'
          : 'text-white'
      } ${className || ''}`}
      suppressHydrationWarning
    >
      {timeLeft || 'Ładowanie...'}
    </span>
  );
}

export { SubscriptionTimer } from './SubscriptionTimer';
export default SubscriptionBadge;
