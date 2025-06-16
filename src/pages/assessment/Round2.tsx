import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../../hooks/useToast';
import supabase from '../../lib/supabase';
import Button from '../../components/ui/Button';
import Editor from '@monaco-editor/react';
import { Question, CodingProblem } from '../../types/assessment';

const ROUND_DURATION = 45 * 60; // 45 minutes in seconds

const Round2 = () => {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [codingProblems, setCodingProblems] = useState<CodingProblem[]>([]);
  const [currentSection, setCurrentSection] = useState<'mcq' | 'coding'>('mcq');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [codeSolutions, setCodeSolutions] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(ROUND_DURATION);

  useEffect(() => {
    const fetchAssessmentContent = async () => {
      try {
        // Get the assessment to determine the domain
        const { data: assessment, error: assessmentError } = await supabase
          .from('assessments')
          .select('domain_id')
          .eq('id', assessmentId)
          .single();

        if (assessmentError) throw assessmentError;

        // Fetch technical MCQs for the domain
        const { data: mcqs, error: mcqsError } = await supabase
          .from('questions')
          .select('*')
          .eq('domain_id', assessment.domain_id)
          .eq('question_type', 'technical')
          .limit(5);

        if (mcqsError) throw mcqsError;
        setQuestions(mcqs || []);

        // Fetch coding problems for the domain
        const { data: problems, error: problemsError } = await supabase
          .from('coding_problems')
          .select('*')
          .eq('domain_id', assessment.domain_id)
          .limit(2);

        if (problemsError) throw problemsError;
        setCodingProblems(problems || []);

        // Initialize code solutions
        const initialSolutions: Record<string, string> = {};
        problems?.forEach((problem) => {
          initialSolutions[problem.id] = '// Write your solution here\n';
        });
        setCodeSolutions(initialSolutions);
      } catch (error: any) {
        showToast(error.message, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchAssessmentContent();
  }, [assessmentId]);

  // Timer effect
  useEffect(() => {
    if (timeRemaining <= 0) {
      handleSubmitRound();
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  const handleAnswerSelect = (questionId: string, answer: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleCodeChange = (problemId: string, value: string) => {
    setCodeSolutions((prev) => ({
      ...prev,
      [problemId]: value,
    }));
  };

  const handleNextQuestion = () => {
    if (currentSection === 'mcq') {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
      } else {
        setCurrentSection('coding');
        setCurrentQuestionIndex(0);
      }
    } else {
      if (currentQuestionIndex < codingProblems.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
      }
    }
  };

  const handlePreviousQuestion = () => {
    if (currentSection === 'mcq') {
      if (currentQuestionIndex > 0) {
        setCurrentQuestionIndex((prev) => prev - 1);
      }
    } else {
      if (currentQuestionIndex > 0) {
        setCurrentQuestionIndex((prev) => prev - 1);
      } else {
        setCurrentSection('mcq');
        setCurrentQuestionIndex(questions.length - 1);
      }
    }
  };

  const handleSubmitRound = async () => {
    try {
      setLoading(true);

      // Save MCQ responses
      const mcqResponses = questions.map((question) => ({
        assessment_id: assessmentId,
        question_id: question.id,
        selected_answer: selectedAnswers[question.id] || '',
        is_correct: selectedAnswers[question.id] === question.correct_answer,
        marks_obtained: selectedAnswers[question.id] === question.correct_answer ? question.marks : 0,
      }));

      const { error: responsesError } = await supabase
        .from('assessment_responses')
        .insert(mcqResponses);

      if (responsesError) throw responsesError;

      // Save coding submissions
      const codingSubmissions = codingProblems.map((problem) => ({
        assessment_id: assessmentId,
        problem_id: problem.id,
        code_solution: codeSolutions[problem.id],
        language: 'javascript', // You can make this dynamic based on user selection
        test_results: [], // This would be populated by running test cases
        marks_obtained: 0, // This would be calculated based on test case results
      }));

      const { error: submissionsError } = await supabase
        .from('coding_submissions')
        .insert(codingSubmissions);

      if (submissionsError) throw submissionsError;

      // Calculate Round 2 score
      const mcqMarks = mcqResponses.reduce((sum, response) => sum + response.marks_obtained, 0);
      const codingMarks = codingSubmissions.reduce((sum, submission) => sum + submission.marks_obtained, 0);
      const totalMarks = mcqMarks + codingMarks;

      // Update assessment with Round 2 score and mark as completed
      const { error: updateError } = await supabase
        .from('assessments')
        .update({
          round2_score: totalMarks,
          total_score: totalMarks,
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', assessmentId);

      if (updateError) throw updateError;

      // Navigate to results page
      navigate(`/assessment/${assessmentId}/results`);
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
      </div>
    );
  }

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Round 2: {currentSection === 'mcq' ? 'Technical MCQs' : 'Coding Problems'}
          </h1>
          <div className="text-lg font-medium text-primary-600">
            Time Remaining: {minutes}:{seconds.toString().padStart(2, '0')}
          </div>
        </div>

        {currentSection === 'mcq' ? (
          // MCQ Section
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-600">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <span className="text-sm text-gray-600">
                {Object.keys(selectedAnswers).length} of {questions.length} answered
              </span>
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                {questions[currentQuestionIndex].question_text}
              </h2>
              <div className="space-y-3">
                {questions[currentQuestionIndex].options.map((option: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(questions[currentQuestionIndex].id, option)}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 ${
                      selectedAnswers[questions[currentQuestionIndex].id] === option
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-primary-200'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // Coding Section
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-600">
                Problem {currentQuestionIndex + 1} of {codingProblems.length}
              </span>
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-2">
                {codingProblems[currentQuestionIndex].title}
              </h2>
              <div className="prose max-w-none mb-4">
                <p className="text-gray-600">
                  {codingProblems[currentQuestionIndex].description}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Test Cases:</h3>
                <pre className="text-sm text-gray-600">
                  {JSON.stringify(codingProblems[currentQuestionIndex].test_cases, null, 2)}
                </pre>
              </div>

              <Editor
                height="400px"
                defaultLanguage="javascript"
                value={codeSolutions[codingProblems[currentQuestionIndex].id]}
                onChange={(value) => handleCodeChange(codingProblems[currentQuestionIndex].id, value || '')}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  automaticLayout: true,
                }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePreviousQuestion}
            disabled={currentSection === 'mcq' && currentQuestionIndex === 0}
          >
            Previous
          </Button>

          {currentSection === 'coding' && currentQuestionIndex === codingProblems.length - 1 ? (
            <Button
              variant="primary"
              onClick={handleSubmitRound}
            >
              Submit Assessment
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleNextQuestion}
              disabled={
                currentSection === 'coding' &&
                currentQuestionIndex === codingProblems.length - 1
              }
            >
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Round2;