import { pgTable, serial, varchar, numeric, timestamp, boolean, integer, text, index } from "drizzle-orm/pg-core"
import type { InferSelectModel, InferInsertModel } from "drizzle-orm"

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    telegramId: varchar("telegram_id", { length: 64 }).notNull().unique(),
    username: varchar("username", { length: 64 }),
    referrerId: integer("referrer_id"),
    referrerTelegramId: varchar("referrer_telegram_id", { length: 64 }),
    usdtBalance: numeric("usdt_balance", { precision: 18, scale: 6 }).notNull().default("0"),
    internalBalance: numeric("internal_balance", { precision: 18, scale: 6 }).notNull().default("0"),
    referralBalance: numeric("referral_balance", { precision: 18, scale: 6 }).notNull().default("0"),
    referralWithdrawUnlocked: boolean("referral_withdraw_unlocked").notNull().default(false),
    chatBonusClaimed: boolean("chat_bonus_claimed").notNull().default(false),
    channelBonusClaimed: boolean("channel_bonus_claimed").notNull().default(false),
    dailyBonusAt: timestamp("daily_bonus_at"),
    withdrawEnabled: boolean("withdraw_enabled").notNull().default(true),
    isAdmin: boolean("is_admin").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    referrerTelegramIdx: index("users_referrer_telegram_idx").on(table.referrerTelegramId),
  }),
)

export const miners = pgTable("miners", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  icon: varchar("icon", { length: 16 }).notNull().default("background.gif"),
  price: numeric("price", { precision: 18, scale: 2 }).notNull(),
  durationDays: integer("duration_days").notNull().default(365),
  dailyRate: numeric("daily_rate", { precision: 6, scale: 4 }).notNull().default("0.01"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const userMiners = pgTable("user_miners", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  minerId: integer("miner_id").notNull(),
  price: numeric("price", { precision: 18, scale: 2 }).notNull(),
  dailyRate: numeric("daily_rate", { precision: 6, scale: 4 }).notNull(),
  purchasedAt: timestamp("purchased_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
  lastAccruedAt: timestamp("last_accrued_at").notNull().defaultNow(),
  totalProfit: numeric("total_profit", { precision: 18, scale: 6 }).notNull().default("0"),
})

export const walletDeposits = pgTable("wallet_deposits", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  currency: varchar("currency", { length: 20 }).notNull(),
  amount: numeric("amount", { precision: 18, scale: 6 }).notNull(),
  destination: varchar("destination", { length: 40 }).notNull(),
  minerId: integer("miner_id"),
  status: varchar("status", { length: 32 }).notNull().default("pending"),
  paymentId: varchar("payment_id", { length: 120 }),
  externalPaymentId: varchar("external_payment_id", { length: 120 }),
  walletAddress: varchar("wallet_address", { length: 200 }),
  txHash: varchar("tx_hash", { length: 200 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
})

export const walletWithdrawals = pgTable("wallet_withdrawals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  currency: varchar("currency", { length: 20 }).notNull(),
  amount: numeric("amount", { precision: 18, scale: 6 }).notNull(),
  commission: numeric("commission", { precision: 18, scale: 6 }).notNull().default("0"),
  netAmount: numeric("net_amount", { precision: 18, scale: 6 }).notNull().default("0"),
  status: varchar("status", { length: 32 }).notNull().default("pending"),
  walletAddress: varchar("wallet_address", { length: 200 }).notNull(),
  addressExtra: varchar("address_extra", { length: 200 }),
  paymentId: varchar("payment_id", { length: 120 }),
  transactionHash: varchar("transaction_hash", { length: 200 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
})

export const referralLinks = pgTable("referral_links", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrer_id").notNull(),
  referredUserId: integer("referred_user_id").notNull(),
  level: integer("level").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})



export const promoCodes = pgTable("promo_codes", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 64 }).notNull().unique(),
  reward: numeric("reward", { precision: 18, scale: 6 }).notNull().default("0"),
  maxActivations: integer("max_activations").notNull().default(1),
  activations: integer("activations").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const promoCodeActivations = pgTable("promo_code_activations", {
  id: serial("id").primaryKey(),
  promoCodeId: integer("promo_code_id").notNull(),
  userId: integer("user_id").notNull(),
  reward: numeric("reward", { precision: 18, scale: 6 }).notNull().default("0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const referralOverrides = pgTable("referral_overrides", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  level1Rate: numeric("level1_rate", { precision: 6, scale: 4 }).notNull().default("0.1"),
  level2Rate: numeric("level2_rate", { precision: 6, scale: 4 }).notNull().default("0.06"),
  level3Rate: numeric("level3_rate", { precision: 6, scale: 4 }).notNull().default("0.03"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 64 }).notNull().unique(),
  title: varchar("title", { length: 200 }).notNull(),
  reward: numeric("reward", { precision: 18, scale: 6 }).notNull().default("0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const userTasks = pgTable("user_tasks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  taskId: integer("task_id").notNull(),
  completedAt: timestamp("completed_at").notNull().defaultNow(),
})

export const bonusTransactions = pgTable("bonus_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: varchar("type", { length: 64 }).notNull(),
  amount: numeric("amount", { precision: 18, scale: 6 }).notNull(),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export type User = InferSelectModel<typeof users>
export type NewUser = InferInsertModel<typeof users>

export const MINING_CONSTANTS = {
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

