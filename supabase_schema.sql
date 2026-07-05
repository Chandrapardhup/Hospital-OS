-- Run this in your Supabase SQL Editor

-- 1. Users Table (Auth Store Simulation)
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT, -- For simulated login only
  role TEXT NOT NULL,
  department TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Patients Table
CREATE TABLE patients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  dob TEXT,
  gender TEXT,
  blood_group TEXT,
  address TEXT,
  status TEXT,
  last_visit TEXT,
  assigned_doctor_id TEXT,
  allergies TEXT[],
  insurance_provider TEXT,
  insurance_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Doctors Table
CREATE TABLE doctors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  department TEXT,
  specialization TEXT,
  experience_years INTEGER,
  consultation_fee NUMERIC,
  available_days TEXT[],
  status TEXT,
  avatar TEXT
);

-- 4. Appointments Table
CREATE TABLE appointments (
  id TEXT PRIMARY KEY,
  patient_id TEXT,
  doctor_id TEXT,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  type TEXT,
  status TEXT,
  symptoms TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Notifications Table
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Medical Records Table
CREATE TABLE medical_records (
  id TEXT PRIMARY KEY,
  patient_id TEXT,
  title TEXT NOT NULL,
  sub TEXT,
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Invoices Table
CREATE TABLE invoices (
  id TEXT PRIMARY KEY,
  patient_id TEXT,
  doctor_id TEXT,
  amount NUMERIC NOT NULL,
  status TEXT,
  date TEXT,
  items JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Inventory Table
CREATE TABLE inventory (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  unit TEXT NOT NULL,
  min_stock_level INTEGER NOT NULL DEFAULT 10,
  status TEXT,
  last_restocked TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable Row Level Security (RLS) to allow our frontend to read/write freely
-- Since we are migrating from a local storage solution without a backend JWT auth system,
-- this allows our simulated auth to work out-of-the-box with the database.
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE doctors DISABLE ROW LEVEL SECURITY;
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory DISABLE ROW LEVEL SECURITY;
