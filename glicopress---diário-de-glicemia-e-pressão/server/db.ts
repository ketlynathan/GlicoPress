import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../drizzle/schema';

export const databaseConfigured = /^postgres(?:ql)?:\/\//i.test(process.env.DATABASE_URL ?? '');
if (!databaseConfigured) console.warn('DATABASE_URL is not configured; database requests will return a service-unavailable response.');
const sql = neon(process.env.DATABASE_URL ?? 'postgresql://unconfigured:unconfigured@localhost/unconfigured');
export const db = drizzle(sql, { schema });
export { schema };
