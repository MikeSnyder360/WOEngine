# Orchestrator Backend Setup Guide

The **Orchestrator** is a Node.js worker that handles the core build pipeline:
- Polls Redis for build jobs
- Decrypts customer credentials
- Clones the engine repo
- Generates per-tenant files (theme, program)
- Runs `eas build` and `eas submit`
- Updates database with results

---

## Prerequisites

Before running the orchestrator locally, you need:

### 1. Git SSH Access
The orchestrator clones the engine repo via SSH:
```bash
ssh-add ~/.ssh/id_ed25519  # (or your SSH key)
ssh -T git@github.com      # Test: should say "Hi [username]"
```

### 2. EAS Account (Expo Application Services)
The orchestrator uses EAS to build and submit iOS/Android apps:

```bash
npm install -g eas-cli
eas login
eas whoami  # Verify you're logged in
```

This creates `~/.eas` with your credentials.

### 3. Node.js 18+
```bash
node --version  # Should be v18+
```

### 4. Docker (for local Postgres + Redis)
```bash
docker-compose up -d
```

### 5. AWS Credentials (for Secrets Manager, optional)
For **demo/local dev**: skip this (credentials are not used)

For **production**: configure AWS:
```bash
aws configure
# Or set env vars:
export AWS_ACCESS_KEY_ID="..."
export AWS_SECRET_ACCESS_KEY="..."
```

---

## Local Setup (Demo Mode)

### 1. Install Dependencies

```bash
cd apps/orchestrator
pnpm install
```

### 2. Configure Environment

Create `.env.local`:

```bash
# Database (same as dashboard)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/woengine_dev"

# Redis
REDIS_URL="redis://localhost:6379"

# AWS (not needed for demo)
AWS_REGION="us-east-1"

# EAS (your account)
EAS_TOKEN="your-eas-token-here"

# Engine Repo
ENGINE_REPO="git@github.com:MikeSnyder360/WOEngine.git"

# Environment
NODE_ENV="development"
```

**For demo mode** with mock builds (no real EAS):
- Leave `EAS_TOKEN` empty
- The orchestrator will log what it would do instead of actually building

### 3. Verify Database

```bash
npx prisma db push
```

This creates tables if not already done.

### 4. Start the Orchestrator

```bash
pnpm dev
```

You should see:
```
[Orchestrator] Starting build worker...
[Orchestrator] Redis URL: redis://localhost:6379
[Orchestrator] Database URL: postgresql://...
[Orchestrator] AWS Region: us-east-1
[Orchestrator] Worker started, listening for jobs...
```

---

## Testing the Build Pipeline

### Test 1: Dashboard → Orchestrator Flow

**Terminal 1: Orchestrator** (running from above)

**Terminal 2: Dashboard**
```bash
cd apps/dashboard
pnpm dev
```

**Terminal 3: Trigger a build**

1. Go to http://localhost:3000
2. Sign in (demo: any email)
3. Create an app
4. Save branding + program
5. Click "Build & Submit (Free)"

**Watch Terminal 1** for build job processing:
```
[Build clx1234] Starting build for platforms: ios, android
[Build clx1234] Building app: My App
[Build clx1234] Running build for ios, android
[Build clx1234] Build succeeded (stub)
[Build clx1234] Cleaning up workspace
```

### Test 2: Manual Job Enqueue

```bash
redis-cli
> lpush "bull:builds:0" '{"buildId":"test-123","platforms":["ios"]}'
> quit
```

Check orchestrator logs — it should pick up the job.

---

## Configuration Details

### Environment Variables

| Variable | Required | Description |
|----------|----------|---|
| `DATABASE_URL` | Yes | Postgres connection string |
| `REDIS_URL` | Yes | Redis connection string |
| `AWS_REGION` | Yes | AWS region (us-east-1, etc.) |
| `EAS_TOKEN` | No (demo) | EAS API token for real builds |
| `ENGINE_REPO` | Yes | Git repo URL (git@github.com:...) |
| `NODE_ENV` | No | "development" or "production" |

### AWS Secrets Manager (Optional)

For **demo/local**: credentials are mocked

For **production**: store encrypted credentials:
```bash
aws secretsmanager create-secret \
  --name secret:apple:app-123:v1 \
  --secret-string file://apple-key.p8
```

The orchestrator will decrypt on-demand when processing builds.

---

## Build Orchestration Steps

When a build job is picked up from Redis:

1. **Load from database**
   - Get Build, App, Tenant, BrandManifest, ProgramVersion

2. **Decrypt credentials**
   - Apple: ASC `.p8` key from AWS Secrets Manager
   - Google: Play service-account JSON from AWS Secrets Manager

3. **Git clone**
   - `git clone git@github.com:MikeSnyder360/WOEngine.git --depth 1 --branch v1.0.0-engine /tmp/build-{buildId}`
   - `npm ci` in workspace

4. **Generate tenant files**
   - `src/theme.js` (from colorTokens)
   - `src/data/program.default.json` (from program JSON)
   - Overwrite `assets/` (icon, splash, adaptive icons)

