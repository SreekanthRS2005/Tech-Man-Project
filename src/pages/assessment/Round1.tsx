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

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const { data, error } = await supabase
          .from('questions')
          .select('*')
          .eq('question_type', 'aptitude')
          .limit(10);

        if (error) throw error;
        
        if (!data || data.length === 0) {
          throw new Error('No aptitude questions found. Please contact administrator.');
        }
        
        setQuestions(data);
        showToast('Round 1: Aptitude Test loaded', 'info');
      } catch (error: any) {
        console.error('Error fetching questions:', error);
        showToast(error.message || 'Failed to load questions', 'error');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    if (assessmentId) {
      fetchQuestions();
    }
  }, [assessmentId, navigate, showToast]);

  // Timer effect
  useEffect(() => {
    if (timeRemaining <= 0 && !showResults && !submitting) {
      handleSubmitRound();
      return;
    }

    if (!showResults) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => prev - 1);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeRemaining, showResults, submitting]);

  const handleAnswerSelect = (questionId: string, answer: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmitRound = async () => {
    if (submitting) return;
    
    try {
      setSubmitting(true);
      showToast('Submitting Round 1...', 'info');

      // Calculate results before saving
      const correctAnswers = questions.filter(q => selectedAnswers[q.id] === q.correct_answer).length;
      const results = quickCalculateResults(correctAnswers, questions.length, 3);
      
      // Save responses
      const responses = questions.map((question) => ({
        assessment_id: assessmentId,
        question_id: question.id,
        selected_answer: selectedAnswers[question.id] || '',
        is_correct: selectedAnswers[question.id] === question.correct_answer,
        marks_obtained: selectedAnswers[question.id] === question.correct_answer ? question.marks : 0,
      }));

      const { error: responsesError } = await supabase
        .from('assessment_responses')
        .insert(responses);

      if (responsesError) throw responsesError;

      // Calculate Round 1 score
      const totalMarks = responses.reduce((sum, response) => sum + response.marks_obtained, 0);

      // Update assessment with Round 1 score
      const { error: updateError } = await supabase
        .from('assessments')
        .update({ round1_score: totalMarks })
        .eq('id', assessmentId);

      if (updateError) throw updateError;

      // Show results first
      setRoundResults(results);
      setShowResults(true);
      
      showToast('Round 1 completed successfully!', 'success');
    } catch (error: any) {
      console.error('Error submitting Round 1:', error);
      showToast(error.message || 'Failed to submit Round 1', 'error');
      setSubmitting(false);
    }
  };

  const handleContinueToRound2 = () => {
    navigate(`/assessment/${assessmentId}/round2`);
  };

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

  if (showResults && roundResults) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Round 1 Complete!</h1>
          <p className="text-gray-600">Here are your aptitude test results</p>
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
            disabled={submitting}
          >
            Continue to Round 2
          </Button>
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
                disabled={Object.keys(selectedAnswers).length === 0 || submitting}
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