import type { Express, Request, Response } from "express"
import { and, desc, eq, sql } from "drizzle-orm"
import { db } from "../db"
import { registerBrowserAccessGuards } from "../middleware/browserAccess"
import { verifyJWT } from "../middleware/jwt"
import { promoCodes, referralLinks, referralOverrides, users, walletDeposits, walletWithdrawals } from "../../shared/schema"
import { enqueueWithdrawal } from "./withdrawals"

async function requireAdmin(req: Request, res: Response) {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" })
    return null
  }

  const [user] = await db
    .select({ isAdmin: users.isAdmin })
    .from(users)
    .where(eq(users.id, Number(req.user.sub)))
    .limit(1)

  if (!user?.isAdmin) {
    res.status(403).json({ error: "Forbidden" })
    return null
  }

  return user
}

export function setupAdminRoutes(app: Express) {
  registerBrowserAccessGuards(app)

  app.get("/api/admin/stats", verifyJWT, async (req, res) => {
    if (!(await requireAdmin(req, res))) {
      return
    }

    const [{ totalUsers }] = await db.select({ totalUsers: sql<number>`count(*)` }).from(users)
    const [{ totalDeposited }] = await db
      .select({ totalDeposited: sql<number>`coalesce(sum(amount), 0)` })
      .from(walletDeposits)
      .where(eq(walletDeposits.status, "confirmed"))
    const [{ totalWithdrawn }] = await db
      .select({ totalWithdrawn: sql<number>`coalesce(sum(amount), 0)` })
      .from(walletWithdrawals)
      .where(eq(walletWithdrawals.status, "completed"))
    const [{ totalCommission }] = await db
      .select({ totalCommission: sql<number>`coalesce(sum(commission), 0)` })
      .from(walletWithdrawals)
      .where(eq(walletWithdrawals.status, "completed"))

    res.json({
      totalUsers,
      totalDeposited,
      totalWithdrawn,
      totalCommission,
    })
  })

  app.get("/api/admin/withdrawals", verifyJWT, async (req, res) => {
    if (!(await requireAdmin(req, res))) {
      return
    }

    const withdrawals = await db
      .select({
        id: walletWithdrawals.id,
        userId: walletWithdrawals.userId,
        username: users.username,
        telegramId: users.telegramId,
        walletAddress: walletWithdrawals.walletAddress,
        addressExtra: walletWithdrawals.addressExtra,
        amount: walletWithdrawals.amount,
        currency: walletWithdrawals.currency,
        commission: walletWithdrawals.commission,
        transactionHash: walletWithdrawals.transactionHash,
        status: walletWithdrawals.status,
        createdAt: walletWithdrawals.createdAt,
      })
      .from(walletWithdrawals)
      .leftJoin(users, eq(walletWithdrawals.userId, users.id))
      .orderBy(desc(walletWithdrawals.createdAt))

    res.json(withdrawals)
  })

  app.post("/api/admin/withdrawals/:id/approve", verifyJWT, async (req, res) => {
    if (!(await requireAdmin(req, res))) {
      return
    }

    const withdrawalId = Number(req.params.id)
    const [withdrawal] = await db
      .select({ status: walletWithdrawals.status })
      .from(walletWithdrawals)
      .where(eq(walletWithdrawals.id, withdrawalId))
      .limit(1)

    if (!withdrawal) {
      return res.status(404).json({ error: "Withdrawal not found" })
    }

    if (withdrawal.status !== "pending") {
      return res.status(400).json({ error: "Withdrawal cannot be approved in current status" })
    }

    enqueueWithdrawal(withdrawalId)

    res.json({ success: true })
  })

  app.post("/api/admin/withdrawals/:id/reject", verifyJWT, async (req, res) => {
    if (!(await requireAdmin(req, res))) {
      return
    }

    const withdrawalId = Number(req.params.id)
    const [withdrawal] = await db
      .select({
        amount: walletWithdrawals.amount,
        currency: walletWithdrawals.currency,
        userId: walletWithdrawals.userId,
        status: walletWithdrawals.status,
      })
      .from(walletWithdrawals)
      .where(eq(walletWithdrawals.id, withdrawalId))
      .limit(1)

    if (!withdrawal) {
      return res.status(404).json({ error: "Withdrawal not found" })
    }

    if (withdrawal.status !== "pending") {
      return res.status(400).json({ error: "Withdrawal cannot be rejected in current status" })
    }

    if (String(withdrawal.currency).toUpperCase().startsWith("USDT")) {
      await db
        .update(users)
        .set({
          internalBalance: sql`internal_balance + ${withdrawal.amount}`,
          updatedAt: new Date(),
        })
        .where(eq(users.id, withdrawal.userId))
    }

    await db
      .update(walletWithdrawals)
      .set({ status: "rejected", updatedAt: new Date() })
      .where(eq(walletWithdrawals.id, withdrawalId))

    res.json({ success: true })
  })

  app.get("/api/admin/referrals/:userId", verifyJWT, async (req, res) => {
    if (!(await requireAdmin(req, res))) {
      return
    }

    const userId = Number(req.params.userId)
    const levels = await db
      .select({
        referrerId: referralLinks.referrerId,
        referredUserId: referralLinks.referredUserId,
        level: referralLinks.level,
      })
      .from(referralLinks)
      .where(eq(referralLinks.referrerId, userId))

    res.json({ levels })
  })

  app.post("/api/admin/internal-balance", verifyJWT, async (req, res) => {
    if (!(await requireAdmin(req, res))) {
      return
    }

    const { username, amount } = req.body as { username?: string; amount?: number }
    const normalizedUsername = username?.trim().replace(/^@/, "")
    if (!normalizedUsername || !amount) {
      return res.status(400).json({ error: "username and amount are required" })
    }

    const [user] = await db.select({ id: users.id }).from(users).where(eq(users.username, normalizedUsername)).limit(1)
    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    await db
      .update(users)
      .set({ internalBalance: sql`internal_balance + ${amount}`, updatedAt: new Date() })
      .where(eq(users.id, user.id))

    res.json({ success: true })
  })

  app.post("/api/admin/referral-overrides", verifyJWT, async (req, res) => {
    if (!(await requireAdmin(req, res))) {
      return
    }

    const { username, level1Rate, level2Rate, level3Rate } = req.body as {
      username?: string
      level1Rate?: number
      level2Rate?: number
      level3Rate?: number
    }
    const normalizedUsername = username?.trim().replace(/^@/, "")
    if (!normalizedUsername) {
      return res.status(400).json({ error: "username is required" })
    }

    const [target] = await db.select({ id: users.id }).from(users).where(eq(users.username, normalizedUsername)).limit(1)
    if (!target) {
      return res.status(404).json({ error: "User not found" })
    }

    const payload = {
      userId: target.id,
      level1Rate: (level1Rate ?? 0.1).toString(),
      level2Rate: (level2Rate ?? 0.06).toString(),
      level3Rate: (level3Rate ?? 0.03).toString(),
      updatedAt: new Date(),
    }

    const [existing] = await db.select({ id: referralOverrides.id }).from(referralOverrides).where(eq(referralOverrides.userId, target.id)).limit(1)
    if (existing) {
      await db.update(referralOverrides).set(payload).where(eq(referralOverrides.userId, target.id))
    } else {
      await db.insert(referralOverrides).values(payload)
    }

    res.json({ success: true })
  })

  app.get("/api/admin/promocodes", verifyJWT, async (req, res) => {
    if (!(await requireAdmin(req, res))) {
      return
    }

    const rows = await db.select().from(promoCodes).orderBy(desc(promoCodes.createdAt))
    res.json(rows)
  })

  app.post("/api/admin/promocodes", verifyJWT, async (req, res) => {
    if (!(await requireAdmin(req, res))) {
      return
    }

    const { code, bonusAmount, maxActivations } = req.body as {
      code?: string
      bonusAmount?: string
      maxActivations?: number
    }
    if (!bonusAmount) {
      return res.status(400).json({ error: "bonusAmount is required" })
    }

    const generatedCode = code?.trim().toUpperCase() || `PROMO${Date.now().toString().slice(-6)}`
    const [created] = await db
      .insert(promoCodes)
      .values({
        code: generatedCode,
        reward: bonusAmount,
        maxActivations: maxActivations ?? 1,
        active: true,
      })
      .returning()

    res.json(created)
  })

  app.delete("/api/admin/promocodes/:id", verifyJWT, async (req, res) => {
    if (!(await requireAdmin(req, res))) {
      return
    }

    const promoId = Number(req.params.id)
    await db.update(promoCodes).set({ active: false }).where(eq(promoCodes.id, promoId))
    res.json({ success: true })
  })

}
