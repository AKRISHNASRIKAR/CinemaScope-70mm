import { pgTable, uuid, timestamp, text } from 'drizzle-orm/pg-core';

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(), // references auth.users(id) in Supabase
  username: text('username').notNull().unique(),
  avatar_url: text('avatar_url'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
