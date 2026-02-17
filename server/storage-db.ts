import { db } from "./db"
import {
  users,
  referrals,
  requiredChannels,
  tasks,
  userTasks,
  promocodes,
  promocodeUsages,
  ambassadorApplications,
  withdrawals,
  transactions,
  settings,
  type Transaction,
  type InsertTransaction,
} from "../shared/schema"
import type {
  User,
  InsertUser,
  Referral,
  InsertReferral,
  RequiredChannel,
  InsertRequiredChannel,
  Task,
  InsertTask,
  UserTask,
  InsertUserTask,
  Promocode,
  InsertPromocode,
  AmbassadorApplication,
  InsertAmbassadorApplication,
  Withdrawal,
  InsertWithdrawal,
} from "../shared/schema"
import { eq, and, desc, sql } from "drizzle-orm"

// Storage interface definition
export interface IStorage {
  getUserData: (userId: number) => Promise<any>
  getAllUsers: () => Promise<any[]>
  logNotification: (userId: number, title: string, message: string, type: string) => Promise<void>
  getSetting: (key: string) => Promise<string | null>
  setSetting: (key: string, value: string) => Promise<void>
}

const MAX_POSTGRES_INT = 2147483647

async function withRetry<T>(operation: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await operation()
    } catch (error: any) {
      const isRetryable =
        error?.message?.includes("timeout") ||
        error?.message?.includes("connection") ||
        error?.cause?.message?.includes("timeout")

      if (!isRetryable || i === retries - 1) {
        throw error
      }

      console.log(`Database operation failed, retrying (${i + 1}/${retries})...`)
      await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)))
    }
  }
  throw new Error("Max retries reached")
}

