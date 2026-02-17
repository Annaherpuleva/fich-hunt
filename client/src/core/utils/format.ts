import { formatAtomicAmount, fromAtomicAmount, toAtomicAmount } from '../../../../shared/money';

export function lamportsToSol(lamports: number | bigint, digits = 4): string {
  return formatAtomicAmount(lamports, digits, false);
}

export function solToLamports(sol: number): number {
  return Number(toAtomicAmount(sol));
}

export function formatGameAmount(amountAtomic: number | bigint, digits = 4): string {
  return formatAtomicAmount(amountAtomic, digits, true);
}

export function atomicToFloat(amountAtomic: number | bigint): number {
  return fromAtomicAmount(amountAtomic);
}

export function clampNumber(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function formatDurationHMS(totalSeconds: number): string {
  const safe = Number.isFinite(totalSeconds) ? Math.max(0, Math.floor(totalSeconds)) : 0;
  const days = Math.floor(safe / 86_400);
  const hours = Math.floor((safe % 86_400) / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  if (days > 0) {
    let lang: 'ru' | 'en' = 'en';
    if (typeof window !== 'undefined') {
      const globalLang = (window as any).__cryptofishLang;
      if (globalLang === 'ru' || globalLang === 'en') {
        lang = globalLang;
      } else {
        const stored = window.localStorage?.getItem('cryptofish:language');
        if (stored === 'ru' || stored === 'en') lang = stored;
      }
    }
    const suffix = lang === 'ru' ? 'Д' : 'D';
    const dd = String(days);
    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');
    const ss = String(seconds).padStart(2, '0');
    return `${dd}${suffix} ${hh}:${mm}:${ss}`;
  }
  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}
