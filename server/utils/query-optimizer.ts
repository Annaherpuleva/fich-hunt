// Query Optimizer - для 80k+ пользователей
import { db } from "../db"

// Batch операции вместо N+1 queries
export async function batchGetUsers(userIds: string[], selectFields: string[] = ["id", "withdraw_balance", "deposit_balance"]) {
  if (userIds.length === 0) return []

  const fields = selectFields.join(", ")
  const placeholders = userIds.map((_, i) => `$${i + 1}`).join(",")
  const result = await db.query(
    `SELECT ${fields} FROM users WHERE id IN (${placeholders})`,
    userIds
  )
  return result.rows
}

// Оптимизированный поиск активных майнеров
export async function getActiveMiersOptimized(limit: number = 1000, offset: number = 0) {
  const result = await db.query(
    `SELECT id, active_mining_amount, mining_rate, last_auto_accrual 
     FROM users 
     WHERE mining_started = true AND active_mining_amount > 0
     ORDER BY id
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  )
  return result.rows
}

// Batch обновление балансов вместо отдельных UPDATE'ов
export async function batchUpdateBalances(updates: Array<{ userId: string; depositDelta: number; withdrawDelta: number }>) {
  if (updates.length === 0) return []

  const cases = updates
    .map((u, i) => `('${u.userId}', ${u.depositDelta}, ${u.withdrawDelta})`)
    .join(",")

  const result = await db.query(
    `
    UPDATE users u SET
      deposit_balance = deposit_balance + v.deposit_delta,
      withdraw_balance = withdraw_balance + v.withdraw_delta
    FROM (VALUES ${cases}) AS v(user_id, deposit_delta, withdraw_delta)
    WHERE u.id = v.user_id
    RETURNING id, deposit_balance, withdraw_balance
    `
  )
  return result.rows
}

// Кэш для settings
let settingsCache: Map<string, any> = new Map()
let settingsCacheTime = 0
const SETTINGS_CACHE_TTL = 300000 // 5 минут

export async function getCachedSetting(key: string) {
  const now = Date.now()

  if (settingsCacheTime + SETTINGS_CACHE_TTL > now && settingsCache.has(key)) {
    return settingsCache.get(key)
  }

  // Обновить весь кэш если истек
  if (settingsCacheTime + SETTINGS_CACHE_TTL <= now) {
    const result = await db.query("SELECT key, value FROM settings")
    settingsCache.clear()

    result.rows.forEach((row) => {
      settingsCache.set(row.key, row.value)
    })

    settingsCacheTime = now
  }

  return settingsCache.get(key)
}

// Компактный SELECT для фронтенда
export async function getUserDataCompact(userId: string) {
  const result = await db.query(
    `SELECT 
      id, 
      withdraw_balance, 
      deposit_balance, 
      active_mining_amount, 
      mining_started,
      referral_activated,
      updated_at
     FROM users 
     WHERE id = $1`,
    [userId]
  )
  return result.rows[0]
}
