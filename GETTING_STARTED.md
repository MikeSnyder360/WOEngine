# Getting Started with WOEngine

## Quick Start (5 minutes)

### 1. Clone and install

```bash
git clone git@github.com:MikeSnyder360/WOEngine.git
cd WOEngine
pnpm install
```

### 2. Start services

```bash
docker-compose up -d
```

This starts:
- **PostgreSQL** on `localhost:5432`
- **Redis** on `localhost:6379`

### 3. Set up environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with:
- `DATABASE_URL` — already set to docker Postgres
- `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`
- `PAYMENTS_DISABLED=true` — demo mode (builds are free, no Stripe charges)
  - Optional: if you want to test real Stripe, set `PAYMENTS_DISABLED=false` and add `STRIPE_SECRET_KEY`

### 4. Initialize database

```bash
cd apps/dashboard
npx prisma migrate dev
```

This creates tables from `db/schema.prisma`.

### 5. Start dev servers

**Terminal 1: Dashboard (Next.js)**
```bash
cd apps/dashboard
pnpm dev
```
Open http://localhost:3000

**Terminal 2: Orchestrator (optional, for testing builds)**
```bash
cd apps/orchestrator
pnpm dev
```

---

## Using the Dashboard

1. **Sign in**: Go to http://localhost:3000
   - Demo mode: enter any email
   - No password required locally

2. **Create an app**:
   - Click "Create App"
   - Fill in app name, iOS bundle ID, Android package name
   - Example:
     - App name: "My Fitness"
     - iOS: `com.example.myfitness`
     - Android: `com.example.myfitness`

3. **Customize branding**:
   - Click "Show Branding Editor"
   - Change colors (primary/secondary)
   - Click "Save Branding"

4. **Add workout program**:
   - Click "Show Program Editor"
   - Paste or edit program JSON
   - Click "Save & Publish Program"

5. **Trigger a build** (requires Stripe test key):
   - Click "Build & Submit"
   - Demo mode: all builds succeed (no real EAS calls)
   - Check build history to see status

---

## Database Inspection

View/edit data with Prisma Studio:

```bash
cd apps/dashboard
pnpm db:studio
```

Opens http://localhost:5555

---

## Architecture

- **Engine** (`apps/engine/`) — Expo React Native app
  - Templatable at build time (theme.js, program.json)
  - Ships to iOS & Android

- **Dashboard** (`apps/dashboard/`) — Next.js admin tool
  - NextAuth for auth
  - Prisma ORM for database
  - API routes for CRUD + Stripe

- **Orchestrator** (`apps/orchestrator/`) — Node.js build worker
  - Polls Redis queue for jobs
  - Decrypts credentials from Secrets Manager
  - Runs `eas build` + `eas submit`
  - Stores results in Postgres

- **Database** — PostgreSQL
  - Tenants, Apps, Builds, Credentials (encrypted refs)
  - Versioned branding & program data

- **Queue** — Redis
  - BullMQ job queue
  - Decouples dashboard from long-running builds

---

## Development Tips

### Reset database

```bash
cd apps/dashboard
npx prisma migrate reset
```

### View logs

Dashboard:
```bash
cd apps/dashboard
pnpm dev
```

Orchestrator:
```bash
cd apps/orchestrator
pnpm dev
```

### Test full flow locally

1. Sign in to dashboard (demo: any email)
2. Create app
3. Save branding + program
4. Trigger build
   - **Demo mode** (default): builds are free, no payment required
   - Optional: to test Stripe, set `PAYMENTS_DISABLED=false` and use test card `4242 4242 4242 4242`
5. Watch build history refresh (polls every 5 sec)

---

## Next Steps

- [ ] Connect to real Stripe account (get real API keys)
- [ ] Connect to real EAS account (get `EAS_TOKEN`)
- [ ] Set up AWS Secrets Manager (for encrypting customer credentials)
- [ ] Deploy dashboard to production (Vercel)
- [ ] Deploy orchestrator to production (AWS ECS)
- [ ] Create credential upload forms (Apple, Google)
- [ ] Test end-to-end build pipeline

---

## Troubleshooting

**Database connection refused**
- Ensure `docker-compose up -d` is running
- Check `DATABASE_URL` in `.env.local`

**Can't sign in**
- Check `NEXTAUTH_SECRET` is set in `.env.local`
- Check `NEXTAUTH_URL=http://localhost:3000`

**Build fails**
- Check orchestrator is running (optional, local only)
- Check Redis is running: `redis-cli ping` (should return PONG)

---

## Further Reading

- [ARCHITECTURE.md](./ARCHITECTURE.md) — System design
- [REPOSITORY_STRUCTURE.md](./REPOSITORY_STRUCTURE.md) — Directory layout
- [docs/BACKEND_STACK.md](./docs/BACKEND_STACK.md) — Backend services
- [docs/SETUP.md](./docs/SETUP.md) — Advanced local setup
