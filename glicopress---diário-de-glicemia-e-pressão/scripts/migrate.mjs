import 'dotenv/config';
import postgres from 'postgres';
import { mkdirSync, readdirSync, readFileSync } from 'node:fs';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL é obrigatória.');
const sql = postgres(process.env.DATABASE_URL, { max: 1, ssl: 'require' });
await sql`CREATE TABLE IF NOT EXISTS __glico_migrations (id text primary key, applied_at timestamptz not null default now())`;
const dir = new URL('../drizzle/migrations/', import.meta.url);
const files = readdirSync(dir).filter((file) => file.endsWith('.sql')).sort();
for (const file of files) {
  const [existing] = await sql`SELECT id FROM __glico_migrations WHERE id = ${file}`;
  if (existing) continue;
  const content = readFileSync(new URL(file, dir), 'utf8');
  await sql.begin(async (tx) => {
    for (const statement of content.split('--> statement-breakpoint').map((part) => part.trim()).filter(Boolean)) await tx.unsafe(statement);
    await tx`INSERT INTO __glico_migrations (id) VALUES (${file})`;
  });
  console.log(`Aplicada: ${file}`);
}
await sql.end();
console.log('Migrations concluídas.');
