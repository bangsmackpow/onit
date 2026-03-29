-- migrations/002_invitations.sql

-- Invitations table for multi-user tenant sharing
CREATE TABLE IF NOT EXISTS invitations (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT DEFAULT 'member', -- 'admin', 'member'
    token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT (datetime('now')),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Index for quick lookup by token
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);

-- Index for checking pending invites for a specific email/tenant combo
CREATE UNIQUE INDEX IF NOT EXISTS idx_invitations_email_tenant ON invitations(email, tenant_id);
