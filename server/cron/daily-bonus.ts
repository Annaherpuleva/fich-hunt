import type { Express } from "express"
import { eq, isNull, lt, or, sql } from "drizzle-orm"
import { integer, numeric, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core"

import { db, hasTables } from "../db"
import { MINING_CONSTANTS } from "../../shared/constants"

const users = pgTable("users", {
  id: serial("id").primaryKey(),
  internalBalance: numeric("internal_balance", { precision: 18, scale: 6 }).notNull(),
  dailyBonusAt: timestamp("daily_bonus_at"),
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

const DAILY_BONUS_INTERVAL_MS = 24 * 60 * 60 * 1000

async function applyDailyBonuses(): Promise<number> {
  const requiredTablesExist = await hasTables("users", "bonus_transactions")
  if (!requiredTablesExist) {
    console.warn("Skipping daily bonuses: required tables are not available yet")
    return 0
  }

  const now = new Date()
  const cutoff = new Date(now.getTime() - DAILY_BONUS_INTERVAL_MS)

  const eligibleUsers = await db
    .select({ id: users.id })
    .from(users)
    .where(or(isNull(users.dailyBonusAt), lt(users.dailyBonusAt, cutoff)))

  for (const user of eligibleUsers) {
    await db
      .update(users)
      .set({
        internalBalance: sql`internal_balance + ${MINING_CONSTANTS.DAILY_BONUS}`,
        dailyBonusAt: now,
        updatedAt: now,
      })
      .where(eq(users.id, user.id))

    await db.insert(bonusTransactions).values({
      userId: user.id,
      type: "daily_bonus",
      amount: MINING_CONSTANTS.DAILY_BONUS.toString(),
      metadata: "Auto daily bonus (cron)",
    })
  }

  return eligibleUsers.length
}

export function scheduleDailyBonuses(app: Express) {
  const run = async (): Promise<void> => {
    try {
      await applyDailyBonuses()
    } catch (error) {
      console.error("Failed to apply daily bonuses:", error)
    }
  }

  run()

  if (app.locals.dailyBonusInterval) {
    return
  }

  app.locals.dailyBonusInterval = setInterval(() => {
    void run()
  }, DAILY_BONUS_INTERVAL_MS)
}
