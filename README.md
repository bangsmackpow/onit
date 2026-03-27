# ⚙️ Maintenance Scheduler

A serverless, multi-tenant maintenance and chore scheduling application built on **Cloudflare Workers**, **Pages**, **D1**, and **R2**. Track oil changes, filter replacements, insurance renewals, household chores, and more—with automated email reminders, multi-user assignment, and complete audit history.

**Live from Git → Cloudflare in minutes. No servers. No DevOps.**

---

## 🎯 Core Idea

Maintenance tasks slip through the cracks. Oil changes get delayed, house filters get forgotten, insurance lapses—and life gets expensive. 

Maintenance Scheduler is a lightweight, collaborative platform where individuals and families track recurring maintenance across cars, houses, appliances, and more. Set it once, get reminded before it matters, track completion, and never miss a deadline again.

Perfect for:
- **Families** sharing responsibility for household and vehicle upkeep
- **Property managers** tracking maintenance across multiple units
- **Future monetization** as a SaaS for landlords, fleet operators, and property services

---

## 📋 Planned Features

### MVP (Phase 1 - Launch)
- ✅ Multi-tenant account management (strict tenant isolation)
- ✅ Create & manage assets (cars, houses, appliances)
- ✅ Define recurring maintenance tasks with configurable reminder windows
- ✅ Mark tasks complete with optional notes
- ✅ View task history and past completions
- ✅ Daily digest email reminders (configurable time)
- ✅ Snooze reminders (postpone 3, 7, 14 days)
- ✅ Single & multi-user task assignment
- ✅ Track metrics (mileage, hours, cost) per task
- ✅ PWA support (installable on mobile/desktop)
- ✅ Responsive design (mobile-first)

### Phase 2 (Post-Launch)
- 📱 Native iOS/Android apps with push notifications
- 💳 Stripe integration for per-tenant monthly/yearly billing
- 📸 Photo/receipt uploads to R2 with task completions
- 📊 Maintenance analytics & cost tracking dashboard
- 🔔 Flexible reminder channels (SMS, Slack, Discord webhooks)
- 👥 Team collaboration features (shared asset access, role-based permissions)
- 📅 iCalendar export & calendar integrations (Google Calendar, Outlook)
- 🤖 ML-driven predictive maintenance suggestions
- 🌍 Multi-language & timezone support

### Future Considerations
- Self-hosted option (Docker Compose alternative)
- API marketplace for integrations (vehicle OBD-II data, insurance APIs)
- White-label SaaS offering for property management companies

---

## 🏗️ Architecture

### Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 14+ | SSR/SSG, PWA support, TypeScript |
| **API** | Hono.js on Workers | Lightweight, fast, Cloudflare-native |
| **Database** | Cloudflare D1 (SQLite) | Structured relational data, migrations |
| **Files** | Cloudflare R2 | Photo/receipt storage for tasks |
| **Scheduling** | Cron Triggers (Workers) | Daily digest email processing |
| **Email** | smtp2go (3rd-party SMTP) | Outbound email delivery |
| **Auth** | Custom JWT + D1 | Session management, tenant isolation |
| **Hosting** | Cloudflare Pages + Workers | Global CDN, serverless compute |
| **CI/CD** | GitHub Actions | Build & deploy on push |

### Data Model

```
Tenants (SaaS accounts)
├─ Users (account members)
├─ Assets (cars, houses, appliances)
│  └─ MaintenanceTasks (oil change, filter replacement, etc.)
│     ├─ TaskHistory (past completions, metrics)
│     └─ TaskAssignments (single or multi-user owners)
└─ ReminderSnoozed (user postponement log)
```

### Key Design Decisions

**Strict Multi-Tenancy:**
- Every query filters by `tenant_id` at the database layer
- No cross-tenant data leaks possible
- Row-level security via JWT claims

**Configurable Reminders:**
- Each task defines grace period (notify X days before due)
- Cron job runs daily; calculates upcoming tasks per tenant
- Users can snooze reminders (stored in `RemindersPost`poned table)

**Flexible Task Assignment:**
- Tasks can have `assignment_type`: `'single'` or `'shared'`
- Shared tasks track multiple `TaskAssignment` rows
- History captures *who* completed *what* and *when*

**Metrics Tracking:**
- Optional fields: `mileage`, `hours`, `cost_usd` on `TaskHistory`
- Enables cost analysis and maintenance pattern insights

---

## 🚀 Deployment

### Prerequisites
- Cloudflare account (Free tier works; D1/R2 require Pro)
- GitHub account & repository
- smtp2go API key (free tier available)
- Node.js 18+ locally

### Quick Start

1. **Clone & Setup**
   ```bash
   git clone <repo>
   cd maintenance-scheduler
   npm install
   ```

2. **Configure Wrangler**
   ```bash
   cp wrangler.example.toml wrangler.toml
   # Edit wrangler.toml with your Cloudflare account ID, D1 database name, R2 bucket
   ```

3. **Create D1 Database**
   ```bash
   npx wrangler d1 create maintenance-scheduler
   ```

4. **Run Migrations**
   ```bash
   npx wrangler d1 execute maintenance-scheduler --file=./migrations/001_init.sql
   ```

5. **Set Environment Variables (Cloudflare Dashboard)**
   ```
   SMTP2GO_API_KEY=sk_live_xxxxx
   JWT_SECRET=your-secure-random-string
   SMTP_FROM_EMAIL=noreply@yourdomain.com
   ```

6. **Deploy**
   ```bash
   npm run deploy
   # Next.js → Pages
   # Hono API → Workers
   # Both auto-deployed via GitHub Actions
   ```

### Local Development

