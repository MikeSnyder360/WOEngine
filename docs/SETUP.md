# Local Development Setup

## Prerequisites

- Node.js 18.0.0+
- pnpm 8.0.0+
- PostgreSQL 14+ (local or Docker)
- Redis (local or Docker)
- Git SSH access to this repo

## Quick Start

### 1. Clone and install

```bash
git clone git@github.com:MikeSnyder360/WOEngine.git
cd WOEngine
pnpm install
```

### 2. Set up local database and cache

**Option A: Docker Compose (recommended)**

```bash
docker-compose up -d
```

This starts:
- PostgreSQL on `localhost:5432`
- Redis on `localhost:6379`

**Option B: Manual setup**

Ensure Postgres and Redis are running locally on default ports.

### 3. Configure environment

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in the required values:

**Dashboard** (`apps/dashboard/.env.local`):
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/woengine_dev"
STRIPE_SECRET_KEY="sk_test_..."  # From Stripe dashboard
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="http://localhost:3000"
```

**Orchestrator** (`apps/orchestrator/.env.local`):
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/woengine_dev"
REDIS_URL="redis://localhost:6379"
AWS_REGION="us-east-1"  # For Secrets Manager (dev: use localstack)
EAS_TOKEN="..."  # Generate via `eas login` or dashboard
ENGINE_REPO="git@github.com:MikeSnyder360/WOEngine.git"
```

### 4. Database setup

```bash
# Run migrations
pnpm db:migrate

# (Optional) View database
pnpm db:studio
```

### 5. Start development servers

In separate terminals:

```bash
# Terminal 1: Engine app
pnpm dev:engine

# Terminal 2: Dashboard
pnpm dev:dashboard

# Terminal 3: Orchestrator
pnpm dev:orchestrator
```

- Engine will be running on a local Expo development server
- Dashboard will be at `http://localhost:3000`
- Orchestrator will be polling Redis for jobs (nothing to do yet locally)

## Testing the Flow Locally

### 1. Create a test tenant + app via Prisma Studio

```bash
pnpm db:studio
```

Manually insert a `Tenant` and `App` record.

### 2. Upload credentials and branding

You can use the dashboard forms or insert test records directly via Prisma Studio.

### 3. Enqueue a test build

Either:
- Use the dashboard "Build" button (requires Stripe test key and active subscription)
- Or manually enqueue a job to Redis:

```bash
# In the orchestrator directory
redis-cli
> lpush "bull:buildQueue:0" '{"buildId":"test-1","platforms":["ios"]}'
```

### 4. Watch the orchestrator work

Check the orchestrator logs (it polls Redis and processes jobs).

## Troubleshooting

### Postgres connection refused
- Ensure `docker-compose up -d` ran successfully or Postgres is running on `localhost:5432`
- Check connection string in `.env.local`

### EAS build fails locally
- EAS needs your credentials. Run `eas login` and ensure `~/.eas` exists
- For local dev, use `--profile preview` (less strict)

### Redis connection refused
- Ensure `docker-compose up -d` ran successfully or Redis is running on `localhost:6379`
- Check `REDIS_URL` in `.env.local`

### Types not found across workspaces
- Run `pnpm install` from the root to install all workspaces
- Run `pnpm --filter ./apps --filter ./shared type-check` to verify

## Useful Commands

```bash
# Install a dependency in a specific workspace
pnpm --filter @woengine/dashboard add react-hook-form

# Run a script in all workspaces
pnpm -r run type-check

# Clean all node_modules and reinstall
pnpm clean
pnpm install

# View database (Prisma Studio)
pnpm db:studio

# Create a new database migration
pnpm db:migrate -- --name add_new_table
```

## Next Steps

- Read [ARCHITECTURE.md](./docs/ARCHITECTURE.md) to understand the design
- Read [BACKEND_STACK.md](./docs/BACKEND_STACK.md) for backend details
- Start with Phase 1 of the implementation plan (repo prep for the engine app)
