// Re-export all Drizzle-inferred types as the single source of truth for
// database row shapes. Components and Edge Functions import from here, not
// from individual schema files, so refactors stay in one place.
export type {
  Profile,
  NewProfile,
  WatchHistoryEntry,
  NewWatchHistoryEntry,
  WatchlistEntry,
  NewWatchlistEntry,
  Review,
  NewReview,
  TmdbCacheEntry,
  NewTmdbCacheEntry,
} from '../db/index.js';
