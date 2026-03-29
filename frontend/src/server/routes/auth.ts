// api/src/routes/auth.ts
import { Hono } from 'hono'
import { z } from 'zod'
import { nanoid } from 'nanoid'
import * as bcrypt from 'bcryptjs'
import { generateJWT } from '../middleware/auth'
import { Env } from '../types'

const auth = new Hono<{ Bindings: Env }>()

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  tenantName: z.string().optional(),
})

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

// ============================================================================
// REGISTER
// ============================================================================
auth.post('/register', async (c) => {
  try {
    const body = await c.req.json()
    const validated = RegisterSchema.parse(body)
    const db = c.env.DB

    // Check if user exists
    const existing = await db
      .prepare('SELECT id FROM users WHERE email = ?')
      .bind(validated.email)
      .first()

    if (existing) {
      return c.json({ error: 'User already exists' }, 409)
    }

    // Create Tenant
    const tenantId = nanoid()
    await db
      .prepare('INSERT INTO tenants (id, name, plan, created_at, updated_at) VALUES (?, ?, "free", datetime("now"), datetime("now"))')
      .bind(tenantId, validated.tenantName || 'Household')
      .run()

    // Create User
    const userId = nanoid()
    const passwordHash = await bcrypt.hash(validated.password, 10)
    
    await db
      .prepare(
        'INSERT INTO users (id, tenant_id, email, password_hash, full_name, is_owner, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1, datetime("now"), datetime("now"))'
      )
      .bind(userId, tenantId, validated.email, passwordHash, validated.fullName)
      .run()

    // Create default user preferences
    const prefId = nanoid()
    await db
      .prepare(
        'INSERT INTO user_preferences (id, user_id, tenant_id, email_digest_time, timezone, email_frequency, created_at, updated_at) VALUES (?, ?, ?, "09:00", "UTC", "daily", datetime("now"), datetime("now"))'
      )
      .bind(prefId, userId, tenantId)
      .run()

    // Generate Token
    if (!c.env.JWT_SECRET) {
      console.warn('JWT_SECRET is not set in environment variables! Using temporary fallback for development.')
    }
    const secret = c.env.JWT_SECRET || 'dev-secret-replace-me-in-production'
    const token = await generateJWT(userId, tenantId, validated.email, secret)

    return c.json({
      token,
      user: {
        id: userId,
        tenantId,
        email: validated.email,
        fullName: validated.fullName,
        isOwner: true,
      },
      message: 'Registration successful',
    }, 201)

  } catch (error) {
    console.error('Registration error:', error)
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation error', details: error.errors }, 400)
    }
    return c.json({ error: 'Failed to register', details: String(error) }, 500)
  }
})

// ============================================================================
// LOGIN
// ============================================================================
auth.post('/login', async (c) => {
  try {
    const body = await c.req.json()
    const validated = LoginSchema.parse(body)
    const db = c.env.DB

    const user = await db
      .prepare('SELECT * FROM users WHERE email = ?')
      .bind(validated.email)
      .first<{
        id: string
        tenant_id: string
        email: string
        password_hash: string
        full_name: string
        is_owner: number
      }>()

    if (!user) {
      return c.json({ error: 'Invalid email or password' }, 401)
    }

    const valid = await bcrypt.compare(validated.password, user.password_hash)
    if (!valid) {
      return c.json({ error: 'Invalid email or password' }, 401)
    }

    // Generate Token
    const secret = c.env.JWT_SECRET || 'dev-secret-replace-me-in-production'
    const token = await generateJWT(user.id, user.tenant_id, user.email, secret)

    return c.json({
      token,
      user: {
        id: user.id,
        tenantId: user.tenant_id,
        email: user.email,
        fullName: user.full_name,
        isOwner: !!user.is_owner,
      },
    })

  } catch (error) {
    console.error('Login error:', error)
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation error', details: error.errors }, 400)
    }
    return c.json({ error: 'Failed to login', details: String(error) }, 500)
  }
})

export default auth
