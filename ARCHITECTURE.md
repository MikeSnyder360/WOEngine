# WOEngine Architecture

## Overview

WOEngine is a white-label fitness app engine. Customers customize and build their own branded HIIT/fitness apps for iOS and Android without writing code.

**Core concept:** A single templatable Expo React Native codebase + a dashboard + a build orchestrator = customers can generate fully signed, ready-to-ship app binaries in hours instead of weeks.

## High-Level Design

1. **Engine Repo** (this codebase) — Expo React Native app that builds to both iOS and Android
2. **Dashboard** — Web interface where customers upload branding (icon, colors, app name) and define their workout program
3. **Orchestrator** — Background worker that generates per-customer files, builds the app, and submits to the customer's own App Store Connect + Google Play Console
4. **Database** — Stores tenant/app/build metadata and (encrypted) references to customer credentials
5. **Secrets Manager** — Encrypted storage for customer's Apple `.p8` key and Google service-account JSON

## Key Design Decisions

### Build-Time Templating

Branding (icon, app name, colors) **must** be baked into the binary at build time — app stores require this. The orchestrator:
1. Clones this repo at a pinned release tag
2. Generates per-customer files (theme.js from colors, program.json from workout data)
3. Overwrites asset files (icon.png, splash-icon.png, etc.)
4. Runs `eas build --platform ios android` for that customer
5. Submits the result to the customer's own Apple + Google store accounts

This happens in a secure ephemeral workspace that's destroyed after each build.

### Runtime Program Fetch

The workout program (workouts, exercises, schedules) is **not** baked into the binary. Instead:
- The app ships with a default offline-first program
- On startup, the app attempts to fetch the latest program from an API endpoint
- If fetch fails, the app falls back to the bundled default
- This means customers can update their workouts **instantly without rebuilding** — no App Store review wait

### Code Protection

Since React Native ships a JS bundle inside the binary:
1. The bundle is compiled to Hermes bytecode (not plain JS, harder to reverse-engineer)
2. All JS is minified and obfuscated in production builds
3. The source code and EAS project remain under the product owner's control — customers never see them
4. Any truly sensitive business logic (e.g., licensing checks) lives server-side, not in the app

### Credential Handling

Customer Apple/Google credentials are **never stored in plain text**:
- Dashboard API only stores opaque references (e.g., `secret:apple:app-123:v1`)
- Raw `.p8` keys and service-account JSON go directly into AWS Secrets Manager (encrypted at rest)
- Only the Orchestrator worker (with restricted IAM) can decrypt them
- Credentials are written to disk only in the ephemeral build workspace and are shredded after the build

### Monorepo Structure

