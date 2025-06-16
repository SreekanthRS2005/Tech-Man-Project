/*
  # Assessment Platform Schema

  1. New Tables
    - domains (available assessment domains)
    - questions (aptitude and technical questions)
    - assessments (user assessment sessions)
    - assessment_responses (user responses for each question)
    - coding_problems (coding challenges)
    - coding_submissions (user code submissions)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Domains table
CREATE TABLE IF NOT EXISTS domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read domains"
  ON domains
  FOR SELECT
  TO authenticated
  USING (true);

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id uuid REFERENCES domains(id),
  question_type text NOT NULL CHECK (question_type IN ('aptitude', 'technical')),
  question_text text NOT NULL,
  options jsonb NOT NULL,
  correct_answer text NOT NULL,
  marks integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read questions"
  ON questions
  FOR SELECT
  TO authenticated
  USING (true);

-- Coding problems table
CREATE TABLE IF NOT EXISTS coding_problems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id uuid REFERENCES domains(id),
  title text NOT NULL,
  description text NOT NULL,
  test_cases jsonb NOT NULL,
  difficulty text CHECK (difficulty IN ('easy', 'medium', 'hard')),
  marks integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE coding_problems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read coding problems"
  ON coding_problems
  FOR SELECT
  TO authenticated
  USING (true);

-- Assessments table
CREATE TABLE IF NOT EXISTS assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  domain_id uuid REFERENCES domains(id),
  status text NOT NULL CHECK (status IN ('in_progress', 'completed')) DEFAULT 'in_progress',
  round1_score numeric,
  round2_score numeric,
  total_score numeric,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own assessments"
  ON assessments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own assessments"
  ON assessments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own assessments"
  ON assessments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Assessment responses table
CREATE TABLE IF NOT EXISTS assessment_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid REFERENCES assessments(id),
  question_id uuid REFERENCES questions(id),
  selected_answer text NOT NULL,
  is_correct boolean NOT NULL,
  marks_obtained numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE assessment_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own responses"
  ON assessment_responses
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM assessments
    WHERE assessments.id = assessment_responses.assessment_id
    AND assessments.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own responses"
  ON assessment_responses
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM assessments
    WHERE assessments.id = assessment_responses.assessment_id
    AND assessments.user_id = auth.uid()
  ));

-- Coding submissions table
CREATE TABLE IF NOT EXISTS coding_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid REFERENCES assessments(id),
  problem_id uuid REFERENCES coding_problems(id),
  code_solution text NOT NULL,
  language text NOT NULL,
  test_results jsonb,
  marks_obtained numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE coding_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own submissions"
  ON coding_submissions
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM assessments
    WHERE assessments.id = coding_submissions.assessment_id
    AND assessments.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own submissions"
  ON coding_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM assessments
    WHERE assessments.id = coding_submissions.assessment_id
    AND assessments.user_id = auth.uid()
  ));

-- Insert initial domains
INSERT INTO domains (name, description) VALUES
  ('Java', 'Java programming and enterprise development'),
  ('Python', 'Python programming and scripting'),
  ('JavaScript', 'Web development with JavaScript'),
  ('Full Stack Development', 'Full stack web development'),
  ('Data Analytics', 'Data analysis and visualization'),
  ('Machine Learning', 'Machine learning and AI'),
  ('Automation Testing', 'Software testing automation');