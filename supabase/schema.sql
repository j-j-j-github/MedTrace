-- MedTrace Supabase Schema
-- Run this script in your Supabase SQL Editor

-- 1. Custom Types
CREATE TYPE document_type_enum AS ENUM (
  'LAB_REPORT',
  'PRESCRIPTION',
  'IMAGING_REPORT',
  'DISCHARGE_SUMMARY',
  'CONSULTATION',
  'MEDICAL_CERTIFICATE',
  'OTHER'
);

CREATE TYPE processing_status_enum AS ENUM (
  'UPLOADING',
  'PROCESSING',
  'COMPLETED',
  'FAILED'
);

-- 2. Create Tables

-- Profiles Table
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Medical Records Table
CREATE TABLE medical_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  document_type document_type_enum,
  hospital TEXT,
  doctor TEXT,
  department TEXT,
  record_date DATE,
  patient_name TEXT,
  summary TEXT,
  processing_status processing_status_enum DEFAULT 'UPLOADING',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lab Results Table
CREATE TABLE lab_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  record_id UUID REFERENCES medical_records(id) ON DELETE CASCADE NOT NULL,
  test_name TEXT NOT NULL,
  value TEXT,
  unit TEXT,
  reference_range TEXT,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Medications Table
CREATE TABLE medications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  record_id UUID REFERENCES medical_records(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT,
  duration TEXT,
  instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Share Links Table
CREATE TABLE share_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  record_id UUID REFERENCES medical_records(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  allow_download BOOLEAN DEFAULT false,
  revoked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(token_hash)
);

-- 3. Storage
INSERT INTO storage.buckets (id, name, public) VALUES ('medical-records', 'medical-records', false);

-- 4. Row Level Security (RLS)

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = user_id);

-- Medical Records Policies
CREATE POLICY "Users can view own medical records" 
ON medical_records FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own medical records" 
ON medical_records FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own medical records" 
ON medical_records FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own medical records" 
ON medical_records FOR DELETE 
USING (auth.uid() = user_id);

-- Lab Results Policies
CREATE POLICY "Users can view own lab results" 
ON lab_results FOR SELECT 
USING (EXISTS (SELECT 1 FROM medical_records WHERE medical_records.id = lab_results.record_id AND medical_records.user_id = auth.uid()));

CREATE POLICY "Users can insert own lab results" 
ON lab_results FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM medical_records WHERE medical_records.id = lab_results.record_id AND medical_records.user_id = auth.uid()));

CREATE POLICY "Users can update own lab results" 
ON lab_results FOR UPDATE 
USING (EXISTS (SELECT 1 FROM medical_records WHERE medical_records.id = lab_results.record_id AND medical_records.user_id = auth.uid()));

CREATE POLICY "Users can delete own lab results" 
ON lab_results FOR DELETE 
USING (EXISTS (SELECT 1 FROM medical_records WHERE medical_records.id = lab_results.record_id AND medical_records.user_id = auth.uid()));

-- Medications Policies
CREATE POLICY "Users can view own medications" 
ON medications FOR SELECT 
USING (EXISTS (SELECT 1 FROM medical_records WHERE medical_records.id = medications.record_id AND medical_records.user_id = auth.uid()));

CREATE POLICY "Users can insert own medications" 
ON medications FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM medical_records WHERE medical_records.id = medications.record_id AND medical_records.user_id = auth.uid()));

CREATE POLICY "Users can update own medications" 
ON medications FOR UPDATE 
USING (EXISTS (SELECT 1 FROM medical_records WHERE medical_records.id = medications.record_id AND medical_records.user_id = auth.uid()));

CREATE POLICY "Users can delete own medications" 
ON medications FOR DELETE 
USING (EXISTS (SELECT 1 FROM medical_records WHERE medical_records.id = medications.record_id AND medical_records.user_id = auth.uid()));

-- Share Links Policies
-- Share links should be readable without auth so the public page can check them. We'll handle access via token verification.
-- But wait, users also need to see the share links they generated.
-- We can make SELECT open to all, and let the application filter by token. Or we create a function to check.
-- Let's make it readable by all but rely on the token hash for security.

CREATE POLICY "Share links are viewable by everyone"
ON share_links FOR SELECT
USING (true);

CREATE POLICY "Users can create share links for their records"
ON share_links FOR INSERT
WITH CHECK (auth.uid() = created_by AND EXISTS (SELECT 1 FROM medical_records WHERE id = record_id AND user_id = auth.uid()));

CREATE POLICY "Users can update own share links (revoke)"
ON share_links FOR UPDATE
USING (auth.uid() = created_by);

-- Storage Policies
-- Bucket name: 'medical-records'
CREATE POLICY "Users can upload their own medical documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'medical-records' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own medical documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'medical-records' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own medical documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'medical-records' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
