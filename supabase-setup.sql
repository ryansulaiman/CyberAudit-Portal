-- ═══════════════════════════════════════════════════════════════════
-- CyberAudit Portal — Supabase Database Setup
-- Run this entire file in: Supabase Dashboard → SQL Editor → New query
-- ═══════════════════════════════════════════════════════════════════


-- ── 1. CREATE TABLES ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY,
  email       TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'employee',
  password    TEXT NOT NULL,
  department  TEXT DEFAULT 'Engineering',
  avatar      TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audits (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  version         INTEGER DEFAULT 1,
  device_type     TEXT,
  device_model    TEXT,
  serial_number   TEXT,
  os_version      TEXT,
  checks          JSONB DEFAULT '{}',
  screenshots     JSONB DEFAULT '{}',
  submitted_at    TIMESTAMPTZ,
  status          TEXT DEFAULT 'pending_review',
  rejected_reason TEXT,
  approved_by     TEXT
);

CREATE TABLE IF NOT EXISTS tasks (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  audit_id    TEXT REFERENCES audits(id) ON DELETE CASCADE,
  check_id    TEXT,
  label       TEXT,
  status      TEXT DEFAULT 'pending',
  priority    TEXT DEFAULT 'high',
  assigned_to TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  due_date    TIMESTAMPTZ,
  comments    JSONB DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS activity (
  id        TEXT PRIMARY KEY,
  user_id   TEXT,
  action    TEXT,
  target    TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id      TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  text    TEXT NOT NULL,
  read    BOOLEAN DEFAULT FALSE,
  time    TIMESTAMPTZ DEFAULT NOW()
);


-- ── 2. DISABLE ROW LEVEL SECURITY (internal tool — re-enable if you add Supabase Auth later)

ALTER TABLE users         DISABLE ROW LEVEL SECURITY;
ALTER TABLE audits        DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks         DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity      DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;


-- ── 3. SEED INITIAL DEMO DATA ────────────────────────────────────────
-- (Safe to re-run — ON CONFLICT DO NOTHING skips duplicates)

INSERT INTO users (id, email, name, role, password, department, avatar) VALUES
  ('u1', 'admin@company.com',  'Alex Admin',    'admin',    'admin123', 'IT',          'AA'),
  ('u2', 'alice@company.com',  'Alice Johnson',  'employee', 'pass123',  'Engineering', 'AJ'),
  ('u3', 'bob@company.com',    'Bob Smith',      'employee', 'pass123',  'Marketing',   'BS'),
  ('u4', 'carol@company.com',  'Carol White',    'employee', 'pass123',  'Finance',     'CW'),
  ('u5', 'david@company.com',  'David Brown',    'employee', 'pass123',  'HR',          'DB')
ON CONFLICT (id) DO NOTHING;

INSERT INTO audits (id, user_id, version, device_type, device_model, serial_number, os_version, checks, screenshots, submitted_at, status) VALUES
  ('a1', 'u2', 1, 'Mac',     'MacBook Pro 14"',  'C02XG2JH', 'macOS Sonoma 14.3',
   '{"password_manager":"yes","antivirus":"yes","os_updated":"yes"}',
   '{"password_manager":{"name":"1pass.png","dataUrl":""},"antivirus":{"name":"av.png","dataUrl":""},"os_updated":{"name":"os.png","dataUrl":""}}',
   '2026-02-20T10:22:00Z', 'approved'),
  ('a2', 'u3', 1, 'Windows', 'Dell XPS 15',      '8F3K2M1',  'Windows 11 23H2',
   '{"password_manager":"no","antivirus":"yes","os_updated":"yes"}',
   '{"antivirus":{"name":"av.png","dataUrl":""},"os_updated":{"name":"os.png","dataUrl":""}}',
   '2026-02-22T14:05:00Z', 'pending_review'),
  ('a3', 'u4', 1, 'Windows', 'Lenovo ThinkPad',  'PF2KQR9',  'Windows 10 22H2',
   '{"password_manager":"yes","antivirus":"no","os_updated":"no"}',
   '{"password_manager":{"name":"1pass.png","dataUrl":""}}',
   '2026-02-25T09:15:00Z', 'rejected')
ON CONFLICT (id) DO NOTHING;

UPDATE audits SET rejected_reason = 'Screenshots missing for failed checks.' WHERE id = 'a3';

INSERT INTO tasks (id, user_id, audit_id, check_id, label, status, priority, assigned_to, created_at, due_date, comments) VALUES
  ('t1', 'u3', 'a2', 'password_manager', 'Install 1Password',           'pending', 'high', 'u1', '2026-02-22T14:05:00Z', NOW() + INTERVAL '5 days', '[]'),
  ('t2', 'u4', 'a3', 'antivirus',        'Install & activate antivirus','pending', 'high', 'u1', '2026-02-25T09:15:00Z', NOW() + INTERVAL '5 days', '[]'),
  ('t3', 'u4', 'a3', 'os_updated',       'Update operating system',     'pending', 'high', 'u1', '2026-02-25T09:15:00Z', NOW() + INTERVAL '5 days', '[]')
ON CONFLICT (id) DO NOTHING;

INSERT INTO activity (id, user_id, action, target, timestamp) VALUES
  ('ac1', 'u1', 'approved audit', 'Alice Johnson', '2026-02-21T11:00:00Z'),
  ('ac2', 'u1', 'rejected audit', 'Carol White',   '2026-02-26T10:00:00Z')
ON CONFLICT (id) DO NOTHING;

INSERT INTO notifications (id, user_id, text, read, time) VALUES
  ('n1', 'u2', 'Your audit has been approved ✅',                     false, '2026-02-21T11:00:00Z'),
  ('n2', 'u3', 'Your audit is pending review',                         false, '2026-02-22T14:05:00Z'),
  ('n3', 'u4', 'Your audit was rejected — please resubmit',           false, '2026-02-26T10:00:00Z'),
  ('n4', 'u5', '⚠️ You haven''t submitted your security audit yet!', false, '2026-03-05T09:00:00Z')
ON CONFLICT (id) DO NOTHING;


-- ── 4. STORAGE BUCKET (screenshots) ─────────────────────────────────
-- Cannot be created via SQL. Do this manually in Supabase:
--   Dashboard → Storage → New bucket
--   Name: screenshots
--   Public: YES (toggle on)
-- This lets employees upload proof screenshots that admins can view.


-- ═══════════════════════════════════════════════════════════════════
-- DONE! You should see 5 tables in your Table Editor.
-- Next: open CyberAudit-Portal.html in your browser.
-- ═══════════════════════════════════════════════════════════════════
