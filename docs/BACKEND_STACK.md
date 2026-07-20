# WOEngine Backend Stack

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Customer Dashboard                            │
│                       (Next.js)                                  │
│  - Signup/onboarding  - Branding editor  - Build trigger        │
│  - Store credentials  - Program editor   - Build history        │
└─────────────────────┬───────────────────────────────────────────┘
                      │ (HTTP API calls)
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│              Dashboard Backend API                               │
│              (Next.js Server Actions / Routes)                   │
│                                                                  │
│  - Tenant/App CRUD        - Secret references (no raw keys)     │
│  - Stripe integration     - Build job enqueue                   │
│  - Store credential mgmt  - Status polling                      │
└─────────────┬──────────────────────────────────────────┬────────┘
              │                                          │
              │                                          │
    ┌─────────▼──────────┐                  ┌──────────▼──────────┐
    │  PostgreSQL        │                  │  Stripe API         │
    │  (Tenants,Apps,    │                  │  (Subscriptions,    │
    │   Builds, Secret   │                  │   One-off charges)  │
    │   References)      │                  │                     │
    └────────────────────┘                  └─────────────────────┘
              ▲
              │
    ┌─────────┴──────────────────────────────────────┐
    │                                                │
┌───▼────────────────┐                   ┌──────────▼──────────┐
│  Redis + BullMQ    │                   │  Secrets Manager    │
│  Job Queue         │                   │  (AWS Secrets Mgr   │
│  (build jobs)      │◄────┐             │   or Vault)         │
└────────────────────┘     │             │                     │
         ▲                  │             │  - Apple ASC keys   │
         │                  │             │  - Google SA JSON   │
         │         Encrypted│             │  - Encrypted at     │
         │         creds    │             │    rest, IAM-scoped │
         │                  │             │    access           │
         │         ┌────────▼─────────────────────────────────┐
         │         │   Orchestrator Worker (always-on)        │
         │         │   (Node.js)                              │
         │         │                                          │
         │         │  1. Poll Redis queue for jobs            │
         │         │  2. Decrypt secrets from Secrets Manager │
         │         │  3. Git checkout Engine Repo @ tag       │
         │         │  4. Generate tenant files (theme, prog)  │
         │         │  5. Overwrite assets                     │
         │         │  6. Run `eas build` → `eas submit`       │
         │         │  7. Poll EAS for status                  │
         │         │  8. Update Build row + report back       │
         │         │  9. Shred ephemeral workspace            │
         │         │                                          │
         └──────────────────────────────────────┬─────────────┘
                                                │
              ┌─────────────────────────────────┼──────────────────────┐
              │                                 │                      │
       ┌──────▼────────┐           ┌───────────▼──────┐      ┌────────▼─────┐
       │ Engine Repo   │           │  EAS API         │      │ Apple/Google │
       │ (private git) │           │  (CLI + REST)    │      │ Store APIs   │
       │               │           │                  │      │              │
       │ /workspace/   │           │ - Build          │      │ - ASC API    │
       │ Engine/       │           │ - Submit         │      │ - Play API   │
       │ v1.0.0-engine│           │ - List builds    │      │              │
       └───────────────┘           └──────────────────┘      └──────────────┘
