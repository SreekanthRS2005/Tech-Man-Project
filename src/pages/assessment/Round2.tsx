import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../../hooks/useToast';
import supabase from '../../lib/supabase';
import Button from '../../components/ui/Button';
import LanguageSelector, { SUPPORTED_LANGUAGES, Language } from '../../components/ui/LanguageSelector';
import CodeExecutionStatus, { ExecutionStatus } from '../../components/ui/CodeExecutionStatus';
import ConfirmationDialog from '../../components/ui/ConfirmationDialog';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Editor from '@monaco-editor/react';
import { Question, CodingProblem } from '../../types/assessment';
import { getRandomQuestions, CodingQuestion } from '../../utils/codingQuestions';
import { validateCodeSubmission, CodeSubmission } from '../../utils/codeValidation';
import { calculateMarksWithValidation } from '../../utils/marksCalculation';
import { generateConfirmationNumber, sendTestCompletionEmail, TestCompletionData } from '../../utils/emailService';
import { QuestionCache } from '../../utils/cacheManager';

const ROUND_DURATION = 45 * 60; // 45 minutes in seconds

const Round2 = () => {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  // Core state
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [codingProblems, setCodingProblems] = useState<CodingQuestion[]>([]);
  const [currentSection, setCurrentSection] = useState<'mcq' | 'coding'>('mcq');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [codeSolutions, setCodeSolutions] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(ROUND_DURATION);
  const [round1Verified, setRound1Verified] = useState(false);
  const [usedQuestionIds, setUsedQuestionIds] = useState<string[]>([]);
  
  // Language and execution state
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(SUPPORTED_LANGUAGES[0]);
  const [executionStatus, setExecutionStatus] = useState<ExecutionStatus>('idle');
  const [executionResults, setExecutionResults] = useState<Record<string, any>>({});
  
  // UI state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log('Round2 Component Mounted:', {
      assessmentId,
      currentSection,
      round1Verified,
      submitting
    });
  }, [assessmentId, currentSection, round1Verified, submitting]);

  // Load assessment content with caching
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
        
        // Verify Round 1 completion
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

        if (assessment.round1_score === null) {
          console.log('Round 1 not completed, redirecting');
          showToast('Please complete Round 1 first', 'warning');
          navigate(`/assessment/${assessmentId}/round1`);
          return;
        }

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

        // Fetch technical MCQs with caching
        const mcqs = await QuestionCache.getQuestions(
          assessment.domain_id,
          'technical',
          async () => {
            const { data, error } = await supabase
              .from('questions')
              .select('*')
              .eq('domain_id', assessment.domain_id)
              .eq('question_type', 'technical')
              .limit(5);

            if (error) throw error;
            return data || [];
          }
        );
        
        console.log('MCQs loaded:', mcqs.length);
        setQuestions(mcqs);

        // Get random coding questions
        const randomCodingQuestions = getRandomQuestions(2, 'medium', usedQuestionIds);
        console.log('Random coding questions loaded:', randomCodingQuestions.length);
        setCodingProblems(randomCodingQuestions);
        
        setUsedQuestionIds(prev => [...prev, ...randomCodingQuestions.map(q => q.id)]);

        // Initialize code solutions with language-specific boilerplate
        const initialSolutions: Record<string, string> = {};
        randomCodingQuestions.forEach((problem) => {
          initialSolutions[problem.id] = selectedLanguage.boilerplate.replace(
            '// Write your solution here',
            `// ${problem.title}\n// ${problem.description}\n\n// Write your solution here`
          );
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

  // Timer with cleanup
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

  // Language change handler
  const handleLanguageChange = (language: Language) => {
    setSelectedLanguage(language);
    
    // Update code solutions with new boilerplate
    const updatedSolutions: Record<string, string> = {};
    codingProblems.forEach((problem) => {
      const currentCode = codeSolutions[problem.id] || '';
      // If current code is just boilerplate, replace with new language boilerplate
      if (currentCode.trim().length < 50) {
        updatedSolutions[problem.id] = language.boilerplate.replace(
          '// Write your solution here',
          `// ${problem.title}\n// ${problem.description}\n\n// Write your solution here`
        );
      } else {
        updatedSolutions[problem.id] = currentCode;
      }
    });
    setCodeSolutions(updatedSolutions);
  };

  // MCQ answer selection
  const handleAnswerSelect = (questionId: string, answer: string) => {
    console.log('MCQ answer selected:', { questionId, answer });
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  // Code change handler
  const handleCodeChange = (problemId: string, value: string) => {
    console.log('Code changed for problem:', problemId);
    setCodeSolutions((prev) => ({
      ...prev,
      [problemId]: value || '',
    }));
    
    // Reset execution status when code changes
    setExecutionStatus('idle');
  };

  // Run code execution
  const handleRunCode = async (problemId: string) => {
    const code = codeSolutions[problemId];
    const problem = codingProblems.find(p => p.id === problemId);
    
    if (!code || !problem) return;

    setExecutionStatus('compiling');
    
    try {
      // Simulate compilation delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setExecutionStatus('running');
      
      const submission: CodeSubmission = {
        code,
        language: selectedLanguage.id,
        problemId,
        testCases: problem.testCases,
        maxPoints: problem.points
      };

      const result = await validateCodeSubmission(submission);
      
      setExecutionResults(prev => ({
        ...prev,
        [problemId]: result
      }));

      if (result.isValid && result.passedTests > 0) {
        setExecutionStatus('success');
        showToast(`Code executed successfully! ${result.passedTests}/${result.totalTests} tests passed`, 'success');
      } else {
        setExecutionStatus('error');
        showToast('Code execution failed. Check your logic and try again.', 'error');
      }
      
    } catch (error) {
      setExecutionStatus('error');
      showToast('Code execution failed due to an error', 'error');
      console.error('Code execution error:', error);
    }
  };

  // Navigation handlers with smooth transitions
  const handleNextQuestion = async () => {
    setIsTransitioning(true);
    
    await new Promise(resolve => setTimeout(resolve, 200));
    
    if (currentSection === 'mcq') {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else if (codingProblems.length > 0) {
        setCurrentSection('coding');
        setCurrentQuestionIndex(0);
      }
    } else {
      if (currentQuestionIndex < codingProblems.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      }
    }
    
    setIsTransitioning(false);
  };

  const handlePreviousQuestion = async () => {
    setIsTransitioning(true);
    
    await new Promise(resolve => setTimeout(resolve, 200));
    
    if (currentSection === 'mcq') {
      if (currentQuestionIndex > 0) {
        setCurrentQuestionIndex(prev => prev - 1);
      }
    } else {
      if (currentQuestionIndex > 0) {
        setCurrentQuestionIndex(prev => prev - 1);
      } else if (questions.length > 0) {
        setCurrentSection('mcq');
        setCurrentQuestionIndex(questions.length - 1);
      }
    }
    
    setIsTransitioning(false);
  };

  // Enhanced submission with email notification
  const handleSubmitRound = async () => {
    if (submitting) {
      console.log('Submit already in progress');
      return;
    }
    
    try {
      console.log('Starting Round 2 submission');
      setSubmitting(true);
      showToast('Submitting Round 2...', 'info');

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

      if (mcqResponses.length > 0) {
        const { error: responsesError } = await supabase
          .from('assessment_responses')
          .insert(mcqResponses);

        if (responsesError) {
          console.error('Error saving MCQ responses:', responsesError);
          throw responsesError;
        }
      }

      // Process and save coding submissions
      const codingSubmissions = await Promise.all(
        codingProblems.map(async (problem) => {
          const solution = codeSolutions[problem.id] || '';
          let marksObtained = 0;
          let testResults: any[] = [];

          if (solution.trim()) {
            try {
              const submission: CodeSubmission = {
                code: solution,
                language: selectedLanguage.id,
                problemId: problem.id,
                testCases: problem.testCases,
                maxPoints: problem.points
              };

              const result = await validateCodeSubmission(submission);
              marksObtained = result.score;
              testResults = result.errors.map(error => ({ passed: false, output: error }));
              
              if (result.passedTests > 0) {
                testResults.unshift({ passed: true, output: 'Some test cases passed' });
              }
            } catch (error) {
              console.error('Error validating code:', error);
              testResults = [{ passed: false, output: 'Validation failed' }];
            }
          }

          return {
            assessment_id: assessmentId,
            problem_id: null, // Dynamic questions don't have DB entries
            code_solution: solution,
            language: selectedLanguage.id,
            test_results: testResults,
            marks_obtained: marksObtained,
          };
        })
      );

      if (codingSubmissions.length > 0) {
        const { error: submissionsError } = await supabase
          .from('coding_submissions')
          .insert(codingSubmissions);

        if (submissionsError) {
          console.error('Error saving coding submissions:', submissionsError);
          throw submissionsError;
        }
      }

      // Calculate marks with validation
      const calculationResult = await calculateMarksWithValidation(assessmentId);
      
      if (!calculationResult.validationPassed) {
        console.warn('Marks calculation validation failed:', calculationResult.errors);
      }

      // Update assessment status
      const { error: updateError } = await supabase
        .from('assessments')
        .update({
          round2_score: calculationResult.round2Score,
          total_score: calculationResult.totalScore,
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', assessmentId);

      if (updateError) {
        console.error('Error updating assessment:', updateError);
        throw updateError;
      }

      // Generate confirmation and send email
      const confirmationNumber = generateConfirmationNumber();
      
      // Get user and assessment details for email
      const { data: userAssessment } = await supabase
        .from('assessments')
        .select(`
          *,
          domains(name),
          users(full_name, email)
        `)
        .eq('id', assessmentId)
        .single();

      if (userAssessment?.users) {
        const emailData: TestCompletionData = {
          userName: userAssessment.users.full_name,
          userEmail: userAssessment.users.email,
          assessmentId,
          domainName: userAssessment.domains?.name || 'Unknown',
          totalScore: calculationResult.totalScore,
          percentage: calculationResult.percentage,
          status: calculationResult.status,
          completedAt: new Date().toISOString(),
          confirmationNumber,
          round1Score: calculationResult.round1Score,
          round2Score: calculationResult.round2Score
        };

        // Send email notification
        const emailSent = await sendTestCompletionEmail(emailData);
        if (emailSent) {
          showToast(`Assessment completed! Confirmation email sent to ${userAssessment.users.email}`, 'success');
        } else {
          showToast('Assessment completed! Email notification failed to send.', 'warning');
        }
      }

      console.log('Round 2 completed successfully');
      showToast('Round 2 completed successfully!', 'success');
      
      // Navigate to results
      navigate(`/assessment/${assessmentId}/results`);
      
    } catch (error: any) {
      console.error('Error submitting Round 2:', error);
      showToast(error.message || 'Failed to submit Round 2', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading Round 2...</p>
        </div>
      </div>
    );
  }

  // Round 1 verification
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

  // No content available
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

  const currentQuestions = currentSection === 'mcq' ? questions : codingProblems;
  const currentQuestion = currentQuestions[currentQuestionIndex];
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const totalQuestions = questions.length + codingProblems.length;
  const currentOverallIndex = currentSection === 'mcq' 
    ? currentQuestionIndex + 1 
    : questions.length + currentQuestionIndex + 1;

  const isLastQuestion = (currentSection === 'coding' && currentQuestionIndex === codingProblems.length - 1) ||
                        (currentSection === 'mcq' && currentQuestionIndex === questions.length - 1 && codingProblems.length === 0);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className={cn(
        'bg-white rounded-lg shadow-md p-8 transition-all duration-200',
        isTransitioning && 'opacity-50'
      )}>
        {/* Header */}
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
          <div className="flex items-center space-x-4">
            <div className={`text-lg font-medium ${
              timeRemaining < 300 ? 'text-error-600' : 'text-primary-600'
            }`}>
              Time Remaining: {minutes}:{seconds.toString().padStart(2, '0')}
            </div>
            {currentSection === 'coding' && (
              <LanguageSelector
                selectedLanguage={selectedLanguage.id}
                onLanguageChange={handleLanguageChange}
                disabled={submitting}
                className="w-48"
              />
            )}
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

        {/* Content */}
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
                    className={cn(
                      'w-full p-4 text-left rounded-lg border-2 transition-all duration-200 hover:shadow-md',
                      selectedAnswers[questions[currentQuestionIndex].id] === option
                        ? 'border-primary-500 bg-primary-50 shadow-md'
                        : 'border-gray-200 hover:border-primary-200'
                    )}
                  >
                    <div className="flex items-center">
                      <div className={cn(
                        'w-4 h-4 rounded-full border-2 mr-3',
                        selectedAnswers[questions[currentQuestionIndex].id] === option
                          ? 'border-primary-500 bg-primary-500'
                          : 'border-gray-300'
                      )}>
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
                  <span className={cn(
                    'px-2 py-1 rounded text-xs font-medium',
                    codingProblems[currentQuestionIndex].difficulty === 'easy' ? 'bg-success-100 text-success-800' :
                    codingProblems[currentQuestionIndex].difficulty === 'medium' ? 'bg-warning-100 text-warning-800' :
                    'bg-error-100 text-error-800'
                  )}>
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

              {/* Code Editor */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-900">Your Solution ({selectedLanguage.name}):</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRunCode(codingProblems[currentQuestionIndex].id)}
                    disabled={!codeSolutions[codingProblems[currentQuestionIndex].id]?.trim() || executionStatus === 'running' || executionStatus === 'compiling'}
                    isLoading={executionStatus === 'running' || executionStatus === 'compiling'}
                  >
                    Run Code
                  </Button>
                </div>
                
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  <Editor
                    height="400px"
                    language={selectedLanguage.monacoId}
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
                      suggestOnTriggerCharacters: true,
                      quickSuggestions: true,
                      autoIndent: 'full',
                      formatOnPaste: true,
                      formatOnType: true
                    }}
                  />
                </div>
              </div>

              {/* Execution Status */}
              <CodeExecutionStatus
                status={executionStatus}
                executionTime={executionResults[codingProblems[currentQuestionIndex].id]?.executionTime}
                passedTests={executionResults[codingProblems[currentQuestionIndex].id]?.passedTests}
                totalTests={executionResults[codingProblems[currentQuestionIndex].id]?.totalTests}
                errors={executionResults[codingProblems[currentQuestionIndex].id]?.errors}
                className="mb-4"
              />

              {/* Execution Feedback */}
              {executionResults[codingProblems[currentQuestionIndex].id] && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h3 className="text-sm font-medium text-blue-900 mb-2">Execution Results:</h3>
                  <div className="space-y-2">
                    {executionResults[codingProblems[currentQuestionIndex].id].feedback?.map((feedback: string, index: number) => (
                      <p key={index} className="text-sm text-blue-800">{feedback}</p>
                    ))}
                  </div>
                  <div className="mt-2 text-sm text-blue-700">
                    Score: {executionResults[codingProblems[currentQuestionIndex].id].score || 0}/{codingProblems[currentQuestionIndex].points} points
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
            disabled={currentSection === 'mcq' && currentQuestionIndex === 0 || isTransitioning}
          >
            Previous
          </Button>

          <div className="flex space-x-3">
            <div className="text-sm text-gray-600 flex items-center">
              {currentSection === 'mcq' ? (
                <span>MCQ {currentQuestionIndex + 1} of {questions.length}</span>
              ) : (
                <span>Coding {currentQuestionIndex + 1} of {codingProblems.length}</span>
              )}
            </div>

            {isLastQuestion ? (
              <Button
                variant="primary"
                onClick={() => setShowConfirmDialog(true)}
                disabled={submitting || isTransitioning}
                className="min-w-[150px]"
              >
                Submit Assessment
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleNextQuestion}
                disabled={isTransitioning}
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
                      className={cn(
                        'w-8 h-8 rounded text-xs font-medium transition-colors',
                        currentSection === 'mcq' && index === currentQuestionIndex
                          ? 'bg-primary-600 text-white'
                          : selectedAnswers[questions[index].id]
                          ? 'bg-success-100 text-success-700 border border-success-300'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
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
                      className={cn(
                        'w-8 h-8 rounded text-xs font-medium transition-colors',
                        currentSection === 'coding' && index === currentQuestionIndex
                          ? 'bg-primary-600 text-white'
                          : codeSolutions[codingProblems[index].id] && codeSolutions[codingProblems[index].id].trim().length > 50
                          ? 'bg-success-100 text-success-700 border border-success-300'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
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

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleSubmitRound}
        title="Submit Assessment"
        message="Are you sure you want to submit your Round 2 assessment? This action cannot be undone."
        type="warning"
        confirmText="Submit Assessment"
        cancelText="Continue Working"
        isLoading={submitting}
      >
        <div className="bg-gray-50 rounded-lg p-4 mt-4">
          <h4 className="font-medium text-gray-900 mb-2">Submission Summary:</h4>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• MCQ Questions: {Object.keys(selectedAnswers).length}/{questions.length} answered</li>
            <li>• Coding Problems: {Object.values(codeSolutions).filter(code => code.trim().length > 50).length}/{codingProblems.length} attempted</li>
            <li>• Selected Language: {selectedLanguage.name}</li>
            <li>• Time Remaining: {minutes}:{seconds.toString().padStart(2, '0')}</li>
          </ul>
        </div>
      </ConfirmationDialog>
    </div>
  );
};

export default Round2;