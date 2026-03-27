// api/src/routes/tasks.ts
import { Hono } from 'hono'
import { z } from 'zod'
import { nanoid } from 'nanoid'

interface Env {
  DB: D1Database
}

const tasks = new Hono<{ Bindings: Env }>()

const CreateTaskSchema = z.object({
  assetId: z.string().min(1),
  taskName: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  assignmentType: z.enum(['single', 'shared']),
  assignedToUserIds: z.array(z.string()).min(1), // at least one user
  reminderDaysBefore: z.number().int().min(0).default(7),
  recurrenceType: z.enum(['once', 'monthly', 'quarterly', 'biannual', 'annual']),
  recurrenceInterval: z.number().int().min(1).optional(),
  nextDueDate: z.string(), // ISO date string
})

const CompleteTaskSchema = z.object({
  notes: z.string().max(1000).optional(),
  mileage: z.number().int().optional(),
  hoursTracked: z.number().optional(),
  costUsd: z.number().optional(),
})

const SnoozeTaskSchema = z.object({
  snoozeDays: z.enum(['3', '7', '14']).transform(Number),
})

/**
 * Calculate next due date based on recurrence type
 */
function calculateNextDueDate(currentDue: Date, recurrenceType: string, interval: number = 1): string {
  const next = new Date(currentDue)

  switch (recurrenceType) {
    case 'monthly':
      next.setMonth(next.getMonth() + interval)
      break
    case 'quarterly':
      next.setMonth(next.getMonth() + 3 * interval)
      break
    case 'biannual':
      next.setMonth(next.getMonth() + 6 * interval)
      break
    case 'annual':
      next.setFullYear(next.getFullYear() + interval)
      break
    case 'once':
    default:
      return '' // No recurrence
  }

  return next.toISOString().split('T')[0] // Return YYYY-MM-DD
}

// ============================================================================
// GET ALL TASKS FOR TENANT
// ============================================================================
tasks.get('/', async (c) => {
  try {
    const tenantId = c.get('tenantId') as string
    const db = c.env.DB as D1Database

    // Get all tasks with assignment info
    const result = await db
      .prepare(
        `
        SELECT 
          t.*,
          a.name as asset_name,
          GROUP_CONCAT(ta.assigned_to_user_id) as assigned_user_ids
        FROM maintenance_tasks t
        LEFT JOIN assets a ON t.asset_id = a.id
        LEFT JOIN task_assignments ta ON t.id = ta.task_id
        WHERE t.tenant_id = ?
        GROUP BY t.id
        ORDER BY t.next_due_date ASC
        `
      )
      .bind(tenantId)
      .all<any>()

    // Transform results
    const transformedTasks = (result.results || []).map((task: any) => ({
      ...task,
      assigned_user_ids: task.assigned_user_ids ? task.assigned_user_ids.split(',') : [],
    }))

    return c.json({ tasks: transformedTasks })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return c.json({ error: 'Failed to fetch tasks' }, 500)
  }
})

// ============================================================================
// GET SINGLE TASK
// ============================================================================
tasks.get('/:id', async (c) => {
  try {
    const tenantId = c.get('tenantId') as string
    const taskId = c.req.param('id')
    const db = c.env.DB as D1Database

    const task = await db
      .prepare('SELECT * FROM maintenance_tasks WHERE id = ? AND tenant_id = ?')
      .bind(taskId, tenantId)
      .first()

    if (!task) {
      return c.json({ error: 'Task not found' }, 404)
    }

    // Get assignments
    const assignments = await db
      .prepare('SELECT assigned_to_user_id FROM task_assignments WHERE task_id = ?')
      .bind(taskId)
      .all()

    return c.json({
      task: {
        ...task,
        assigned_user_ids: (assignments.results || []).map((a: any) => a.assigned_to_user_id),
      },
    })
  } catch (error) {
    console.error('Error fetching task:', error)
    return c.json({ error: 'Failed to fetch task' }, 500)
  }
})

// ============================================================================
// CREATE TASK
// ============================================================================
tasks.post('/', async (c) => {
  try {
    const tenantId = c.get('tenantId') as string
    const userId = c.get('userId') as string
    const body = await c.req.json()
    const validated = CreateTaskSchema.parse(body)

    const db = c.env.DB as D1Database
    const taskId = nanoid()

    // Verify asset belongs to tenant
    const asset = await db
      .prepare('SELECT id FROM assets WHERE id = ? AND tenant_id = ?')
      .bind(validated.assetId, tenantId)
      .first()

    if (!asset) {
      return c.json({ error: 'Asset not found or unauthorized' }, 404)
    }

    // Begin transaction
    await db.prepare('BEGIN TRANSACTION').run()

    try {
      // Insert task
      await db
        .prepare(
          `INSERT INTO maintenance_tasks 
          (id, asset_id, tenant_id, task_name, description, assignment_type, 
           reminder_days_before, recurrence_type, recurrence_interval, next_due_date, created_by, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime("now"), datetime("now"))`
        )
        .bind(
          taskId,
          validated.assetId,
          tenantId,
          validated.taskName,
          validated.description || null,
          validated.assignmentType,
          validated.reminderDaysBefore,
          validated.recurrenceType,
          validated.recurrenceInterval || null,
          validated.nextDueDate,
          userId
        )
        .run()

      // Insert task assignments
      for (const assignedUserId of validated.assignedToUserIds) {
        await db
          .prepare(
            'INSERT INTO task_assignments (id, task_id, tenant_id, assigned_to_user_id, assigned_at) VALUES (?, ?, ?, ?, datetime("now"))'
          )
          .bind(nanoid(), taskId, tenantId, assignedUserId)
          .run()
      }

      await db.prepare('COMMIT').run()
    } catch (err) {
      await db.prepare('ROLLBACK').run()
      throw err
    }

    const newTask = await db
      .prepare('SELECT * FROM maintenance_tasks WHERE id = ?')
      .bind(taskId)
      .first()

    return c.json({ task: newTask }, 201)
  } catch (error) {
    console.error('Error creating task:', error)
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation error', details: error.errors }, 400)
    }
    return c.json({ error: 'Failed to create task' }, 500)
  }
})

// ============================================================================
// COMPLETE TASK
// ============================================================================
tasks.post('/:id/complete', async (c) => {
  try {
    const tenantId = c.get('tenantId') as string
    const userId = c.get('userId') as string
    const taskId = c.req.param('id')
    const body = await c.req.json()
    const validated = CompleteTaskSchema.parse(body)

    const db = c.env.DB as D1Database

    // Verify task belongs to tenant
    const task = await db
      .prepare(
        'SELECT id, recurrence_type, recurrence_interval, next_due_date FROM maintenance_tasks WHERE id = ? AND tenant_id = ?'
      )
      .bind(taskId, tenantId)
      .first<any>()

    if (!task) {
      return c.json({ error: 'Task not found or unauthorized' }, 404)
    }

    const now = new Date().toISOString()
    const historyId = nanoid()

    // Insert completion history
    await db
      .prepare(
        `INSERT INTO task_history 
        (id, task_id, tenant_id, completed_by_user_id, completed_at, notes, mileage, hours_tracked, cost_usd, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime("now"))`
      )
      .bind(
        historyId,
        taskId,
        tenantId,
        userId,
        now,
        validated.notes || null,
        validated.mileage || null,
        validated.hoursTracked || null,
        validated.costUsd || null
      )
      .run()

    // Update task's last_completed_at
    await db
      .prepare('UPDATE maintenance_tasks SET last_completed_at = ? WHERE id = ?')
      .bind(now, taskId)
      .run()

    // Calculate next due date if recurring
    if (task.recurrence_type !== 'once') {
      const currentDue = new Date(task.next_due_date)
      const nextDueDate = calculateNextDueDate(currentDue, task.recurrence_type, task.recurrence_interval || 1)

      await db
        .prepare('UPDATE maintenance_tasks SET next_due_date = ? WHERE id = ?')
        .bind(nextDueDate, taskId)
        .run()
    }

    // Delete snoozed reminders for this task
    await db
      .prepare('DELETE FROM reminders_snoozed WHERE task_id = ?')
      .bind(taskId)
      .run()

    return c.json({ success: true, message: 'Task completed' })
  } catch (error) {
    console.error('Error completing task:', error)
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation error', details: error.errors }, 400)
    }
    return c.json({ error: 'Failed to complete task' }, 500)
  }
})

// ============================================================================
// SNOOZE TASK REMINDER
// ============================================================================
tasks.post('/:id/snooze', async (c) => {
  try {
    const tenantId = c.get('tenantId') as string
    const userId = c.get('userId') as string
    const taskId = c.req.param('id')
    const body = await c.req.json()
    const validated = SnoozeTaskSchema.parse(body)

    const db = c.env.DB as D1Database

    // Verify task
    const task = await db
      .prepare('SELECT id, next_due_date FROM maintenance_tasks WHERE id = ? AND tenant_id = ?')
      .bind(taskId, tenantId)
      .first<any>()

    if (!task) {
      return c.json({ error: 'Task not found or unauthorized' }, 404)
    }

    // Calculate snooze date
    const snoozedUntil = new Date()
    snoozedUntil.setDate(snoozedUntil.getDate() + validated.snoozeDays)

    // Insert snooze record
    await db
      .prepare(
        `INSERT INTO reminders_snoozed 
        (id, task_id, tenant_id, user_id, original_due_date, snoozed_until, snooze_days, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime("now"))`
      )
      .bind(
        nanoid(),
        taskId,
        tenantId,
        userId,
        task.next_due_date,
        snoozedUntil.toISOString().split('T')[0],
        validated.snoozeDays
      )
      .run()

    return c.json({ success: true, message: `Reminder snoozed for ${validated.snoozeDays} days` })
  } catch (error) {
    console.error('Error snoozing task:', error)
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation error', details: error.errors }, 400)
    }
    return c.json({ error: 'Failed to snooze task' }, 500)
  }
})

export default tasks
