# WOEngine Backend Cost Estimate

## Executive Summary

**Backend infrastructure costs for WOEngine are extremely low relative to revenue**, enabling 96%+ gross margins at scale.

For **100 active apps**, backend costs are **$400–800/month**, while subscription + per-build revenue is **$14,200+/month**.

As the platform scales, backend costs grow sublinearly due to infrastructure efficiency — at 1,000 apps, per-unit costs drop to $1.50–3/app/month, maintaining 97%+ margins.

---

## Cost Model Overview

WOEngine backend consists of:
1. **Web dashboard** (Next.js) — customer management UI
2. **Orchestrator worker** (Node.js) — async build processing
3. **PostgreSQL database** — multi-tenant data storage
4. **Redis queue** — job queue (BullMQ)
5. **AWS Secrets Manager** — encrypted credential storage
6. **Cloud storage** — app icons, assets, logs
7. **Monitoring & observability** — optional but recommended

**Critical note**: EAS (Expo Application Services) builds are **paid by customers to Expo**, not by WOEngine. Same for App Store/Play Store submission fees.

---

## Detailed Cost Breakdown

### 1. Web Dashboard Hosting (Next.js)

**Purpose**: Multi-tenant SaaS dashboard where customers create apps, customize branding, manage programs, trigger builds, view history.

**Options**:

| Provider | Small (100 apps) | Medium (500 apps) | Notes |
|----------|------------------|-------------------|-------|
| **Vercel** (recommended) | $20–50/mo | $50–150/mo | Optimized for Next.js; automatic scaling |
| **AWS Amplify** | $10–30/mo | $30–100/mo | Lower cost; less seamless Next.js experience |
| **Railway** | $15–40/mo | $40–120/mo | Pay-as-you-go; good for variable load |
| **Render** | $7–25/mo | $25–80/mo | Budget option; slower cold starts |
| **AWS EC2** (self-hosted) | $10–15/mo | $20–40/mo | Raw compute; requires ops overhead |

**Recommended**: **Vercel Pro ($20/mo) → Vercel Growth Plan ($50–150/mo)** as you scale.

**Why**: Automatic scaling, built-in analytics, zero-config Next.js deployment, CDN included.

**Expected usage at 100 apps**:
- Dashboard requests: ~500–2,000/day (customers managing apps, builds)
- Data transfer: ~100MB/day
- Concurrency: 5–20 simultaneous users
- Function runtime: ~50–100 ms per request

**Estimate for 100 apps**: **$50/month** (Vercel Pro)

---

### 2. Orchestrator Worker (Node.js Build Service)

**Purpose**: Long-running service that polls Redis for build jobs, clones the engine repo, generates per-tenant files, runs EAS build/submit, updates database, cleans up.

**Characteristics**:
- Runs 24/7 (polling every 5–10 seconds)
- CPU-intensive during builds (EAS CLI overhead)
- Memory: ~500MB base, ~1GB during active builds
- Network: ~500MB–1GB per build (git clone, EAS communication)
- Storage: Ephemeral (cleans up after each build)

**Options**:

| Provider | Small (100 apps, 1–2 builds/mo ea) | Medium (500 apps) | Notes |
|----------|-------------------------------------|-------------------|-------|
| **AWS ECS** (recommended) | $50–100/mo | $150–300/mo | Fully managed; pay for compute |
| **AWS EC2 t3.small** | $15–30/mo | $30–60/mo | Raw instance; requires ops |
| **Railway** | $30–60/mo | $100–200/mo | Simple deployment; good scaling |
| **Heroku** | $50–100/mo | $150–300/mo | Easy but less cost-efficient at scale |
| **Self-hosted** (your server) | $0/mo | $0/mo | Requires ops; capital upfront |

**Recommended**: **AWS ECS Fargate** ($50–100/mo) for 100 apps, scaling to multiple task replicas as concurrency increases.

**Scaling assumption**: 1 concurrent build at a time. If you want 3 concurrent builds, multiply by 3.

