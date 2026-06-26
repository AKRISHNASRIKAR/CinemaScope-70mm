import { pgTable, uuid, text, char, timestamp } from 'drizzle-orm/pg-core';

// Mirrors auth.users(id) 1-to-1. Row is created automatically by the
// handle_new_user trigger (migration 0006) when a new auth user is inserted.
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(), // FK → auth.users(id) ON DELETE CASCADE (enforced in migration SQL)
  username: text('username').notNull().unique(),
  display_name: text('display_name'),
  bio: text('bio'),
  avatar_url: text('avatar_url'),
  // ISO 3166-1 alpha-2 region for watch-provider localisation (default: US)
  region: char('region', { length: 2 }).notNull().default('US'),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
