// Domain/UI constants used across the frontend

export const SOL_DECIMALS = 9;
export const LAMPORTS_PER_SOL = 10 ** SOL_DECIMALS;

// Contract-related UI mirrors (do not enforce on-chain logic here):
export const MIN_DEPOSIT_LAMPORTS = 10_000_000; // 0.01 SOL
export const MIN_FEED_LAMPORTS = 10_000_000; // 0.01 SOL (mirror of on-chain MIN_FEED_LAMPORTS)
export const COMMISSION_BPS = 1000; // 10% "сверху"
export const FISH_RENT_LAMPORTS = 2_213_280; // Rent for create/resurrect fish account
