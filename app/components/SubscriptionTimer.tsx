'use client';

import { useEffect, useState } from 'react';

interface SubscriptionTimerProps {
  expiresAt?: string | Date | null;
  className?: string;
  onExpireChange?: (isExpired: boolean) => void;
}

export function SubscriptionTimer({ expiresAt, className, onExpireChange }: SubscriptionTimerProps) {
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isExpired, setIsExpired] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);

    const calculateTime = () => {
      if (!expiresAt) {
        setTimeLeft('Wygasł');
        setIsExpired(true);
        if (onExpireChange) onExpireChange(true);
        return;
      }
      const expDate = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
      const diff = expDate.getTime() - Date.now();
      if (isNaN(diff) || diff <= 0) {
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

      if (days > 0) {
        setTimeLeft(`Pozostało: ${days} ${days === 1 ? 'dzień' : 'dni'}, ${hours} godz.`);
      } else {
        setTimeLeft(`Pozostało: ${hours} godz. ${minutes} min.`);
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpireChange]);

  if (!mounted) {
    return <span className="text-zinc-500 text-xs font-['Poppins',sans-serif]">Sprawdzanie ważności...</span>;
  }

  return (
    <span className={`text-xs font-medium font-['Poppins',sans-serif] ${isExpired ? 'text-red-400 font-bold' : 'text-zinc-300'} ${className || ''}`}>
      {timeLeft}
    </span>
  );
}

export default SubscriptionTimer;