export class DatabaseStorage implements IStorage {
  // ==================== USER METHODS ====================
  async logNotification(userId: number, title: string, message: string, type: string): Promise<void> {
    try {
      const botToken = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN || ""
      if (!botToken) return

      const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1)
      if (userResult.length === 0) return

      const user = userResult[0]
      if (!user.telegramId) return

      const notificationMessage = `🔔 <b>${title}</b>\n${message}`

      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: user.telegramId,
          text: notificationMessage,
          parse_mode: "HTML",
        }),
      })
    } catch (error) {
      console.error("Failed to log notification:", error)
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    try {
      // Check if id exceeds PostgreSQL integer limit
      if (id > MAX_POSTGRES_INT) {
        // Try to find by telegramId instead
        return await this.getUserByTelegramId(String(id))
      }
      return await withRetry(async () => {
        const result = await db.select().from(users).where(eq(users.id, id)).limit(1)
        return result[0]
      })
    } catch (error) {
      console.error("Error getting user by id:", error)
      return undefined
    }
  }

  async getUserByTelegramId(telegramId: string): Promise<User | undefined> {
    try {
      return await withRetry(async () => {
        const result = await db
          .select()
          .from(users)
          .where(eq(users.telegramId, String(telegramId)))
          .limit(1)
        return result[0]
      })
    } catch (error) {
      console.error("Error getting user by telegramId:", error)
      return undefined
    }
  }

  async getUserByReferralCode(referralCode: string): Promise<User | undefined> {
    try {
      return await withRetry(async () => {
        const result = await db.select().from(users).where(eq(users.referralCode, referralCode)).limit(1)
        return result[0]
      })
    } catch (error) {
      console.error("Error getting user by referralCode:", error)
      return undefined
    }
  }

  async getAllUsers(): Promise<User[]> {
    return await withRetry(async () => {
      return await db.select().from(users).orderBy(desc(users.createdAt))
    })
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    return await withRetry(
      async () => {
        const existing = await db
          .select()
          .from(users)
          .where(eq(users.telegramId, String(insertUser.telegramId)))
          .limit(1)

        if (existing[0]) {
          // User already exists, return existing user
          return existing[0]
        }

        try {
          const result = await db
            .insert(users)
            .values({
              ...insertUser,
              telegramId: String(insertUser.telegramId),
            })
            .returning()
          return result[0]
        } catch (error: any) {
          if (error?.cause?.code === "23505" && error?.cause?.constraint === "users_telegram_id_unique") {
            // User was created by another request, fetch and return it
            const existing = await db
              .select()
              .from(users)
              .where(eq(users.telegramId, String(insertUser.telegramId)))
              .limit(1)
            if (existing[0]) {
              return existing[0]
            }
          }
          throw error
        }
      },
      5,
      2000,
    ) // 5 попыток с увеличенной задержкой
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    return await withRetry(async () => {
      if (updates.walletAddress) {
        const existingUser = await this.getUser(id)
        if (existingUser?.walletAddress && existingUser.walletAddress !== updates.walletAddress) {
          throw new Error("Wallet address cannot be changed once set")
        }
      }

      const result = await db
        .update(users)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning()
      return result[0]
    })
  }

  async getUsersCount(): Promise<number> {
    const result = await withRetry(async () => {
      const result = await db.select({ count: sql<number>`count(*)` }).from(users)
      return Number(result[0].count)
    })
    return result
  }

  // ==================== REFERRAL METHODS ====================
  async getReferralsByReferrer(referrerId: number): Promise<Referral[]> {
    return await withRetry(async () => {
      return await db.select().from(referrals).where(eq(referrals.referrerId, referrerId))
    })
  }

  async getReferralsByLevel(referrerId: number, level: number): Promise<Referral[]> {
    return await withRetry(async () => {
      const result = await db
        .select()
        .from(referrals)
        .innerJoin(users, eq(referrals.referredId, users.id))
        .where(
          and(eq(referrals.referrerId, referrerId), eq(referrals.level, level), eq(users.referralActivated, true)),
        )

      return result.map((row) => row.referrals)
    })
  }

  async getReferralByReferrerAndReferred(referrerId: number, referredId: number): Promise<Referral | undefined> {
    const result = await withRetry(async () => {
      const result = await db
        .select()
        .from(referrals)
        .where(and(eq(referrals.referrerId, referrerId), eq(referrals.referredId, referredId)))
        .limit(1)
      return result[0]
    })
    return result
  }

  async getReferralByReferredId(referredId: number): Promise<Referral | undefined> {
    const result = await withRetry(async () => {
      const result = await db.select().from(referrals).where(eq(referrals.referredId, referredId)).limit(1)
      return result[0]
    })
    return result
  }

  async createReferral(insertReferral: InsertReferral): Promise<Referral> {
    const result = await withRetry(async () => {
      const result = await db.insert(referrals).values(insertReferral).returning()
      return result[0]
    })
    return result
  }

  async getReferralCount(referrerId: number, level: number): Promise<number> {
    const result = await withRetry(async () => {
      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(referrals)
        .where(and(eq(referrals.referrerId, referrerId), eq(referrals.level, level)))
      return Number(result[0].count)
    })
    return result
  }

  async updateReferralCollectEarnings(referrerId: number, referredId: number, amount: string): Promise<void> {
    await withRetry(async () => {
      const existing = await db
        .select()
        .from(referrals)
        .where(and(eq(referrals.referrerId, referrerId), eq(referrals.referredId, referredId)))
        .limit(1)

      if (existing.length > 0) {
        const currentEarnings = Number.parseFloat(existing[0].collectEarnings || "0")
        const addAmount = Number.parseFloat(amount)
        const newEarnings = (currentEarnings + addAmount).toFixed(10)

        await db
          .update(referrals)
          .set({ collectEarnings: newEarnings })
          .where(and(eq(referrals.referrerId, referrerId), eq(referrals.referredId, referredId)))
      }
    })
  }

  // ==================== REQUIRED CHANNELS METHODS ====================
  async getRequiredChannels(): Promise<RequiredChannel[]> {
    return await withRetry(async () => {
      return await db.select().from(requiredChannels).where(eq(requiredChannels.isActive, true))
    })
  }

  async getAllRequiredChannels(): Promise<RequiredChannel[]> {
    return await withRetry(async () => {
      return await db.select().from(requiredChannels)
    })
  }

  async createRequiredChannel(insertChannel: InsertRequiredChannel): Promise<RequiredChannel> {
    const result = await withRetry(async () => {
      const result = await db.insert(requiredChannels).values(insertChannel).returning()
      return result[0]
    })
    return result
  }

  async updateRequiredChannel(id: number, updates: Partial<RequiredChannel>): Promise<RequiredChannel> {
    const result = await withRetry(async () => {
      const result = await db.update(requiredChannels).set(updates).where(eq(requiredChannels.id, id)).returning()
      return result[0]
    })
    return result
  }

  async deleteRequiredChannel(id: number): Promise<void> {
    await withRetry(async () => {
      await db.delete(requiredChannels).where(eq(requiredChannels.id, id))
    })
  }

  // ==================== TASK METHODS ====================
  async getTask(id: number): Promise<Task | undefined> {
    const result = await withRetry(async () => {
      const result = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1)
      return result[0]
    })
    return result
  }

  async getAllTasks(): Promise<Task[]> {
    return await withRetry(async () => {
      return await db.select().from(tasks)
    })
  }

  async getActiveTasks(): Promise<Task[]> {
    return await withRetry(async () => {
      return await db.select().from(tasks).where(eq(tasks.isActive, true))
    })
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const result = await withRetry(async () => {
      const result = await db.insert(tasks).values(insertTask).returning()
      return result[0]
    })
    return result
  }

  async updateTask(id: number, updates: Partial<Task>): Promise<Task> {
    const result = await withRetry(async () => {
      const result = await db.update(tasks).set(updates).where(eq(tasks.id, id)).returning()
      return result[0]
    })
    return result
  }

  async deleteTask(id: number): Promise<void> {
    await withRetry(async () => {
      await db.delete(userTasks).where(eq(userTasks.taskId, id))
      await db.delete(tasks).where(eq(tasks.id, id))
    })
  }

  // ==================== USER TASK METHODS ====================
  async getUserTask(userId: number, taskId: number): Promise<UserTask | undefined> {
    const result = await withRetry(async () => {
      const result = await db
        .select()
        .from(userTasks)
        .where(and(eq(userTasks.userId, userId), eq(userTasks.taskId, taskId)))
        .limit(1)
      return result[0]
    })
    return result
  }

  async getUserTasks(userId: number): Promise<UserTask[]> {
    return await withRetry(async () => {
      return await db.select().from(userTasks).where(eq(userTasks.userId, userId))
    })
  }

  async createUserTask(insertUserTask: InsertUserTask): Promise<UserTask> {
    const result = await withRetry(async () => {
      const result = await db.insert(userTasks).values(insertUserTask).returning()
      return result[0]
    })
    return result
  }

  async updateUserTask(id: number, updates: Partial<UserTask>): Promise<UserTask> {
    const result = await withRetry(async () => {
      const result = await db.update(userTasks).set(updates).where(eq(userTasks.id, id)).returning()
      return result[0]
    })
    return result
  }

  // ==================== PROMOCODE METHODS ====================
  async getPromocode(id: number): Promise<Promocode | undefined> {
    const result = await withRetry(async () => {
      const result = await db.select().from(promocodes).where(eq(promocodes.id, id)).limit(1)
      return result[0]
    })
    return result
  }

  async getPromocodeByCode(code: string): Promise<Promocode | undefined> {
    const result = await withRetry(async () => {
      const result = await db.select().from(promocodes).where(eq(promocodes.code, code.toUpperCase())).limit(1)
      return result[0]
    })
    return result
  }

  async getAllPromocodes(): Promise<Promocode[]> {
    return await withRetry(async () => {
      return await db.select().from(promocodes).orderBy(desc(promocodes.createdAt))
    })
  }

  async createPromocode(insertPromocode: InsertPromocode): Promise<Promocode> {
    const result = await withRetry(async () => {
      const result = await db
        .insert(promocodes)
        .values({ ...insertPromocode, code: insertPromocode.code.toUpperCase() })
        .returning()
      return result[0]
    })
    return result
  }

  async updatePromocode(id: number, updates: Partial<Promocode>): Promise<Promocode> {
    const result = await withRetry(async () => {
      const result = await db.update(promocodes).set(updates).where(eq(promocodes.id, id)).returning()
      return result[0]
    })
    return result
  }

  async incrementPromocodeUsage(id: number): Promise<void> {
    await withRetry(async () => {
      await db
        .update(promocodes)
        .set({ usedCount: sql`${promocodes.usedCount} + 1` })
        .where(eq(promocodes.id, id))
    })
  }

  async deletePromocode(id: number): Promise<void> {
    await withRetry(async () => {
      await db.delete(promocodeUsages).where(eq(promocodeUsages.promocodeId, id))
      await db.delete(promocodes).where(eq(promocodes.id, id))
    })
  }

  // ==================== PROMOCODE USAGE METHODS ====================
  async hasUserUsedPromocode(userId: number, promocodeId: number): Promise<boolean> {
    const result = await withRetry(async () => {
      const result = await db
        .select()
        .from(promocodeUsages)
        .where(and(eq(promocodeUsages.userId, userId), eq(promocodeUsages.promocodeId, promocodeId)))
        .limit(1)
      return result.length > 0
    })
    return result
  }

  async createPromocodeUsage(userId: number, promocodeId: number): Promise<void> {
    await withRetry(async () => {
      await db.insert(promocodeUsages).values({ userId, promocodeId })
    })
  }

  // ==================== AMBASSADOR APPLICATION METHODS ====================
  async getAmbassadorApplication(id: number): Promise<AmbassadorApplication | undefined> {
    const result = await withRetry(async () => {
      const result = await db.select().from(ambassadorApplications).where(eq(ambassadorApplications.id, id)).limit(1)
      return result[0]
    })
    return result
  }

  async getUserAmbassadorApplication(userId: number): Promise<AmbassadorApplication | undefined> {
    const result = await withRetry(async () => {
      const result = await db
        .select()
        .from(ambassadorApplications)
        .where(eq(ambassadorApplications.userId, userId))
        .orderBy(desc(ambassadorApplications.createdAt))
        .limit(1)
      return result[0]
    })
    return result
  }

  async getAllAmbassadorApplications(): Promise<AmbassadorApplication[]> {
    return await withRetry(async () => {
      return await db.select().from(ambassadorApplications).orderBy(desc(ambassadorApplications.createdAt))
    })
  }

  async getPendingAmbassadorApplications(): Promise<AmbassadorApplication[]> {
    return await withRetry(async () => {
      return await db
        .select()
        .from(ambassadorApplications)
        .where(eq(ambassadorApplications.status, "pending"))
        .orderBy(desc(ambassadorApplications.createdAt))
    })
  }

  async createAmbassadorApplication(insertApplication: InsertAmbassadorApplication): Promise<AmbassadorApplication> {
    const result = await withRetry(async () => {
      const result = await db.insert(ambassadorApplications).values(insertApplication).returning()
      return result[0]
    })
    return result
  }

  async updateAmbassadorApplication(
    id: number,
    updates: Partial<AmbassadorApplication>,
  ): Promise<AmbassadorApplication | undefined> {
    const result = await withRetry(async () => {
      const result = await db
        .update(ambassadorApplications)
        .set(updates)
        .where(eq(ambassadorApplications.id, id))
        .returning()
      return result[0]
    })
    return result
  }

  async deleteAmbassadorApplication(id: number): Promise<void> {
    await withRetry(async () => {
      await db.delete(ambassadorApplications).where(eq(ambassadorApplications.id, id))
    })
  }

  // ==================== WITHDRAWAL METHODS ====================
  async getWithdrawal(id: number): Promise<Withdrawal | undefined> {
    const result = await withRetry(async () => {
      const result = await db.select().from(withdrawals).where(eq(withdrawals.id, id)).limit(1)
      return result[0]
    })
    return result
  }

  async getUserWithdrawals(userId: number): Promise<Withdrawal[]> {
    return await withRetry(async () => {
      return await db
        .select()
        .from(withdrawals)
        .where(eq(withdrawals.userId, userId))
        .orderBy(desc(withdrawals.createdAt))
    })
  }

  async getAllWithdrawals(): Promise<Withdrawal[]> {
    return await withRetry(async () => {
      return await db.select().from(withdrawals).orderBy(desc(withdrawals.createdAt))
    })
  }

  async getPendingWithdrawals(): Promise<Withdrawal[]> {
    return await withRetry(async () => {
      return await db
        .select()
        .from(withdrawals)
        .where(eq(withdrawals.status, "pending"))
        .orderBy(desc(withdrawals.createdAt))
    })
  }

  async createWithdrawal(insertWithdrawal: InsertWithdrawal): Promise<Withdrawal> {
    const result = await withRetry(async () => {
      const result = await db.insert(withdrawals).values(insertWithdrawal).returning()
      return result[0]
    })
    return result
  }

  async updateWithdrawal(id: number, updates: Partial<Withdrawal>): Promise<Withdrawal> {
    const result = await withRetry(async () => {
      const result = await db.update(withdrawals).set(updates).where(eq(withdrawals.id, id)).returning()
      return result[0]
    })
    return result
  }

  // ==================== TRANSACTION METHODS ====================
  async getTransaction(id: number): Promise<Transaction | undefined> {
    const result = await withRetry(async () => {
      const result = await db.select().from(transactions).where(eq(transactions.id, id)).limit(1)
      return result[0]
    })
    return result
  }

  async getUserTransactions(userId: number): Promise<Transaction[]> {
    return await withRetry(async () => {
      return await db
        .select()
        .from(transactions)
        .where(eq(transactions.userId, userId))
        .orderBy(desc(transactions.createdAt))
    })
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return await withRetry(async () => {
      return await db.select().from(transactions).orderBy(desc(transactions.createdAt))
    })
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const result = await withRetry(async () => {
      const result = await db.insert(transactions).values(insertTransaction).returning()
      return result[0]
    })
    return result
  }

  // ==================== MINING ACTIVATION BALANCE METHODS ====================
  async getTonBalance(userId: number): Promise<string> {
    try {
      const user = await this.getUser(userId)
      return user?.tonBalance || "0"
    } catch {
      return "0"
    }
  }

  async getUsdtBalance(userId: number): Promise<string> {
    try {
      const user = await this.getUser(userId)
      return user?.usdtBalance || "0"
    } catch {
      return "0"
    }
  }

  async getBalances(userId: number): Promise<{ tonBalance: string; usdtBalance: string }> {
    try {
      const user = await this.getUser(userId)
      return {
        tonBalance: user?.tonBalance || "0",
        usdtBalance: user?.usdtBalance || "0",
      }
    } catch {
      return { tonBalance: "0", usdtBalance: "0" }
    }
  }

  async deductTonBalance(userId: number, amount: string): Promise<boolean> {
    return await withRetry(async () => {
      const user = await this.getUser(userId)
      if (!user) return false

      const currentBalance = Number.parseFloat(user.tonBalance || "0")
      const deductAmount = Number.parseFloat(amount)

      if (currentBalance < deductAmount) {
        throw new Error("Insufficient TON balance")
      }

      const newBalance = (currentBalance - deductAmount).toFixed(10)
      await this.updateUser(userId, { tonBalance: newBalance })
      return true
    })
  }

  async deductUsdtBalance(userId: number, amount: string): Promise<boolean> {
    return await withRetry(async () => {
      const user = await this.getUser(userId)
      if (!user) return false

      const currentBalance = Number.parseFloat(user.usdtBalance || "0")
      const deductAmount = Number.parseFloat(amount)

      if (currentBalance < deductAmount) {
        throw new Error("Insufficient USDT balance")
      }

      const newBalance = (currentBalance - deductAmount).toFixed(10)
      await this.updateUser(userId, { usdtBalance: newBalance })
      return true
    })
  }

  async addTonBalance(userId: number, amount: string): Promise<boolean> {
    return await withRetry(async () => {
      const user = await this.getUser(userId)
      if (!user) return false

      const currentBalance = Number.parseFloat(user.tonBalance || "0")
      const addAmount = Number.parseFloat(amount)
      const newBalance = (currentBalance + addAmount).toFixed(10)

      await this.updateUser(userId, { tonBalance: newBalance })
      return true
    })
  }

  async addUsdtBalance(userId: number, amount: string): Promise<boolean> {
    return await withRetry(async () => {
      const user = await this.getUser(userId)
      if (!user) return false

      const currentBalance = Number.parseFloat(user.usdtBalance || "0")
      const addAmount = Number.parseFloat(amount)
      const newBalance = (currentBalance + addAmount).toFixed(10)

      await this.updateUser(userId, { usdtBalance: newBalance })
      return true
    })
  }

  // ==================== INIT ====================
  async initializeSettings(): Promise<void> {
    const defaultSettings = [
      { key: "min_withdrawal", value: "0.4" },
      { key: "min_withdrawal_ton", value: "0.4" },
      { key: "min_withdrawal_usdt", value: "2" }, // ~5 USD
      { key: "daily_mining_percent", value: "25" }, // 25% per 24 hours
      // 5 levels of referral bonuses (registration bonus)
      { key: "referral_level_1_bonus", value: "0.01" },
      { key: "referral_level_2_bonus", value: "0.01" },
      { key: "referral_level_3_bonus", value: "0.01" },
      { key: "referral_level_4_bonus", value: "0.0" },
      { key: "referral_level_5_bonus", value: "0.0" },
      // 5 levels of referral percents (profit bonus)
      { key: "referral_level_1_percent", value: "10" }, // 10%
      { key: "referral_level_2_percent", value: "5" }, // 5%
      { key: "referral_level_3_percent", value: "3" }, // 3%
      { key: "referral_level_4_percent", value: "0" }, // 0%
      { key: "referral_level_5_percent", value: "0" }, // 0%
      { key: "withdrawal_fee", value: "1.5" }, // 1.5%
    ]

    for (const setting of defaultSettings) {
      const existing = await this.getSetting(setting.key)
      if (!existing) {
        await this.updateSetting(setting.key, setting.value)
      }
    }
  }
}

export const dbStorage = new DatabaseStorage()
export const storage = dbStorage // Alias for convenience
