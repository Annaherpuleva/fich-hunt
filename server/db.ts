import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "../shared/schema"
import { sql } from "drizzle-orm"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required")
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  max: 100, // Увеличено до 100 для 80k пользователей
  min: 10, // Минимум 10 подключений
  idleTimeoutMillis: 120000, // 2 минуты
  connectionTimeoutMillis: 15000, // 15 секунд
  acquireTimeoutMillis: 45000, // 45 секунд
  allowExitOnIdle: false, // Не закрывать пул при неактивности
})

const DEFAULT_MINERS = [
  { name: "Core Start", icon: "⛏️", price: 10 },
  { name: "Core Base", icon: "🏭", price: 35 },
  { name: "Core Spark", icon: "⚡", price: 55 },
  { name: "Core Entry", icon: "💎", price: 80 },
  { name: "Core Rise", icon: "👑", price: 95 },
  { name: "Core Turbo", icon: "🚀", price: 120 },
  { name: "Core Pro", icon: "🏆", price: 205 },
  { name: "Core Advanced", icon: "🛰️", price: 340 },
  { name: "Core Boost", icon: "🔱", price: 430 },
  { name: "Core Prime", icon: "🪙", price: 610 },
  { name: "Core Power", icon: "🌌", price: 830 },
  { name: "Core Elite", icon: "✨", price: 988 },
  { name: "Core Apex", icon: "🌀", price: 1080 },
  { name: "Core Infinity", icon: "♾️", price: 1200 },
]

const DEFAULT_MINER_DURATION_DAYS = 7
const DEFAULT_MINER_DAILY_RATE = 0.25

// Create drizzle instance
export const db = drizzle(pool, { schema })

export { sql }

pool.on("error", (err) => {
  console.error("Database pool error (non-fatal):", err.message)
})

const ensureMinersSeeded = async () => {
  const { rows } = await pool.query("SELECT 1 FROM miners LIMIT 1")
  if (rows.length > 0) return

  const placeholders = DEFAULT_MINERS.map((_, index) => {
    const base = index * 5
    return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`
  }).join(", ")
  const values = DEFAULT_MINERS.flatMap((miner) => [
    miner.name,
    miner.icon,
    miner.price,
    DEFAULT_MINER_DURATION_DAYS,
    DEFAULT_MINER_DAILY_RATE,
  ])

  await pool.query(
    `INSERT INTO miners (name, icon, price, duration_days, daily_rate) VALUES ${placeholders}`,
    values,
  )
}

const checkConnection = async (retries = 5) => {
  for (let i = 0; i < retries; i++) {
    try {
      await pool.query("SELECT 1")
      console.log("Database connected successfully")
      if (process.env.RUN_MIGRATIONS === "true") {
        try {
          await pool.query(`
            ALTER TABLE staking_positions
            ADD COLUMN IF NOT EXISTS earned_interest NUMERIC(20, 10) DEFAULT '0' NOT NULL
          `)
          await pool.query(`
            DO $$
            BEGIN
              IF EXISTS (
                SELECT 1
                FROM pg_constraint
                WHERE conname = 'tasks_type_check'
              ) THEN
                ALTER TABLE tasks DROP CONSTRAINT tasks_type_check;
              END IF;

              IF to_regclass('public.tasks') IS NOT NULL THEN
                ALTER TABLE tasks
                  ADD CONSTRAINT tasks_type_check
                  CHECK (type IN ('channel', 'chat', 'bot', 'link'));
              END IF;
            END
            $$;
          `)
          await pool.query(`
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'user_tasks'
      AND c.relkind = 'v'
  ) THEN
    ALTER VIEW public.user_tasks RENAME TO user_tasks_view;
  END IF;

  IF to_regclass('public.user_tasks') IS NULL THEN
    CREATE TABLE public.user_tasks (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
      task_id BIGINT NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
      completed BOOLEAN NOT NULL DEFAULT FALSE,
      completed_at TIMESTAMPTZ,
      reward_claimed BOOLEAN NOT NULL DEFAULT FALSE,
      is_subscribed BOOLEAN NOT NULL DEFAULT TRUE,
      last_check_at TIMESTAMPTZ,
      penalty_applied BOOLEAN NOT NULL DEFAULT FALSE,
      CONSTRAINT user_tasks_user_task_unique UNIQUE (user_id, task_id)
    );
  END IF;
END
$$;
`);

await pool.query(`CREATE INDEX IF NOT EXISTS user_tasks_user_id_idx ON public.user_tasks(user_id);`);
await pool.query(`CREATE INDEX IF NOT EXISTS user_tasks_task_id_idx ON public.user_tasks(task_id);`);
        } catch (migrationError) {
          console.warn(
            "Skipping startup migrations for staking_positions/tasks (insufficient privileges?):",
            migrationError,
          )
        }
      }
      await ensureMinersSeeded()
      return
    } catch (err) {
      console.error(`Database connection attempt ${i + 1}/${retries} failed:`, err)
      if (i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000 * (i + 1)))
      }
    }
  }
  console.error("Failed to connect to database after retries, continuing anyway...")
}

checkConnection()
