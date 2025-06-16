import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Award, Target, TrendingUp } from 'lucide-react';
import { TestResults, formatTestResults } from '../../utils/testCalculations';
import { cn } from '../../utils/cn';

interface TestResultsDisplayProps {
  results: TestResults;
  className?: string;
  showBreakdown?: boolean;
  compact?: boolean;
}

const TestResultsDisplay: React.FC<TestResultsDisplayProps> = ({
  results,
  className,
  showBreakdown = true,
  compact = false
}) => {
  const formattedResults = formatTestResults(results);

  if (!results) {
    return (
      <div className={cn('bg-error-50 border border-error-200 rounded-lg p-4', className)}>
        <div className="flex items-center text-error-600">
          <XCircle className="h-5 w-5 mr-2" />
          <span className="font-medium text-error-800">Error: No results data available</span>
        </div>
      </div>
    );
  }

  // Error display
  if (formattedResults.hasErrors) {
    return (
      <div className={cn('bg-error-50 border border-error-200 rounded-lg p-4', className)}>
        <div className="flex items-center mb-3">
          <AlertTriangle className="h-5 w-5 text-error-600 mr-2" />
          <h3 className="font-medium text-error-800">Test Results Error</h3>
        </div>
        <div className="space-y-2">
          {formattedResults.errorMessages.map((error, index) => (
            <p key={index} className="text-sm text-error-700 bg-error-100 p-2 rounded">
              {error}
            </p>
          ))}
        </div>
      </div>
    );
  }

  const statusColor = results.status === 'PASS' ? 'success' : 'error';
  const StatusIcon = results.status === 'PASS' ? CheckCircle : XCircle;

  if (compact) {
    return (
      <div className={cn('bg-white border border-gray-200 rounded-lg p-4', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <StatusIcon className={`h-6 w-6 text-${statusColor}-500`} />
            <div>
              <p className="font-semibold text-gray-900">{formattedResults.scoreText}</p>
              <p className="text-sm text-gray-600">{formattedResults.questionsText}</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium bg-${statusColor}-100 text-${statusColor}-800`}>
            {results.status}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('bg-white border border-gray-200 rounded-lg overflow-hidden', className)}>
      {/* Header Section */}
      <div className={`bg-${statusColor}-50 border-b border-${statusColor}-200 p-6`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-full bg-${statusColor}-100`}>
              <StatusIcon className={`h-8 w-8 text-${statusColor}-600`} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Test Results</h2>
              <p className="text-gray-600">Assessment completed successfully</p>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-lg bg-${statusColor}-100 border border-${statusColor}-300`}>
            <span className={`text-lg font-bold text-${statusColor}-800`}>
              {results.status}
            </span>
          </div>
        </div>
      </div>

      {/* Main Results Section */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Score Card */}
          <div className="bg-primary-50 rounded-lg p-4 border border-primary-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-600">Overall Score</p>
                <p className="text-3xl font-bold text-primary-900">{results.percentage}%</p>
              </div>
              <Award className="h-8 w-8 text-primary-500" />
            </div>
          </div>

          {/* Accuracy Card */}
          <div className="bg-accent-50 rounded-lg p-4 border border-accent-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-accent-600">Accuracy</p>
                <p className="text-3xl font-bold text-accent-900">
                  {results.totalQuestions > 0 ? Math.round((results.correctAnswers / results.totalQuestions) * 100) : 0}%
                </p>
              </div>
              <Target className="h-8 w-8 text-accent-500" />
            </div>
          </div>

          {/* Performance Card */}
          <div className="bg-secondary-50 rounded-lg p-4 border border-secondary-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Questions Correct</p>
                <p className="text-3xl font-bold text-secondary-900">
                  {results.correctAnswers}/{results.totalQuestions}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-secondary-500" />
            </div>
          </div>
        </div>

        {/* Detailed Information */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Questions:</span>
              <span className="font-medium text-gray-900">{results.totalQuestions}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Correct Answers:</span>
              <span className="font-medium text-gray-900">{results.correctAnswers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Points:</span>
              <span className="font-medium text-gray-900">{results.totalPoints}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Points Earned:</span>
              <span className="font-medium text-gray-900">{results.earnedPoints}</span>
            </div>
          </div>
        </div>

        {/* Question Breakdown */}
        {showBreakdown && results.breakdown && results.breakdown.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Question Breakdown</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {results.breakdown.map((question, index) => (
                <div
                  key={question.id || index}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg border',
                    question.isCorrect
                      ? 'bg-success-50 border-success-200'
                      : 'bg-error-50 border-error-200'
                  )}
                >
                  <div className="flex items-center space-x-3">
                    {question.isCorrect ? (
                      <CheckCircle className="h-5 w-5 text-success-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-error-500" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">Question {index + 1}</p>
                      <p className="text-sm text-gray-600">
                        Your answer: {question.userAnswer || 'No answer'}
                      </p>
                      {!question.isCorrect && (
                        <p className="text-sm text-gray-500">
                          Correct answer: {question.correctAnswer}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      {question.isCorrect ? question.points : 0}/{question.points}
                    </p>
                    <p className="text-xs text-gray-500">points</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer with formatted text */}
      <div className="bg-gray-50 border-t border-gray-200 p-4">
        <div className="text-center space-y-1">
          <p className="text-lg font-semibold text-gray-900">{formattedResults.scoreText}</p>
          <p className={`font-medium text-${statusColor}-700`}>{formattedResults.statusText}</p>
          <p className="text-sm text-gray-600">{formattedResults.questionsText}</p>
        </div>
      </div>
    </div>
  );
};

export default TestResultsDisplay;