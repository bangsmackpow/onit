-- migrations/004_billing.sql

-- Add Stripe tracking columns to tenants
ALTER TABLE tenants ADD COLUMN stripe_customer_id TEXT;
ALTER TABLE tenants ADD COLUMN stripe_subscription_id TEXT;

-- Index for searching tenants by stripe customer ID (for webhooks)
CREATE INDEX IF NOT EXISTS idx_tenants_stripe_customer_id ON tenants(stripe_customer_id);
