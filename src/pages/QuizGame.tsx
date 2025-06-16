import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, XCircle, Award, Target, TrendingUp, RotateCcw } from 'lucide-react';
import Button from '../components/ui/Button';
import { cn } from '../utils/cn';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
  round: number;
}

interface Answer {
  questionId: number;
  selectedAnswer: string;
  isCorrect: boolean;
  round: number;
}

interface RoundResult {
  round: number;
  score: number;
  totalQuestions: number;
  percentage: number;
  correctAnswers: Answer[];
  incorrectAnswers: Answer[];
}

interface GameResults {
  round1: RoundResult;
  round2: RoundResult;
  totalScore: number;
  totalQuestions: number;
  overallPercentage: number;
  performanceRating: string;
}

const QUIZ_QUESTIONS: Question[] = [
  // Round 1 Questions
  {
    id: 1,
    question: "What is the capital of France?",
    options: ["London", "Berlin", "Paris", "Madrid"],
    correctAnswer: "Paris",
    round: 1
  },
  {
    id: 2,
    question: "Which planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    correctAnswer: "Mars",
    round: 1
  },
  {
    id: 3,
    question: "What is 15 × 8?",
    options: ["110", "120", "130", "140"],
    correctAnswer: "120",
    round: 1
  },
  {
    id: 4,
    question: "Who painted the Mona Lisa?",
    options: ["Vincent van Gogh", "Pablo Picasso", "Leonardo da Vinci", "Michelangelo"],
    correctAnswer: "Leonardo da Vinci",
    round: 1
  },
  {
    id: 5,
    question: "What is the largest ocean on Earth?",
    options: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"],
    correctAnswer: "Pacific Ocean",
    round: 1
  },
  // Round 2 Questions
  {
    id: 6,
    question: "What is the chemical symbol for gold?",
    options: ["Go", "Gd", "Au", "Ag"],
    correctAnswer: "Au",
    round: 2
  },
  {
    id: 7,
    question: "In which year did World War II end?",
    options: ["1944", "1945", "1946", "1947"],
    correctAnswer: "1945",
    round: 2
  },
  {
    id: 8,
    question: "What is the square root of 144?",
    options: ["10", "11", "12", "13"],
    correctAnswer: "12",
    round: 2
  },
  {
    id: 9,
    question: "Which programming language is known for web development?",
    options: ["Python", "JavaScript", "C++", "Java"],
    correctAnswer: "JavaScript",
    round: 2
  },
  {
    id: 10,
    question: "What is the smallest prime number?",
    options: ["0", "1", "2", "3"],
    correctAnswer: "2",
    round: 2
  }
];

