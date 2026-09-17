import { existsSync, readFileSync } from 'node:fs';
import { readdirSync } from 'node:fs';

const dir = new URL('../drizzle/migrations/', import.meta.url);
const files = readdirSync(dir).filter((file) => file.endsWith('.sql')).sort();
if (files.length === 0) throw new Error('Nenhuma migration SQL versionada foi encontrada.');
for (const file of files) {
  const content = readFileSync(new URL(file, dir), 'utf8');
  if (!content.trim()) throw new Error(`Migration vazia: ${file}`);
}
console.log(`Migrations verificadas: ${files.join(', ')}`);
console.log('Para gerar uma nova migration durante desenvolvimento, use uma instalação isolada do drizzle-kit e revise o SQL antes de versionar.');
