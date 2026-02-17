import type { Express } from "express"
import { and, eq, gt, lte, sql } from "drizzle-orm"
import { integer, numeric, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core"

import { db, hasTables } from "../db"
import { MINING_CONSTANTS } from "../../shared/constants"

const userMiners = pgTable("user_miners", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  price: numeric("price", { precision: 18, scale: 2 }).notNull(),
  dailyRate: numeric("daily_rate", { precision: 6, scale: 4 }).notNull(),
  purchasedAt: timestamp("purchased_at").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  lastAccruedAt: timestamp("last_accrued_at").notNull(),
  totalProfit: numeric("total_profit", { precision: 18, scale: 6 }).notNull(),
})

const users = pgTable("users", {
  id: serial("id").primaryKey(),
  usdtBalance: numeric("usdt_balance", { precision: 18, scale: 6 }).notNull(),
  internalBalance: numeric("internal_balance", { precision: 18, scale: 6 }).notNull(),
  updatedAt: timestamp("updated_at").notNull(),
})

const bonusTransactions = pgTable("bonus_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: varchar("type", { length: 64 }).notNull(),
  amount: numeric("amount", { precision: 18, scale: 6 }).notNull(),
  metadata: varchar("metadata", { length: 255 }),
  createdAt: timestamp("created_at").notNull(),
})

const ACCRUAL_INTERVAL_MS = MINING_CONSTANTS.ACCRUAL_MINUTES * 60 * 1000

type AccrualUpdate = {
  userId: number
  amount: number
}

type AccrualResult = {
  hasActiveMiners: boolean
}

async function accrueMinerRewards(): Promise<AccrualResult> {
  const requiredTablesExist = await hasTables("user_miners", "users", "bonus_transactions")
  if (!requiredTablesExist) {
    console.warn("Skipping mining reward accrual: required tables are not available yet")
    return { hasActiveMiners: false }
  }

  const now = new Date()
  const pendingMiners = await db
    .select()
    .from(userMiners)
    .where(and(lte(userMiners.purchasedAt, now), gt(userMiners.expiresAt, now)))

  if (pendingMiners.length === 0) {
    return { hasActiveMiners: false }
  }

  const accruals = new Map<number, number>()

  for (const miner of pendingMiners) {
    const expiresAt = new Date(miner.expiresAt)
    const lastAccruedAt = new Date(miner.lastAccruedAt)
    if (now <= lastAccruedAt || now >= expiresAt) {
      continue
    }

    const elapsedMs = Math.min(now.getTime(), expiresAt.getTime()) - lastAccruedAt.getTime()
    const intervals = Math.floor(elapsedMs / ACCRUAL_INTERVAL_MS)
    if (intervals <= 0) {
      continue
    }

    const price = Number(miner.price)
    const dailyRate = Number(miner.dailyRate)
    const perInterval = (price * dailyRate) / (24 * (60 / MINING_CONSTANTS.ACCRUAL_MINUTES))
    const accrued = perInterval * intervals
    const newAccruedAt = new Date(lastAccruedAt.getTime() + intervals * ACCRUAL_INTERVAL_MS)

    await db
      .update(userMiners)
      .set({
        totalProfit: sql`total_profit + ${accrued}`,
        lastAccruedAt: newAccruedAt,
      })
      .where(eq(userMiners.id, miner.id))

    accruals.set(miner.userId, (accruals.get(miner.userId) ?? 0) + accrued)
  }

  const updates: AccrualUpdate[] = Array.from(accruals.entries()).map(([userId, amount]) => ({
    userId,
    amount,
  }))

  for (const update of updates) {
    if (update.amount <= 0) {
      continue
    }

    await db
      .update(users)
      .set({
        usdtBalance: sql`usdt_balance + ${update.amount * MINING_CONSTANTS.AUTO_CLAIM_SPLIT.purchase}`,
        internalBalance: sql`internal_balance + ${update.amount * MINING_CONSTANTS.AUTO_CLAIM_SPLIT.withdraw}`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, update.userId))

    await db.insert(bonusTransactions).values({
      userId: update.userId,
      type: "mining_accrual",
      amount: update.amount.toString(),
      metadata: JSON.stringify({ intervalsMinutes: MINING_CONSTANTS.ACCRUAL_MINUTES, source: "cron", autoClaimSplit: "50/50" }),
    })
  }

  return { hasActiveMiners: true }
}

export function scheduleMiningRewards(app: Express) {
  const intervalMs = ACCRUAL_INTERVAL_MS
  const run = async (): Promise<AccrualResult> => {
    try {
      return await accrueMinerRewards()
    } catch (error) {
      console.error("Failed to accrue mining rewards:", error)
      return { hasActiveMiners: false }
    }
  }

  void run()

  if (!app.locals.miningRewardsInterval) {
    app.locals.miningRewardsInterval = setInterval(() => {
      void run()
    }, intervalMs)
  }
}
