import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../drizzle/schema';

if (!process.env.DATABASE_URL) console.warn('DATABASE_URL is not configured; database requests will fail safely.');
const sql = neon(process.env.DATABASE_URL ?? '');
export const db = drizzle(sql, { schema });
export { schema };