```

## Core Services

### 1. Dashboard Backend (Next.js)

**Responsibilities:**
- Tenant/App/Subscription CRUD
- Branding & program-config form handling
- Stripe subscription + one-off charge management
- Credential ingestion, validation, and secret-reference creation
- Job enqueue to Redis
- Build status polling / webhooks

**Deployment:** Vercel, Railway, or AWS (scalable HTTP service)

**Key Dependencies:**
- `prisma` — Postgres ORM
- `stripe` — Stripe SDK
- `dotenv` — env-var management
- `zod` — form validation
- `next-auth` or `clerk` — multi-tenant auth

**Entry Points:**
- `POST /api/tenants` — create tenant
- `POST /api/apps` — create app
- `POST /api/credentials/apple` — store ASC key ref
- `POST /api/credentials/google` — store Play SA JSON ref
- `POST /api/builds` — trigger a build (charges Stripe, enqueues job)
- `GET /api/builds/:buildId` — poll status
- Stripe webhook handler

**Secrets Handling:**
- Raw Apple `.p8` and Google service-account JSON are **never stored in Postgres** or logged
- On credential upload: validate immediately against Apple/Google APIs (fail fast if invalid)
- Write only an opaque secret reference to the database (e.g., `secretRef: "secret:apple:app-123:v1"`)
- Store the raw material in the Secrets Manager only
- Only the Orchestrator worker (with restricted IAM) can decrypt

---

### 2. Orchestrator Worker (Node.js)

**Responsibilities:**
- Poll Redis job queue for new build requests
- Decrypt customer credentials from the Secrets Manager
- Git checkout the Engine Repo at a pinned release tag
- Generate per-tenant files (theme.js from colorTokens, program.default.json)
- Overwrite assets (icon, splash, adaptive-icon layers)
- Write ephemeral tenant.manifest.json + eas.json with customer's credentials
- Run `eas build --platform ios|android|both --profile production`
- Run `eas submit` (uses the injected customer credentials)
- Stream build status back to Postgres Build row + Dashboard
- Shred the entire ephemeral workspace on completion (success or failure)

**Deployment:** EC2 / ECS / Kubernetes (always-on, long-running builds don't fit serverless)

**Key Dependencies:**
- `bullmq` — Redis queue consumer
- `@aws-sdk/client-secrets-manager` (or Vault SDK) — decrypt secrets
- `simple-git` — git checkout
- `execa` — run `eas build`/`eas submit` as child processes
- `prisma` — update Build status
- `rimraf` — cleanup ephemeral workspace

**Workflows:**
1. Pull `{ buildId }` from Redis
2. Load Build + App + Tenant + BrandManifest + ProgramVersion from Postgres
3. Decrypt ASC `.p8` + Google SA JSON from Secrets Manager
4. Create ephemeral `/tmp/build-${buildId}` directory
5. Git: `git clone --depth 1 --branch v1.0.0-engine git@github.com:MikeSnyder360/WOEngine.git /tmp/build-${buildId}/workspace`
6. `npm ci` in workspace
7. Write tenant.manifest.json: `{ name, icon: "./assets/icon.png", bundleIdentifier, package, ... }`
8. Overwrite `/assets/icon.png`, `/assets/android-icon-*.png`, etc. with tenant's uploaded files
9. Run `scripts/generate-tenant-files.js` to create `src/theme.js` from colorTokens, `src/data/program.default.json` from program snapshot
10. Write ephemeral `eas.json` with `submit.production` block pointing to decrypted `.p8` + Play JSON
11. Run: `eas build --platform ios --profile production --json` → parse JSON output → save `easBuildIdIos` to Postgres
12. Poll `eas build:list --platform ios` until status = finished
13. Run: `eas submit --platform ios --json`
14. Update Build row: `status = 'submitted'` / `status = 'succeeded'` / `status = 'failed'`
15. Always: `rimraf /tmp/build-${buildId}` and shred any temp decrypted keys

**Failure handling:**
- Sanitize all EAS error messages before storing in `Build.failureReason` (strip file paths, secret patterns)
- Charge is already taken at trigger time — no automatic refund logic here, but Dashboard can show "failed" so user/support knows to investigate
- Dead-letter queue for jobs that fail permanently (e.g., bad config, unreachable git repo)

---

### 3. Database (PostgreSQL)

**Core tables:**
- `Tenant`, `Subscription`, `App`, `BrandManifest`, `ProgramVersion`, `AppleCredential`, `GoogleCredential`, `Build`
- All versioned (every Build references exact snapshot it used)
- Secret material *never* stored — only references like `secretRef: "secret:apple:app-123:v1"`

**Deployment:** AWS RDS, Supabase, or managed Postgres (multi-AZ for production)

**Connection pool:** Prisma `@prisma/client` with connection pooling (PgBouncer or Prisma's built-in)

---

### 4. Secrets Manager (AWS Secrets Manager, GCP Secret Manager, or Vault)

**Stores:**
- Apple ASC `.p8` key material (encrypted at rest, with encryption key AWS/GCP-managed)
- Google Play service-account JSON (encrypted)

**Access Control:**
- Only the Orchestrator worker's IAM role can decrypt
- Dashboard API does NOT have decrypt permissions — only write (during credential upload)
- Encryption keys are rotated annually (AWS/GCP native)
- Audit log every decrypt (for compliance/debugging)

**Pattern:**
```
secretRef = "secret:apple:${tenantId}:v1"
// Stored in Postgres Build row