5. **Run EAS**
   - `eas build --platform ios android --profile production`
   - Parses output, saves build IDs to database
   - `eas submit --platform ios android --profile production`
   - Updates database with submission status

6. **Cleanup**
   - `rm -rf /tmp/build-{buildId}` (unconditionally, even on error)
   - Shred decrypted credentials from memory

---

## Troubleshooting

### Redis Connection Refused
```bash
# Check if Redis is running
redis-cli ping  # Should return PONG

# Or start it
docker-compose up -d
```

### Database Connection Refused
```bash
# Check Postgres
psql postgresql://postgres:postgres@localhost:5432/woengine_dev

# Or start it
docker-compose up -d
```

### Git Clone Fails
```bash
# Verify SSH access
ssh -T git@github.com  # Should say "Hi [username]"

# Test clone
git clone git@github.com:MikeSnyder360/WOEngine.git --depth 1 /tmp/test
```

### EAS Login Issues
```bash
# Clear EAS cache
rm -rf ~/.eas

# Re-login
eas login
eas whoami
```

### Build Job Not Processing
```bash
# Check Redis queue
redis-cli
> llen "bull:builds:0"  # Should show pending jobs

# Check orchestrator logs for errors
# (check terminal running `pnpm dev`)
```

### AWS Secrets Manager Access Denied
```bash
# Verify AWS credentials
aws sts get-caller-identity

# Check IAM permissions for Secrets Manager
# Need: secretsmanager:GetSecretValue
```

---

## Performance Tuning

### Concurrency

Currently set to **1 build at a time** (EAS builds are long):

```typescript
// src/index.ts
const worker = new Worker('builds', buildOrchestrator, {
  concurrency: 1,  // Process one build at a time
  // ...
});
```

To scale:
- Increase concurrency (but beware EAS rate limits)
- Run multiple orchestrator instances on different machines
- Use Redis cluster for job distribution

### Memory

Builds are memory-intensive. Monitor:
```bash
top  # Watch memory usage
ps aux | grep node
```

### Logging

Default: errors only. For verbose logging:

```bash
DEBUG=* pnpm dev
```

Or update logger level in `src/index.ts`.

---

## Production Deployment

### Prerequisites
- AWS Secrets Manager configured with encrypted credentials
- EAS account with sufficient build quota
- Private GitHub repo access (SSH key deployed)
- Redis cluster
- RDS PostgreSQL

### Deployment Options

**Option 1: AWS ECS**
```bash
# Build container image
docker build -f Dockerfile.orchestrator -t woengine-orchestrator:v1 .

# Push to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin [ECR_URI]
docker push [ECR_URI]/woengine-orchestrator:v1

# Deploy via CloudFormation / Terraform
```

**Option 2: Kubernetes**
```bash
# Create deployment
kubectl create deployment woengine-orchestrator \
  --image=[REGISTRY]/woengine-orchestrator:v1

# Configure env vars, secrets
kubectl create secret generic woengine-secrets \
  --from-literal=DATABASE_URL="..." \
  --from-literal=REDIS_URL="..." \
  --from-literal=AWS_REGION="..."
```

**Option 3: EC2**
```bash
# SSH into instance
ssh ec2-user@instance-ip

# Clone repo, install, run
git clone ...
pnpm install
pnpm build
NODE_ENV=production pnpm start
```

### Health Checks

Monitor the orchestrator:
```bash
# Check if worker is running
curl http://localhost:3000/health

# Monitor queue depth
redis-cli llen "bull:builds:0"

# Check database connectivity
psql $DATABASE_URL -c "SELECT 1"
```

### Scaling Strategy

1. **Horizontal**: Run multiple orchestrator instances
2. **Vertical**: Increase machine resources
3. **Queue management**: Monitor backlog, adjust concurrency
4. **EAS quotas**: Monitor build minute usage

---

## Useful Commands

```bash
# Run locally
pnpm dev

# Build for production
pnpm build

# Start production build
NODE_ENV=production node dist/index.js

# Type check
pnpm type-check

# Check for linting issues
pnpm lint

# View database
pnpm db:studio

# Connect to Redis
redis-cli

# Test EAS CLI
eas --version
eas whoami
```

---

## Architecture Notes

- **Ephemeral workspaces**: Each build gets a temporary `/tmp/build-{id}` directory, cleaned up after
- **Secrets never logged**: Decrypted credentials are only written to ephemeral disk, never to logs
- **Versioned data**: Each build references exact snapshots of BrandManifest + ProgramVersion
- **Async**: Dashboard enqueues, orchestrator processes in background via Redis

---

## See Also

- [ARCHITECTURE.md](../ARCHITECTURE.md) — System design
- [BACKEND_STACK.md](./BACKEND_STACK.md) — Backend services overview
- [GETTING_STARTED.md](../GETTING_STARTED.md) — Quick start guide
- [STATUS.md](../STATUS.md) — Implementation checklist
