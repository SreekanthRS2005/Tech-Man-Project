import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../../hooks/useToast';
import supabase from '../../lib/supabase';
import Button from '../../components/ui/Button';
import Editor from '@monaco-editor/react';
import { Question, CodingProblem } from '../../types/assessment';
import { getRandomQuestions, validateSolution, CodingQuestion } from '../../utils/codingQuestions';
import { analyzeCodeSubmission } from '../../utils/testCalculations';

const ROUND_DURATION = 45 * 60; // 45 minutes in seconds

const Round2 = () => {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [codingProblems, setCodingProblems] = useState<CodingQuestion[]>([]);
  const [currentSection, setCurrentSection] = useState<'mcq' | 'coding'>('mcq');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [codeSolutions, setCodeSolutions] = useState<Record<string, string>>({});
  const [codeAnalysis, setCodeAnalysis] = useState<Record<string, any>>({});
  const [timeRemaining, setTimeRemaining] = useState(ROUND_DURATION);
  const [round1Verified, setRound1Verified] = useState(false);
  const [usedQuestionIds, setUsedQuestionIds] = useState<string[]>([]);

  // Debug: Add console logs for navigation debugging
  useEffect(() => {
    console.log('Round2 Component Mounted:', {
      assessmentId,
      currentSection,
      round1Verified,
      submitting
    });
  }, [assessmentId, currentSection, round1Verified, submitting]);

  useEffect(() => {
    const fetchAssessmentContent = async () => {
      if (!assessmentId) {
        console.error('Assessment ID is missing');
        showToast('Assessment ID is required', 'error');
        navigate('/dashboard');
        return;
      }

      try {
        console.log('Fetching assessment content for:', assessmentId);
        
        // First verify that Round 1 is completed
        const { data: assessment, error: assessmentError } = await supabase
          .from('assessments')
          .select('round1_score, round2_score, status, domain_id, domains(name)')
          .eq('id', assessmentId)
          .single();

        if (assessmentError) {
          console.error('Error fetching assessment:', assessmentError);
          throw assessmentError;
        }

        console.log('Assessment data:', assessment);

        // Check if Round 1 is completed
        if (assessment.round1_score === null) {
          console.log('Round 1 not completed, redirecting');
          showToast('Please complete Round 1 first', 'warning');
          navigate(`/assessment/${assessmentId}/round1`);
          return;
        }

        // Check if Round 2 is already completed
        if (assessment.round2_score !== null) {
          console.log('Round 2 already completed, redirecting to results');
          showToast('Round 2 already completed. Viewing results.', 'info');
          navigate(`/assessment/${assessmentId}/results`);
          return;
        }

        setRound1Verified(true);

        if (!assessment.domain_id) {
          throw new Error('Assessment domain not found');
        }

        // Fetch technical MCQs for the domain
        console.log('Fetching technical questions for domain:', assessment.domain_id);
        const { data: mcqs, error: mcqsError } = await supabase
          .from('questions')
          .select('*')
          .eq('domain_id', assessment.domain_id)
          .eq('question_type', 'technical')
          .limit(5);

        if (mcqsError) {
          console.error('Error fetching MCQs:', mcqsError);
          throw mcqsError;
        }
        
        console.log('MCQs loaded:', mcqs?.length || 0);
        setQuestions(mcqs || []);

        // Get random coding questions from the pool (no database dependency)
        const randomCodingQuestions = getRandomQuestions(2, 'medium', usedQuestionIds);
        console.log('Random coding questions loaded:', randomCodingQuestions.length);
        setCodingProblems(randomCodingQuestions);
        
        // Track used questions to avoid repeats
        setUsedQuestionIds(prev => [...prev, ...randomCodingQuestions.map(q => q.id)]);

        // Initialize code solutions with proper starter code
        const initialSolutions: Record<string, string> = {};
        randomCodingQuestions.forEach((problem) => {
          initialSolutions[problem.id] = `// ${problem.title}
// ${problem.description}

function solution() {
    // Write your solution here
    // Input: ${problem.inputExample}
    // Expected Output: ${problem.outputExample}
    
    return null; // Replace with your solution
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

    fetchAssessmentContent();
  }, [assessmentId, navigate, showToast]);

  // Timer effect with proper cleanup
  useEffect(() => {
    if (timeRemaining <= 0 && !submitting && round1Verified) {
      console.log('Timer expired, auto-submitting Round 2');
      handleSubmitRound();
      return;
    }

    if (round1Verified && !submitting) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            console.log('Round 2 timer reached zero');
          }
          return newTime;
        });
      }, 1000);

      return () => {
        console.log('Cleaning up Round 2 timer');
        clearInterval(timer);
      };
    }
  }, [timeRemaining, submitting, round1Verified]);

  const handleAnswerSelect = (questionId: string, answer: string) => {
    console.log('MCQ answer selected:', { questionId, answer });
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleCodeChange = (problemId: string, value: string) => {
    console.log('Code changed for problem:', problemId);
    setCodeSolutions((prev) => ({
      ...prev,
      [problemId]: value || '',
    }));
  };

  const analyzeCode = (problemId: string) => {
    const code = codeSolutions[problemId];
    const problem = codingProblems.find(p => p.id === problemId);
    
    if (!code || !problem) return;

    // Analyze the code submission
    const analysis = analyzeCodeSubmission(code, 'javascript');
    
    // Validate against test cases
    const validation = validateSolution(problem, code, 'javascript');
    
    const combinedAnalysis = {
      ...analysis,
      ...validation,
      timestamp: new Date().toISOString()
    };

    setCodeAnalysis(prev => ({
      ...prev,
      [problemId]: combinedAnalysis
    }));

    // Show feedback to user
    showToast(
      `Code analyzed! Score: ${validation.score}/${problem.points} points`,
      validation.passed ? 'success' : 'warning'
    );
  };

  const handleNextQuestion = () => {
    if (currentSection === 'mcq') {
      if (currentQuestionIndex < questions.length - 1) {
        const newIndex = currentQuestionIndex + 1;
        console.log('Moving to next MCQ:', newIndex);
        setCurrentQuestionIndex(newIndex);
      } else if (codingProblems.length > 0) {
        console.log('Switching to coding section');
        setCurrentSection('coding');
        setCurrentQuestionIndex(0);
      }
    } else {
      if (currentQuestionIndex < codingProblems.length - 1) {
        const newIndex = currentQuestionIndex + 1;
        console.log('Moving to next coding problem:', newIndex);
        setCurrentQuestionIndex(newIndex);
      }
    }
  };

  const handlePreviousQuestion = () => {
    if (currentSection === 'mcq') {
      if (currentQuestionIndex > 0) {
        const newIndex = currentQuestionIndex - 1;
        console.log('Moving to previous MCQ:', newIndex);
        setCurrentQuestionIndex(newIndex);
      }
    } else {
      if (currentQuestionIndex > 0) {
        const newIndex = currentQuestionIndex - 1;
        console.log('Moving to previous coding problem:', newIndex);
        setCurrentQuestionIndex(newIndex);
      } else if (questions.length > 0) {
        console.log('Switching back to MCQ section');
        setCurrentSection('mcq');
        setCurrentQuestionIndex(questions.length - 1);
      }
    }
  };

  const calculateScore = (mcqResponses: any[], codingSubmissions: any[]) => {
    const mcqMarks = mcqResponses.reduce((sum, response) => sum + response.marks_obtained, 0);
    const codingMarks = codingSubmissions.reduce((sum, submission) => sum + submission.marks_obtained, 0);
    console.log('Score calculation:', { mcqMarks, codingMarks, total: mcqMarks + codingMarks });
    return mcqMarks + codingMarks;
  };

  const handleSubmitRound = async () => {
    if (submitting) {
      console.log('Submit already in progress');
      return;
    }
    
    try {
      console.log('Starting Round 2 submission');
      setSubmitting(true);
      showToast('Submitting Round 2...', 'info');

      // Validate assessment ID
      if (!assessmentId) {
        throw new Error('Assessment ID is missing');
      }

      // Save MCQ responses
      const mcqResponses = questions.map((question) => ({
        assessment_id: assessmentId,
        question_id: question.id,
        selected_answer: selectedAnswers[question.id] || '',
        is_correct: selectedAnswers[question.id] === question.correct_answer,
        marks_obtained: selectedAnswers[question.id] === question.correct_answer ? question.marks : 0,
      }));

      console.log('Saving MCQ responses:', mcqResponses.length);

      if (mcqResponses.length > 0) {
        const { error: responsesError } = await supabase
          .from('assessment_responses')
          .insert(mcqResponses);

        if (responsesError) {
          console.error('Error saving MCQ responses:', responsesError);
          throw responsesError;
        }
      }

      // Save coding submissions with enhanced scoring
      const codingSubmissions = codingProblems.map((problem) => {
        const solution = codeSolutions[problem.id] || '';
        const analysis = codeAnalysis[problem.id];
        
        // Calculate marks based on analysis
        let marksObtained = 0;
        if (analysis) {
          marksObtained = analysis.score || 0;
        } else {
          // Fallback scoring if no analysis
          const hasContent = solution.trim().length > 50;
          const hasFunction = solution.includes('function') || solution.includes('=>');
          const hasLogic = solution.includes('return') || solution.includes('console.log');
          
          if (hasContent && hasFunction && hasLogic) {
            marksObtained = Math.floor(problem.points * 0.7);
          } else if (hasContent && (hasFunction || hasLogic)) {
            marksObtained = Math.floor(problem.points * 0.4);
          } else if (hasContent) {
            marksObtained = Math.floor(problem.points * 0.2);
          }
        }

        console.log('Coding problem scoring:', {
          problemId: problem.id,
          marksObtained,
          maxMarks: problem.points,
          hasAnalysis: !!analysis
        });

        return {
          assessment_id: assessmentId,
          problem_id: problem.id, // This will be null since we're using dynamic questions
          code_solution: solution,
          language: 'javascript',
          test_results: analysis?.testResults || [{ passed: marksObtained > 0, output: 'Code analysis completed' }],
          marks_obtained: marksObtained,
        };
      });

      console.log('Saving coding submissions:', codingSubmissions.length);

      // For dynamic coding problems, we'll save them differently since they don't exist in the database
      // We'll store the results in a way that doesn't require foreign key constraints
      const modifiedSubmissions = codingSubmissions.map(sub => ({
        ...sub,
        problem_id: null, // Set to null since these are dynamic questions
      }));

      if (modifiedSubmissions.length > 0) {
        const { error: submissionsError } = await supabase
          .from('coding_submissions')
          .insert(modifiedSubmissions);

        if (submissionsError) {
          console.error('Error saving coding submissions:', submissionsError);
          throw submissionsError;
        }
      }

      // Calculate Round 2 score
      const round2Score = calculateScore(mcqResponses, codingSubmissions);

      // Get Round 1 score to calculate total
      const { data: currentAssessment, error: fetchError } = await supabase
        .from('assessments')
        .select('round1_score')
        .eq('id', assessmentId)
        .single();

      if (fetchError) {
        console.error('Error fetching current assessment:', fetchError);
        throw fetchError;
      }

      const totalScore = (currentAssessment.round1_score || 0) + round2Score;

      console.log('Final scores:', {
        round1Score: currentAssessment.round1_score,
        round2Score,
        totalScore
      });

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

      if (updateError) {
        console.error('Error updating assessment:', updateError);
        throw updateError;
      }

      console.log('Round 2 completed successfully');
      showToast('Round 2 completed successfully!', 'success');
      
      // Navigate to results page
      const resultsPath = `/assessment/${assessmentId}/results`;
      console.log('Navigating to results:', resultsPath);
      navigate(resultsPath);
    } catch (error: any) {
      console.error('Error submitting Round 2:', error);
      showToast(error.message || 'Failed to submit Round 2', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Debug: Log current state
  useEffect(() => {
    console.log('Round2 State Update:', {
      loading,
      submitting,
      round1Verified,
      currentSection,
      questionsCount: questions.length,
      codingProblemsCount: codingProblems.length,
      mcqAnswersCount: Object.keys(selectedAnswers).length,
      codeSubmissionsCount: Object.keys(codeSolutions).length
    });
  }, [loading, submitting, round1Verified, currentSection, questions.length, codingProblems.length, selectedAnswers, codeSolutions]);

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

  if (!round1Verified) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Round 1 Required</h1>
          <p className="text-gray-600 mb-6">
            You must complete Round 1 before accessing Round 2.
          </p>
          <Button
            variant="primary"
            onClick={() => navigate(`/assessment/${assessmentId}/round1`)}
          >
            Go to Round 1
          </Button>
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
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">
                  {codingProblems[currentQuestionIndex].title}
                </h2>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    codingProblems[currentQuestionIndex].difficulty === 'easy' ? 'bg-success-100 text-success-800' :
                    codingProblems[currentQuestionIndex].difficulty === 'medium' ? 'bg-warning-100 text-warning-800' :
                    'bg-error-100 text-error-800'
                  }`}>
                    {codingProblems[currentQuestionIndex].difficulty.toUpperCase()}
                  </span>
                  <span className="text-sm text-gray-600">
                    {codingProblems[currentQuestionIndex].points} points
                  </span>
                </div>
              </div>

              <div className="prose max-w-none mb-4">
                <p className="text-gray-600 whitespace-pre-wrap">
                  {codingProblems[currentQuestionIndex].description}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Example Input:</h3>
                  <code className="text-sm text-gray-600">
                    {codingProblems[currentQuestionIndex].inputExample}
                  </code>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Expected Output:</h3>
                  <code className="text-sm text-gray-600">
                    {codingProblems[currentQuestionIndex].outputExample}
                  </code>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Test Cases:</h3>
                <div className="space-y-2">
                  {codingProblems[currentQuestionIndex].testCases
                    .filter(tc => !tc.hidden)
                    .map((testCase, index) => (
                    <div key={index} className="text-sm">
                      <span className="text-gray-600">
                        Input: <code>{testCase.input}</code> → 
                        Output: <code>{testCase.expectedOutput}</code>
                      </span>
                    </div>
                  ))}
                  <p className="text-xs text-gray-500 mt-2">
                    Note: Additional hidden test cases will be used for evaluation
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-900">Your Solution:</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => analyzeCode(codingProblems[currentQuestionIndex].id)}
                    disabled={!codeSolutions[codingProblems[currentQuestionIndex].id]?.trim()}
                  >
                    Analyze Code
                  </Button>
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

              {/* Code Analysis Feedback */}
              {codeAnalysis[codingProblems[currentQuestionIndex].id] && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h3 className="text-sm font-medium text-blue-900 mb-2">Code Analysis:</h3>
                  <div className="space-y-2">
                    {codeAnalysis[codingProblems[currentQuestionIndex].id].feedback?.map((feedback: string, index: number) => (
                      <p key={index} className="text-sm text-blue-800">{feedback}</p>
                    ))}
                  </div>
                  <div className="mt-2 text-sm text-blue-700">
                    Score: {codeAnalysis[codingProblems[currentQuestionIndex].id].score || 0}/{codingProblems[currentQuestionIndex].points} points
                  </div>
                </div>
              )}

              {/* Hints */}
              {codingProblems[currentQuestionIndex].hints.length > 0 && (
                <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-warning-900 mb-2">💡 Hints:</h3>
                  <ul className="space-y-1">
                    {codingProblems[currentQuestionIndex].hints.map((hint, index) => (
                      <li key={index} className="text-sm text-warning-800">• {hint}</li>
                    ))}
                  </ul>
                </div>
              )}
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
                className="min-w-[150px]"
              >
                {submitting ? 'Submitting...' : 'Submit Assessment'}
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

        {/* Debug info in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Debug Info</h3>
            <div className="bg-gray-100 rounded p-4 text-sm">
              <pre>{JSON.stringify({
                assessmentId,
                round1Verified,
                currentSection,
                currentQuestionIndex,
                totalQuestions,
                submitting,
                codeAnalysisCount: Object.keys(codeAnalysis).length
              }, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Round2;