```bash
# Terminal 1: Next.js dev server
npm run dev:frontend

# Terminal 2: Wrangler (simulates Workers + D1 locally)
npm run dev:api

# Access: http://localhost:3000
```

### GitHub Actions CI/CD

**Workflow:**
1. Push to `main` branch
2. GitHub Actions runs tests & builds
3. Next.js compiled to `/out` → Cloudflare Pages
4. Hono API bundled → Cloudflare Workers
5. Auto-deployed to production

No Docker, no VPS, no SSH. Just `git push`.

---

## 📊 Database Schema (D1)

```sql
-- Tenants (SaaS billing units)
CREATE TABLE tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  plan TEXT NOT NULL, -- 'free', 'pro', 'enterprise'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Users (tenant members)
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Assets (cars, houses, appliances)
CREATE TABLE assets (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL, -- "2019 Honda Civic", "Master Bedroom AC"
  asset_type TEXT NOT NULL, -- 'car', 'house', 'appliance'
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Maintenance Tasks
CREATE TABLE maintenance_tasks (
  id TEXT PRIMARY KEY,
  asset_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  task_name TEXT NOT NULL, -- "Oil Change", "Air Filter Replacement"
  description TEXT,
  assignment_type TEXT NOT NULL, -- 'single', 'shared'
  reminder_days_before INT DEFAULT 7, -- notify X days before due
  recurrence_type TEXT NOT NULL, -- 'once', 'monthly', 'quarterly', 'biannual', 'annual'
  recurrence_interval INT, -- if custom: every N months/years
  last_completed_at DATETIME,
  next_due_date DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT NOT NULL,
  FOREIGN KEY (asset_id) REFERENCES assets(id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Task Assignments (who owns this task?)
CREATE TABLE task_assignments (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  assigned_to_user_id TEXT NOT NULL,
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES maintenance_tasks(id),
  FOREIGN KEY (assigned_to_user_id) REFERENCES users(id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  UNIQUE(task_id, assigned_to_user_id) -- prevent duplicate assignments
);

-- Task Completion History
CREATE TABLE task_history (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  completed_by_user_id TEXT NOT NULL,
  completed_at DATETIME NOT NULL,
  notes TEXT,
  -- Optional metrics
  mileage INT,
  hours_tracked DECIMAL(10,2),
  cost_usd DECIMAL(10,2),
  -- R2 attachment info
  receipt_photo_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES maintenance_tasks(id),
  FOREIGN KEY (completed_by_user_id) REFERENCES users(id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Snoozed Reminders
CREATE TABLE reminders_snoozed (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  original_due_date DATETIME NOT NULL,
  snoozed_until DATETIME NOT NULL,
  snooze_days INT, -- 3, 7, 14
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES maintenance_tasks(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
```

---

## 🔐 Security

- **JWT-based auth** with `tenant_id` embedded in token
- **Row-level filtering** on all queries (tenant_id check)
- **Password hashing** with bcrypt
- **HTTPS only** (Cloudflare enforced)
- **Snooze tokens** prevent fake snooze requests
- **R2 signed URLs** for file access (expiring links)
- **Rate limiting** on API endpoints via Cloudflare

---

## 📱 PWA Support

- **Offline mode**: Service worker caches essential UI/assets
- **Installable**: Add to home screen on iOS/Android
- **Native feel**: Full-screen, splash screen
- `manifest.json` with app icons & theme colors

---

## 💰 Monetization Model (Phase 2)

**Per-Tenant Pricing:**
- **Free**: 3 assets, 10 tasks, email reminders
- **Pro** ($9/month): Unlimited assets, 100 tasks, priority support
- **Enterprise** ($99/month): Unlimited everything + API access + custom integrations

Stripe integration in Phase 2 with tenant subscription management.

---

## 📈 Roadmap

| Phase | Timeline | Focus |
|-------|----------|-------|
| **Phase 1** | Weeks 1-4 | MVP: D1 schema, Hono API, Next.js frontend, email cron, PWA |
| **Phase 2** | Weeks 5-8 | Mobile apps (React Native), Stripe billing, R2 attachments |
| **Phase 3** | Weeks 9-12 | Analytics dashboard, SMS reminders, API marketplace |
| **Phase 4** | Ongoing | ML maintenance predictions, white-label SaaS, team features |

---

## 🛠️ Local Development Commands

```bash
# Install dependencies
npm install

# Run frontend + API locally
npm run dev

# Build for production
npm run build

# Deploy to Cloudflare
npm run deploy

# Run D1 migrations
npm run migrate

# Generate types from D1 schema
npm run types:generate
```

---

## 📞 Support & Contributing

For issues, feature requests, or contributions, open a GitHub issue or PR.

---

## 📄 License

MIT

---

## 🗂️ Project Structure

```
maintenance-scheduler/
├── frontend/                    # Next.js app
│   ├── app/                     # App Router
│   ├── components/              # React components
│   ├── lib/                     # Utilities (auth, API client)
│   ├── public/                  # Static assets, manifest.json
│   └── styles/                  # Global CSS
├── api/                         # Hono.js Workers
│   ├── src/
│   │   ├── index.ts             # Hono app entry
│   │   ├── middleware/          # Auth, CORS, logging
│   │   ├── routes/              # API endpoints
│   │   ├── db/                  # D1 queries, types
│   │   └── services/            # Business logic (email, tasks)
│   └── wrangler.toml
├── migrations/                  # D1 SQL migrations
│   ├── 001_init.sql
│   └── 002_add_metrics.sql
├── .github/workflows/           # CI/CD (GitHub Actions)
│   └── deploy.yml
└── README.md
```

---

**Ready to build?** Start with Phase 1 MVP: set up D1 schema, build the Hono API endpoints (CRUD for assets, tasks, completions), then wire the Next.js frontend.

