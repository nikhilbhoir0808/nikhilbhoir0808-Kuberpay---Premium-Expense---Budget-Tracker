export const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  AED: 'AED ',
  JPY: '¥'
};

export function formatCurrency(
  amount: number,
  currency: string = 'INR',
  options?: { compact?: boolean; showSign?: boolean; decimals?: number }
): string {
  const symbol = CURRENCY_SYMBOLS[currency] || '₹';
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const decimals = options?.decimals !== undefined ? options.decimals : (absAmount % 1 === 0 ? 0 : 2);

  let formatted = '';

  if (options?.compact) {
    if (currency === 'INR') {
      if (absAmount >= 10000000) {
        formatted = `${(absAmount / 10000000).toFixed(2)} Cr`;
      } else if (absAmount >= 100000) {
        formatted = `${(absAmount / 100000).toFixed(2)} L`;
      } else if (absAmount >= 1000) {
        formatted = `${(absAmount / 1000).toFixed(1)} K`;
      } else {
        formatted = absAmount.toFixed(decimals);
      }
    } else {
      if (absAmount >= 1000000) {
        formatted = `${(absAmount / 1000000).toFixed(1)}M`;
      } else if (absAmount >= 1000) {
        formatted = `${(absAmount / 1000).toFixed(1)}K`;
      } else {
        formatted = absAmount.toFixed(decimals);
      }
    }
  } else {
    if (currency === 'INR') {
      // Indian numbering format (e.g., 1,23,456.00)
      const parts = absAmount.toFixed(decimals).split('.');
      let intPart = parts[0];
      const decPart = parts[1] ? `.${parts[1]}` : '';

      if (intPart.length > 3) {
        const last3 = intPart.substring(intPart.length - 3);
        const otherNumbers = intPart.substring(0, intPart.length - 3);
        intPart = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3;
      }
      formatted = `${intPart}${decPart}`;
    } else {
      formatted = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(absAmount);
    }
  }

  const sign = options?.showSign ? (isNegative ? '- ' : '+ ') : (isNegative ? '- ' : '');
  return `${sign}${symbol}${formatted}`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

export function formatTime(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(d);
}

export function getRelativeDay(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const target = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 0 && diffDays >= -6) return `${Math.abs(diffDays)} days ago`;
  if (diffDays > 0 && diffDays <= 7) return `In ${diffDays} days`;

  return formatDate(dateStr);
}

export function isDueSoon(dateStr: string): { isDue: boolean; daysRemaining: number } {
  if (!dateStr) return { isDue: false, daysRemaining: 999 };
  const [year, month, day] = dateStr.split('-').map(Number);
  const target = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return {
    isDue: diffDays <= 5,
    daysRemaining: diffDays,
  };
}
