export type Domain = {
  id: string;
  name: string;
  description: string;
  created_at: string;
};

export type Question = {
  id: string;
  domain_id: string;
  question_type: 'aptitude' | 'technical';
  question_text: string;
  options: string[];
  correct_answer: string;
  marks: number;
  created_at: string;
};

export type CodingProblem = {
  id: string;
  domain_id: string;
  title: string;
  description: string;
  test_cases: {
    input: string;
    expected_output: string;
  }[];
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  created_at: string;
};

export type Assessment = {
  id: string;
  user_id: string;
  domain_id: string;
  status: 'in_progress' | 'completed';
  round1_score: number | null;
  round2_score: number | null;
  total_score: number | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
};

export type AssessmentResponse = {
  id: string;
  assessment_id: string;
  question_id: string;
  selected_answer: string;
  is_correct: boolean;
  marks_obtained: number;
  created_at: string;
};

export type CodingSubmission = {
  id: string;
  assessment_id: string;
  problem_id: string;
  code_solution: string;
  language: string;
  test_results: {
    passed: boolean;
    output: string;
  }[];
  marks_obtained: number;
  created_at: string;
};