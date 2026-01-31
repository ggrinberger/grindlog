/**
 * Format weight without trailing zeros
 * e.g., 80.00 -> "80", 80.50 -> "80.5", 80.25 -> "80.25"
 */
export function formatWeight(weight: number | null | undefined): string {
  if (weight === null || weight === undefined) return '—';
  const num = Number(weight);
  if (isNaN(num)) return '—';
  
  // Remove trailing zeros
  return num % 1 === 0 ? num.toString() : num.toFixed(2).replace(/\.?0+$/, '');
}

/**
 * Format duration in seconds to human readable
 * e.g., 1800 -> "30 min", 90 -> "1:30"
 */
export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return '—';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${mins} min`;
}

/**
 * Format number without trailing zeros
 */
export function formatNumber(num: number | null | undefined, decimals = 2): string {
  if (num === null || num === undefined) return '—';
  const n = Number(num);
  if (isNaN(n)) return '—';
  
  return n % 1 === 0 ? n.toString() : n.toFixed(decimals).replace(/\.?0+$/, '');
}
