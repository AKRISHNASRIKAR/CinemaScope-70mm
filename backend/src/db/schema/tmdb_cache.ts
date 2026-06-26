import { pgTable, text, jsonb, timestamp, integer } from 'drizzle-orm/pg-core';

// Server-side cache for TMDB API responses.
// cache_key is the primary key: a hash of the endpoint path + sorted query
// params (api_key and language stripped). Lookups are always by key, so no
// surrogate ID is needed.
// expires_at is computed at write time. A read that finds expires_at < now()
// treats the row as a miss and re-fetches from TMDB.
// hit_count is incremented on each cache hit for observability.
export const tmdbCache = pgTable('tmdb_cache', {
  cache_key: text('cache_key').primaryKey(),
  endpoint: text('endpoint').notNull(), // human-readable path, e.g. "/movie/550"
  payload: jsonb('payload').notNull(),
  fetched_at: timestamp('fetched_at', { withTimezone: true }).notNull().defaultNow(),
  expires_at: timestamp('expires_at', { withTimezone: true }).notNull(),
  hit_count: integer('hit_count').notNull().default(0),
});

export type TmdbCacheEntry = typeof tmdbCache.$inferSelect;
export type NewTmdbCacheEntry = typeof tmdbCache.$inferInsert;