// In Orchestrator:
const p8Content = await secretsManager.getSecretValue(secretRef)
// Write to ephemeral file only, never logged
```

---

### 5. Job Queue (Redis + BullMQ)

**Responsibilities:**
- Decouple "build triggered" from the 10–20+ min build cycle
- Survive Orchestrator restarts (jobs persisted in Redis)
- Dead-letter queue for failed jobs

**Deployment:** AWS ElastiCache or a managed Redis service

**Job shape:**
```json
{
  "buildId": "abc123",
  "platforms": ["ios", "android"],
  "chargeId": "pi_xyz"  // Stripe charge that already succeeded
}
```

---

## Integration Points

### EAS CLI

The Orchestrator runs `eas build` and `eas submit` as CLI subprocesses using the product owner's own EAS credentials (stored in `~/.eas` in the Orchestrator's container, seeded from env vars or a secrets manager entry).

**Critical**: The product owner's EAS credentials and the customer's ASC/Play credentials are separate — they must never be mixed or logged together.

### Stripe

Dashboard API calls Stripe to:
- Create Subscription on signup (via Checkout)
- Create PaymentIntent for one-off per-build charges
- Webhook handler updates `Subscription.status` on events

### Apple / Google APIs

Orchestrator only calls these indirectly through `eas submit` (EAS handles the API calls using the injected credentials). Dashboard API validates credentials at upload time using the official SDKs.

---

## Environment & Deployment Model

### Development
- Local `docker-compose` with Postgres + Redis + fake-secrets (or moto for AWS Secrets Manager mocking)
- Orchestrator runs locally, builds to EAS preview profile
- Dashboard on `localhost:3000`

### Staging
- Dashboard: Vercel preview deployment
- Orchestrator: EC2 t3.medium or ECS task
- Postgres: AWS RDS dev instance
- Redis: ElastiCache micro
- Secrets Manager: real AWS account but non-production credentials
- EAS: `eas build --profile preview`

### Production
- Dashboard: Vercel production
- Orchestrator: ECS task (auto-scaling, health checks) or Kubernetes
- Postgres: RDS multi-AZ, automated backups
- Redis: ElastiCache cluster mode enabled
- Secrets Manager: AWS Secrets Manager, rotation enabled
- EAS: `eas build --profile production`

---

## Security Checklist

- [ ] All raw secret material (`.p8`, service-account JSON) encrypted at rest in Secrets Manager
- [ ] Orchestrator IAM role restricted to Secrets Manager decrypt + Postgres write
- [ ] No secret material in logs, env vars, or process listings
- [ ] Dashboard API validates credentials against real APIs before saving references
- [ ] HTTPS everywhere (Vercel + AWS native)
- [ ] Postgres connections use SSL
- [ ] Redis connections use AUTH + TLS (ElastiCache AUTH policy)
- [ ] Stripe webhook signature validation
- [ ] Rate limiting on Dashboard API endpoints
- [ ] Audit log for every Orchestrator build (what was built, who triggered it, which credentials were used)

---

## Tech Stack Summary

| Layer | Technology | Justification |
|-------|-----------|---|
| Dashboard | Next.js 14 (App Router) | Rapid dev, shared JS/React ecosystem, SSR + API routes in one deploy |
| Database | PostgreSQL + Prisma | Standard relational for versioned builds/audit trails; Prisma for safety |
| Secrets | AWS Secrets Manager (or Vault) | Encrypted at rest, IAM-scoped, audit logs, key rotation |
| Job Queue | Redis + BullMQ | Reliable, simple, Redis already ubiquitous, BullMQ has great DX |
| Orchestrator | Node.js (minimal HTTP server or just queue consumer) | Reuse existing JS knowledge, git/subprocess orchestration is straightforward |
| Auth | Clerk or Auth.js | Multi-tenant SaaS auth out of the box |
| Billing | Stripe | Industry standard, no PCI burden, handles subscriptions + one-off charges |
| Deployment | Vercel (Dashboard) + AWS (Orchestrator/Postgres/Redis) | Vercel for fast iteration; AWS for stateful long-running processes |

---

## Sequencing for Implementation

1. **Phase 1: Repo prep** (steps 1–5 from the main plan)
   - Make Engine Repo templatable
   - No backend changes yet

2. **Phase 2: Data model + Dashboard API skeleton**
   - Postgres schema + migrations
   - Next.js project setup
   - Basic Tenant/App/Build CRUD endpoints
   - Stripe integration skeleton (no actual charging yet)

3. **Phase 3: Orchestrator skeleton**
   - Redis queue setup
   - Git checkout + basic file generation
   - Stub out `eas build`/`eas submit` calls (local testing only)

4. **Phase 4: Secrets Manager integration**
   - Credential encryption/decryption
   - IAM roles + policies

5. **Phase 5: Full end-to-end**
   - Wire Dashboard → charge → enqueue → Orchestrator → EAS → submit
   - Real Stripe charges
   - Real EAS builds

6. **Phase 6: Dashboard UI**
   - React forms for branding/program editing
   - Build history + status
   - Billing portal
