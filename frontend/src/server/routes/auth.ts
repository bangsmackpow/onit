// api/src/routes/auth.ts
import { Hono } from 'hono'
import { z } from 'zod'
import { nanoid } from 'nanoid'
import * as bcrypt from 'bcryptjs'
import { generateJWT, authMiddleware } from '../middleware/auth'
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
      let plan = 'free'
      if (!tenantIdByInvite) {
        // Create new tenant if not joining one
        await db
          .prepare(
            'INSERT INTO tenants (id, name, plan, created_at, updated_at) VALUES (?, ?, ?, datetime("now"), datetime("now"))'
          )
          .bind(tenantId, validated.tenantName || `${validated.fullName}'s Household`, plan)
          .run()
      } else {
        const tenant = await db.prepare('SELECT plan FROM tenants WHERE id = ?').bind(tenantId).first<{ plan: string }>()
        plan = tenant?.plan || 'free'
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
          plan: plan.toLowerCase().trim(),
          isAdmin: validated.email === (c.env.ADMIN_EMAIL || 'curtis@example.com')
        },
        message: 'Registration successful',
      }, 201)
    } catch (err) {
      await db.prepare('ROLLBACK').run()
      throw err
    }
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
// ============================================================================
// GET CURRENT USER (ME)
// ============================================================================
auth.get('/me', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId') as string
    const db = c.env.DB

    const res = await db.prepare(`
      SELECT 
        u.id, 
        u.tenant_id as tenant_id, 
        u.email, 
        u.full_name as full_name, 
        u.is_owner as is_owner, 
        u.is_system_admin as is_system_admin,
        t.name as tenant_name,
        t.plan as plan 
      FROM users u 
      JOIN tenants t ON u.tenant_id = t.id 
      WHERE u.id = ?
    `).bind(userId).first<{
      id: string
      tenant_id: string
      email: string
      full_name: string
      is_owner: number
      is_system_admin: number
      tenant_name: string
      plan: string
    }>()

    if (!res) {
      return c.json({ error: 'User not found' }, 404)
    }

    return c.json({
      user: {
        id: res.id,
        tenantId: res.tenant_id,
        email: res.email,
        fullName: res.full_name,
        isOwner: !!res.is_owner,
        tenantName: res.tenant_name,
        plan: res.plan?.toLowerCase().trim() || 'free',
        isAdmin: !!res.is_system_admin || res.email === (c.env.ADMIN_EMAIL || 'curtis@example.com')
      },
    })
  } catch (error) {
    console.error('Me error:', error)
    return c.json({ error: 'Failed to fetch user context' }, 500)
  }
})

auth.post('/login', async (c) => {
  try {
    const body = await c.req.json()
    const validated = LoginSchema.parse(body)
    const db = c.env.DB

    const res = await db.prepare(`
      SELECT 
        u.id, 
        u.tenant_id as tenant_id, 
        u.email, 
        u.password_hash as password_hash, 
        u.full_name as full_name, 
        u.is_owner as is_owner, 
        u.is_system_admin as is_system_admin,
        t.name as tenant_name,
        t.plan as plan 
      FROM users u 
      JOIN tenants t ON u.tenant_id = t.id 
      WHERE u.email = ?
    `).bind(validated.email).first<{
      id: string
      tenant_id: string
      email: string
      password_hash: string
      full_name: string
      is_owner: number
      is_system_admin: number
      tenant_name: string
      plan: string
    }>()

    if (!res || !(await bcrypt.compare(validated.password, res.password_hash))) {
      return c.json({ error: 'Invalid email or password' }, 401)
    }

    // Generate Token
    const secret = c.env.JWT_SECRET || 'dev-secret-replace-me-in-production'
    const token = await generateJWT(res.id, res.tenant_id, res.email, secret)

    return c.json({
      token,
      user: {
        id: res.id,
        tenantId: res.tenant_id,
        email: res.email,
        fullName: res.full_name,
        isOwner: !!res.is_owner,
        tenantName: res.tenant_name,
        plan: res.plan?.toLowerCase().trim() || 'free',
        isAdmin: !!res.is_system_admin || res.email === (c.env.ADMIN_EMAIL || 'curtis@example.com')
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
