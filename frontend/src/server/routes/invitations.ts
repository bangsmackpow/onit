// api/src/routes/invitations.ts
import { Hono } from 'hono'
import { z } from 'zod'
import { nanoid } from 'nanoid'
import { Env, Variables } from '../types'

const invitations = new Hono<{ Bindings: Env, Variables: Variables }>()

const CreateInviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'member']).default('member'),
})

// ============================================================================
// GET ALL ACTIVE INVITES FOR TENANT
// ============================================================================
invitations.get('/', async (c) => {
  try {
    const tenantId = c.get('tenantId')
    const db = c.env.DB

    const result = await db
      .prepare('SELECT * FROM invitations WHERE tenant_id = ? AND expires_at > datetime("now") ORDER BY created_at DESC')
      .bind(tenantId)
      .all()

    return c.json({ invitations: result.results || [] })
  } catch (error) {
    console.error('Error fetching invitations:', error)
    return c.json({ error: 'Failed to fetch invitations' }, 500)
  }
})

// ============================================================================
// CREATE INVITATION
// ============================================================================
invitations.post('/', async (c) => {
  try {
    const tenantId = c.get('tenantId')
    const body = await c.req.json()
    const validated = CreateInviteSchema.parse(body)
    
    const db = c.env.DB
    const inviteId = nanoid()
    const token = nanoid(32) // Long secure token
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 day expiry

    // Check if user already exists in this tenant
    const existingUser = await db
      .prepare('SELECT id FROM users WHERE email = ? AND tenant_id = ?')
      .bind(validated.email, tenantId)
      .first()
    
    if (existingUser) {
      return c.json({ error: 'User is already a member of this household' }, 400)
    }

    // Insert invitation
    await db
      .prepare(
        'INSERT INTO invitations (id, tenant_id, email, role, token, expires_at) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .bind(
        inviteId, 
        tenantId, 
        validated.email, 
        validated.role, 
        token, 
        expiresAt.toISOString()
      )
      .run()

    return c.json({ 
      success: true, 
      invite: { 
        id: inviteId, 
        email: validated.email, 
        token, 
        expiresAt: expiresAt.toISOString() 
      } 
    }, 201)
  } catch (error) {
    console.error('Error creating invitation:', error)
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation error', details: error.errors }, 400)
    }
    return c.json({ error: 'Failed to create invitation' }, 500)
  }
})

// ============================================================================
// REVOKE INVITATION
// ============================================================================
invitations.delete('/:id', async (c) => {
  try {
    const tenantId = c.get('tenantId')
    const inviteId = c.req.param('id')
    const db = c.env.DB

    const result = await db
      .prepare('DELETE FROM invitations WHERE id = ? AND tenant_id = ?')
      .bind(inviteId, tenantId)
      .run()

    if (result.meta.changes === 0) {
      return c.json({ error: 'Invitation not found' }, 404)
    }

    return c.json({ success: true, message: 'Invitation revoked' })
  } catch (error) {
    console.error('Error revoking invitation:', error)
    return c.json({ error: 'Failed to revoke invitation' }, 500)
  }
})

export default invitations
