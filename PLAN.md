# 🚀 ONIT Maintenance Scheduler - Roadmap & Plan

## 📌 Project Overview
ONIT is a serverless, multi-tenant maintenance and chore scheduling application built for family collaboration. It utilizes a modern "PWA-First" strategy to provide a native-like experience on Android and iOS while maintaining a single, efficient codebase.

---

## ✅ Completed Milestones (Phase 1 & 2)

### 1. Core Infrastructure
- **Multi-Tenant D1 Database:** Strict isolation with 11+ tables.
- **Hono.js API:** Fully typed, JWT-authenticated backend running on Cloudflare Workers.
- **PWA Scaffold:** Next.js 14 with Service Workers, manifest, and offline support.

### 2. Knowledge Base & Automation
- **Master Templates:** Over 50+ professional maintenance protocols (Cars, HVAC, Lawn, Appliances).
- **Daily Digest:** Automated email summaries via SMTP2GO and Cloudflare Crons.
- **Snooze Engine:** Logic to postpone tasks by 3, 7, or 14 days.
- **Supportive Archives:** Backend article system with step-by-step guides (HVAC sizing, smoke tests).

### 3. "Zen Garden" UX Refactor
- **Aesthetic Pivot:** Simplified minimalist white/slate theme. High-contrast UI for readability.
- **Rule of Three:** Dashboard redesigned to focus on exactly 3 daily priorities.
- **Global Search (CMD+K):** Universal command bar for assets, tasks, and knowledge articles.
- **Full CRUD:** Capability to modify assets and recurring task schedules.
- **Household Management:** Email-based invitations and role-based access control (Admin/Member).
- **Web Push Notifications:** Native lock-screen alerts for overdue tasks.

### 4. Stability & Production Readiness
- **Static Export Support:** Refactored dynamic routes for compatibility with `output: export` on Cloudflare Pages.
- **Migration & Seeding:** Stabilized D1 schema updates and added a one-click "Seed Archives" button for Admin.
- **Middleware Hardening:** Fixed security gaps to ensure all API routes are properly protected.

---

## 🛠️ Deployment Status

- **Frontend:** Deployed to Cloudflare Pages.
- **API:** Deployed to Cloudflare Workers.
- **Database:** Managed via Cloudflare D1.
- **CI/CD:** Automated via GitHub Actions (`.github/workflows/deploy.yml`).

---

## 📋 Remaining Refinements (Phase 3)

1. **[ ] Advanced Analytics:** Integrate `Chart.js` for cost and mileage tracking.
2. **[ ] Activity Feed:** Real-time dashboard logs of family maintenance actions.
3. **[ ] Onboarding Emails:** Automated "Welcome" protocols via SMTP2GO.
4. **[ ] Offline Sync Logic:** Improved data persistence when API is unreachable.
5. **[ ] Multi-Asset Bulk Actions:** Ability to snooze or complete multiple items at once.

---

*Last Updated: May 8, 2026*
