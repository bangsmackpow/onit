# Setup & Deployment Guide

## Prerequisites

- **Node.js 18+** - [Download](https://nodejs.org/)
- **npm 9+** - Comes with Node.js
- **Cloudflare Account** (free tier is fine, but D1/R2 require paid account)
- **GitHub Account** - For CI/CD
- **smtp2go Account** (free tier available) - For email sending

## Local Development Setup

### 1. Clone Repository

```bash
git clone <your-repo-url>
cd maintenance-scheduler
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual values:

```
JWT_SECRET=generate-a-random-32-char-string-here
SMTP2GO_API_KEY=your-smtp2go-api-key
SMTP_FROM_EMAIL=noreply@yourdomain.com
NEXT_PUBLIC_API_URL=http://localhost:8787
```

### 4. Setup Cloudflare (D1 Database)

1. **Create D1 Database**
   ```bash
   npx wrangler d1 create maintenance-scheduler
   ```

2. **Update `api/wrangler.toml`**
   - Copy the database ID from the output above
   - Paste it in the `d1_databases` section

3. **Run Migrations**
   ```bash
   npx wrangler d1 execute maintenance-scheduler --file=./migrations/001_init.sql --local
   ```

### 5. Run Local Development

In separate terminal windows:

**Terminal 1: Hono API (Workers)**
```bash
npm run dev:api
# Runs on http://localhost:8787
```

**Terminal 2: Next.js Frontend**
```bash
npm run dev:frontend
# Runs on http://localhost:3000
```

Or use both in one command:
```bash
npm run dev
```

### 6. Test Locally

- **Frontend**: http://localhost:3000
- **API**: http://localhost:8787/api/health
- **Register**: Create a new account at `/register`
- **Dashboard**: Access at `/dashboard` after login

---

## Production Deployment

### Step 1: Prepare Cloudflare

#### Create D1 Database (Remote)

```bash
npx wrangler d1 create maintenance-scheduler --remote
```

Save the database ID returned.

#### Create R2 Bucket (for Phase 2)

```bash
npx wrangler r2 bucket create maintenance-scheduler-files
```

#### Configure wrangler.toml

Update `api/wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "maintenance-scheduler"
database_id = "YOUR_DATABASE_ID"  # Paste here

[[r2_buckets]]
binding = "BUCKET_R2"
bucket_name = "maintenance-scheduler-files"
```

### Step 2: Setup GitHub Secrets

In your GitHub repository settings, add these secrets:

| Secret Name | Value |
|---|---|
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare Account ID |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token (with Workers + Pages permissions) |
| `JWT_SECRET` | Random 32+ character string |
| `SMTP2GO_API_KEY` | Your SMTP2GO API key |
| `SMTP_FROM_EMAIL` | noreply@yourdomain.com |
| `NEXT_PUBLIC_API_URL` | https://yourdomain.com/api |

### Step 3: Create Cloudflare Pages Project

1. Go to Cloudflare Dashboard → Pages
2. Click **Create a project** → Connect to Git
3. Select your GitHub repository
4. Configure build settings:
   - **Framework**: Next.js
   - **Build command**: `npm run build:frontend`
   - **Build output directory**: `frontend/out`
5. Save and deploy

### Step 4: Create Cloudflare Workers Project

1. Go to Cloudflare Dashboard → Workers
2. Click **Create a Service** → Use quickstart
3. Or use **wrangler** CLI:
   ```bash
   npx wrangler publish --env production
   ```

### Step 5: Setup Custom Domain

#### For Pages (Frontend)
1. In Pages project settings → Custom Domain
2. Add your domain (e.g., `yourdomain.com`)
3. Update DNS records as instructed

#### For Workers (API)
1. Create a route in your zone settings:
   - Pattern: `yourdomain.com/api/*`
   - Service: Your Workers service
   - Zone: Your domain

### Step 6: Run Migrations on Production

```bash
npx wrangler d1 execute maintenance-scheduler --remote --file=./migrations/001_init.sql
```

### Step 7: Deploy

Push to main branch:
```bash
git push origin main
```

GitHub Actions will automatically:
1. Run tests & linting
2. Build API (Hono/Workers)
3. Build Frontend (Next.js)
4. Deploy to Cloudflare Pages (frontend)
5. Deploy to Cloudflare Workers (API)
6. Run DB migrations

---

## Monitoring & Debugging

### View API Logs

```bash
npx wrangler tail --env production
```

### Check Database

```bash
npx wrangler d1 execute maintenance-scheduler "SELECT * FROM users" --remote
```

### Test API Endpoint

```bash
curl https://yourdomain.com/api/health

# With authentication
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://yourdomain.com/api/assets
```

### View Pages Deployments

Go to Cloudflare Dashboard → Pages → maintenance-scheduler → Deployments

---

## Troubleshooting

### "API endpoint not found"

- Ensure Workers route is configured in DNS
- Check that API URL in frontend `.env` matches your domain

### "D1 database not found"

- Verify database ID in `wrangler.toml`
- Run `npx wrangler d1 list` to see all databases

### "Migrations failed"

- Ensure all migration files are in `./migrations/`
- Check SQL syntax in migration files
- Run locally first: `npx wrangler d1 execute maintenance-scheduler --file=./migrations/001_init.sql --local`

### "SMTP2GO emails not sending"

- Verify API key is correct
- Check email log table: `SELECT * FROM email_log WHERE status = 'failed'`
- Test with curl:
  ```bash
  curl -X POST https://api.smtp2go.com/v3/email/send \
    -H "Content-Type: application/json" \
    -d '{"api_key":"YOUR_KEY","to":[{"email":"test@example.com"}],"from":"noreply@yourdomain.com","subject":"Test","html_body":"Test"}'
  ```

---

## Next Steps (Phase 2+)

- [ ] Add R2 photo/receipt uploads
- [ ] Implement Stripe billing
- [ ] Build mobile apps (React Native)
- [ ] Add SMS reminders
- [ ] Analytics dashboard
- [ ] Team collaboration features

---

## Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 Docs](https://developers.cloudflare.com/d1/)
- [Hono.js Docs](https://hono.dev/)
- [Next.js Docs](https://nextjs.org/docs)
- [smtp2go Docs](https://www.smtp2go.com/docs/)

---

## Support

For issues or questions:
1. Check the logs (see Monitoring section above)
2. Review GitHub Issues
3. Open a new issue with:
   - Error message
   - Steps to reproduce
   - Environment (local/production)
