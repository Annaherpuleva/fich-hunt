const parseAdditionalChannels = (): string[] => {
  const raw = process.env.ADDITIONAL_CHANNELS || ""
  return raw
    .split(",")
    .map((channel) => channel.trim())
    .filter(Boolean)
}

const BASE_MINING_CONSTANTS = {
  DAILY_RATE: 0.01,
  ACCRUAL_MINUTES: 1,
  ACCRUAL_HOURS: 1,
  AUTO_CLAIM_HOURS: 1,
  WITHDRAW_RATE_USDT_PER_COIN: 0.0001,
  MIN_WITHDRAWAL: 0.2,
  MIN_WITHDRAWAL_BY_CURRENCY: {
    USDT: 0.2,
    USDT_TON: 0.2,
    USDT_BEP20: 0.3,
    USDT_TRX: 1,
    TON: 0.2,
  },
  WITHDRAW_COMMISSION: 0,
  REFERRAL_RATES: [0.05, 0.03, 0.01],
  ADMIN_REFERRAL_RATES: [0.1, 0.06, 0.03],
  REGISTRATION_BONUS: 1.5,
  MINER_PRICE_MIN: 3,
  MINER_PRICE_MAX: 1380,
  DAILY_BONUS: 0.001,
  AUTO_CLAIM_SPLIT: { purchase: 0.5, withdraw: 0.5 },
  DAILY_CHECK_IN_REWARDS: [
    0.001, 0.002, 0.005, 0.006, 0.007, 0.008, 0.009, 0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08,
    0.09, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.01, 1.1, 1.2, 1.35,
  ],
  CHAT_BONUS: 0.1,
  CHANNEL_BONUS: 0.1,
  INVITE_BONUS: 0.01,
}

export const MINING_CONSTANTS = {
  ...BASE_MINING_CONSTANTS,
  REQUIRED_CHANNEL_ID: process.env.REQUIRED_CHANNEL_ID || "",
  MAIN_CHAT_ID: process.env.MAIN_CHAT_ID || "",
  ADDITIONAL_CHANNELS: parseAdditionalChannels(),
}
