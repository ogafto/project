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
    return <span className={`text-xs text-zinc-400 font-medium whitespace-nowrap ${className || ''}`}>Ważność: Aktywny</span>;
  }

  const expiryDate = new Date(expiresAt);
  if (isNaN(expiryDate.getTime())) {
    return <span className={`text-xs text-zinc-400 font-medium whitespace-nowrap ${className || ''}`}>Ważność: Aktywny</span>;
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
      <span className={`text-xs font-semibold text-rose-400 whitespace-nowrap ${className || ''}`}>
        Ważność: Wygasł ({formattedDate})
      </span>
    );
  }

  return (
    <span className={`text-xs font-medium text-zinc-200 whitespace-nowrap ${className || ''}`}>
      Ważność: do {formattedDate}
    </span>
  );
}

export { SubscriptionExpiryBadge as SubscriptionBadge, SubscriptionExpiryBadge as SubscriptionTimer };
export default SubscriptionExpiryBadge;
