-- ==============================================================================
-- NavJyoti Database Migration: 002_add_auth_clinical_qr_features
-- Version: 2.0.0
-- Target Database: PostgreSQL 14+ (Compatible with Neon & local PostgreSQL)
-- Description:
--   Supports Option B (Phone + Password for Parents, Email Optional),
--   Worker/Supervisor OTP records, in-app notifications, communications,
--   clinical dose tracking, and secure expiring QR passes.
--
-- PRE-MIGRATION BACKUP INSTRUCTIONS (RUN ON COMMAND LINE BEFORE APPLYING):
--   pg_dump -U postgres -d navjyoti -F c -b -v -f "navjyoti_backup_$(date +%Y%m%d_%H%M%S).dump"
--
-- STATUS: DRAFT / PENDING EXPLICIT USER APPROVAL.
-- DO NOT EXECUTE ON PRODUCTION WITHOUT SEPARATE APPROVAL.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- UP MIGRATION (APPLY CHANGES)
-- ------------------------------------------------------------------------------

BEGIN;

-- 1. Extend users table for Parent Phone + Password authentication
-- Make email nullable to support parents registering without email
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;

-- Add phone number with unique constraint for reliable parent lookups
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_users_phone'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT uq_users_phone UNIQUE (phone);
    END IF;
END $$;

ALTER TABLE users ADD COLUMN IF NOT EXISTS village VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10) DEFAULT 'hi';
ALTER TABLE users ADD COLUMN IF NOT EXISTS worker_id VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS consent BOOLEAN DEFAULT TRUE NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- 2. Extend children table with clinical & demographic fields
ALTER TABLE children ADD COLUMN IF NOT EXISTS gender VARCHAR(20) DEFAULT 'Male';
ALTER TABLE children ADD COLUMN IF NOT EXISTS village VARCHAR(100);
ALTER TABLE children ADD COLUMN IF NOT EXISTS blood_group VARCHAR(10);
ALTER TABLE children ADD COLUMN IF NOT EXISTS birth_weight_kg FLOAT;
ALTER TABLE children ADD COLUMN IF NOT EXISTS migration_status VARCHAR(30) DEFAULT 'resident';
ALTER TABLE children ADD COLUMN IF NOT EXISTS priority_level VARCHAR(20) DEFAULT 'green';

-- 3. Extend vaccinations table with administration tracking
ALTER TABLE vaccinations ADD COLUMN IF NOT EXISTS batch_number VARCHAR(50);
ALTER TABLE vaccinations ADD COLUMN IF NOT EXISTS facility VARCHAR(150);
ALTER TABLE vaccinations ADD COLUMN IF NOT EXISTS worker_name VARCHAR(100);
ALTER TABLE vaccinations ADD COLUMN IF NOT EXISTS site VARCHAR(50);
ALTER TABLE vaccinations ADD COLUMN IF NOT EXISTS notes VARCHAR(300);

-- 4. Create otp_records table for Health Worker & Supervisor login
CREATE TABLE IF NOT EXISTS otp_records (
    id SERIAL PRIMARY KEY,
    email VARCHAR(150) NOT NULL,
    role VARCHAR(30) NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    last_sent_at TIMESTAMPTZ NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    is_used BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_otp_email_role ON otp_records(email, role);

-- 5. Create notifications table for in-app alerts
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    child_id INTEGER REFERENCES children(id) ON DELETE SET NULL,
    title VARCHAR(150) NOT NULL,
    message VARCHAR(500) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'info',
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

-- 6. Create communications table for outreach messaging
CREATE TABLE IF NOT EXISTS communications (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER NOT NULL REFERENCES users(id),
    child_id INTEGER REFERENCES children(id) ON DELETE SET NULL,
    recipient_name VARCHAR(100) NOT NULL,
    recipient_phone VARCHAR(20) NOT NULL,
    message_type VARCHAR(50) NOT NULL DEFAULT 'reminder',
    message VARCHAR(500) NOT NULL,
    channel VARCHAR(50) NOT NULL DEFAULT 'Simulated SMS',
    status VARCHAR(50) NOT NULL DEFAULT 'Queued',
    sent_at TIMESTAMPTZ NOT NULL
);

-- 7. Create qr_token_records table for secure expiring health pass handoff
CREATE TABLE IF NOT EXISTS qr_token_records (
    id SERIAL PRIMARY KEY,
    child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_qr_child ON qr_token_records(child_id);
CREATE INDEX IF NOT EXISTS idx_qr_hash ON qr_token_records(token_hash);

COMMIT;


-- ------------------------------------------------------------------------------
-- DOWN MIGRATION (SAFE ROLLBACK SCRIPT - REVERSIBLE)
-- ------------------------------------------------------------------------------

-- BEGIN;
-- DROP TABLE IF EXISTS qr_token_records CASCADE;
-- DROP TABLE IF EXISTS communications CASCADE;
-- DROP TABLE IF EXISTS notifications CASCADE;
-- DROP TABLE IF EXISTS otp_records CASCADE;
--
-- ALTER TABLE vaccinations DROP COLUMN IF EXISTS notes;
-- ALTER TABLE vaccinations DROP COLUMN IF EXISTS site;
-- ALTER TABLE vaccinations DROP COLUMN IF EXISTS worker_name;
-- ALTER TABLE vaccinations DROP COLUMN IF EXISTS facility;
-- ALTER TABLE vaccinations DROP COLUMN IF EXISTS batch_number;
--
-- ALTER TABLE children DROP COLUMN IF EXISTS priority_level;
-- ALTER TABLE children DROP COLUMN IF EXISTS migration_status;
-- ALTER TABLE children DROP COLUMN IF EXISTS birth_weight_kg;
-- ALTER TABLE children DROP COLUMN IF EXISTS blood_group;
-- ALTER TABLE children DROP COLUMN IF EXISTS village;
-- ALTER TABLE children DROP COLUMN IF EXISTS gender;
--
-- DROP INDEX IF EXISTS idx_users_phone;
-- ALTER TABLE users DROP CONSTRAINT IF EXISTS uq_users_phone;
-- ALTER TABLE users DROP COLUMN IF EXISTS consent;
-- ALTER TABLE users DROP COLUMN IF EXISTS worker_id;
-- ALTER TABLE users DROP COLUMN IF EXISTS preferred_language;
-- ALTER TABLE users DROP COLUMN IF EXISTS village;
-- ALTER TABLE users DROP COLUMN IF EXISTS phone;
-- ALTER TABLE users ALTER COLUMN email SET NOT NULL;
-- COMMIT;
