import { boolean, check, index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 120 }).notNull(),
  email: varchar('email', { length: 320 }).notNull(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({ emailIdx: uniqueIndex('users_email_idx').on(t.email) }));

export const dailyRecords = pgTable('daily_records', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull(),
  glucose: integer('glucose'), glucoseContext: varchar('glucose_context', { length: 30 }),
  systolicPressure: integer('systolic_pressure'), diastolicPressure: integer('diastolic_pressure'),
  heartRate: integer('heart_rate'), weight: integer('weight'), symptoms: text('symptoms'), notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({ userDateIdx: index('daily_records_user_recorded_idx').on(t.userId, t.recordedAt), valuesCheck: check('daily_records_values_check', sql`(glucose is null or glucose between 20 and 1000) and (systolic_pressure is null or systolic_pressure between 40 and 300) and (diastolic_pressure is null or diastolic_pressure between 20 and 200) and (heart_rate is null or heart_rate between 20 and 250)`)}));

export const medications = pgTable('medications', {
  id: uuid('id').defaultRandom().primaryKey(), userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 160 }).notNull(), dosage: varchar('dosage', { length: 120 }).notNull(), schedule: jsonb('schedule').$type<string[]>().notNull().default([]), notes: text('notes'), active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(), updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({ userIdx: index('medications_user_idx').on(t.userId) }));

export const medicationLogs = pgTable('medication_logs', {
  id: uuid('id').defaultRandom().primaryKey(), medicationId: uuid('medication_id').notNull().references(() => medications.id, { onDelete: 'cascade' }), userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }), takenAt: timestamp('taken_at', { withTimezone: true }).notNull(), status: varchar('status', { length: 20 }).notNull(), notes: text('notes'), createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({ userIdx: index('medication_logs_user_idx').on(t.userId), statusCheck: check('medication_logs_status_check', sql`status in ('tomado','atrasado','pulado')`) }));

export const userPreferences = pgTable('user_preferences', { id: uuid('id').defaultRandom().primaryKey(), userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }), timezone: varchar('timezone', { length: 80 }).notNull().default('America/Sao_Paulo'), notificationSettings: jsonb('notification_settings').$type<Record<string, unknown>>().notNull().default({}), createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(), updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull() }, (t) => ({ userUnique: uniqueIndex('user_preferences_user_idx').on(t.userId) }));

export type User = typeof users.$inferSelect;
export type DailyRecord = typeof dailyRecords.$inferSelect;
export type Medication = typeof medications.$inferSelect;
export type MedicationLog = typeof medicationLogs.$inferSelect;