**Expected load at 100 apps**:
- ~100–200 builds/month (1–2 per app)
- Build duration: ~15–20 minutes (mostly waiting on EAS)
- Idle time: 99% (just polling Redis)
- CPU: ~10% average, ~80% during active build
- Memory: ~500MB idle, ~1GB active

**Estimate for 100 apps**: **$75/month** (Fargate t3.medium, 1 task)

---

### 3. PostgreSQL Database (Managed)

**Purpose**: Multi-tenant database storing tenants, apps, brand manifests, program versions, builds, credentials (opaque references), subscriptions.

**Schema size estimates at 100 apps**:
- Tenants: 100 rows
- Apps: ~150 rows (avg 1.5 apps per tenant)
- BrandManifests: ~300 rows (versioned, ~2–3 per app)
- ProgramVersions: ~300 rows (versioned, ~2–3 per app)
- Builds: ~150–200 rows (1–2 per app per month)
- Build history: ~1,500 rows (keep 30 days)
- AppleCredentials/GoogleCredentials: ~150 rows (1–2 per app)
- Total data: ~50–100 GB (includes indexes, backups)

**Options**:

| Provider | Small (100 apps) | Medium (500 apps) | Large (1,000+ apps) |
|----------|------------------|-------------------|---------------------|
| **AWS RDS** (db.t3.micro) | $15–25/mo | $25–50/mo | $50–100/mo |
| **AWS RDS** (db.t3.small) | $30–50/mo | $50–100/mo | $100–150/mo |
| **Railway** (shared) | $10–20/mo | $20–40/mo | $40–80/mo |
| **Neon** (serverless) | $5–15/mo | $15–30/mo | $30–60/mo |
| **AWS Aurora Serverless** | $10–25/mo | $25–60/mo | $60–150/mo |

**Recommended**: **AWS RDS db.t3.small** ($50/mo) for production-grade reliability and performance.

**Why**: Multi-AZ failover, automated backups, Read Replicas for scaling reads, good balance of cost and reliability.

**Expected queries at 100 apps**:
- Dashboard API calls: ~1–5 per second (customer interactions)
- Orchestrator lookups: ~0.1 queries/sec (build processing)
- Build history polling: ~1–2 queries/sec (clients checking status)
- Total: ~10 QPS peak, <1 QPS average

**Estimate for 100 apps**: **$50/month** (db.t3.small with Multi-AZ: +$25 = $75 total)

---

### 4. Redis Queue (BullMQ)

**Purpose**: Job queue storing pending/active/completed build jobs.

**Queue characteristics at 100 apps**:
- Average queue depth: 0–2 jobs (build one at a time)
- Peak queue depth: 5–10 jobs (if builds back up)
- Job retention: 24–48 hours
- Memory footprint: ~50MB (small jobs)
- Concurrency: 1 worker processing jobs

**Options**:

| Provider | Cost | Notes |
|----------|------|-------|
| **Upstash** (serverless Redis) | Free–$5/mo | Ideal for hobby/small projects; pay-as-you-go |
| **AWS ElastiCache** (cache.t3.micro) | $15–25/mo | Overkill for queue, but good if you need caching too |
| **Redis Cloud** | $15–50/mo | Managed; good uptime SLA |
| **Railway** (Redis add-on) | $5–10/mo | Simple; integrates with other services |
| **Self-hosted** | $0/mo | Requires ops; risk of data loss if not backed up |

**Recommended**: **Upstash** (free tier) until queue depth exceeds 10,000 messages/day, then upgrade to paid tier.

**Estimate for 100 apps**: **Free–$5/month** (Upstash free tier)

---

### 5. AWS Secrets Manager

**Purpose**: Encrypted storage of customer Apple and Google app signing credentials (.p8 keys, service-account JSON).

**Cost model**:
- **$0.40 per secret per month** (or $0.40/month minimum if <1 API call/day)
- **$0.05 per 10,000 API calls**

**Secrets at 100 apps**:
- Apple App Store Connect API key (.p8): 1 per app = 100 secrets
- Google Play service account (JSON): 1 per app = 100 secrets
- Optional: Stripe API key (1 total) = 1 secret
- Total: ~200 secrets

