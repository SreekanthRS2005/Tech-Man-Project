export type Domain = {
  id: string;
  name: string;
  description: string;
  created_at: string;
};

export type Question = {
  id: string;
  domain_id: string | null;
  question_type: 'aptitude' | 'technical';
  question_text: string;
  options: string[];
  correct_answer: string;
  marks: number;
  created_at: string;
};

export type CodingProblem = {
  id: string;
  domain_id: string | null;
  title: string;
  description: string;
  test_cases: {
    input: string;
    expected_output: string;
  }[];
  difficulty: 'easy' | 'medium' | 'hard' | null;
  marks: number;
  created_at: string;
};

export type Assessment = {
  id: string;
  user_id: string | null;
  domain_id: string | null;
  status: 'in_progress' | 'completed';
  round1_score: number | null;
  round2_score: number | null;
  total_score: number | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  domains?: {
    name: string;
  };
};

export type AssessmentResponse = {
  id: string;
  assessment_id: string | null;
  question_id: string | null;
  selected_answer: string;
  is_correct: boolean;
  marks_obtained: number;
  created_at: string;
  questions?: {
    question_text: string;
    correct_answer: string;
    marks: number;
    question_type: 'aptitude' | 'technical';
  };
};

export type CodingSubmission = {
  id: string;
  assessment_id: string | null;
  problem_id: string | null;
  code_solution: string;
  language: string;
  test_results: {
    passed: boolean;
    output: string;
  }[] | null;
  marks_obtained: number;
  created_at: string;
  coding_problems?: {
    title: string;
    marks: number;
  };
};