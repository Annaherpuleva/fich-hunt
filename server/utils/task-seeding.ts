import { db } from "../db"
import { tasks } from "../../shared/schema"

export const DEFAULT_TASKS = [
  { key: "welcome_bonus", title: "Welcome bonus", reward: 0.5 },
  { key: "first_miner", title: "Rent your first power", reward: 2 },
  { key: "invite_friend", title: "Invite your first friend", reward: 0.1 },
  { key: "chat_bonus", title: "Subscribe to the chat", reward: 0.1 },
  { key: "channel_bonus", title: "Subscribe to the channel", reward: 0.1 },
]

export async function ensureTasksSeeded() {
  const existing = await db.select({ id: tasks.id }).from(tasks).limit(1)
  if (existing.length > 0) return

  await db.insert(tasks).values(
    DEFAULT_TASKS.map((task) => ({
      key: task.key,
      title: task.title,
      reward: task.reward.toString(),
      createdAt: new Date(),
    })),
  )
}
