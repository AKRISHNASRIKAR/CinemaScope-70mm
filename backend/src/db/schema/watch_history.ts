import { pgTable, bigserial, uuid, integer, text, timestamp, unique } from 'drizzle-orm/pg-core';

// Records every film a user has watched.
// UNIQUE(user_id, tmdb_id) means re-watching upserts watched_at instead of
// creating a duplicate row.
// title and poster_path are denormalised here: avoids a JOIN to tmdb_cache on
// every read and survives cache eviction.
export const watchHistory = pgTable(
  'watch_history',
  {
    id: bigserial('id', { mode: 'bigint' }).primaryKey(),
    user_id: uuid('user_id').notNull(), // FK → auth.users(id) ON DELETE CASCADE
    tmdb_id: integer('tmdb_id').notNull(),
    title: text('title').notNull(),
    poster_path: text('poster_path'),
    watched_at: timestamp('watched_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique('watch_history_user_film_unique').on(table.user_id, table.tmdb_id)],
);

export type WatchHistoryEntry = typeof watchHistory.$inferSelect;
export type NewWatchHistoryEntry = typeof watchHistory.$inferInsert;
