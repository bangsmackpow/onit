// api/src/routes/auth.ts
import { Hono } from 'hono'
import { z } from 'zod'
import { nanoid } from 'nanoid'
import * as bcrypt from 'bcryptjs'
import { generateJWT } from '../middleware/auth'
import { Env, Variables } from '../types'

const auth = new Hono<{ Bindings: Env, Variables: Variables }>()

const RegisterSchema = z.object({
  fullName: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  inviteToken: z.string().optional(),
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

    // Determine tenant context: New household or joining via Invite
    let tenantIdByInvite: string | null = null
    let assignedRole: string = 'admin'

    if (validated.inviteToken) {
      const invite = await db
        .prepare('SELECT tenant_id, role FROM invitations WHERE token = ? AND expires_at > datetime("now")')
        .bind(validated.inviteToken)
        .first<{ tenant_id: string; role: string }>()
      
      if (!invite) {
        return c.json({ error: 'Invalid or expired invitation token' }, 400)
      }
      tenantIdByInvite = invite.tenant_id
      assignedRole = invite.role
    }

    const tenantId = tenantIdByInvite || nanoid()
    const userId = nanoid()
    const hashedPassword = await bcrypt.hash(validated.password, 10)

    // Transaction for registration
    await db.prepare('BEGIN TRANSACTION').run()
    try {
      if (!tenantIdByInvite) {
        // Create new tenant if not joining one
        await db
          .prepare(
            'INSERT INTO tenants (id, name, plan, created_at, updated_at) VALUES (?, ?, ?, datetime("now"), datetime("now"))'
          )
          .bind(tenantId, validated.tenantName || `${validated.fullName}'s Household`, 'free')
          .run()
      }

      await db
        .prepare(
          'INSERT INTO users (id, tenant_id, full_name, email, password_hash, role, is_owner, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime("now"), datetime("now"))'
        )
        .bind(userId, tenantId, validated.fullName, validated.email, hashedPassword, assignedRole, tenantIdByInvite ? 0 : 1)
        .run()

      // Delete the invitation if used
      if (validated.inviteToken) {
        await db.prepare('DELETE FROM invitations WHERE token = ?').bind(validated.inviteToken).run()
      }

      await db.prepare('COMMIT').run()
    } catch (err) {
      await db.prepare('ROLLBACK').run()
      throw err
    }

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

// ============================================================================
// GET ALL MEMBERS FOR TENANT
// ============================================================================
auth.get('/members', async (c) => {
  try {
    const tenantId = c.get('tenantId') as string
    const db = c.env.DB

    const result = await db
      .prepare('SELECT id, full_name, email, role, is_owner, created_at FROM users WHERE tenant_id = ? ORDER BY is_owner DESC, created_at ASC')
      .bind(tenantId)
      .all()

    return c.json({ members: result.results || [] })
  } catch (error) {
    console.error('Error fetching members:', error)
    return c.json({ error: 'Failed to fetch members' }, 500)
  }
})

export default auth
