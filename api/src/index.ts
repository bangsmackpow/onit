// api/src/index.ts
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { bearerAuth } from 'hono/bearer-auth'
import { secureHeaders } from 'hono/secure-headers'

import authRoutes from './routes/auth'
import assetsRoutes from './routes/assets'
import tasksRoutes from './routes/tasks'
import historyRoutes from './routes/history'
import remindersRoutes from './routes/reminders'
import cronHandler from './services/cron'
import { authMiddleware } from './middleware/auth'

interface Env {
  DB: D1Database
  JWT_SECRET: string
  SMTP2GO_API_KEY: string
  SMTP_FROM_EMAIL: string
}

const app = new Hono<{ Bindings: Env }>()

// ============================================================================
// GLOBAL MIDDLEWARE
// ============================================================================

app.use(logger())
app.use(secureHeaders())
app.use(
  cors({
    origin: '*', // Configure based on env in production
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length'],
  })
)

// Health check (unprotected)
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ============================================================================
// PUBLIC ROUTES (no auth required)
// ============================================================================

app.route('/api/auth', authRoutes)

// ============================================================================
// PROTECTED ROUTES (auth required)
// ============================================================================

// Apply auth middleware to all /api/* routes except /auth and /health
app.use('/api/assets/*', authMiddleware)
app.use('/api/tasks/*', authMiddleware)
app.use('/api/history/*', authMiddleware)
app.use('/api/reminders/*', authMiddleware)

app.route('/api/assets', assetsRoutes)
app.route('/api/tasks', tasksRoutes)
app.route('/api/history', historyRoutes)
app.route('/api/reminders', remindersRoutes)

// ============================================================================
// CRON TRIGGERS (Cloudflare Cron)
// ============================================================================

// Scheduled handler for daily digest emails
app.post('/api/cron/send-digests', async (c) => {
  try {
    await cronHandler.sendDailyDigests(c.env.DB, c.env.SMTP2GO_API_KEY, c.env.SMTP_FROM_EMAIL)
    return c.json({ success: true, message: 'Daily digests sent' })
  } catch (error) {
    console.error('Cron error:', error)
    return c.json({ success: false, error: String(error) }, 500)
  }
})

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.onError((err, c) => {
  console.error('Error:', err)
  return c.json(
    {
      error: err.message || 'Internal Server Error',
      status: 500,
    },
    500
  )
})

app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404)
})

export default app