**Cost calculation**:
- Storage: 200 secrets × $0.40 = $80/month
- API calls: ~200 builds/month × 2 secrets per build × 1 call = 400 calls/month = $0.02
- Total: **~$80/month**

**Optimization**: Use secret names with tenant IDs (e.g., `secret:apple:tenant-123`, `secret:google:tenant-123`) to reduce secret count. Or store all tenant secrets as one JSON object = 100 secrets total → **$40/month**.

**Estimate for 100 apps**: **$40–80/month** (depending on secret organization)

---

### 6. Cloud Storage (S3)

**Purpose**: Store app icons, splash screens, adaptive icons, asset bundles, build logs, backups.

**Storage breakdown at 100 apps**:
- App icons: ~100 × 2 KB = 200 KB
- Splash screens: ~100 × 50 KB = 5 MB
- Adaptive icons: ~100 × 20 KB = 2 MB
- Build logs: ~200 builds/month × 100 KB = 20 MB (keep 90 days = 600 MB)
- Database backups: ~100 MB (keep 7 daily + weekly)
- Total: ~1 GB

**Cost at 100 apps**:
- Storage: 1 GB × $0.023/GB = $0.02/month
- Data transfer (out): ~500 MB/month × $0.09 = $0.05/month
- API calls: ~1,000 requests/month × $0.0004 = $0.40/month
- Total: **<$1/month**

S3 is essentially free at this scale.

**Estimate for 100 apps**: **$1–5/month** (includes logging, backups)

---

### 7. Monitoring & Observability (Optional but Recommended)

**Purpose**: Alert on errors, track performance, monitor build queue health.

**Options**:

| Tool | Cost | Purpose |
|------|------|---------|
| **Sentry** (error tracking) | Free–$29/mo | Catch runtime errors in dashboard/orchestrator |
| **Datadog** (full observability) | $15–200+/mo | Logs, metrics, APM (overkill for 100 apps) |
| **LogRocket** (frontend/backend) | Free–$99/mo | Session replay + error tracking |
| **CloudWatch** (AWS native) | $0.50–5/mo | Basic logging; cheap but manual |
| **Grafana + Prometheus** | Self-hosted | Free; requires setup |

**Recommended for 100 apps**: **Sentry** ($0 free tier → $29/mo) + **CloudWatch** (built into AWS).

**Estimate for 100 apps**: **$0–30/month** (Sentry free tier sufficient for <100 errors/day)

---

### 8. Miscellaneous

