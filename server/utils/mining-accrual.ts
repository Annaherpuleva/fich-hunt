import { and, desc, eq, lte, sql } from "drizzle-orm"
import { db } from "../db"
import { MINING_CONSTANTS, bonusTransactions, userMiners, users } from "../../shared/schema"

const ACCRUAL_INTERVAL_MS = MINING_CONSTANTS.ACCRUAL_MINUTES * 60 * 1000

export async function accrueUserMiners(userId: number) {
  const now = new Date()
  const userMinerRows = await db
    .select()
    .from(userMiners)
    .where(and(eq(userMiners.userId, userId), lte(userMiners.purchasedAt, now)))
    .orderBy(desc(userMiners.purchasedAt))

  let totalAccrued = 0

  for (const miner of userMinerRows) {
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
    totalAccrued += accrued

    const newAccruedAt = new Date(lastAccruedAt.getTime() + intervals * ACCRUAL_INTERVAL_MS)

    await db
      .update(userMiners)
      .set({
        totalProfit: sql`total_profit + ${accrued}`,
        lastAccruedAt: newAccruedAt,
      })
      .where(eq(userMiners.id, miner.id))
  }

  if (totalAccrued > 0) {
    await db
      .update(users)
      .set({
        usdtBalance: sql`usdt_balance + ${totalAccrued * MINING_CONSTANTS.AUTO_CLAIM_SPLIT.purchase}`,
        internalBalance: sql`internal_balance + ${totalAccrued * MINING_CONSTANTS.AUTO_CLAIM_SPLIT.withdraw}`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))

    await db.insert(bonusTransactions).values({
      userId,
      type: "mining_accrual",
      amount: totalAccrued.toString(),
      metadata: JSON.stringify({ intervalsMinutes: MINING_CONSTANTS.ACCRUAL_MINUTES, autoClaimSplit: "50/50" }),
    })
  }

  return totalAccrued
}
