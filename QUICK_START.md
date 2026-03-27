# 🚀 Quick Start (5 Minutes)

## TL;DR

```bash
# 1. Clone & install
git clone <repo>
cd maintenance-scheduler
npm install

# 2. Get a JWT secret & SMTP2GO key
# - JWT_SECRET: any random 32-char string
# - SMTP2GO_API_KEY: free account at smtp2go.com

# 3. Create .env.local
cat > .env.local << 'EOF'
JWT_SECRET=my-super-secret-key-12345678901234
SMTP2GO_API_KEY=sk_live_xxxxx
SMTP_FROM_EMAIL=noreply@localhost
NEXT_PUBLIC_API_URL=http://localhost:8787
EOF

# 4. Setup D1 (local)
npx wrangler d1 create maintenance-scheduler --local

# 5. Run both servers
npm run dev

# 6. Open in browser
# Frontend: http://localhost:3000
# API: http://localhost:8787/api/health
```

---

## What You Get

After 5 minutes, you have:

✅ Full-stack app running locally  
✅ Multi-tenant database with strict isolation  
✅ JWT authentication (register → login → dashboard)  
✅ CRUD for assets (cars, houses, appliances)  
✅ Task management with recurrence logic  
✅ Snooze reminders  
✅ View past completions & metrics  
✅ Daily digest email service (cron)  
✅ PWA-ready frontend  

---

## Key Files to Understand First

1. **`README.md`** - Project overview & roadmap
2. **`SETUP.md`** - Full setup & deployment guide
3. **`PROJECT_STRUCTURE.md`** - Code organization
4. **`migrations/001_init.sql`** - Database schema
5. **`api/src/index.ts`** - API entry point & routing
6. **`frontend/src/app/login/page.tsx`** - Frontend example

---

## What's Already Built (Phase 1)

### Backend ✅
- `POST /api/auth/register` - Create tenant + user
- `POST /api/auth/login` - Get JWT token
- `GET /api/assets` - List user's assets
- `POST /api/assets` - Create new asset
- `GET /api/tasks` - List user's tasks
- `POST /api/tasks` - Create recurring task
- `POST /api/tasks/:id/complete` - Mark task done
- `POST /api/tasks/:id/snooze` - Postpone reminder
- `GET /api/reminders/upcoming` - View due tasks
- `GET /api/history/*` - View past completions & metrics
- Daily cron job that sends email digests

### Frontend ⏳ (Scaffold Ready)
- Login page (complete)
- Auth store & API client (complete)
- Routes & PWA manifest (complete)
- Login page is fully functional
- **TODO**: Register, dashboard, asset list, task management UI

---

## Next: Build the UI

The backend is 100% done. Now add the frontend pages:

```bash
# Create these files (copy login/page.tsx pattern):
frontend/src/app/register/page.tsx
frontend/src/app/dashboard/page.tsx
frontend/src/app/assets/page.tsx
frontend/src/app/tasks/page.tsx
frontend/src/app/tasks/[id]/page.tsx
```

Each should:
1. Call API endpoints (use `apiGet`, `apiPost`, etc. from `lib/apiClient.ts`)
2. Manage state with Zustand stores or React hooks
3. Display data in Tailwind CSS styled components

---

## Testing the API

### Register a new account
```bash
curl -X POST http://localhost:8787/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "tenantName": "My House",
    "fullName": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

Response:
```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": "abc123",
    "tenantId": "xyz789",
    "email": "john@example.com",
    "fullName": "John Doe"
  }
}
```

### Login
```bash
curl -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

### Create an asset
```bash
TOKEN="eyJhbGc..."  # From login response

curl -X POST http://localhost:8787/api/assets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "2019 Honda Civic",
    "assetType": "car",
    "description": "Daily commute vehicle"
  }'
```

### List assets
```bash
curl http://localhost:8787/api/assets \
  -H "Authorization: Bearer $TOKEN"
```

---

## Deploy to Production

When ready (after building UI):

### 1. Setup Cloudflare
```bash
# Create D1 database
npx wrangler d1 create maintenance-scheduler

# Create R2 bucket (Phase 2)
npx wrangler r2 bucket create maintenance-scheduler-files
```

### 2. Add GitHub Secrets
Go to GitHub repo → Settings → Secrets and add:
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`
- `JWT_SECRET`
- `SMTP2GO_API_KEY`
- `SMTP_FROM_EMAIL`
- `NEXT_PUBLIC_API_URL` (your domain)

### 3. Push to main
```bash
git push origin main
```

GitHub Actions deploys automatically to Cloudflare Pages + Workers.

---

## Database Schema at a Glance

```sql
tenants          -- Your SaaS accounts
├── users        -- Team members
├── assets       -- Cars, houses, appliances
└── maintenance_tasks
    ├── task_assignments  -- Who owns each task
    ├── task_history      -- Past completions
    └── reminders_snoozed -- Postponed reminders
```

**Key Design:**
- Every table has `tenant_id` — strict multi-tenant isolation
- Tasks have configurable reminder windows & recurrence
- History tracks metrics (mileage, hours, cost)
- Email log tracks sends for auditing

---

## Common Commands

```bash
# Development
npm run dev              # Both servers
npm run dev:api         # Just API
npm run dev:frontend    # Just frontend

# Build
npm run build           # Both
npm run build:api       # Just API
npm run build:frontend  # Just frontend

# Database
npm run migrate         # Run migrations locally
npx wrangler d1 execute maintenance-scheduler \
  "SELECT * FROM users" --local

# Deployment
npm run deploy          # Full deploy (when ready)
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Cannot find module" | Run `npm install` |
| "D1 not found" | Run `npx wrangler d1 create maintenance-scheduler --local` |
| "Port 3000/8787 already in use" | Kill process or use different ports |
| "JWT_SECRET not found" | Create `.env.local` with JWT_SECRET |
| "CORS error" | Check API URL in `.env.local` matches frontend requests |

---

## What's Next?

1. **Build the UI** - Copy `login/page.tsx` pattern for other pages
2. **Test the flow** - Register → Create asset → Add task → Complete task
3. **Add email** - Set SMTP2GO key, watch digests send daily at 9 UTC
4. **Deploy** - Push to GitHub, sit back while Actions deploys

---

## Resources

- Full guide: `SETUP.md`
- Code structure: `PROJECT_STRUCTURE.md`
- DB schema: `migrations/001_init.sql`
- API routes: `api/src/routes/*.ts`
- Frontend examples: `frontend/src/app/login/page.tsx`

---

Good luck! Build fast. Ship faster. 🚀
