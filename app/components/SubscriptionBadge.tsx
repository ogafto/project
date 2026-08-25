'use client';

import React from 'react';

export function SubscriptionExpiryBadge({
  expiresAt,
  className,
}: {
  expiresAt?: string | null;
  className?: string;
}) {
  if (!expiresAt) {
    return <span className={`text-xs text-zinc-400 font-medium ${className || ''}`}>Ważność: Aktywny</span>;
  }

  const expiryDate = new Date(expiresAt);
  if (isNaN(expiryDate.getTime())) {
    return <span className={`text-xs text-zinc-400 font-medium ${className || ''}`}>Ważność: Aktywny</span>;
  }

  const isExpired = expiryDate.getTime() <= Date.now();

  // Format daty: DD.MM.YYYY
  const formattedDate = expiryDate.toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  if (isExpired) {
    return (
      <span className={`text-xs font-semibold px-2.5 py-1 rounded-md bg-red-500/15 text-red-400 border border-red-500/30 ${className || ''}`}>
        Ważność: Wygasł ({formattedDate})
      </span>
    );
  }

  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-md bg-zinc-800/80 text-zinc-300 border border-zinc-700/60 ${className || ''}`}>
      Ważność: do {formattedDate}
    </span>
  );
}

export { SubscriptionExpiryBadge as SubscriptionBadge, SubscriptionExpiryBadge as SubscriptionTimer };
export default SubscriptionExpiryBadge;
