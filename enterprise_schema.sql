-- Run this in your Supabase SQL Editor

-- 1. Recommendations Table
CREATE TABLE recommendations (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  priority TEXT NOT NULL,
  confidence_score NUMERIC NOT NULL,
  reason TEXT NOT NULL,
  department TEXT NOT NULL,
  suggested_action TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Workflows Table
CREATE TABLE workflows (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  trigger_event TEXT NOT NULL,
  status TEXT NOT NULL,
  steps JSONB NOT NULL,
  execution_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Emails Table
CREATE TABLE emails (
  id TEXT PRIMARY KEY,
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  template TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Daily Briefings Table
CREATE TABLE daily_briefings (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  hospital_health_score NUMERIC NOT NULL,
  admissions INTEGER NOT NULL,
  discharges INTEGER NOT NULL,
  appointments INTEGER NOT NULL,
  critical_patients INTEGER NOT NULL,
  revenue NUMERIC NOT NULL,
  pending_lab_reports INTEGER NOT NULL,
  recommendations JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable Row Level Security (RLS)
ALTER TABLE recommendations DISABLE ROW LEVEL SECURITY;
ALTER TABLE workflows DISABLE ROW LEVEL SECURITY;
ALTER TABLE emails DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_briefings DISABLE ROW LEVEL SECURITY;
