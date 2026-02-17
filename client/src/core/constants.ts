// Domain/UI constants used across the frontend

export const ATOMIC_DECIMALS = 9;
export const ATOMIC_UNITS_PER_TOKEN = 10 ** ATOMIC_DECIMALS;

// Fallback rules, overridden by backend /api/v1/config
export const FALLBACK_MIN_DEPOSIT_ATOMIC = 10_000_000;
export const FALLBACK_MIN_FEED_ATOMIC = 10_000_000;
export const FALLBACK_COMMISSION_BPS = 1000;
export const FISH_RENT_LAMPORTS = 2_213_280; // Rent for create/resurrect fish account

// Backward compatibility aliases during migration.
export const LAMPORTS_PER_SOL = ATOMIC_UNITS_PER_TOKEN;
export const MIN_DEPOSIT_LAMPORTS = FALLBACK_MIN_DEPOSIT_ATOMIC;
export const MIN_FEED_LAMPORTS = FALLBACK_MIN_FEED_ATOMIC;
export const COMMISSION_BPS = FALLBACK_COMMISSION_BPS;
