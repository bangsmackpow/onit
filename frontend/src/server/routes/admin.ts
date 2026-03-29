// api/src/routes/admin.ts
import { Hono } from 'hono'
import { Env, Variables } from '../types'

const admin = new Hono<{ Bindings: Env, Variables: Variables }>()

// ============================================================================
// SYSTEM STATS
// ============================================================================
admin.get('/stats', async (c) => {
  try {
    const db = c.env.DB
    
    const [tenants, users, assets, tasks, growth, distribution] = await Promise.all([
      db.prepare('SELECT COUNT(*) as count FROM tenants').first<{ count: number }>(),
      db.prepare('SELECT COUNT(*) as count FROM users').first<{ count: number }>(),
      db.prepare('SELECT COUNT(*) as count FROM assets').first<{ count: number }>(),
      db.prepare('SELECT COUNT(*) as count FROM tasks').first<{ count: number }>(),
      db.prepare(`
        SELECT date(created_at) as day, COUNT(*) as count 
        FROM tenants 
        WHERE created_at >= date('now', '-7 days') 
        GROUP BY day 
        ORDER BY day ASC
      `).all(),
      db.prepare('SELECT plan, COUNT(*) as count FROM tenants GROUP BY plan').all()
    ])

    return c.json({
      stats: {
        totalTenants: tenants?.count || 0,
        totalUsers: users?.count || 0,
        totalAssets: assets?.count || 0,
        totalTasks: tasks?.count || 0,
        growth: growth.results || [],
        distribution: distribution.results || []
      }
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return c.json({ error: 'Failed to fetch stats' }, 500)
  }
})

// ============================================================================
// LIST TENANTS
// ============================================================================
admin.get('/tenants', async (c) => {
  try {
    const db = c.env.DB
    
    // Get all tenants with their owner's email
    const result = await db.prepare(`
      SELECT t.id, t.name, t.plan, t.created_at, u.email as owner_email
      FROM tenants t
      LEFT JOIN users u ON t.id = u.tenant_id AND u.is_owner = 1
      ORDER BY t.created_at DESC
    `).all()

    return c.json({ tenants: result.results || [] })
  } catch (error) {
    console.error('Admin list tenants error:', error)
    return c.json({ error: 'Failed to list households' }, 500)
  }
})

// ============================================================================
// TOGGLE PLAN
// ============================================================================
admin.post('/tenants/:id/plan', async (c) => {
  try {
    const tenantId = c.req.param('id')
    const { plan } = await c.req.json()
    const db = c.env.DB

    if (plan !== 'free' && plan !== 'premium') {
      return c.json({ error: 'Invalid plan type' }, 400)
    }

    await db.prepare('UPDATE tenants SET plan = ?, updated_at = datetime("now") WHERE id = ?')
      .bind(plan, tenantId)
      .run()

    return c.json({ success: true, plan })
  } catch (error) {
    console.error('Admin toggle plan error:', error)
    return c.json({ error: 'Failed to update plan' }, 500)
  }
})

export default admin
