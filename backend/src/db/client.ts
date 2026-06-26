import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index.js';

const connectionString =
  process.env['DATABASE_URL'] ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

// Single shared connection pool for the process.
// In Edge Functions this module is not used directly — see _shared/db.ts.
const queryClient = postgres(connectionString);

export const db = drizzle(queryClient, { schema });
export type Db = typeof db;
