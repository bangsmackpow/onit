// api/src/routes/invitations.ts
import { Hono } from 'hono'
import { nanoid } from 'nanoid'
import { Env, Variables } from '../types'

const invitations = new Hono<{ Bindings: Env, Variables: Variables }>()

// ============================================================================
// LIST INVITATIONS (Premium only)
// ============================================================================
invitations.get('/', async (c) => {
  try {
    const tenantId = c.get('tenantId')
    const db = c.env.DB

    // Check plan
    const tenant = await db.prepare('SELECT plan FROM tenants WHERE id = ?').bind(tenantId).first<{ plan: string }>()
    if (tenant?.plan !== 'premium') {
      return c.json({ invitations: [], message: 'Upgrade to Premium to invite family members.' })
    }

    const result = await db
      .prepare('SELECT * FROM invitations WHERE tenant_id = ? AND expires_at > datetime("now") ORDER BY created_at DESC')
      .bind(tenantId)
      .all()
    return c.json({ invitations: result.results || [] })
  } catch (error) {
    console.error('List invitations error:', error)
    return c.json({ error: 'Failed to list invitations' }, 500)
  }
})

// ============================================================================
// CREATE INVITATION (Premium only)
// ============================================================================
invitations.post('/', async (c) => {
  try {
    const tenantId = c.get('tenantId') as string
    const body = await c.req.json()
    const { email, role } = body
    const db = c.env.DB

    if (!email) {
      return c.json({ error: 'Email is required' }, 400)
    }

    // Check plan
    const tenant = await db.prepare('SELECT plan FROM tenants WHERE id = ?').bind(tenantId).first<{ plan: string }>()
    if (tenant?.plan !== 'premium') {
      return c.json({ error: 'Upgrade to Premium to unlock Family Sharing.' }, 403)
    }

    const invitationId = nanoid()
    const token = nanoid(32)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    await db
      .prepare(
        'INSERT INTO invitations (id, tenant_id, email, role, token, expires_at) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .bind(invitationId, tenantId, email, role || 'member', token, expiresAt)
      .run()

    return c.json({ 
      success: true, 
      invitation: { id: invitationId, token, email, role } 
    }, 201)
  } catch (error) {
    console.error('Create invitation error:', error)
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

    await db
      .prepare('DELETE FROM invitations WHERE id = ? AND tenant_id = ?')
      .bind(inviteId, tenantId)
      .run()

    return c.json({ success: true })
  } catch (error) {
    console.error('Delete invitation error:', error)
    return c.json({ error: 'Failed to revoke invitation' }, 500)
  }
})

export default invitations
