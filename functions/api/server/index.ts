// api/src/index.ts
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { secureHeaders } from 'hono/secure-headers'

import authRoutes from './routes/auth'
import assetsRoutes from './routes/assets'
import tasksRoutes from './routes/tasks'
import historyRoutes from './routes/history'
import remindersRoutes from './routes/reminders'
import cronHandler from './services/cron'
import { authMiddleware } from './middleware/auth'
import { Env, Variables } from './types'

const app = new Hono<{ Bindings: Env, Variables: Variables }>()

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

// DB connectivity check
app.get('/api/db-health', async (c) => {
  try {
    const db = c.env.DB
    if (!db) return c.json({ status: 'error', error: 'D1 binding (DB) is missing in environment' }, 500)
    
    const result = await db.prepare('SELECT 1').run()
    return c.json({ status: 'ok', db: 'reachable', result })
  } catch (error) {
    return c.json({ status: 'error', error: String(error) }, 500)
  }
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
    const db = c.env.DB
    const apiKey = c.env.SMTP2GO_API_KEY
    const fromEmail = c.env.SMTP_FROM_EMAIL
    // Note: cronHandler.sendDailyDigests needs to be updated to accept D1Database directly if not already
    await (cronHandler as any).sendDailyDigests(db, apiKey, fromEmail)
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
