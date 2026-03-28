# ⚙️ Maintenance Scheduler (ONIT)

A serverless, multi-tenant maintenance and chore scheduling application. Built on **Cloudflare Workers (Hono)**, **Pages (Next.js)**, **D1 (SQLite)**, and **R2**.

Track oil changes, filter replacements, insurance renewals, and household chores with automated email reminders and a mobile-friendly PWA.

---

## 🏗️ Project Structure

This is a monorepo using **npm workspaces**:

- [**api/**](./api) - Hono.js API running on Cloudflare Workers. Fully typed with Zod and Jose.
- [**frontend/**](./frontend) - Next.js 14 PWA running on Cloudflare Pages.
- [**migrations/**](./migrations) - D1 SQL schema and migration history.
- [**docs/**](./docs) - Original scaffold documentation and hand-off guides.

---

## 🚀 Quick Start (Development)

1. **Install Dependencies** (from root):
   ```bash
   npm install
   ```

2. **Configure Environment**:
   Create a `.env` file in the root based on [.env.example](.env.example).
   ```bash
   JWT_SECRET=your-dev-secret
   SMTP2GO_API_KEY=your-api-key
   SMTP_FROM_EMAIL=noreply@yourdomain.com
   ```

3. **Initialize Database** (Local):
   ```bash
   npx wrangler d1 create maintenance-scheduler --local
   npx wrangler d1 execute maintenance-scheduler --local --file=./migrations/001_init.sql
   ```

4. **Run Both Services**:
   ```bash
   npm run dev
   ```
   - **Frontend**: [http://localhost:3000](http://localhost:3000)
   - **API**: [http://localhost:8787](http://localhost:8787)

---

## ✅ Current Status (Phase 1)

- [x] Multi-tenant D1 Schema (11 tables)
- [x] Backend API (Hono.js) - 100% Typed & Functional
- [x] JWT Authentication & Middleware
- [x] Asset & Task Management Logic
- [x] Daily Digest cron service
- [x] Frontend Scaffold (Next.js + PWA)
- [x] Auth Store (Zustand) & API Client (Axios)
- [x] Fully functional Login page

## 🎯 Upcoming (Phase 2)

- [ ] Cloudflare R2 Integration for photo/receipt uploads.
- [ ] Stripe Billing & Subscription management.
- [ ] Dashboard View & Analytics.
- [ ] Task Pipeline UI refinement.

---

## 📜 Documentation

Detailed guides moved to the [**docs/**](./docs) directory:
- [Quick Start](./docs/QUICK_START.md)
- [Detailed Setup Guide](./docs/SETUP.md)
- [Delivery Roadmap](./docs/DELIVERY.md)

---

**License:** MIT
