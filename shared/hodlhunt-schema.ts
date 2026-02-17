import {
  bigint,
  boolean,
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const fishStatusEnum = pgEnum("fish_status", ["alive", "dead", "exited"])
export const paymentDirectionEnum = pgEnum("payment_direction", ["deposit", "withdraw"])
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "confirmed", "failed"])

export const hhUsers = pgTable("hh_users", {
  id: serial("id").primaryKey(),
  telegramId: varchar("telegram_id", { length: 64 }).notNull().unique(),
  username: varchar("username", { length: 64 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const hhWallets = pgTable("hh_wallets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => hhUsers.id, { onDelete: "cascade", onUpdate: "cascade" }),
  tonAddress: varchar("ton_address", { length: 128 }).notNull(),
  isVerified: boolean("is_verified").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userTonAddressUniqueIdx: uniqueIndex("hh_wallets_user_ton_address_unique_idx").on(table.userId, table.tonAddress),
  tonAddressUniqueIdx: uniqueIndex("hh_wallets_ton_address_unique_idx").on(table.tonAddress),
}))

export const hhOceanState = pgTable("hh_ocean_state", {
  id: integer("id").primaryKey().default(1),
  totalFishCount: integer("total_fish_count").notNull().default(0),
  totalShares: bigint("total_shares", { mode: "bigint" }).notNull().default(BigInt(0)),
  balanceUnits: bigint("balance_units", { mode: "bigint" }).notNull().default(BigInt(0)),
  isStorm: boolean("is_storm").notNull().default(false),
  feedingPercentageBps: integer("feeding_percentage_bps").notNull().default(500),
  stormProbabilityBps: integer("storm_probability_bps").notNull().default(350),
  cycleStartTime: timestamp("cycle_start_time", { withTimezone: true }).notNull().defaultNow(),
  nextModeChangeTime: timestamp("next_mode_change_time", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  singleRowIdCheck: check("hh_ocean_state_single_row_id_check", sql`${table.id} = 1`),
  totalFishCountCheck: check("hh_ocean_state_total_fish_count_check", sql`${table.totalFishCount} >= 0`),
  totalSharesCheck: check("hh_ocean_state_total_shares_check", sql`${table.totalShares} >= 0`),
  balanceUnitsCheck: check("hh_ocean_state_balance_units_check", sql`${table.balanceUnits} >= 0`),
  feedingPercentageBpsRangeCheck: check(
    "hh_ocean_state_feeding_percentage_bps_range_check",
    sql`${table.feedingPercentageBps} BETWEEN 0 AND 10000`,
  ),
  stormProbabilityBpsRangeCheck: check(
    "hh_ocean_state_storm_probability_bps_range_check",
    sql`${table.stormProbabilityBps} BETWEEN 0 AND 10000`,
  ),
  nextModeAfterCycleStartCheck: check(
    "hh_ocean_state_next_mode_after_cycle_start_check",
    sql`${table.nextModeChangeTime} >= ${table.cycleStartTime}`,
  ),
}))

export const hhFish = pgTable(
  "hh_fish",
  {
    id: serial("id").primaryKey(),
    ownerUserId: integer("owner_user_id")
      .notNull()
      .references(() => hhUsers.id, { onDelete: "restrict", onUpdate: "cascade" }),
    name: varchar("name", { length: 120 }).notNull(),
    share: bigint("share", { mode: "bigint" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastFedAt: timestamp("last_fed_at", { withTimezone: true }),
    lastHuntAt: timestamp("last_hunt_at", { withTimezone: true }),
    canHuntAfter: timestamp("can_hunt_after", { withTimezone: true }),
    isProtected: boolean("is_protected").notNull().default(false),
    protectionEndsAt: timestamp("protection_ends_at", { withTimezone: true }),
    markedByFishId: integer("marked_by_fish_id"),
    markExpiresAt: timestamp("mark_expires_at", { withTimezone: true }),
    status: fishStatusEnum("status").notNull().default("alive"),
    version: integer("version").notNull().default(1),
  },
  (table) => ({
    ownerStatusIdx: index("hh_fish_owner_status_idx").on(table.ownerUserId, table.status),
    ownerCreatedIdx: index("hh_fish_owner_created_idx").on(table.ownerUserId, table.createdAt),
    statusCanHuntAfterIdx: index("hh_fish_status_can_hunt_after_idx").on(table.status, table.canHuntAfter),
    sharePositiveCheck: check("hh_fish_share_positive_check", sql`${table.share} > 0`),
    versionPositiveCheck: check("hh_fish_version_positive_check", sql`${table.version} > 0`),
    markExpiresRequiresMarkCheck: check(
      "hh_fish_mark_expires_requires_mark_check",
      sql`${table.markExpiresAt} IS NULL OR ${table.markedByFishId} IS NOT NULL`,
    ),
    protectionEndsRequiresProtectionCheck: check(
      "hh_fish_protection_ends_requires_protection_check",
      sql`${table.protectionEndsAt} IS NULL OR ${table.isProtected} = true`,
    ),
    fishOwnerFk: foreignKey({
      name: "hh_fish_owner_fk",
      columns: [table.ownerUserId],
      foreignColumns: [hhUsers.id],
    }),
    markedByFishFk: foreignKey({
      name: "hh_fish_marked_by_fish_fk",
      columns: [table.markedByFishId],
      foreignColumns: [table.id],
    }),
  }),
)

export const hhPayments = pgTable(
  "hh_payments",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => hhUsers.id, { onDelete: "restrict", onUpdate: "cascade" }),
    direction: paymentDirectionEnum("direction").notNull(),
    asset: varchar("asset", { length: 32 }).notNull().default("TON"),
    amount: bigint("amount", { mode: "bigint" }).notNull(),
    status: paymentStatusEnum("status").notNull().default("pending"),
    txHash: varchar("tx_hash", { length: 128 }),
    memo: varchar("memo", { length: 128 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    statusDirectionCreatedIdx: index("hh_payments_status_direction_created_idx").on(
      table.status,
      table.direction,
      table.createdAt,
    ),
    memoUniqueIdx: uniqueIndex("hh_payments_memo_unique_idx").on(table.memo),
    txHashUniqueIdx: uniqueIndex("hh_payments_tx_hash_unique_idx").on(table.txHash),
    amountPositiveCheck: check("hh_payments_amount_positive_check", sql`${table.amount} > 0`),
    memoRequiredForDepositCheck: check(
      "hh_payments_memo_required_for_deposit_check",
      sql`${table.direction} <> 'deposit' OR ${table.memo} IS NOT NULL`,
    ),
    txHashRequiredForConfirmedCheck: check(
      "hh_payments_tx_hash_required_for_confirmed_check",
      sql`${table.status} <> 'confirmed' OR ${table.txHash} IS NOT NULL`,
    ),
  }),
)

export const hhLedgerEntries = pgTable(
  "hh_ledger_entries",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => hhUsers.id, { onDelete: "restrict", onUpdate: "cascade" }),
    paymentId: integer("payment_id").references(() => hhPayments.id, {
      onDelete: "restrict",
      onUpdate: "cascade",
    }),
    delta: bigint("delta", { mode: "bigint" }).notNull(),
    reason: text("reason").notNull(),
    refId: varchar("ref_id", { length: 128 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userCreatedAtIdx: index("hh_ledger_entries_user_created_idx").on(table.userId, table.createdAt),
    paymentIdIdx: index("hh_ledger_entries_payment_id_idx").on(table.paymentId),
    paymentEntryUniqueIdx: uniqueIndex("hh_ledger_entries_payment_unique_idx").on(table.paymentId),
    nonZeroDeltaCheck: check("hh_ledger_entries_non_zero_delta_check", sql`${table.delta} <> 0`),
  }),
)

export const hhGameEvents = pgTable(
  "hh_game_events",
  {
    id: serial("id").primaryKey(),
    eventType: varchar("event_type", { length: 64 }).notNull(),
    fishId: integer("fish_id").references(() => hhFish.id, { onDelete: "set null", onUpdate: "cascade" }),
    actorUserId: integer("actor_user_id").references(() => hhUsers.id, { onDelete: "set null", onUpdate: "cascade" }),
    payloadJson: jsonb("payload_json"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    typeCreatedAtIdx: index("hh_game_events_type_created_idx").on(table.eventType, table.createdAt),
  }),
)
