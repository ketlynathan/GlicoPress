# GlicoPress

Diário pessoal de glicemia, pressão arterial e medicamentos. A interface WhatsApp-like original foi preservada; os dados agora são persistidos no Neon PostgreSQL por uma API server-side.

## Arquitetura

O React + Vite é somente cliente e chama `/api/*`. As Vercel Functions em `api/[...path].ts` validam a sessão em cookie `HttpOnly`, consultam o Neon com Drizzle ORM e filtram cada consulta por `user_id`. Senhas usam `bcryptjs` e a sessão usa JWT assinado com `jose`. O navegador nunca recebe `DATABASE_URL`.

## Desenvolvimento local

Requisitos: Node.js 20+, uma conta Neon e npm.

```bash
npm install
cp .env.example .env
# preencha DATABASE_URL e AUTH_SECRET com um segredo aleatório de 32+ caracteres
npm run db:generate
npm run db:migrate
npm run dev
```

Acesse `http://localhost:3000` e crie a primeira conta com e-mail e senha de pelo menos 8 caracteres.

## Neon e migrations

Crie um projeto PostgreSQL no [Neon](https://neon.tech), copie a connection string para `DATABASE_URL` e não a coloque em variáveis `VITE_*`. Valide as migrations com `npm run db:generate` e aplique com `npm run db:migrate`. O executor usa transação, tabela de controle e SQL versionado em `drizzle/migrations`; não instala o `drizzle-kit` no projeto de produção por segurança da cadeia de dependências.

## Vercel

Importe o repositório na Vercel, configure o diretório raiz como `glicopress---diário-de-glicemia-e-pressão` se necessário e cadastre `DATABASE_URL`, `AUTH_SECRET` e `NODE_ENV=production` em Production/Preview. O `vercel.json` configura `npm ci`, `npm run build`, saída `dist`, runtime Node.js 22 para as Functions, fallback SPA e headers de segurança. A pasta `api` é detectada como Vercel Function. Execute as migrations a partir de uma máquina segura usando a mesma `DATABASE_URL` antes do primeiro acesso.

Não configure `DATABASE_URL` ou `AUTH_SECRET` como variáveis `VITE_*`: elas são server-side e nunca devem entrar no bundle do navegador. Após o primeiro deploy, valide o domínio HTTPS, o cookie `glicopress_session` com atributos `HttpOnly; Secure; SameSite=Lax` e os endpoints `/api/auth/me` e `/api/records`.

## Dados antigos do localStorage

Após o login, se o navegador possuir `glicopress_records`, a aplicação tenta uma migração única por conta para registros compatíveis. O localStorage não é apagado. A chave de sessão evita repetir a tentativa no mesmo navegador; falhas não apagam os dados.

## Scripts

`npm run dev`, `npm run build`, `npm run preview`, `npm run lint`, `npm test`, `npm run db:generate`, `npm run db:migrate` e `npm run db:studio` estão disponíveis no `package.json`. `db:studio` fica desabilitado no projeto; use o Neon Console ou uma instalação isolada do Drizzle Studio.

## Schema

`users` guarda identidade e hash; `daily_records` guarda medições e notas; `medications` guarda medicamentos e horários em JSON; `medication_logs` guarda tomadas; `user_preferences` guarda timezone e configurações de notificação. UUIDs, índices por usuário/data/e-mail, foreign keys com cascade e constraints de faixas numéricas estão definidos em `drizzle/schema.ts`.

## Segurança e LGPD

Dados de saúde exigem minimização, controle de acesso e transparência. Em produção, use `AUTH_SECRET` forte e exclusivo, TLS, backups criptografados e teste de restauração, retenção definida, monitoramento sem valores clínicos, política de exclusão/exportação e controle de acesso ao projeto Neon/Vercel. Não registre senhas, tokens ou medições em logs. Avalie base legal, encarregado e direitos do titular com assessoria especializada; este projeto não substitui revisão jurídica ou médica.

## Verificação

```bash
npm run lint
npm test
npm run build
```
