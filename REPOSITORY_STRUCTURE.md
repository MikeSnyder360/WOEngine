# WOEngine Repository Structure

```
WOEngine/
│
├── README.md                           # Overview, setup instructions
├── ARCHITECTURE.md                     # Design docs (can link to plan)
├── REPOSITORY_STRUCTURE.md             # This file
├── .gitignore
├── .easignore                          # Ignore ephemeral/generated files for EAS
├── .github/
│   ├── workflows/
│   │   ├── engine-build.yml           # Lint/test engine on PR
│   │   ├── dashboard-build.yml        # Lint/test dashboard on PR
│   │   └── deploy.yml                 # Deploy dashboard to Vercel, etc
│   └── CODEOWNERS
│
├── pnpm-workspace.yaml                # Monorepo setup
├── package.json                        # Root workspace config
│
│
├── apps/
│   │
│   ├── engine/                         # Expo React Native app (iOS + Android)
│   │   ├── app.config.js              # Dynamic config (reads HIIT_TENANT_MANIFEST env var)
│   │   ├── app.config.defaults.json   # Fallback config (today's app.json)
│   │   ├── eas.json                   # EAS Build/Submit profiles
│   │   ├── metro.config.js            # (if customizing Metro)
│   │   ├── babel.config.js            # (if customizing Babel)
│   │   ├── package.json               # Engine dependencies
│   │   ├── .easignore                 # Ignore generated files
│   │   │
│   │   ├── src/
│   │   │   ├── App.js                 # Root component
│   │   │   ├── Navigation.js           # Navigation setup
│   │   │   │
│   │   │   ├── screens/
│   │   │   │   ├── HomeScreen.js
│   │   │   │   ├── CircuitScreen.js
│   │   │   │   ├── FlowScreen.js
│   │   │   │   ├── SummaryScreen.js
│   │   │   │   ├── HistoryScreen.js
│   │   │   │   ├── RatingScreen.js
│   │   │   │   └── index.js
│   │   │   │
│   │   │   ├── components/
│   │   │   │   ├── ui.js              # Shared UI primitives
│   │   │   │   ├── Timer.js
│   │   │   │   ├── CircuitCard.js
│   │   │   │   └── index.js
│   │   │   │
│   │   │   ├── hooks/
│   │   │   │   ├── useCircuitSession.js
│   │   │   │   ├── useStopwatch.js
│   │   │   │   └── index.js
│   │   │   │
│   │   │   ├── data/
│   │   │   │   ├── program.js          # Main export, composes program-source logic
│   │   │   │   ├── program.default.js # Static data (LEVELS, CIRCUIT, SCHEDULE)
│   │   │   │   ├── program.engine.js  # Parameterized helper functions
│   │   │   │   ├── program.default.json # Generated per-build (bundled fallback)
│   │   │   │   └── programSource.js   # Runtime fetch + AsyncStorage cache logic
│   │   │   │
│   │   │   ├── theme/
│   │   │   │   ├── theme.js           # Generated per-build from tenant colors
│   │   │   │   └── theme.default.js   # Static defaults (colors, spacing, type)
│   │   │   │
│   │   │   ├── utils/
│   │   │   │   ├── storage.js         # AsyncStorage wrapper
│   │   │   │   ├── sound.js           # Audio playback (expo-audio)
│   │   │   │   ├── format.js          # String formatting
│   │   │   │   └── index.js
│   │   │   │
│   │   │   └── types.ts               # App-local types (if any)
│   │   │
│   │   ├── assets/
│   │   │   ├── icon.png               # App icon (1024×1024, overwritten per-tenant)
│   │   │   ├── splash-icon.png        # (overwritten per-tenant)
│   │   │   ├── favicon.png
│   │   │   ├── android-icon-foreground.png    # (overwritten per-tenant)
│   │   │   ├── android-icon-background.png    # (overwritten per-tenant)
│   │   │   ├── android-icon-monochrome.png    # (overwritten per-tenant)
│   │   │   ├── sounds/
│   │   │   │   ├── tick.wav
│   │   │   │   ├── go.wav
│   │   │   │   └── done.wav
│   │   │   └── rope-icon.svg          # Icon asset
│   │   │
│   │   └── scripts/
│   │       └── (if any local scripts)
│   │
│   │
│   ├── dashboard/                      # Web admin tool (Next.js)
│   │   ├── package.json
│   │   ├── next.config.js
│   │   ├── tsconfig.json
│   │   │
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── page.tsx           # Landing
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── auth/
│   │   │   │   │   ├── signin/
│   │   │   │   │   └── signup/
│   │   │   │   ├── dashboard/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── apps/
│   │   │   │   │   ├── billing/
│   │   │   │   │   └── settings/
│   │   │   │   └── api/
│   │   │   │       ├── tenants/
│   │   │   │       ├── apps/
│   │   │   │       ├── credentials/
│   │   │   │       ├── branding/
│   │   │   │       ├── builds/
│   │   │   │       ├── webhooks/
│   │   │   │       └── health.ts
│   │   │   │
│   │   │   ├── components/
│   │   │   │   ├── BrandingEditor.tsx
│   │   │   │   ├── ProgramEditor.tsx
│   │   │   │   └── (more components)
│   │   │   │
│   │   │   ├── lib/
│   │   │   │   ├── prisma.ts
│   │   │   │   ├── stripe.ts
│   │   │   │   ├── api-client.ts
│   │   │   │   └── auth.ts
│   │   │   │
│   │   │   └── styles/
│   │   │
│   │   ├── public/
│   │   └── env.example
│   │
│   │
│   └── orchestrator/                  # Build worker service (Node.js)
│       ├── package.json
│       ├── tsconfig.json
│       ├── .env.example
│       │
│       ├── src/
│       │   ├── index.ts               # Entry point
│       │   ├── config.ts              # Load env vars
│       │   │
│       │   ├── queue/
│       │   │   ├── consumer.ts
│       │   │   ├── producer.ts
│       │   │   └── types.ts
│       │   │
│       │   ├── orchestrator/
│       │   │   ├── build.ts
│       │   │   ├── git.ts
│       │   │   ├── generate.ts
│       │   │   ├── eas.ts
│       │   │   ├── secrets.ts
│       │   │   ├── cleanup.ts
│       │   │   └── types.ts
│       │   │
│       │   ├── db/
│       │   │   └── client.ts
│       │   │
│       │   ├── logging/
│       │   │   └── logger.ts
│       │   │
│       │   └── utils/
│       │       └── errors.ts
│       │
│       └── scripts/
│           └── generate-tenant-files.js
│
│
├── shared/                             # Shared code (types, schemas)
│   ├── package.json
│   │
│   ├── src/
│   │   ├── types/
│   │   │   ├── tenant.ts
│   │   │   ├── build.ts
│   │   │   ├── credential.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── schemas/
│   │   │   ├── branding.ts
│   │   │   ├── program.ts
│   │   │   ├── credential.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── constants/
│   │   │   ├── limits.ts
│   │   │   └── programs.ts
│   │   │
│   │   └── utils/
│   │       ├── validation.ts
│   │       └── format.ts
│   │
│   └── tsconfig.json
│
│
├── db/                                 # Database schema + migrations
│   ├── schema.prisma                  # Prisma schema
│   └── migrations/                    # Prisma migrations
│
│
├── docs/
│   ├── SETUP.md                       # Local dev setup
│   ├── DEPLOYMENT.md                  # Staging + production
│   ├── API.md                         # Dashboard API endpoints
│   ├── SECURITY.md                    # Secret handling, IAM
│   └── CONTRIBUTING.md
│
│
├── .env.example                        # Template env vars
├── docker-compose.yml                  # Local dev: Postgres, Redis
├── Dockerfile.orchestrator             # Orchestrator container
│
└── .gitignore                          # Standard + ephemeral build artifacts
```

## Key Design Notes

- **apps/engine**: Expo React Native → builds both iOS (.ipa) and Android (.aab). Per-build, orchestrator generates `theme.js` and `program.default.json` from tenant data, overwrites assets, then runs `eas build` for both platforms.
- **apps/dashboard**: Web admin UI (Next.js). Forms for branding, program editing, credential upload. API routes for CRUD + Stripe webhooks.
- **apps/orchestrator**: Long-running Node.js worker. Polls Redis queue, decrypts secrets, generates tenant files, runs EAS build/submit, shreds workspace.
- **shared/**: Reusable TypeScript types and Zod schemas across dashboard, orchestrator, and engine.
- **db/**: Prisma schema + migrations. Single source of truth for Postgres structure.
- **docs/**: Architecture, setup, security, API reference.
