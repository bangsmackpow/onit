// api/src/routes/reminders.ts
import { Hono } from 'hono'
import { Env, Variables } from '../types'

const reminders = new Hono<{ Bindings: Env, Variables: Variables }>()

// ============================================================================
// GET UPCOMING REMINDERS FOR TENANT
// ============================================================================
reminders.get('/upcoming', async (c) => {
  try {
    const tenantId = c.get('tenantId')
    const db = c.env.DB

    // Get tasks due within the reminder window
    const result = await db
      .prepare(
        `
        SELECT 
          t.id,
          t.task_name,
          t.next_due_date,
          t.reminder_days_before,
          t.asset_id,
          a.name as asset_name,
          GROUP_CONCAT(u.email) as assigned_emails,
          GROUP_CONCAT(u.full_name) as assigned_names
        FROM maintenance_tasks t
        LEFT JOIN assets a ON t.asset_id = a.id
        LEFT JOIN task_assignments ta ON t.id = ta.task_id
        LEFT JOIN users u ON ta.assigned_to_user_id = u.id
        WHERE t.tenant_id = ?
          AND t.next_due_date IS NOT NULL
          AND t.recurrence_type != 'once'
          AND date(t.next_due_date) <= date('now', '+' || t.reminder_days_before || ' days')
          AND NOT EXISTS (
            SELECT 1 FROM reminders_snoozed rs
            WHERE rs.task_id = t.id AND date(rs.snoozed_until) >= date('now')
          )
        GROUP BY t.id
        ORDER BY t.next_due_date ASC
        `
      )
      .bind(tenantId)
      .all<any>()

    return c.json({
      reminders: (result.results || []).map((r: any) => ({
        ...r,
        assigned_emails: r.assigned_emails ? r.assigned_emails.split(',') : [],
        assigned_names: r.assigned_names ? r.assigned_names.split(',') : [],
      })),
    })
  } catch (error) {
    console.error('Error fetching upcoming reminders:', error)
    return c.json({ error: 'Failed to fetch reminders' }, 500)
  }
})

// ============================================================================
// GET SNOOZED REMINDERS
// ============================================================================
reminders.get('/snoozed', async (c) => {
  try {
    const tenantId = c.get('tenantId')
    const db = c.env.DB

    const result = await db
      .prepare(
        `
        SELECT 
          rs.*,
          t.task_name,
          a.name as asset_name
        FROM reminders_snoozed rs
        LEFT JOIN maintenance_tasks t ON rs.task_id = t.id
        LEFT JOIN assets a ON t.asset_id = a.id
        WHERE rs.tenant_id = ? AND date(rs.snoozed_until) >= date('now')
        ORDER BY rs.snoozed_until ASC
        `
      )
      .bind(tenantId)
      .all<any>()

    return c.json({ snoozed: result.results || [] })
  } catch (error) {
    console.error('Error fetching snoozed reminders:', error)
    return c.json({ error: 'Failed to fetch snoozed reminders' }, 500)
  }
})

// ============================================================================
// UNSNOOZE A REMINDER (remove snooze entry)
// ============================================================================
reminders.delete('/snoozed/:snoozedId', async (c) => {
  try {
    const tenantId = c.get('tenantId')
    const snoozedId = c.req.param('snoozedId')
    const db = c.env.DB

    // Verify ownership
    const snoozed = await db
      .prepare('SELECT id FROM reminders_snoozed WHERE id = ? AND tenant_id = ?')
      .bind(snoozedId, tenantId)
      .first()

    if (!snoozed) {
      return c.json({ error: 'Snooze not found or unauthorized' }, 404)
    }

    await db.prepare('DELETE FROM reminders_snoozed WHERE id = ?').bind(snoozedId).run()

    return c.json({ success: true, message: 'Snooze removed' })
  } catch (error) {
    console.error('Error removing snooze:', error)
    return c.json({ error: 'Failed to remove snooze' }, 500)
  }
})

export default reminders
