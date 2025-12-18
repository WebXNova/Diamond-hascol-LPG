export function titleCaseWords(input: string): string {
  return input
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/\b\p{L}/gu, (m) => m.toUpperCase());
}

export function digitsOnly(input: string): string {
  return input.replace(/[^\d]/g, '');
}

export function formatPKPhoneLoose(input: string): string {
  // Lightweight "feel-good" formatting: keep + if user typed it, otherwise keep digits/spaces.
  const raw = input.replace(/[^\d+]/g, '');
  const hasPlus = raw.startsWith('+');
  const digits = digitsOnly(raw);

  if (!digits) return hasPlus ? '+' : '';

  // Simple grouping: country (up to 3), then 3, then rest
  const cc = digits.slice(0, Math.min(3, digits.length));
  const rest = digits.slice(cc.length);
  const p1 = rest.slice(0, 3);
  const p2 = rest.slice(3);
  const parts = [cc, p1, p2].filter(Boolean);
  const formatted = parts.join(' ');
  return hasPlus ? `+${formatted}` : formatted;
}

export function clampInt(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

export function formatPKR(amount: number): string {
  const rounded = Math.round(amount);
  return `₨${rounded.toLocaleString('en-PK')}`;
}


