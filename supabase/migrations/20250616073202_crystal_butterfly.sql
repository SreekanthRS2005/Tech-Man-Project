/*
  # Fix Database Schema Relationships and RLS Issues

  1. Schema Fixes
    - Ensure proper foreign key relationships between tables
    - Fix users table structure and constraints
    - Update RLS policies for proper access control
    
  2. Table Relationships
    - assessments.domain_id -> domains.id
    - assessments.user_id -> auth.users.id (not public.users.id)
    - assessment_responses.assessment_id -> assessments.id
    - coding_submissions.assessment_id -> assessments.id
    
  3. Security Updates
    - Fix RLS policies to use auth.uid() correctly
    - Ensure proper access control for all tables
*/

-- First, let's ensure the users table has the correct structure and constraints
DO $$
BEGIN
  -- Drop the existing foreign key constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'users_id_fkey' 
    AND table_name = 'users'
  ) THEN
    ALTER TABLE users DROP CONSTRAINT users_id_fkey;
  END IF;
END $$;

-- Recreate the users table foreign key constraint to reference auth.users
ALTER TABLE users 
ADD CONSTRAINT users_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fix the assessments table foreign key to reference auth.users directly
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'assessments_user_id_fkey' 
    AND table_name = 'assessments'
  ) THEN
    ALTER TABLE assessments DROP CONSTRAINT assessments_user_id_fkey;
  END IF;
END $$;

-- Add the correct foreign key constraint
ALTER TABLE assessments 
ADD CONSTRAINT assessments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Ensure the domains table exists and has proper structure
CREATE TABLE IF NOT EXISTS domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Ensure the foreign key relationship between assessments and domains exists
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'assessments_domain_id_fkey' 
    AND table_name = 'assessments'
  ) THEN
    ALTER TABLE assessments DROP CONSTRAINT assessments_domain_id_fkey;
  END IF;
END $$;

-- Add the foreign key constraint
ALTER TABLE assessments 
ADD CONSTRAINT assessments_domain_id_fkey 
FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE SET NULL;

-- Update RLS policies for users table
DROP POLICY IF EXISTS "Users can insert their own data" ON users;
DROP POLICY IF EXISTS "Users can read their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;

CREATE POLICY "Users can insert their own data"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read their own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Update RLS policies for assessments table
DROP POLICY IF EXISTS "Users can insert their own assessments" ON assessments;
DROP POLICY IF EXISTS "Users can read their own assessments" ON assessments;
DROP POLICY IF EXISTS "Users can update their own assessments" ON assessments;

CREATE POLICY "Users can insert their own assessments"
  ON assessments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own assessments"
  ON assessments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own assessments"
  ON assessments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Ensure domains table has proper RLS
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read domains" ON domains;
CREATE POLICY "Anyone can read domains"
  ON domains
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert some default domains if they don't exist
INSERT INTO domains (name, description) 
VALUES 
  ('JavaScript', 'Frontend and backend JavaScript development'),
  ('Python', 'Python programming and data science'),
  ('Java', 'Java enterprise development'),
  ('React', 'React frontend development'),
  ('Node.js', 'Node.js backend development')
ON CONFLICT DO NOTHING;

-- Ensure questions table has proper foreign key to domains
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'questions_domain_id_fkey' 
    AND table_name = 'questions'
  ) THEN
    ALTER TABLE questions 
    ADD CONSTRAINT questions_domain_id_fkey 
    FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Ensure coding_problems table has proper foreign key to domains
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'coding_problems_domain_id_fkey' 
    AND table_name = 'coding_problems'
  ) THEN
    ALTER TABLE coding_problems 
    ADD CONSTRAINT coding_problems_domain_id_fkey 
    FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Update assessment_responses RLS policies to use proper joins
DROP POLICY IF EXISTS "Users can insert their own responses" ON assessment_responses;
DROP POLICY IF EXISTS "Users can read their own responses" ON assessment_responses;

CREATE POLICY "Users can insert their own responses"
  ON assessment_responses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM assessments 
      WHERE assessments.id = assessment_responses.assessment_id 
      AND assessments.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can read their own responses"
  ON assessment_responses
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM assessments 
      WHERE assessments.id = assessment_responses.assessment_id 
      AND assessments.user_id = auth.uid()
    )
  );

-- Update coding_submissions RLS policies
DROP POLICY IF EXISTS "Users can insert their own submissions" ON coding_submissions;
DROP POLICY IF EXISTS "Users can read their own submissions" ON coding_submissions;

CREATE POLICY "Users can insert their own submissions"
  ON coding_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM assessments 
      WHERE assessments.id = coding_submissions.assessment_id 
      AND assessments.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can read their own submissions"
  ON coding_submissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM assessments 
      WHERE assessments.id = coding_submissions.assessment_id 
      AND assessments.user_id = auth.uid()
    )
  );

-- Ensure all tables have RLS enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE coding_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE coding_submissions ENABLE ROW LEVEL SECURITY;