One Git repo with three main apps:
- `/apps/engine` — the Expo app (what customers' apps are built from)
- `/apps/dashboard` — the Next.js web admin tool
- `/apps/orchestrator` — the Node.js build worker
- `/shared` — shared TypeScript types and Zod schemas
- `/db` — Prisma database schema

This keeps everything in sync and makes it easy to deploy related changes together.

## Architecture Layers

### Customer-Facing
- **Dashboard** (Next.js web app) — branding editor, program editor, build history, billing
- **App Store/Play Store** — where the built apps appear for end users

### Operational
- **Database** (PostgreSQL) — all metadata: tenants, apps, builds, credentials (references only)
- **Secrets Manager** (AWS Secrets Manager) — encrypted customer credentials
- **Job Queue** (Redis + BullMQ) — decouples build triggers from the long build process

### Build Pipeline
- **Orchestrator Worker** (Node.js) — polls queue, generates tenant files, invokes EAS, submits to stores
- **EAS Build/Submit** — Expo's managed build service (one project owned by the product owner)
- **Engine Repo** — Expo app source code (private, tagged releases)

## Data Model

Core entities (stored in Postgres):
- **Tenant** — a customer company
- **Subscription** — Stripe subscription (monthly fee)
- **App** — a branded app (customers may have multiple)
- **BrandManifest** (versioned) — icon, colors, app name for an app (snapshotted at build time)
- **ProgramVersion** (versioned) — workout definition for an app (snapshotted at build time)
- **AppleCredential** / **GoogleCredential** — encrypted secret references for signing
- **Build** — a build request + result (status, EAS IDs, timestamps, cost)

Every Build references exact snapshots of the BrandManifest and ProgramVersion used — critical for debugging and replicating builds.

## Deployment Model

### Development
- Dashboard runs locally on `localhost:3000`
- Orchestrator runs locally, consumes jobs from local Redis
- Postgres and Redis run in Docker

### Staging
- Dashboard: Vercel preview deployment
- Orchestrator: AWS ECS task
- Database: AWS RDS (dev instance)
- Cache: AWS ElastiCache

### Production
- Dashboard: Vercel production
- Orchestrator: AWS ECS (scaled, health-checked)
- Database: AWS RDS (multi-AZ, backups)
- Cache: AWS ElastiCache (cluster mode)
- Secrets: AWS Secrets Manager (with rotation)

## Security Model

1. **Secrets never leave their store**
   - Encrypted in Secrets Manager
   - Only Orchestrator can decrypt (IAM-scoped)
   - Written to disk only in ephemeral workspace during build
   - Shredded unconditionally after build

2. **No shared credentials**
   - Product owner's EAS credentials used only by Orchestrator (separate from customer credentials)
   - Customer's Apple/Google credentials never accessible from Dashboard or other services

3. **Audit trail**
   - Every build logged: who triggered it, what was built, which credentials were used
   - EAS build logs are sanitized before storage (no secrets)

4. **Versioning**
   - Every Build references exact data snapshots — can always recreate or debug a specific build
   - Credential references are immutable (pointing to a specific version in Secrets Manager)

## Implementation Phases

1. **Phase 1: Engine templating** — Make the app accept per-tenant configuration (colors, icon, program)
2. **Phase 2: Dashboard API** — CRUD endpoints for tenants, apps, builds; Stripe integration
3. **Phase 3: Orchestrator** — Build worker that generates files and calls EAS
4. **Phase 4: Secrets integration** — Encrypt/decrypt customer credentials
5. **Phase 5: End-to-end** — Wire Dashboard → charge → orchestrate → build → submit
6. **Phase 6: UI polish** — Dashboard forms, branding previews, build status

See the root [plan document](../../../.claude/plans/delightful-snuggling-sutton.md) for detailed implementation steps.

## Tech Stack

| Component | Technology | Why |
|-----------|-----------|-----|
| Engine | Expo React Native | Cross-platform iOS/Android, fast iteration |
| Dashboard | Next.js | Full-stack in one deploy, great DX |
| Orchestrator | Node.js + BullMQ | Long-running, event-driven, good fit for build orchestration |
| Database | PostgreSQL + Prisma | Relational for versioned builds, Prisma for type safety |
| Secrets | AWS Secrets Manager | Managed encryption, audit logs, key rotation |
| Queue | Redis + BullMQ | Reliable, simple, persistent across restarts |
| Auth | Clerk or Auth.js | Multi-tenant SaaS out of the box |
| Billing | Stripe | Industry standard, handles subscriptions + one-off charges |

## Future Considerations

- **Theme runtime-swapping** — currently colors are build-time, but could be made runtime-configurable with a ThemeProvider if customers want instant recolor
- **Custom app logic** — could expose a plugin system for advanced customers (not in scope v1)
- **Web dashboard on the app itself** — currently the dashboard is a separate web app; could embed a settings panel in the app itself
- **Windows/macOS builds** — Expo supports them; could expand beyond iOS/Android

---

For detailed backend architecture, see [docs/BACKEND_STACK.md](./docs/BACKEND_STACK.md).
For implementation guide, see the root plan document and [docs/SETUP.md](./docs/SETUP.md).
