import { pgTable, bigserial, uuid, integer, text, timestamp, unique } from 'drizzle-orm/pg-core';

// Films a user intends to watch.
// Same denormalisation rationale as watch_history: title and poster_path are
// stored here so the watchlist page loads without hitting tmdb_cache.
export const watchlist = pgTable(
  'watchlist',
  {
    id: bigserial('id', { mode: 'bigint' }).primaryKey(),
    user_id: uuid('user_id').notNull(), // FK → auth.users(id) ON DELETE CASCADE
    tmdb_id: integer('tmdb_id').notNull(),
    title: text('title').notNull(),
    poster_path: text('poster_path'),
    added_at: timestamp('added_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique('watchlist_user_film_unique').on(table.user_id, table.tmdb_id)],
);

export type WatchlistEntry = typeof watchlist.$inferSelect;
export type NewWatchlistEntry = typeof watchlist.$inferInsert;
