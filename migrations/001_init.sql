-- Maintenance Scheduler - D1 Schema
-- Phase 1: Core multi-tenant, task, and history tables

-- ============================================================================
-- TENANTS (SaaS billing units)
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free', -- 'free', 'pro', 'enterprise'
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tenants_plan ON tenants(plan);

-- ============================================================================
-- USERS (tenant members)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  is_owner INTEGER DEFAULT 0, -- 1 = tenant owner, 0 = member
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  UNIQUE(tenant_id, email)
);

CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);

-- ============================================================================
-- ASSETS (cars, houses, appliances)
-- ============================================================================
CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL, -- "2019 Honda Civic", "Master Bedroom AC"
  asset_type TEXT NOT NULL, -- 'car', 'house', 'appliance'
  description TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX idx_assets_tenant ON assets(tenant_id);
CREATE INDEX idx_assets_type ON assets(asset_type);

-- ============================================================================
-- MAINTENANCE TASKS
-- ============================================================================
CREATE TABLE IF NOT EXISTS maintenance_tasks (
  id TEXT PRIMARY KEY,
  asset_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  task_name TEXT NOT NULL, -- "Oil Change", "Air Filter Replacement"
  description TEXT,
  assignment_type TEXT NOT NULL, -- 'single', 'shared'
  reminder_days_before INTEGER DEFAULT 7, -- notify X days before due
  recurrence_type TEXT NOT NULL, -- 'once', 'monthly', 'quarterly', 'biannual', 'annual'
  recurrence_interval INTEGER, -- for custom intervals (every N months/years)
  last_completed_at TEXT,
  next_due_date TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_tasks_asset ON maintenance_tasks(asset_id);
CREATE INDEX idx_tasks_tenant ON maintenance_tasks(tenant_id);
CREATE INDEX idx_tasks_due ON maintenance_tasks(next_due_date);
CREATE INDEX idx_tasks_recurring ON maintenance_tasks(recurrence_type);

-- ============================================================================
-- TASK ASSIGNMENTS (who owns this task?)
-- ============================================================================
CREATE TABLE IF NOT EXISTS task_assignments (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  assigned_to_user_id TEXT NOT NULL,
  assigned_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES maintenance_tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  UNIQUE(task_id, assigned_to_user_id)
);

CREATE INDEX idx_assignments_task ON task_assignments(task_id);
CREATE INDEX idx_assignments_user ON task_assignments(assigned_to_user_id);
CREATE INDEX idx_assignments_tenant ON task_assignments(tenant_id);

-- ============================================================================
-- TASK COMPLETION HISTORY
-- ============================================================================
CREATE TABLE IF NOT EXISTS task_history (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  completed_by_user_id TEXT NOT NULL,
  completed_at TEXT NOT NULL,
  notes TEXT,
  -- Optional metrics
  mileage INTEGER,
  hours_tracked REAL,
  cost_usd REAL,
  -- R2 attachment info (Phase 2)
  receipt_photo_url TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES maintenance_tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (completed_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX idx_history_task ON task_history(task_id);
CREATE INDEX idx_history_tenant ON task_history(tenant_id);
CREATE INDEX idx_history_completed_by ON task_history(completed_by_user_id);
CREATE INDEX idx_history_completed_at ON task_history(completed_at);

-- ============================================================================
-- SNOOZED REMINDERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS reminders_snoozed (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  original_due_date TEXT NOT NULL,
  snoozed_until TEXT NOT NULL,
  snooze_days INTEGER, -- 3, 7, 14
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES maintenance_tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX idx_snoozed_task ON reminders_snoozed(task_id);
CREATE INDEX idx_snoozed_user ON reminders_snoozed(user_id);
CREATE INDEX idx_snoozed_tenant ON reminders_snoozed(tenant_id);
CREATE INDEX idx_snoozed_until ON reminders_snoozed(snoozed_until);

-- ============================================================================
-- EMAIL SEND LOG (for tracking reminder emails sent)
-- ============================================================================
CREATE TABLE IF NOT EXISTS email_log (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  sent_at TEXT NOT NULL,
  status TEXT DEFAULT 'sent', -- 'sent', 'failed', 'bounced'
  error_message TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES maintenance_tasks(id) ON DELETE CASCADE
);

CREATE INDEX idx_email_log_tenant ON email_log(tenant_id);
CREATE INDEX idx_email_log_user ON email_log(user_id);
CREATE INDEX idx_email_log_sent_at ON email_log(sent_at);

-- ============================================================================
-- PREFERENCES (per-user settings)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_preferences (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  tenant_id TEXT NOT NULL,
  email_digest_time TEXT DEFAULT '09:00', -- HH:MM in user's timezone
  timezone TEXT DEFAULT 'UTC',
  email_frequency TEXT DEFAULT 'daily', -- 'daily', 'weekly', 'off'
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX idx_preferences_user ON user_preferences(user_id);
CREATE INDEX idx_preferences_tenant ON user_preferences(tenant_id);
