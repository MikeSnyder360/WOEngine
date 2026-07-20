# WOEngine

White-label fitness app engine. Build and ship custom branded HIIT/fitness apps to iOS and Android without writing code.

## What is WOEngine?

WOEngine is a closed-source app "engine" that other people can rebrand and customize to build their own fitness apps. Customers:
- Upload a custom icon, colors, and app name
- Define their own workout program
- Connect their Apple Developer and Google Play accounts
- Get a fully signed, ready-to-submit iOS + Android app

Monetization is hybrid: monthly subscription for dashboard access + per-build fee.

## Project Structure

See [REPOSITORY_STRUCTURE.md](./REPOSITORY_STRUCTURE.md) for the complete monorepo layout.

**Core components:**
- **apps/engine** — Expo React Native app (builds iOS + Android)
- **apps/dashboard** — Next.js web admin tool for customers
- **apps/orchestrator** — Node.js worker that builds + submits to app stores
- **shared/** — Shared TypeScript types and Zod schemas

## Architecture

High-level design: [ARCHITECTURE.md](./ARCHITECTURE.md) (link to the approved plan)

Quick flow:
1. Customer signs up, connects store credentials
2. Customer uploads branding (icon, colors) + workout program via dashboard
3. Customer clicks "Build" → charges Stripe per-build fee
4. Orchestrator worker:
   - Checks out the engine at a pinned release tag
   - Generates per-customer files (theme.js from colors, program.json from workout data)
   - Overwrites assets (icon, splash, etc.)
   - Runs `eas build --platform ios android`
   - Submits to customer's own App Store Connect + Google Play Console
5. Customer's app appears in their TestFlight / Play Console within hours

## Development Setup

### Prerequisites
- Node.js 18+
- pnpm 8+
- PostgreSQL 14+ (for local dashboard development)
- Redis (for local orchestrator testing)

### Quick Start

```bash
# Install dependencies
pnpm install

# Start the engine app locally
pnpm dev:engine

# Start the dashboard locally (requires .env.local)
pnpm dev:dashboard

# Database migrations
pnpm db:migrate

# View database (Prisma Studio)
pnpm db:studio
```

See [docs/SETUP.md](./docs/SETUP.md) for detailed local dev instructions.

## Deployment

### Engine (Expo app)
Builds are triggered by the orchestrator worker. Tagged releases are pinned (e.g., `v1.0.0-engine`).

### Dashboard
Deployed to Vercel (or similar). Requires:
- Postgres database (AWS RDS or similar)
- Stripe API keys
- Auth provider (Clerk or Auth.js)

### Orchestrator
Long-running service (EC2, ECS, or Kubernetes). Requires:
- Redis queue
- AWS Secrets Manager (or Vault) for encrypted customer credentials
- EAS CLI + product owner's EAS account
- Git SSH access to this private repo

See [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) for full deployment guide.

## Security

- Raw secret material (Apple `.p8` keys, Google service-account JSON) is encrypted at rest in AWS Secrets Manager.
- Only the orchestrator worker has IAM permissions to decrypt.
- Engine source code + EAS project stay under the product owner's control — customers never see them.
- Hermes bytecode compilation + JS minification protect the shipped app.

See [docs/SECURITY.md](./docs/SECURITY.md) for complete security model.

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

**Dashboard** (`apps/dashboard/.env.local`):
- `DATABASE_URL` — Postgres connection string
- `STRIPE_SECRET_KEY` — Stripe API key
- `NEXTAUTH_SECRET` — Auth secret (generate with `openssl rand -base64 32`)

**Orchestrator** (`apps/orchestrator/.env.local`):
- `DATABASE_URL` — Same Postgres
- `REDIS_URL` — Redis connection
- `AWS_REGION` — AWS region for Secrets Manager
- `EAS_TOKEN` — Product owner's EAS API token
- `ENGINE_REPO` — This repo (git@github.com:MikeSnyder360/WOEngine.git)

## API

Dashboard API endpoints are documented in [docs/API.md](./docs/API.md).

Key routes:
- `POST /api/tenants` — Create tenant
- `POST /api/apps` — Create app
- `POST /api/credentials/apple` — Store Apple credentials
- `POST /api/credentials/google` — Store Google credentials
- `POST /api/builds` — Trigger a build
- `GET /api/builds/:buildId` — Poll build status

## Contribution

See [docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md) for guidelines.

## License

Proprietary — contact the product owner for licensing inquiries.

---

**Questions?** See the docs in `/docs` or contact the team.
