import { eq } from "drizzle-orm"
import { db } from "../db"
import { referralLinks, users } from "../../shared/schema"

export async function createReferralChain(newUserId: number, referrerId: number) {
  let currentReferrerId: number | null = referrerId
  for (let level = 1; level <= 3; level += 1) {
    if (!currentReferrerId) break
    await db.insert(referralLinks).values({
      referrerId: currentReferrerId,
      referredUserId: newUserId,
      level,
    })
    const [next] = await db
      .select({ referrerId: users.referrerId })
      .from(users)
      .where(eq(users.id, currentReferrerId))
      .limit(1)
    currentReferrerId = next?.referrerId ?? null
  }
}

export async function getReferralChain(referrerId: number, maxLevel = 3) {
  const chain: Array<{ referrerId: number; level: number }> = []
  let currentReferrerId: number | null = referrerId

  for (let level = 1; level <= maxLevel; level += 1) {
    if (!currentReferrerId) break
    chain.push({ referrerId: currentReferrerId, level })
    const [next] = await db
      .select({ referrerId: users.referrerId })
      .from(users)
      .where(eq(users.id, currentReferrerId))
      .limit(1)
    currentReferrerId = next?.referrerId ?? null
  }

  return chain
}
