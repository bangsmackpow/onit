// api/src/routes/history.ts
import { Hono } from 'hono'
import { Env, Variables } from '../types'

const history = new Hono<{ Bindings: Env, Variables: Variables }>()

// ============================================================================
// GET HISTORY FOR A TASK
// ============================================================================
history.get('/task/:taskId', async (c) => {
  try {
    const tenantId = c.get('tenantId')
    const taskId = c.req.param('taskId')
    const limit = c.req.query('limit') || '20'
    const offset = c.req.query('offset') || '0'

    const db = c.env.DB

    // Verify task belongs to tenant
    const task = await db
      .prepare('SELECT id FROM maintenance_tasks WHERE id = ? AND tenant_id = ?')
      .bind(taskId, tenantId)
      .first()

    if (!task) {
      return c.json({ error: 'Task not found or unauthorized' }, 404)
    }

    // Fetch history
    const result = await db
      .prepare(
        `
        SELECT 
          h.*,
          u.full_name as completed_by_name
        FROM task_history h
        LEFT JOIN users u ON h.completed_by_user_id = u.id
        WHERE h.task_id = ? AND h.tenant_id = ?
        ORDER BY h.completed_at DESC
        LIMIT ? OFFSET ?
        `
      )
      .bind(taskId, tenantId, parseInt(limit), parseInt(offset))
      .all<any>()

    // Get total count
    const countResult = await db
      .prepare('SELECT COUNT(*) as count FROM task_history WHERE task_id = ? AND tenant_id = ?')
      .bind(taskId, tenantId)
      .first<{ count: number }>()

    return c.json({
      history: result.results || [],
      total: countResult?.count || 0,
      limit: parseInt(limit),
      offset: parseInt(offset),
    })
  } catch (error) {
    console.error('Error fetching history:', error)
    return c.json({ error: 'Failed to fetch history' }, 500)
  }
})

// ============================================================================
// GET ALL HISTORY FOR TENANT (aggregated)
// ============================================================================
history.get('/', async (c) => {
  try {
    const tenantId = c.get('tenantId')
    const limit = c.req.query('limit') || '50'
    const offset = c.req.query('offset') || '0'

    const db = c.env.DB

    const result = await db
      .prepare(
        `
        SELECT 
          h.*,
          t.task_name,
          t.asset_id,
          a.name as asset_name,
          u.full_name as completed_by_name
        FROM task_history h
        LEFT JOIN maintenance_tasks t ON h.task_id = t.id
        LEFT JOIN assets a ON t.asset_id = a.id
        LEFT JOIN users u ON h.completed_by_user_id = u.id
        WHERE h.tenant_id = ?
        ORDER BY h.completed_at DESC
        LIMIT ? OFFSET ?
        `
      )
      .bind(tenantId, parseInt(limit), parseInt(offset))
      .all<any>()

    const countResult = await db
      .prepare('SELECT COUNT(*) as count FROM task_history WHERE tenant_id = ?')
      .bind(tenantId)
      .first<{ count: number }>()

    return c.json({
      history: result.results || [],
      total: countResult?.count || 0,
      limit: parseInt(limit),
      offset: parseInt(offset),
    })
  } catch (error) {
    console.error('Error fetching all history:', error)
    return c.json({ error: 'Failed to fetch history' }, 500)
  }
})

// ============================================================================
// GET METRICS SUMMARY FOR A TASK
// ============================================================================
history.get('/task/:taskId/metrics', async (c) => {
  try {
    const tenantId = c.get('tenantId')
    const taskId = c.req.param('taskId')

    const db = c.env.DB

    // Verify task
    const task = await db
      .prepare('SELECT id FROM maintenance_tasks WHERE id = ? AND tenant_id = ?')
      .bind(taskId, tenantId)
      .first()

    if (!task) {
      return c.json({ error: 'Task not found or unauthorized' }, 404)
    }

    // Get metrics
    const metricsResult = await db
      .prepare(
        `
        SELECT 
          COUNT(*) as total_completions,
          SUM(mileage) as total_mileage,
          AVG(mileage) as avg_mileage,
          SUM(hours_tracked) as total_hours,
          AVG(hours_tracked) as avg_hours,
          SUM(cost_usd) as total_cost,
          AVG(cost_usd) as avg_cost
        FROM task_history
        WHERE task_id = ? AND tenant_id = ?
        `
      )
      .bind(taskId, tenantId)
      .first<any>()

    return c.json({ metrics: metricsResult })
  } catch (error) {
    console.error('Error fetching metrics:', error)
    return c.json({ error: 'Failed to fetch metrics' }, 500)
  }
})

export default history