const QuizGame = () => {
  const navigate = useNavigate();
  const [currentRound, setCurrentRound] = useState<1 | 2>(1);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [gamePhase, setGamePhase] = useState<'playing' | 'round-transition' | 'results'>('playing');
  const [timeRemaining, setTimeRemaining] = useState(30); // 30 seconds per question
  const [gameResults, setGameResults] = useState<GameResults | null>(null);

  const currentQuestions = QUIZ_QUESTIONS.filter(q => q.round === currentRound);
  const currentQuestion = currentQuestions[currentQuestionIndex];

  // Timer effect
  useEffect(() => {
    if (gamePhase === 'playing' && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeRemaining === 0 && gamePhase === 'playing') {
      handleNextQuestion();
    }
  }, [timeRemaining, gamePhase]);

  // Reset timer when question changes
  useEffect(() => {
    setTimeRemaining(30);
  }, [currentQuestionIndex, currentRound]);

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleNextQuestion = () => {
    // Record the answer
    const newAnswer: Answer = {
      questionId: currentQuestion.id,
      selectedAnswer: selectedAnswer || '',
      isCorrect: selectedAnswer === currentQuestion.correctAnswer,
      round: currentRound
    };

    const updatedAnswers = [...answers, newAnswer];
    setAnswers(updatedAnswers);

    // Check if this is the last question of the round
    if (currentQuestionIndex === currentQuestions.length - 1) {
      if (currentRound === 1) {
        // Transition to Round 2
        setGamePhase('round-transition');
        setTimeout(() => {
          setCurrentRound(2);
          setCurrentQuestionIndex(0);
          setSelectedAnswer('');
          setGamePhase('playing');
        }, 2000);
      } else {
        // Game completed, calculate results
        calculateResults(updatedAnswers);
      }
    } else {
      // Move to next question
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer('');
    }
  };

  const calculateResults = (finalAnswers: Answer[]) => {
    const round1Answers = finalAnswers.filter(a => a.round === 1);
    const round2Answers = finalAnswers.filter(a => a.round === 2);

    const round1Result: RoundResult = {
      round: 1,
      score: round1Answers.filter(a => a.isCorrect).length,
      totalQuestions: 5,
      percentage: (round1Answers.filter(a => a.isCorrect).length / 5) * 100,
      correctAnswers: round1Answers.filter(a => a.isCorrect),
      incorrectAnswers: round1Answers.filter(a => !a.isCorrect)
    };

    const round2Result: RoundResult = {
      round: 2,
      score: round2Answers.filter(a => a.isCorrect).length,
      totalQuestions: 5,
      percentage: (round2Answers.filter(a => a.isCorrect).length / 5) * 100,
      correctAnswers: round2Answers.filter(a => a.isCorrect),
      incorrectAnswers: round2Answers.filter(a => !a.isCorrect)
    };

    const totalScore = round1Result.score + round2Result.score;
    const overallPercentage = (totalScore / 10) * 100;

    let performanceRating = '';
    if (overallPercentage >= 90) performanceRating = 'Excellent';
    else if (overallPercentage >= 70) performanceRating = 'Good';
    else if (overallPercentage >= 50) performanceRating = 'Average';
    else performanceRating = 'Need Improvement';

    const results: GameResults = {
      round1: round1Result,
      round2: round2Result,
      totalScore,
      totalQuestions: 10,
      overallPercentage,
      performanceRating
    };

    setGameResults(results);
    setGamePhase('results');
  };

  const getPerformanceColor = (rating: string) => {
    switch (rating) {
      case 'Excellent': return 'text-success-600';
      case 'Good': return 'text-primary-600';
      case 'Average': return 'text-warning-600';
      case 'Need Improvement': return 'text-error-600';
      default: return 'text-gray-600';
    }
  };

  const getPerformanceBgColor = (rating: string) => {
    switch (rating) {
      case 'Excellent': return 'bg-success-50 border-success-200';
      case 'Good': return 'bg-primary-50 border-primary-200';
      case 'Average': return 'bg-warning-50 border-warning-200';
      case 'Need Improvement': return 'bg-error-50 border-error-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const restartGame = () => {
    setCurrentRound(1);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setSelectedAnswer('');
    setGamePhase('playing');
    setGameResults(null);
  };

  if (gamePhase === 'round-transition') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center max-w-md mx-4">
          <div className="mb-6">
            <CheckCircle className="h-16 w-16 text-success-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Round 1 Complete!</h2>
            <p className="text-gray-600">Get ready for Round 2...</p>
          </div>
          <div className="animate-pulse">
            <div className="h-2 bg-primary-200 rounded-full overflow-hidden">
              <div className="h-full bg-primary-600 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (gamePhase === 'results' && gameResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-xl p-8 mb-6">
            <div className="text-center">
              <Award className="h-16 w-16 text-warning-500 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Quiz Complete!</h1>
              <p className="text-gray-600">Here's your detailed performance analysis</p>
            </div>
          </div>

          {/* Overall Performance */}
          <div className={`rounded-lg border-2 p-6 mb-6 ${getPerformanceBgColor(gameResults.performanceRating)}`}>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Overall Performance</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <Target className="h-8 w-8 text-primary-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{gameResults.totalScore}/10</p>
                  <p className="text-sm text-gray-600">Total Score</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <TrendingUp className="h-8 w-8 text-accent-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{gameResults.overallPercentage.toFixed(1)}%</p>
                  <p className="text-sm text-gray-600">Overall Percentage</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <Award className="h-8 w-8 text-warning-500 mx-auto mb-2" />
                  <p className={`text-xl font-bold ${getPerformanceColor(gameResults.performanceRating)}`}>
                    {gameResults.performanceRating}
                  </p>
                  <p className="text-sm text-gray-600">Performance Rating</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <CheckCircle className="h-8 w-8 text-success-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">2/2</p>
                  <p className="text-sm text-gray-600">Rounds Completed</p>
                </div>
              </div>
            </div>
          </div>

          {/* Round Results */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Round 1 Results */}
            <div className="bg-white rounded-lg shadow-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="bg-primary-100 text-primary-700 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">1</span>
                Round 1 Results
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Score:</span>
                  <span className="font-bold text-gray-900">{gameResults.round1.score}/5</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Percentage:</span>
                  <span className="font-bold text-gray-900">{gameResults.round1.percentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-primary-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${gameResults.round1.percentage}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Round 2 Results */}
            <div className="bg-white rounded-lg shadow-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="bg-secondary-100 text-secondary-700 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">2</span>
                Round 2 Results
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Score:</span>
                  <span className="font-bold text-gray-900">{gameResults.round2.score}/5</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Percentage:</span>
                  <span className="font-bold text-gray-900">{gameResults.round2.percentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-secondary-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${gameResults.round2.percentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Question Analysis */}
          <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Question Analysis</h3>
            
            {[1, 2].map(roundNum => {
              const roundResult = roundNum === 1 ? gameResults.round1 : gameResults.round2;
              const roundQuestions = QUIZ_QUESTIONS.filter(q => q.round === roundNum);
              
              return (
                <div key={roundNum} className="mb-8">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Round {roundNum}</h4>
                  <div className="space-y-3">
                    {roundQuestions.map((question, index) => {
                      const userAnswer = answers.find(a => a.questionId === question.id);
                      const isCorrect = userAnswer?.isCorrect || false;
                      
                      return (
                        <div 
                          key={question.id}
                          className={`p-4 rounded-lg border-2 ${
                            isCorrect 
                              ? 'bg-success-50 border-success-200' 
                              : 'bg-error-50 border-error-200'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center mb-2">
                                {isCorrect ? (
                                  <CheckCircle className="h-5 w-5 text-success-500 mr-2" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-error-500 mr-2" />
                                )}
                                <span className="font-medium text-gray-900">
                                  Question {index + 1}
                                </span>
                              </div>
                              <p className="text-gray-700 mb-2">{question.question}</p>
                              <div className="text-sm">
                                <p className="text-gray-600">
                                  <span className="font-medium">Your answer:</span> {userAnswer?.selectedAnswer || 'No answer'}
                                </p>
                                {!isCorrect && (
                                  <p className="text-gray-600">
                                    <span className="font-medium">Correct answer:</span> {question.correctAnswer}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                              isCorrect 
                                ? 'bg-success-100 text-success-800' 
                                : 'bg-error-100 text-error-800'
                            }`}>
                              {isCorrect ? 'Correct' : 'Incorrect'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="text-center space-x-4">
            <Button
              variant="primary"
              size="lg"
              onClick={restartGame}
              icon={<RotateCcw size={18} />}
            >
              Play Again
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('/dashboard')}
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Playing phase
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Quiz Game</h1>
              <p className="text-gray-600">Round {currentRound} of 2</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`flex items-center px-4 py-2 rounded-lg ${
                timeRemaining <= 10 ? 'bg-error-100 text-error-700' : 'bg-primary-100 text-primary-700'
              }`}>
                <Clock className="h-5 w-5 mr-2" />
                <span className="font-bold">{timeRemaining}s</span>
              </div>
              <div className="text-sm text-gray-600">
                Question {currentQuestionIndex + 1} of {currentQuestions.length}
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / currentQuestions.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            {currentQuestion.question}
          </h2>
          
          <div className="space-y-3 mb-8">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(option)}
                className={cn(
                  'w-full p-4 text-left rounded-lg border-2 transition-all duration-200 hover:shadow-md',
                  selectedAnswer === option
                    ? 'border-primary-500 bg-primary-50 shadow-md'
                    : 'border-gray-200 hover:border-primary-200'
                )}
              >
                <div className="flex items-center">
                  <div className={cn(
                    'w-4 h-4 rounded-full border-2 mr-3',
                    selectedAnswer === option
                      ? 'border-primary-500 bg-primary-500'
                      : 'border-gray-300'
                  )}>
                    {selectedAnswer === option && (
                      <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5" />
                    )}
                  </div>
                  <span className="text-gray-900">{option}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Round {currentRound} • Question {currentQuestionIndex + 1} of {currentQuestions.length}
            </div>
            <Button
              variant="primary"
              size="lg"
              onClick={handleNextQuestion}
              disabled={!selectedAnswer}
            >
              {currentQuestionIndex === currentQuestions.length - 1 
                ? (currentRound === 1 ? 'Continue to Round 2' : 'Finish Quiz')
                : 'Next Question'
              }
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizGame;