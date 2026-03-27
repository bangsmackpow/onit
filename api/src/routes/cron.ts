// api/src/services/cron.ts
import { nanoid } from 'nanoid'

interface TenantWithUsers {
  tenant_id: string
  user_email: string
  user_id: string
  digest_time: string
  timezone: string
}

interface UpcomingTask {
  task_id: string
  task_name: string
  asset_name: string
  next_due_date: string
  days_until_due: number
  reminder_days_before: number
}

/**
 * Send daily digest emails to all users with upcoming tasks
 */
async function sendDailyDigests(
  db: D1Database,
  smtp2goApiKey: string,
  fromEmail: string
): Promise<void> {
  try {
    console.log('Starting daily digest cron job...')

    // Get all unique tenants and their users with digest enabled
    const tenantsResult = await db
      .prepare(
        `
        SELECT DISTINCT
          t.id as tenant_id,
          u.id as user_id,
          u.email as user_email,
          COALESCE(up.email_digest_time, '09:00') as digest_time,
          COALESCE(up.timezone, 'UTC') as timezone
        FROM tenants t
        LEFT JOIN users u ON t.id = u.tenant_id
        LEFT JOIN user_preferences up ON u.id = up.user_id
        WHERE u.email IS NOT NULL
          AND COALESCE(up.email_frequency, 'daily') = 'daily'
        `
      )
      .all<TenantWithUsers>()

    const tenants = tenantsResult.results || []

    for (const tenant of tenants) {
      // Check if it's time to send digest for this user (based on their timezone & preference)
      const shouldSendNow = isTimeToSendDigest(tenant.digest_time, tenant.timezone)

      if (!shouldSendNow) {
        console.log(`Skipping digest for ${tenant.user_email} (not their digest time)`)
        continue
      }

      // Get upcoming tasks for this user's tenant
      const tasksResult = await db
        .prepare(
          `
          SELECT 
            t.id as task_id,
            t.task_name,
            a.name as asset_name,
            t.next_due_date,
            t.reminder_days_before,
            CAST((julianday(t.next_due_date) - julianday('now')) AS INTEGER) as days_until_due
          FROM maintenance_tasks t
          LEFT JOIN assets a ON t.asset_id = a.id
          WHERE t.tenant_id = ?
            AND t.next_due_date IS NOT NULL
            AND CAST((julianday(t.next_due_date) - julianday('now')) AS INTEGER) <= t.reminder_days_before
            AND NOT EXISTS (
              SELECT 1 FROM reminders_snoozed rs
              WHERE rs.task_id = t.id 
                AND rs.user_id = ?
                AND date(rs.snoozed_until) >= date('now')
            )
          ORDER BY t.next_due_date ASC
          `
        )
        .bind(tenant.tenant_id, tenant.user_id)
        .all<UpcomingTask>()

      const upcomingTasks = tasksResult.results || []

      if (upcomingTasks.length === 0) {
        console.log(`No upcoming tasks for ${tenant.user_email}`)
        continue
      }

      // Send email
      try {
        await sendDigestEmail(
          tenant.user_email,
          upcomingTasks,
          smtp2goApiKey,
          fromEmail
        )

        // Log successful send
        for (const task of upcomingTasks) {
          await db
            .prepare(
              `
              INSERT INTO email_log 
              (id, tenant_id, user_id, task_id, subject, recipient_email, sent_at, status)
              VALUES (?, ?, ?, ?, ?, ?, datetime('now'), 'sent')
              `
            )
            .bind(
              nanoid(),
              tenant.tenant_id,
              tenant.user_id,
              task.task_id,
              `Maintenance Reminder: ${task.task_name}`,
              tenant.user_email
            )
            .run()
        }

        console.log(`Sent digest to ${tenant.user_email} with ${upcomingTasks.length} tasks`)
      } catch (emailError) {
        console.error(`Failed to send digest to ${tenant.user_email}:`, emailError)

        // Log failed send
        for (const task of upcomingTasks) {
          await db
            .prepare(
              `
              INSERT INTO email_log 
              (id, tenant_id, user_id, task_id, subject, recipient_email, sent_at, status, error_message)
              VALUES (?, ?, ?, ?, ?, ?, datetime('now'), 'failed', ?)
              `
            )
            .bind(
              nanoid(),
              tenant.tenant_id,
              tenant.user_id,
              task.task_id,
              `Maintenance Reminder: ${task.task_name}`,
              tenant.user_email,
              String(emailError)
            )
            .run()
        }
      }
    }

    console.log('Daily digest cron job completed')
  } catch (error) {
    console.error('Cron job error:', error)
    throw error
  }
}

/**
 * Check if it's time to send digest based on user's timezone and preference
 * (simplified: just check if it's around their preferred time UTC)
 */
function isTimeToSendDigest(digestTime: string, timezone: string): boolean {
  // Simplified: just check if current UTC hour is within 1 hour of digest time
  // In production, implement proper timezone conversion
  const [digestHour] = digestTime.split(':').map(Number)
  const now = new Date()
  const currentHour = now.getUTCHours()

  return currentHour === digestHour || currentHour === (digestHour + 1) % 24
}

/**
 * Format and send email via smtp2go
 */
async function sendDigestEmail(
  recipientEmail: string,
  upcomingTasks: UpcomingTask[],
  apiKey: string,
  fromEmail: string
): Promise<void> {
  const taskList = upcomingTasks
    .map(
      (t) =>
        `<li><strong>${t.task_name}</strong> (${t.asset_name})<br/>Due: ${t.next_due_date} (${t.days_until_due} days)</li>`
    )
    .join('')

  const htmlBody = `
    <h2>Your Maintenance Tasks</h2>
    <p>You have ${upcomingTasks.length} upcoming maintenance tasks:</p>
    <ul>
      ${taskList}
    </ul>
    <p><a href="https://yourdomain.com/dashboard">View all tasks →</a></p>
    <p style="font-size: 12px; color: #666;">
      You're receiving this because you have maintenance tasks due soon. 
      <a href="https://yourdomain.com/settings">Update your preferences</a>
    </p>
  `

  const response = await fetch('https://api.smtp2go.com/v3/email/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      api_key: apiKey,
      to: [{ email: recipientEmail }],
      from: fromEmail,
      subject: `Maintenance Reminder: ${upcomingTasks.length} task(s) due soon`,
      html_body: htmlBody,
    }),
  })

  const result = await response.json() as any

  if (!response.ok || result.request_id === undefined) {
    throw new Error(`SMTP2GO error: ${JSON.stringify(result)}`)
  }
}

export default {
  sendDailyDigests,
}
