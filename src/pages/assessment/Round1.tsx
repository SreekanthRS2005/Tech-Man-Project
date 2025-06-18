import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../../hooks/useToast';
import supabase from '../../lib/supabase';
import Button from '../../components/ui/Button';
import { Question } from '../../types/assessment';
import { quickCalculateResults } from '../../utils/testCalculations';
import TestResultsDisplay from '../../components/ui/TestResultsDisplay';

const ROUND_DURATION = 15 * 60; // 15 minutes in seconds

const Round1 = () => {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(ROUND_DURATION);
  const [showResults, setShowResults] = useState(false);
  const [roundResults, setRoundResults] = useState<any>(null);
  const [round1Completed, setRound1Completed] = useState(false);

  // Debug: Add console logs for navigation debugging
  useEffect(() => {
    console.log('Round1 Component Mounted:', {
      assessmentId,
      showResults,
      round1Completed,
      submitting
    });
  }, [assessmentId, showResults, round1Completed, submitting]);

  useEffect(() => {
    const fetchQuestions = async () => {
      if (!assessmentId) {
        console.error('Assessment ID is missing');
        showToast('Assessment ID is required', 'error');
        navigate('/dashboard');
        return;
      }

      try {
        console.log('Fetching questions for assessment:', assessmentId);
        
        // First check if Round 1 is already completed
        const { data: assessmentData, error: assessmentError } = await supabase
          .from('assessments')
          .select('round1_score, status')
          .eq('id', assessmentId)
          .single();

        if (assessmentError) {
          console.error('Error fetching assessment:', assessmentError);
          throw assessmentError;
        }

        console.log('Assessment data:', assessmentData);

        // If Round 1 is already completed, redirect to Round 2
        if (assessmentData.round1_score !== null) {
          console.log('Round 1 already completed, redirecting to Round 2');
          showToast('Round 1 already completed. Proceeding to Round 2.', 'info');
          navigate(`/assessment/${assessmentId}/round2`);
          return;
        }

        const { data, error } = await supabase
          .from('questions')
          .select('*')
          .eq('question_type', 'aptitude')
          .limit(10);

        if (error) {
          console.error('Error fetching questions:', error);
          throw error;
        }
        
        if (!data || data.length === 0) {
          throw new Error('No aptitude questions found. Please contact administrator.');
        }
        
        console.log('Questions loaded:', data.length);
        setQuestions(data);
        showToast('Round 1: Aptitude Test loaded', 'info');
      } catch (error: any) {
        console.error('Error in fetchQuestions:', error);
        showToast(error.message || 'Failed to load questions', 'error');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [assessmentId, navigate, showToast]);

  // Timer effect with proper cleanup
  useEffect(() => {
    if (timeRemaining <= 0 && !showResults && !submitting && !round1Completed) {
      console.log('Timer expired, auto-submitting Round 1');
      handleSubmitRound();
      return;
    }

    if (!showResults && !round1Completed) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            console.log('Timer reached zero');
          }
          return newTime;
        });
      }, 1000);

      return () => {
        console.log('Cleaning up timer');
        clearInterval(timer);
      };
    }
  }, [timeRemaining, showResults, submitting, round1Completed]);

  const handleAnswerSelect = (questionId: string, answer: string) => {
    console.log('Answer selected:', { questionId, answer });
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      const newIndex = currentQuestionIndex + 1;
      console.log('Moving to next question:', newIndex);
      setCurrentQuestionIndex(newIndex);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      const newIndex = currentQuestionIndex - 1;
      console.log('Moving to previous question:', newIndex);
      setCurrentQuestionIndex(newIndex);
    }
  };

  const handleSubmitRound = async () => {
    if (submitting || round1Completed) {
      console.log('Submit already in progress or completed');
      return;
    }
    
    try {
      console.log('Starting Round 1 submission');
      setSubmitting(true);
      showToast('Submitting Round 1...', 'info');

      // Validate assessment ID
      if (!assessmentId) {
        throw new Error('Assessment ID is missing');
      }

      // Calculate results before saving
      const correctAnswers = questions.filter(q => selectedAnswers[q.id] === q.correct_answer).length;
      const results = quickCalculateResults(correctAnswers, questions.length, 3);
      
      console.log('Round 1 results calculated:', {
        correctAnswers,
        totalQuestions: questions.length,
        results
      });

      // Save responses
      const responses = questions.map((question) => ({
        assessment_id: assessmentId,
        question_id: question.id,
        selected_answer: selectedAnswers[question.id] || '',
        is_correct: selectedAnswers[question.id] === question.correct_answer,
        marks_obtained: selectedAnswers[question.id] === question.correct_answer ? question.marks : 0,
      }));

      console.log('Saving responses:', responses.length);

      const { error: responsesError } = await supabase
        .from('assessment_responses')
        .insert(responses);

      if (responsesError) {
        console.error('Error saving responses:', responsesError);
        throw responsesError;
      }

      // Calculate Round 1 score
      const totalMarks = responses.reduce((sum, response) => sum + response.marks_obtained, 0);
      console.log('Total marks for Round 1:', totalMarks);

      // Update assessment with Round 1 score
      const { error: updateError } = await supabase
        .from('assessments')
        .update({ round1_score: totalMarks })
        .eq('id', assessmentId);

      if (updateError) {
        console.error('Error updating assessment:', updateError);
        throw updateError;
      }

      // Set completion state
      setRound1Completed(true);
      setRoundResults(results);
      setShowResults(true);
      
      console.log('Round 1 completed successfully');
      showToast('Round 1 completed successfully!', 'success');
    } catch (error: any) {
      console.error('Error submitting Round 1:', error);
      showToast(error.message || 'Failed to submit Round 1', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinueToRound2 = () => {
    console.log('Navigating to Round 2:', assessmentId);
    
    if (!assessmentId) {
      console.error('Assessment ID missing for Round 2 navigation');
      showToast('Assessment ID is missing', 'error');
      return;
    }

    if (!round1Completed) {
      console.error('Round 1 not completed, cannot proceed to Round 2');
      showToast('Please complete Round 1 first', 'error');
      return;
    }

    try {
      const round2Path = `/assessment/${assessmentId}/round2`;
      console.log('Navigating to:', round2Path);
      navigate(round2Path);
    } catch (error) {
      console.error('Navigation error:', error);
      showToast('Failed to navigate to Round 2', 'error');
    }
  };

  // Debug: Log current state
  useEffect(() => {
    console.log('Round1 State Update:', {
      loading,
      submitting,
      showResults,
      round1Completed,
      questionsCount: questions.length,
      answersCount: Object.keys(selectedAnswers).length
    });
  }, [loading, submitting, showResults, round1Completed, questions.length, selectedAnswers]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading Round 1...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">No Questions Available</h1>
          <p className="text-gray-600 mb-6">
            No aptitude questions are currently available. Please contact the administrator.
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

  if (showResults && roundResults && round1Completed) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Round 1 Complete!</h1>
          <p className="text-gray-600">Here are your aptitude test results</p>
          <div className="mt-4 p-4 bg-primary-50 border border-primary-200 rounded-lg">
            <p className="text-sm text-primary-700">
              <strong>Note:</strong> Pass threshold is now 40% for coding challenges. 
              Your performance will be evaluated based on this updated criteria.
            </p>
          </div>
        </div>
        
        <TestResultsDisplay 
          results={{
            totalQuestions: questions.length,
            correctAnswers: questions.filter(q => selectedAnswers[q.id] === q.correct_answer).length,
            totalPoints: questions.length * 3,
            earnedPoints: questions.filter(q => selectedAnswers[q.id] === q.correct_answer).length * 3,
            percentage: roundResults.percentage,
            status: roundResults.status,
            breakdown: questions.map((question, index) => ({
              id: question.id,
              question: question.question_text,
              userAnswer: selectedAnswers[question.id] || 'No answer',
              correctAnswer: question.correct_answer,
              isCorrect: selectedAnswers[question.id] === question.correct_answer,
              points: 3
            })),
            errors: []
          }}
          className="mb-8"
        />

        <div className="text-center">
          <Button
            variant="primary"
            size="lg"
            onClick={handleContinueToRound2}
            disabled={submitting || !round1Completed}
            className="min-w-[200px]"
          >
            {submitting ? 'Processing...' : 'Continue to Round 2'}
          </Button>
          
          {/* Debug info in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-4 bg-gray-100 rounded text-sm text-left">
              <strong>Debug Info:</strong>
              <pre>{JSON.stringify({
                assessmentId,
                round1Completed,
                submitting,
                showResults
              }, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Round 1: Aptitude</h1>
            <p className="text-gray-600">General aptitude and reasoning questions</p>
            <p className="text-sm text-primary-600 mt-1">Pass threshold: 40% (Updated for coding challenges)</p>
          </div>
          <div className={`text-lg font-medium ${timeRemaining < 300 ? 'text-error-600' : 'text-primary-600'}`}>
            Time Remaining: {minutes}:{seconds.toString().padStart(2, '0')}
          </div>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-600">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
            <span className="text-sm text-gray-600">
              {Object.keys(selectedAnswers).length} of {questions.length} answered
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
            <div 
              className="bg-primary-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            />
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              {currentQuestion.question_text}
            </h2>
            <div className="space-y-3">
              {currentQuestion.options.map((option: string, index: number) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(currentQuestion.id, option)}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
                    selectedAnswers[currentQuestion.id] === option
                      ? 'border-primary-500 bg-primary-50 shadow-md'
                      : 'border-gray-200 hover:border-primary-200'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                      selectedAnswers[currentQuestion.id] === option
                        ? 'border-primary-500 bg-primary-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedAnswers[currentQuestion.id] === option && (
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

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>

          <div className="flex space-x-3">
            {currentQuestionIndex === questions.length - 1 ? (
              <Button
                variant="primary"
                onClick={handleSubmitRound}
                disabled={Object.keys(selectedAnswers).length === 0 || submitting || round1Completed}
                isLoading={submitting}
              >
                Submit Round 1
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleNextQuestion}
                disabled={currentQuestionIndex === questions.length - 1}
              >
                Next
              </Button>
            )}
          </div>
        </div>

        {/* Question navigation */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Question Navigation</h3>
          <div className="grid grid-cols-10 gap-2">
            {questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                  index === currentQuestionIndex
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
      </div>
    </div>
  );
};

export default Round1;