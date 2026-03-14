-- CyberAudit Portal — Complete DB Setup (safe to re-run)
-- Run this in Supabase Dashboard → SQL Editor

-- USERS
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'employee', password TEXT NOT NULL,
  department TEXT DEFAULT 'Engineering', avatar TEXT,
  reset_token TEXT, reset_token_expiry TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DEPARTMENTS
CREATE TABLE IF NOT EXISTS departments (
  id TEXT PRIMARY KEY, name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AUDITS (period = "YYYY-MM" for monthly tracking)
CREATE TABLE IF NOT EXISTS audits (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period TEXT, version INTEGER DEFAULT 1, device_type TEXT, device_model TEXT,
  serial_number TEXT, os_version TEXT, checks JSONB DEFAULT '{}',
  screenshots JSONB DEFAULT '{}', submitted_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending_review', rejected_reason TEXT, approved_by TEXT
);

-- TASKS
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  audit_id TEXT, check_id TEXT, label TEXT NOT NULL, status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'high', assigned_to TEXT, created_at TIMESTAMPTZ DEFAULT NOW(),
  due_date TIMESTAMPTZ, comments JSONB DEFAULT '[]'
);

-- ACTIVITY
CREATE TABLE IF NOT EXISTS activity (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL,
  action TEXT NOT NULL, target TEXT, timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, text TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE, time TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS on all tables
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE audits DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Add new columns if upgrading from previous version
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMPTZ;
ALTER TABLE audits ADD COLUMN IF NOT EXISTS period TEXT;

-- SCREENSHOTS STORAGE BUCKET
-- Ensures the bucket exists and is public so uploaded images are viewable
INSERT INTO storage.buckets (id, name, public, file_size_limit)
  VALUES ('screenshots', 'screenshots', true, 10485760)
  ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow anyone to read screenshots (view uploaded proof images)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='objects' AND schemaname='storage' AND policyname='screenshots_public_read'
  ) THEN
    EXECUTE 'CREATE POLICY screenshots_public_read ON storage.objects FOR SELECT TO public USING (bucket_id = ''screenshots'')';
  END IF;
END $$;

-- Allow anyone to upload screenshots (employees uploading proof)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='objects' AND schemaname='storage' AND policyname='screenshots_public_insert'
  ) THEN
    EXECUTE 'CREATE POLICY screenshots_public_insert ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = ''screenshots'')';
  END IF;
END $$;

-- Backfill period for existing audits
UPDATE audits SET period = TO_CHAR(COALESCE(submitted_at, NOW()), 'YYYY-MM') WHERE period IS NULL OR period = '';

-- Seed departments
INSERT INTO departments (id, name) VALUES
  ('dept_1','Engineering'),('dept_2','Marketing'),('dept_3','Finance'),
  ('dept_4','HR'),('dept_5','IT'),('dept_6','Sales'),('dept_7','Legal')
ON CONFLICT (id) DO NOTHING;

-- Seed users
INSERT INTO users (id, email, name, role, password, department, avatar) VALUES
  ('u1','admin@company.com','Alex Admin','admin','admin123','IT','AA'),
  ('u2','alice@company.com','Alice Brown','employee','pass123','Engineering','AB'),
  ('u3','bob@company.com','Bob Smith','employee','pass123','Marketing','BS'),
  ('u4','carol@company.com','Carol White','employee','pass123','Finance','CW'),
  ('u5','david@company.com','David Lee','employee','pass123','IT','DL')
ON CONFLICT (id) DO NOTHING;

-- Seed audits (current month)
INSERT INTO audits (id, user_id, period, version, device_type, device_model, serial_number, os_version, checks, screenshots, submitted_at, status) VALUES
  ('a1','u2',TO_CHAR(NOW(),'YYYY-MM'),1,'Mac','MacBook Pro M3','C02X1234','macOS 14.4','{"password_manager":"yes","antivirus":"yes","os_updated":"yes"}','{}',NOW()-INTERVAL '2 days','approved'),
  ('a2','u3',TO_CHAR(NOW(),'YYYY-MM'),1,'Windows','Dell XPS 15','SVC12345','Windows 11','{"password_manager":"yes","antivirus":"no","os_updated":"yes"}','{}',NOW()-INTERVAL '1 day','pending_review'),
  ('a3','u4',TO_CHAR(NOW(),'YYYY-MM'),1,'Mac','MacBook Air M2','C02Y5678','macOS 14.3','{"password_manager":"no","antivirus":"no","os_updated":"yes"}','{}',NOW()-INTERVAL '3 hours','rejected')
ON CONFLICT (id) DO NOTHING;

-- Seed tasks
INSERT INTO tasks (id, user_id, audit_id, check_id, label, status, priority, assigned_to, created_at, due_date, comments) VALUES
  ('t1','u3','a2','antivirus','Install & activate antivirus','pending','high','u1',NOW()-INTERVAL '1 day',NOW()+INTERVAL '5 days','[]'),
  ('t2','u4','a3','password_manager','Install 1Password','in_progress','high','u1',NOW()-INTERVAL '3 hours',NOW()+INTERVAL '5 days','[]'),
  ('t3','u4','a3','antivirus','Install & activate antivirus','pending','high','u1',NOW()-INTERVAL '3 hours',NOW()+INTERVAL '5 days','[]')
ON CONFLICT (id) DO NOTHING;

-- Seed activity
INSERT INTO activity (id, user_id, action, target, timestamp) VALUES
  ('ac1','u2','submitted audit','March 2026',NOW()-INTERVAL '2 days'),
  ('ac2','u1','approved audit','Alice Brown',NOW()-INTERVAL '1 day'),
  ('ac3','u3','submitted audit','March 2026',NOW()-INTERVAL '1 day'),
  ('ac4','u4','submitted audit','March 2026',NOW()-INTERVAL '3 hours')
ON CONFLICT (id) DO NOTHING;

-- Seed notifications
INSERT INTO notifications (id, user_id, text, read, time) VALUES
  ('n1','u1','📋 Alice Brown submitted a March 2026 audit for review',TRUE,NOW()-INTERVAL '2 days'),
  ('n2','u1','📋 Bob Smith submitted a March 2026 audit for review',FALSE,NOW()-INTERVAL '1 day'),
  ('n3','u1','📋 Carol White submitted a March 2026 audit for review',FALSE,NOW()-INTERVAL '3 hours'),
  ('n4','u2','✅ Your March 2026 audit has been approved!',FALSE,NOW()-INTERVAL '1 day'),
  ('n5','u4','❌ Your March 2026 audit was rejected: Missing antivirus and password manager',FALSE,NOW()-INTERVAL '2 hours')
ON CONFLICT (id) DO NOTHING;

-- STORAGE: Create a public bucket named "screenshots" manually in:
-- Supabase Dashboard → Storage → New bucket → name: screenshots → Public ON
