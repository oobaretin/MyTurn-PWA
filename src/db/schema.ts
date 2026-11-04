import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const households = pgTable("households", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  adminPinHash: text("admin_pin_hash"),
  timezone: text("timezone").notNull().default("America/Chicago"),
  eveningStartTime: text("evening_start_time").notNull().default("19:30"),
  morningStartTime: text("morning_start_time").notNull().default("06:30"),
  minutesPerTurn: integer("minutes_per_turn").notNull().default(15),
  schoolDaysOnly: boolean("school_days_only").notNull().default(true),
  dayOffset: integer("day_offset").notNull().default(0),
  lastActiveDate: text("last_active_date"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const kids = pgTable("kids", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: text("household_id")
    .notNull()
    .references(() => households.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color").notNull().default("#6366f1"),
  shareToken: text("share_token").notNull().unique(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kidId: uuid("kid_id")
      .notNull()
      .references(() => kids.id, { onDelete: "cascade" }),
    endpoint: text("endpoint").notNull(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("push_subscriptions_endpoint_idx").on(t.endpoint)],
);

export const dayStates = pgTable(
  "day_states",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    householdId: text("household_id")
      .notNull()
      .references(() => households.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    eveningFirstKidId: uuid("evening_first_kid_id"),
    eveningOrderKidIds: jsonb("evening_order_kid_ids")
      .$type<string[]>()
      .notNull(),
    morningOrderKidIds: jsonb("morning_order_kid_ids")
      .$type<string[]>()
      .notNull(),
    eveningTurnIndex: integer("evening_turn_index").notNull().default(0),
    morningTurnIndex: integer("morning_turn_index").notNull().default(0),
    eveningStarted: boolean("evening_started").notNull().default(false),
    morningStarted: boolean("morning_started").notNull().default(false),
    eveningLastNotifiedAt: timestamp("evening_last_notified_at", {
      withTimezone: true,
    }),
    morningLastNotifiedAt: timestamp("morning_last_notified_at", {
      withTimezone: true,
    }),
    eveningLastNotifiedIndex: integer("evening_last_notified_index")
      .notNull()
      .default(-1),
    morningLastNotifiedIndex: integer("morning_last_notified_index")
      .notNull()
      .default(-1),
  },
  (t) => [
    uniqueIndex("day_states_household_date_idx").on(t.householdId, t.date),
  ],
);

export type Household = typeof households.$inferSelect;
export type Kid = typeof kids.$inferSelect;
export type DayState = typeof dayStates.$inferSelect;
