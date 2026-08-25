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
    return <span className={`text-xs text-zinc-400 font-medium ${className || ''}`}>Aktywny</span>;
  }

  const expiryDate = new Date(expiresAt);
  if (isNaN(expiryDate.getTime())) {
    return <span className={`text-xs text-zinc-400 font-medium ${className || ''}`}>Aktywny</span>;
  }

  const isExpired = expiryDate.getTime() <= Date.now();

  // Format daty i godziny: DD.MM.YYYY, HH:mm
  const formattedDate = expiryDate.toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const formattedTime = expiryDate.toLocaleTimeString('pl-PL', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (isExpired) {
    return (
      <span className={`text-xs font-semibold text-rose-400 ${className || ''}`}>
        Wygasł ({formattedDate}, {formattedTime})
      </span>
    );
  }

  return (
    <span className={`text-xs font-medium text-zinc-200 ${className || ''}`}>
      {formattedDate}, {formattedTime}
    </span>
  );
}

export { SubscriptionExpiryBadge as SubscriptionBadge, SubscriptionExpiryBadge as SubscriptionTimer };
export default SubscriptionExpiryBadge;
