# WOEngine API Examples

## Tenant Creation

```bash
curl -X POST http://localhost:3000/api/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Fit Inc",
    "contactEmail": "admin@fitinc.com"
  }'
```

Response:
```json
{
  "id": "clx1234...",
  "companyName": "Fit Inc",
  "contactEmail": "admin@fitinc.com",
  "status": "active",
  "createdAt": "2024-07-20T...",
  "updatedAt": "2024-07-20T..."
}
```

## App Creation

```bash
curl -X POST http://localhost:3000/api/apps \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "clx1234...",
    "appName": "FitApp",
    "iosBundleId": "com.fitinc.fitapp",
    "androidPackageName": "com.fitinc.fitapp"
  }'
```

Response:
```json
{
  "id": "clx5678...",
  "tenantId": "clx1234...",
  "appName": "FitApp",
  "iosBundleId": "com.fitinc.fitapp",
  "androidPackageName": "com.fitinc.fitapp",
  "currentBrandManifestId": null,
  "currentProgramVersionId": null,
  "createdAt": "2024-07-20T..."
}
```

## Branding Manifest

```bash
curl -X POST http://localhost:3000/api/brand-manifest \
  -H "Content-Type: application/json" \
  -d '{
    "appId": "clx5678...",
    "appDisplayName": "FitApp Pro",
    "colorTokens": {
      "bg": "#0B0D10",
      "surface": "#151A20",
      "work": "#FF5733",
      "rest": "#3366FF",
      "hold": "#FFD700",
      "text": "#F2F5F8",
      "onWork": "#06210F",
      "onRest": "#04192B",
      "onHold": "#2A1A02"
    }
  }'
```

Response:
```json
{
  "id": "clx9012...",
  "appId": "clx5678...",
  "version": 1,
  "appDisplayName": "FitApp Pro",
  "colorTokens": { "...": "..." },
  "createdAt": "2024-07-20T..."
}
```

## Program Version

```bash
curl -X POST http://localhost:3000/api/program-version \
  -H "Content-Type: application/json" \
  -d '{
    "appId": "clx5678...",
    "programJson": {
      "LEVELS": {
        "beginner": {
          "key": "beginner",
          "label": "Beginner",
          "rounds": 2,
          "restSec": 45,
          "roundRestSec": 120
        }
      },
      "CIRCUIT": [
        {
          "order": 1,
          "name": "Jumping Jacks",
          "kind": "count",
          "unit": "reps",
          "targets": { "beginner": "20" }
        }
      ],
      "SCHEDULE": {
        "mon": {
          "day": "Monday",
          "mode": "circuit",
          "focus": "Full Body"
        }
      }
    }
  }'
```

Response:
```json
{
  "id": "clx3456...",
  "appId": "clx5678...",
  "version": 1,
  "programJson": { "...": "..." },
  "isCurrent": true,
  "publishedAt": "2024-07-20T...",
  "createdAt": "2024-07-20T..."
}
```

## Build Trigger

```bash
curl -X POST http://localhost:3000/api/builds \
  -H "Content-Type: application/json" \
  -d '{
    "appId": "clx5678...",
    "platforms": ["ios", "android"]
  }'
```

Response (after Stripe charge):
```json
{
  "id": "clx7890...",
  "appId": "clx5678...",
  "platforms": ["ios", "android"],
  "status": "queued",
  "stripeChargeId": "pi_xxxxx",
  "costCents": 2900,
  "createdAt": "2024-07-20T..."
}
```

## Build Status

```bash
curl http://localhost:3000/api/builds/clx7890...
```

Response:
```json
{
  "id": "clx7890...",
  "status": "building",
  "easBuildIdIos": "5e5b1449...",
  "easBuildIdAndroid": "5e5b1450...",
  "startedAt": "2024-07-20T...",
  "completedAt": null
}
```

---

## Sample Program Data (Full)

```json
{
  "LEVELS": {
    "reduced": {
      "key": "reduced",
      "label": "Ramping Up",
      "rounds": 3,
      "restSec": 30,
      "roundRestSec": 120
    },
    "middle": {
      "key": "middle",
      "label": "Intermediate",
      "rounds": 4,
      "restSec": 30,
      "roundRestSec": 90
    }
  },
  "CIRCUIT": [
    {
      "order": 1,
      "name": "Burpees",
      "kind": "count",
      "unit": "reps",
      "targets": {
        "reduced": "10",
        "middle": "20"
      }
    },
    {
      "order": 2,
      "name": "Plank",
      "kind": "hold",
      "unit": "seconds",
      "targets": {
        "reduced": 30,
        "middle": 60
      }
    }
  ],
  "SCHEDULE": {
    "mon": {
      "day": "Monday",
      "short": "Mon",
      "focus": "Cardio",
      "mode": "circuit",
      "note": "Push for speed"
    },
    "tue": {
      "day": "Tuesday",
      "short": "Tue",
      "focus": "Rest",
      "mode": "rest",
      "note": "Recovery day"
    }
  }
}
```

---

## Sample Color Tokens

```json
{
  "bg": "#0B0D10",
  "surface": "#151A20",
  "surfaceHigh": "#1E252E",
  "border": "#2A333F",
  "text": "#F2F5F8",
  "textDim": "#93A1B0",
  "textFaint": "#5D6B7A",
  "work": "#3DDC84",
  "rest": "#3D9BDC",
  "hold": "#DCA23D",
  "danger": "#DC5B4B",
  "accent": "#8B6BF0",
  "onWork": "#06210F",
  "onRest": "#04192B",
  "onHold": "#2A1A02"
}
```

---

## Testing with Stripe (Sandbox)

Test card numbers for local development:

- **Successful payment**: `4242 4242 4242 4242`
- **Insufficient funds**: `4000 0000 0000 0002`
- **Declined**: `4000 0000 0000 0069`

Expiry: any future date (e.g., 12/25)
CVC: any 3 digits (e.g., 123)

---

## Webhook Testing (Future)

When Stripe webhooks are implemented:

```bash
# Test subscription updated event
stripe trigger account.updated
```

See [Stripe docs](https://stripe.com/docs/cli/trigger) for full list.
