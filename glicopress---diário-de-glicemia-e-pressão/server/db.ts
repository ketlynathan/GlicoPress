import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../drizzle/schema';

const configuredDatabaseUrl = process.env.DATABASE_URL?.trim() ?? '';
export const databaseConfigured = /^postgres(?:ql)?:\/\//i.test(configuredDatabaseUrl);
if (!databaseConfigured) console.warn('DATABASE_URL is not configured; database requests will return a service-unavailable response.');
const sql = neon(configuredDatabaseUrl || 'postgresql://unconfigured:unconfigured@localhost/unconfigured');
export const db = drizzle(sql, { schema });
export { schema };
