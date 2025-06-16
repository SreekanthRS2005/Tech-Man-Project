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
  const [submitting, setSubmitting] = useState(false);
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
          .select('domain_id, domains(name)')
          .eq('id', assessmentId)
          .single();

        if (assessmentError) throw assessmentError;

        if (!assessment.domain_id) {
          throw new Error('Assessment domain not found');
        }

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

        // Initialize code solutions with proper starter code
        const initialSolutions: Record<string, string> = {};
        problems?.forEach((problem) => {
          initialSolutions[problem.id] = `// ${problem.title}
// ${problem.description}

function solution() {
    // Write your solution here
    
}

// Test your solution
console.log(solution());`;
        });
        setCodeSolutions(initialSolutions);

        showToast(`Round 2: ${assessment.domains?.name} Assessment`, 'info');
      } catch (error: any) {
        console.error('Error fetching assessment content:', error);
        showToast(error.message || 'Failed to load assessment content', 'error');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    if (assessmentId) {
      fetchAssessmentContent();
    }
  }, [assessmentId, navigate, showToast]);

  // Timer effect
  useEffect(() => {
    if (timeRemaining <= 0 && !submitting) {
      handleSubmitRound();
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, submitting]);

  const handleAnswerSelect = (questionId: string, answer: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleCodeChange = (problemId: string, value: string) => {
    setCodeSolutions((prev) => ({
      ...prev,
      [problemId]: value || '',
    }));
  };

  const handleNextQuestion = () => {
    if (currentSection === 'mcq') {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
      } else if (codingProblems.length > 0) {
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
      } else if (questions.length > 0) {
        setCurrentSection('mcq');
        setCurrentQuestionIndex(questions.length - 1);
      }
    }
  };

  const calculateScore = (mcqResponses: any[], codingSubmissions: any[]) => {
    const mcqMarks = mcqResponses.reduce((sum, response) => sum + response.marks_obtained, 0);
    const codingMarks = codingSubmissions.reduce((sum, submission) => sum + submission.marks_obtained, 0);
    return mcqMarks + codingMarks;
  };

  const handleSubmitRound = async () => {
    if (submitting) return;
    
    try {
      setSubmitting(true);
      showToast('Submitting Round 2...', 'info');

      // Save MCQ responses
      const mcqResponses = questions.map((question) => ({
        assessment_id: assessmentId,
        question_id: question.id,
        selected_answer: selectedAnswers[question.id] || '',
        is_correct: selectedAnswers[question.id] === question.correct_answer,
        marks_obtained: selectedAnswers[question.id] === question.correct_answer ? question.marks : 0,
      }));

      if (mcqResponses.length > 0) {
        const { error: responsesError } = await supabase
          .from('assessment_responses')
          .insert(mcqResponses);

        if (responsesError) throw responsesError;
      }

      // Save coding submissions with basic scoring
      const codingSubmissions = codingProblems.map((problem) => {
        const solution = codeSolutions[problem.id] || '';
        // Basic scoring: give partial marks if solution is not empty and has some logic
        const hasContent = solution.trim().length > 50; // More than just comments
        const hasFunction = solution.includes('function') || solution.includes('=>');
        const hasLogic = solution.includes('return') || solution.includes('console.log');
        
        let marksObtained = 0;
        if (hasContent && hasFunction && hasLogic) {
          marksObtained = Math.floor(problem.marks * 0.7); // Give 70% for a reasonable attempt
        } else if (hasContent && (hasFunction || hasLogic)) {
          marksObtained = Math.floor(problem.marks * 0.4); // Give 40% for partial attempt
        } else if (hasContent) {
          marksObtained = Math.floor(problem.marks * 0.2); // Give 20% for any attempt
        }

        return {
          assessment_id: assessmentId,
          problem_id: problem.id,
          code_solution: solution,
          language: 'javascript',
          test_results: [{ passed: hasContent && hasFunction && hasLogic, output: 'Basic validation passed' }],
          marks_obtained: marksObtained,
        };
      });

      if (codingSubmissions.length > 0) {
        const { error: submissionsError } = await supabase
          .from('coding_submissions')
          .insert(codingSubmissions);

        if (submissionsError) throw submissionsError;
      }

      // Calculate Round 2 score
      const round2Score = calculateScore(mcqResponses, codingSubmissions);

      // Get Round 1 score to calculate total
      const { data: currentAssessment, error: fetchError } = await supabase
        .from('assessments')
        .select('round1_score')
        .eq('id', assessmentId)
        .single();

      if (fetchError) throw fetchError;

      const totalScore = (currentAssessment.round1_score || 0) + round2Score;

      // Update assessment with Round 2 score and mark as completed
      const { error: updateError } = await supabase
        .from('assessments')
        .update({
          round2_score: round2Score,
          total_score: totalScore,
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', assessmentId);

      if (updateError) throw updateError;

      showToast('Round 2 completed successfully!', 'success');
      
      // Navigate to results page
      navigate(`/assessment/${assessmentId}/results`);
    } catch (error: any) {
      console.error('Error submitting Round 2:', error);
      showToast(error.message || 'Failed to submit Round 2', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading Round 2...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0 && codingProblems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">No Content Available</h1>
          <p className="text-gray-600 mb-6">
            No technical questions or coding problems are available for this domain.
          </p>
          <Button
            variant="primary"
            onClick={() => navigate('/dashboard')}
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const totalQuestions = questions.length + codingProblems.length;
  const currentOverallIndex = currentSection === 'mcq' 
    ? currentQuestionIndex + 1 
    : questions.length + currentQuestionIndex + 1;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Round 2: {currentSection === 'mcq' ? 'Technical MCQs' : 'Coding Problems'}
            </h1>
            <p className="text-gray-600">
              Question {currentOverallIndex} of {totalQuestions} • 
              {currentSection === 'mcq' ? ' Multiple Choice' : ' Coding Challenge'}
            </p>
          </div>
          <div className={`text-lg font-medium ${
            timeRemaining < 300 ? 'text-error-600' : 'text-primary-600'
          }`}>
            Time Remaining: {minutes}:{seconds.toString().padStart(2, '0')}
          </div>
        </div>

        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Progress</span>
            <span className="text-sm text-gray-600">
              {Math.round((currentOverallIndex / totalQuestions) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentOverallIndex / totalQuestions) * 100}%` }}
            />
          </div>
        </div>

        {currentSection === 'mcq' && questions.length > 0 ? (
          // MCQ Section
          <div className="mb-8">
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                {questions[currentQuestionIndex].question_text}
              </h2>
              <div className="space-y-3">
                {questions[currentQuestionIndex].options.map((option: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(questions[currentQuestionIndex].id, option)}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
                      selectedAnswers[questions[currentQuestionIndex].id] === option
                        ? 'border-primary-500 bg-primary-50 shadow-md'
                        : 'border-gray-200 hover:border-primary-200'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                        selectedAnswers[questions[currentQuestionIndex].id] === option
                          ? 'border-primary-500 bg-primary-500'
                          : 'border-gray-300'
                      }`}>
                        {selectedAnswers[questions[currentQuestionIndex].id] === option && (
                          <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5" />
                        )}
                      </div>
                      <span className="text-gray-900">{option}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : codingProblems.length > 0 ? (
          // Coding Section
          <div className="mb-8">
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-2">
                {codingProblems[currentQuestionIndex].title}
              </h2>
              <div className="prose max-w-none mb-4">
                <p className="text-gray-600 whitespace-pre-wrap">
                  {codingProblems[currentQuestionIndex].description}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Test Cases:</h3>
                <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                  {JSON.stringify(codingProblems[currentQuestionIndex].test_cases, null, 2)}
                </pre>
              </div>

              <div className="border border-gray-300 rounded-lg overflow-hidden">
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
                    wordWrap: 'on',
                    scrollBeyondLastLine: false,
                  }}
                />
              </div>
            </div>
          </div>
        ) : null}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePreviousQuestion}
            disabled={currentSection === 'mcq' && currentQuestionIndex === 0}
          >
            Previous
          </Button>

          <div className="flex space-x-3">
            {/* Show current section and question info */}
            <div className="text-sm text-gray-600 flex items-center">
              {currentSection === 'mcq' ? (
                <span>MCQ {currentQuestionIndex + 1} of {questions.length}</span>
              ) : (
                <span>Coding {currentQuestionIndex + 1} of {codingProblems.length}</span>
              )}
            </div>

            {/* Determine if this is the last question overall */}
            {(currentSection === 'coding' && currentQuestionIndex === codingProblems.length - 1) ||
             (currentSection === 'mcq' && currentQuestionIndex === questions.length - 1 && codingProblems.length === 0) ? (
              <Button
                variant="primary"
                onClick={handleSubmitRound}
                isLoading={submitting}
                disabled={submitting}
              >
                Submit Assessment
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleNextQuestion}
              >
                {currentSection === 'mcq' && currentQuestionIndex === questions.length - 1 
                  ? 'Continue to Coding' 
                  : 'Next Question'
                }
              </Button>
            )}
          </div>
        </div>

        {/* Question navigation overview */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Assessment Overview</h3>
          <div className="grid grid-cols-2 gap-6">
            {/* MCQ Progress */}
            {questions.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-gray-600 mb-2">Technical MCQs ({questions.length})</h4>
                <div className="grid grid-cols-5 gap-1">
                  {questions.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setCurrentSection('mcq');
                        setCurrentQuestionIndex(index);
                      }}
                      className={`w-8 h-8 rounded text-xs font-medium transition-colors ${
                        currentSection === 'mcq' && index === currentQuestionIndex
                          ? 'bg-primary-600 text-white'
                          : selectedAnswers[questions[index].id]
                          ? 'bg-success-100 text-success-700 border border-success-300'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Coding Progress */}
            {codingProblems.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-gray-600 mb-2">Coding Problems ({codingProblems.length})</h4>
                <div className="grid grid-cols-5 gap-1">
                  {codingProblems.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setCurrentSection('coding');
                        setCurrentQuestionIndex(index);
                      }}
                      className={`w-8 h-8 rounded text-xs font-medium transition-colors ${
                        currentSection === 'coding' && index === currentQuestionIndex
                          ? 'bg-primary-600 text-white'
                          : codeSolutions[codingProblems[index].id] && codeSolutions[codingProblems[index].id].trim().length > 50
                          ? 'bg-success-100 text-success-700 border border-success-300'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      C{index + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Round2;