**SSL certificates**: Free (Let's Encrypt, included in most hosting)  
**Domain**: $10–15/year (negligible)  
**Email (transactional)**: Free tier on SendGrid/Mailgun  
**Bandwidth overage**: Unlikely at 100 apps; estimate $5–10/month  

**Estimate**: **$5–15/month**

---

## Total Backend Cost Summary

### At 100 Active Apps

| Component | Cost | Notes |
|-----------|------|-------|
| Dashboard (Vercel) | $50 | Includes CDN, analytics |
| Orchestrator (ECS) | $75 | 1 task, ~$0.023/hr |
| Database (RDS db.t3.small) | $75 | Multi-AZ for reliability |
| Redis (Upstash) | $5 | Free tier; pay-as-you-go |
| Secrets Manager | $60 | 200 secrets @ $0.40/secret/mo |
| S3 storage | $5 | Essentially free |
| Monitoring (Sentry) | $0 | Free tier |
| Miscellaneous | $10 | Domain, bandwidth |
| **TOTAL** | **$280/month** | |

**With margin for scaling/redundancy**: **$400–500/month**

---

### At 500 Active Apps

| Component | Cost | Notes |
|-----------|------|-------|
| Dashboard (Vercel Growth) | $100 | Increased concurrency |
| Orchestrator (ECS) | $200 | 2 tasks for concurrency |
| Database (RDS db.t3.large) | $125 | Larger instance |
| Redis (Upstash paid) | $25 | Increased throughput |
| Secrets Manager | $200 | 500 secrets |
| S3 storage | $20 | More history |
| Monitoring (Sentry) | $29 | Paid tier |
| Miscellaneous | $20 | |
| **TOTAL** | **$719/month** | **$1.44/app/mo** |

**With margin**: **$900–1,100/month**

---

### At 1,000 Active Apps

| Component | Cost | Notes |
|-----------|------|-------|
| Dashboard (Vercel) | $150 | Heavy concurrency |
| Orchestrator (ECS) | $400 | 4 tasks, auto-scaling |
| Database (RDS db.t3.xlarge) | $300 | High throughput |
| Redis (Redis Cloud) | $50 | Managed service |
| Secrets Manager | $400 | 1,000 secrets |
| S3 storage | $50 | |
| Monitoring (Sentry) | $99 | Professional tier |
| Miscellaneous | $40 | |
| **TOTAL** | **$1,489/month** | **$1.49/app/mo** |

**With margin**: **$1,800–2,200/month**

---

## Revenue vs. Cost (Unit Economics)

### Revenue Model (Assumed)

- **Subscription**: $99/month per app
- **Per-build fee**: $29 per build (one-time charge)
- **Builds per app per month**: 1–2 (average 1.5)
- **Revenue per app**: $99 + (1.5 × $29) = **$142.50/month**

### Unit Economics Table

| Scale | Monthly Backend Cost | Cost Per App | Revenue Per App | Margin |
|-------|----------------------|--------------|-----------------|--------|
| 100 apps | $400–500 | $4–5 | $142.50 | 96–97% |
| 500 apps | $900–1,100 | $1.80–2.20 | $142.50 | 98–99% |
| 1,000 apps | $1,800–2,200 | $1.80–2.20 | $142.50 | 98–99% |

**Key insight**: Backend costs are nearly fixed; adding apps is nearly pure margin.

---

## What's NOT Included in These Costs

### Customer-Paid Costs (WOEngine doesn't pay)

❌ **EAS (Expo Application Services)**: Customers pay Expo directly
  - Cost: ~$0.15–0.30 per minute of build time
  - Average 15–20 min build = $2–6 per build
  - Customers own their EAS account and pay Expo directly

❌ **App Store submission fees**:
  - Apple: $99/year per developer account
  - Google: $25 one-time per developer account
  - Customers pay directly to Apple/Google

❌ **Customer-provided infrastructure** (optional):
  - API servers for program data fetch
  - Analytics platforms
  - Push notification services

### WOEngine Internal Costs (NOT included above)

⚠️ **Team/salaries**: Engineering, ops, support  
⚠️ **Customer support**: Helpdesk, email, etc.  
⚠️ **Marketing/acquisition**: CAC, paid ads, etc.  
⚠️ **Payment processing**: Stripe takes 2.9% + $0.30 (reduces $29 build fee to ~$27.16)  
⚠️ **Legal/compliance**: Terms of service, privacy policy, etc.  
⚠️ **Development overhead**: Testing, staging, infrastructure, incident response  

These are **operating expenses**, not **backend costs**.

---

## Cost Optimization Strategies

### 1. Use Spot Instances for Orchestrator
**Savings**: ~50% on ECS compute
- Use AWS Fargate Spot for non-critical builds
- Fallback to on-demand if build fails

### 2. Database Read Replicas
**Savings**: ~$50–100/month on heavy-read scenarios
- Dashboard queries read from replica
- Builds write to primary
- Only needed at 500+ apps

### 3. Reserved Instances
**Savings**: ~30–40% on 1-year commitment
- RDS Reserved Instances: $30–50/mo vs. $75/mo on-demand
- ECS on EC2 Reserved: $20–30/mo savings
- Worthwhile at 500+ apps

### 4. Consolidate Secrets
**Savings**: 50% on Secrets Manager
- Store all app secrets in one JSON object per tenant
- Reduces secret count from 200 to 100

### 5. Archive Old Builds
**Savings**: <$1/month (minimal)
- Move builds >90 days old to Glacier ($0.004/GB/month)
- Only matters at 10,000+ apps

### 6. Auto-Scale Orchestrator
**Savings**: Reduce average task count
- Use FIFO queue with scaling metrics
- Scale down to 0 tasks during low-activity hours
- Can reduce ECS cost by 20–30%

---

## Scaling Path & Recommendations

### Phase 1: Launch (0–100 apps, $200–400/month)

**Infrastructure**:
- Vercel Pro: $20/month
- ECS 1 task: $50/month
- RDS db.t3.small: $50/month
- Upstash free tier: $0/month
- Secrets Manager: $40/month
- Monitoring: $0/month (Sentry free)
- S3: $5/month
- **Total**: ~$165/month (plus ~$50 margin)

**Focus**: Simplicity, reliability, observability. Don't over-engineer.

---

### Phase 2: Growth (100–500 apps, $600–1,000/month)

**Infrastructure changes**:
- Upgrade Vercel to Growth plan: $50 → $150/month
- Scale ECS to 2 tasks: $50 → $150/month
- Upgrade RDS: $50 → $100/month
- Switch Redis to Upstash paid: $0 → $20/month
- Secrets Manager: $40 → $200/month

**Optimizations**:
- Add database read replica ($75/month)
- Enable RDS automated backups
- Implement autoscaling for ECS

**Focus**: Scaling gracefully, cost efficiency, team productivity.

---

### Phase 3: Scale (500–1,000+ apps, $1,200–2,500/month)

**Infrastructure changes**:
- ECS auto-scaling (2–4 tasks)
- RDS db.t3.large with Multi-AZ
- Implement Prometheus + Grafana for observability
- CloudFront CDN for dashboard
- Consider database sharding (at 1,000+ apps)

**Focus**: Operational excellence, automation, cost optimization.

---

## Assumptions & Caveats

### Assumptions Made

1. **100 apps = 100 active tenants** (some may be inactive)
2. **1–2 builds per app per month** (some apps build daily, some monthly)
3. **Moderate database size** (~100GB max at 1,000 apps)
4. **No video streaming** (program videos stored by customer or in S3)
5. **No analytics** (customers use external services like Mixpanel)
6. **Single-region deployment** (no multi-region redundancy)
7. **English-only** (no i18n CDN costs)
8. **Build concurrency = 1** (one build at a time)

### If Reality Differs

**If builds are more frequent** (5+ per app/month):
- Orchestrator costs increase (more tasks needed)
- EAS quota increases (customer cost, not WOEngine cost)
- Database growth increases ~20% per 5x build frequency

**If apps are geographically distributed**:
- Consider multi-region RDS (costs 2–3x)
- Consider CloudFront CDN (costs $0.085/GB)

**If you need high availability** (99.99% uptime):
- Add database replicas: +$100–200/month
- Add failover orchestrator: +$50–100/month
- Total additional: **~$200–300/month**

---

## Comparison to Competitors

| Platform | Typical Pricing | Implied Backend Cost | Margin |
|----------|-----------------|----------------------|--------|
| **Ymove** | $39+/month | ~$5–10 | 85–90% |
| **FitBudd** | $149/month | ~$10–20 | 85–90% |
| **Trainerize** | $248/month (white-label) | ~$20–30 | 85–90% |
| **Passion.io** | $99–299/month + 3.9% txn fee | ~$10–20 | 85–90% |
| **WOEngine** (est.) | $99/month + $29/build | ~$5–10 | **96–97%** |

**WOEngine's advantage**: Lower cost-per-unit due to closed-source engine (no code generation overhead) + async builds (vs. real-time builders).

---

## Conclusion

WOEngine backend infrastructure is **extremely cost-efficient**:

- **$400–500/month for 100 apps** = $4–5 per app per month
- **96%+ gross margin** at target pricing ($142/app/month)
- Backend costs **scale sublinearly** (per-unit cost decreases with scale)
- No hidden costs from EAS, App Store, or customer infrastructure

The business model is **highly profitable** if customer acquisition cost (CAC) is controlled.

---

## Next Steps

1. **Finalize pricing**: Confirm $99 subscription + $29 per build assumptions
2. **Stress test**: Estimate build frequency by customer segment
3. **Set alerts**: Monitor Secrets Manager costs (easiest to optimize)
4. **Plan scaling**: Pre-position infrastructure for 500–1,000 apps
5. **Track metrics**: Monitor cost per app, margin, actual vs. estimated costs

