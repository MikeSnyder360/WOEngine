# WOEngine Implementation Status

## Completed ✅

### Phase 1: Engine Templating
- [x] `app.config.js` + `app.config.defaults.json` (dynamic config)
- [x] `theme.js` split into `theme.default.js` + re-export
- [x] Promoted 4 hardcoded hex colors to theme tokens
- [x] `program.js` split (default data, parameterized functions, composition)
- [x] `programSource.js` for runtime fetch (network → cache → bundled)
- [x] App.js loads program asynchronously on startup

### Phase 2: Database + API Skeleton
- [x] Prisma schema with all entities
- [x] Next.js dashboard setup (App Router, layout, home)
- [x] API routes:
  - [x] `/api/tenants` (POST/GET)
  - [x] `/api/apps` (POST/GET)
  - [x] `/api/builds` (POST/GET)
  - [x] `/api/builds/:buildId` (GET)
  - [x] `/api/credentials/apple` (POST/GET)
  - [x] `/api/credentials/google` (POST/GET)
  - [x] `/api/brand-manifest` (POST)
  - [x] `/api/program-version` (POST)
  - [x] `/api/health` (GET)

### Phase 3: Secrets Manager
- [x] AWS Secrets Manager client (`secrets.ts`)
- [x] Decryption helpers (Apple key, Google service account)
- [x] Prisma client singleton for orchestrator

### Phase 4: Orchestrator Build Logic
- [x] Git clone + install (`git.ts`)
- [x] File generation (`generate.ts`)
- [x] EAS build + submit (`eas.ts`)
- [x] Main orchestrator (`build.ts`)
- [x] Error handling + DB updates

### Phase 5: End-to-End Wiring
- [x] Stripe PaymentIntent charging
- [x] Redis job enqueue
- [x] Subscription validation
- [x] Build record creation

### Phase 6+: Dashboard UI
- [x] NextAuth setup (credentials provider, demo mode)
- [x] Sign-in page (`/auth/signin`)
- [x] Dashboard page (`/dashboard`)
  - [x] App list + selection
  - [x] App creation
  - [x] Build trigger with platform selection
- [x] Branding editor component (colors, name)
- [x] Program editor component (JSON editor)
- [x] Build history component (live polling)

### Infrastructure
- [x] docker-compose.yml (Postgres + Redis)
- [x] Environment configuration (.env.example)
- [x] GETTING_STARTED.md guide

---

## In Progress / Not Yet Started 🚧

### Missing UI Features
- [ ] Credential upload forms (Apple `.p8`, Google service-account JSON)
- [ ] Build logs viewer
- [ ] Stripe payment method management UI
- [ ] App icon/asset preview
- [ ] Program validation/preview
- [ ] Build cancellation
- [ ] Mobile responsive design

### Missing Backend Features
- [ ] Stripe webhook handler (for subscription events)
- [ ] Build log streaming to client
- [ ] EAS build polling (currently stubbed)
- [ ] Actual file upload to S3 or similar
- [ ] Image validation (icon dimensions, formats)

### Secrets Management
- [ ] Encrypt credentials on upload (AWS Secrets Manager writes)
- [ ] Credential validation against real Apple/Google APIs
- [ ] Credential rotation/refresh

### Production Readiness
- [ ] Auth: implement proper password hashing (currently demo mode)
- [ ] Rate limiting on API endpoints
- [ ] Input validation and sanitization
- [ ] Error logging and monitoring
- [ ] Database backups
- [ ] Horizontal scaling (Redis cluster, DB replicas)

### Deployment
- [ ] Dockerfile for orchestrator
- [ ] Kubernetes manifests
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Dashboard deployment (Vercel config)
- [ ] Orchestrator deployment (ECS/K8s)
- [ ] Environment variable secrets management (AWS Secrets Manager, vault)

### Testing
- [ ] Unit tests (Prisma, API routes)
- [ ] Integration tests (end-to-end build flow)
- [ ] Load testing (concurrent builds)

---

## Known Limitations / TODOs

1. **Auth** — Currently demo mode (no password). Needs proper implementation before production.

2. **Secrets** — Keys are decrypted in memory. Needs vault/Secrets Manager integration before handling real customer credentials.

3. **EAS Build** — Orchestrator calls stubbed. Needs integration with real EAS API.

4. **File Uploads** — No S3 integration yet. Uploaded assets need to be stored.

5. **Stripe** — One-off charges implemented, but no subscription management UI.

6. **Monitoring** — No logging/alerting for build failures or orchestrator health.

7. **Rate Limiting** — All endpoints publicly accessible (needs auth guard middleware).

---

## Next Priority Tasks

1. **Credential Uploads**
   - Apple: `.p8` file upload + ASC key ID/Issuer ID input
   - Google: service-account JSON file upload
   - Validation against real APIs

2. **Orchestrator Hardening**
   - Real EAS API integration
   - Build status polling
   - Log streaming to dashboard

3. **Production Secrets**
   - AWS Secrets Manager encryption
   - Vault integration
   - Credential rotation

4. **Auth Hardening**
   - Real password hashing (bcrypt)
   - Email verification
   - Multi-factor auth (optional)

5. **Testing**
   - Unit tests
   - Integration tests
   - Load tests

---

## Deployment Checklist

When ready to deploy to production:

- [ ] Stripe live keys (not test)
- [ ] AWS Secrets Manager configured
- [ ] RDS database (not local Postgres)
- [ ] ElastiCache Redis (not local)
- [ ] EAS account set up
- [ ] Auth passwords hashed
- [ ] Rate limiting enabled
- [ ] Monitoring/logging set up
- [ ] Backups configured
- [ ] SSL certificates
- [ ] Domain names
- [ ] CI/CD pipeline

---

## Architecture Notes

- **Single tenant context** is passed through via session (NextAuth)
- **Secrets never logged** — they're only kept in Secrets Manager and ephemeral orchestrator workspace
- **Versioning** — BrandManifest and ProgramVersion are immutable; updates create new versions
- **Async builds** — Dashboard enqueues, orchestrator processes in background
- **Hybrid pricing** — Monthly subscription + per-build fee (one-off Stripe charge)

---

## Code Quality

- TypeScript throughout (types are enforced)
- Prisma for database (type-safe ORM)
- No raw SQL queries
- API error handling (returns typed responses)
- Environment-based config (no hardcoded secrets)

---

## Questions / Design Decisions

1. **Demo Auth** — Should real password hashing be done before beta launch?
2. **Secrets Manager Cost** — Is AWS Secrets Manager the right choice, or should we use Vault?
3. **Build Concurrency** — Currently 1 build at a time. Should we scale horizontally?
4. **Icon Uploads** — Should we validate icon dimensions/format on upload?
5. **Program Validation** — Should we validate program.json schema before publishing?
