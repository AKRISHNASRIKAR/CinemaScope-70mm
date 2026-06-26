import {
  pgTable,
  bigserial,
  uuid,
  integer,
  smallint,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';

// User-authored film reviews. One review per user per film (upsert pattern).
// rating is 1-10 to match TMDB's vote scale.
// body is nullable — a numeric rating without written commentary is valid.
// The CHECK constraint (rating BETWEEN 1 AND 10) is enforced in migration SQL,
// not in Drizzle schema, since Drizzle does not yet emit CHECK constraints.
export const reviews = pgTable(
  'reviews',
  {
    id: bigserial('id', { mode: 'bigint' }).primaryKey(),
    user_id: uuid('user_id').notNull(), // FK → auth.users(id) ON DELETE CASCADE
    tmdb_id: integer('tmdb_id').notNull(),
    title: text('title').notNull(),
    rating: smallint('rating').notNull(),
    body: text('body'),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique('reviews_user_film_unique').on(table.user_id, table.tmdb_id)],
);

export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
