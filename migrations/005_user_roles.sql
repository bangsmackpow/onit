-- migrations/005_user_roles.sql

-- Add role column (as 'admin' or 'member' within a household)
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'member';

-- Add is_system_admin column (global system administrator)
ALTER TABLE users ADD COLUMN is_system_admin INTEGER DEFAULT 0;

-- Set current owner as system admin by default if they match the admin criteria
-- (Note: This is just a helper, better to set manually in D1)
UPDATE users SET is_system_admin = 1 WHERE email = 'curtis@builtnetworks.com';
UPDATE users SET is_system_admin = 1 WHERE email = 'curtis@curtislamasters.com';
