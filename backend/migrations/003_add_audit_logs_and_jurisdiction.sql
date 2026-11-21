-- ==============================================================================
-- NavJyoti Database Migration: 003_add_audit_logs_and_jurisdiction.sql
-- Adds:
--   1. jurisdiction column to users table (if not exists)
--   2. audit_logs table for clinical record change tracking
-- Safe and idempotent: Uses IF NOT EXISTS
-- ==============================================================================

-- 1. Add jurisdiction column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS jurisdiction VARCHAR(100);

-- 2. Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    child_id INTEGER REFERENCES children(id) ON DELETE SET NULL,
    action_type VARCHAR(50) NOT NULL,
    record_type VARCHAR(50) NOT NULL,
    record_id INTEGER,
    fields_changed VARCHAR(500),
    previous_values TEXT,
    new_values TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. Create indexes for efficient filtering and audit queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_child_id ON audit_logs(child_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_users_jurisdiction ON users(jurisdiction);
