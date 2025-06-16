import React from 'react';
import { CheckCircle, XCircle, Clock, Award, Target, TrendingUp, AlertCircle } from 'lucide-react';
import { SummaryReport, RoundResult } from '../../utils/summaryReportCalculations';
import { cn } from '../../utils/cn';

interface SummaryReportDisplayProps {
  report: SummaryReport;
  className?: string;
  showDetailedBreakdown?: boolean;
}

const SummaryReportDisplay: React.FC<SummaryReportDisplayProps> = ({
  report,
  className,
  showDetailedBreakdown = true
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASS':
        return <CheckCircle className="h-5 w-5 text-success-500" />;
      case 'FAIL':
        return <XCircle className="h-5 w-5 text-error-500" />;
      case 'INCOMPLETE':
        return <Clock className="h-5 w-5 text-warning-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PASS':
        return 'success';
      case 'FAIL':
        return 'error';
      case 'INCOMPLETE':
        return 'warning';
      default:
        return 'gray';
    }
  };

  return (
    <div className={cn('bg-white border border-gray-200 rounded-lg overflow-hidden', className)}>
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-50 to-secondary-50 border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Assessment Summary Report</h2>
            <p className="text-gray-600 mt-1">Detailed analysis of your performance</p>
          </div>
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg bg-${getStatusColor(report.overallStatus)}-100 border border-${getStatusColor(report.overallStatus)}-300`}>
            {getStatusIcon(report.overallStatus)}
            <span className={`font-bold text-${getStatusColor(report.overallStatus)}-800`}>
              {report.overallStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Overall Performance Metrics */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-primary-50 rounded-lg p-4 border border-primary-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-600">Overall Accuracy</p>
                <p className="text-2xl font-bold text-primary-900">{report.overallAccuracy}%</p>
                <p className="text-xs text-primary-700">Rounds passed / completed</p>
              </div>
              <Target className="h-8 w-8 text-primary-500" />
            </div>
          </div>

          <div className="bg-success-50 rounded-lg p-4 border border-success-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-success-600">Rounds Passed</p>
                <p className="text-2xl font-bold text-success-900">{report.totalRoundsPassed}</p>
                <p className="text-xs text-success-700">Out of {report.totalRoundsCompleted} completed</p>
              </div>
              <CheckCircle className="h-8 w-8 text-success-500" />
            </div>
          </div>

          <div className="bg-error-50 rounded-lg p-4 border border-error-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-error-600">Rounds Failed</p>
                <p className="text-2xl font-bold text-error-900">{report.totalRoundsFailed}</p>
                <p className="text-xs text-error-700">Need improvement</p>
              </div>
              <XCircle className="h-8 w-8 text-error-500" />
            </div>
          </div>

          <div className="bg-accent-50 rounded-lg p-4 border border-accent-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-accent-600">Total Score</p>
                <p className="text-2xl font-bold text-accent-900">{report.totalScore}</p>
                <p className="text-xs text-accent-700">Out of {report.maxPossibleScore} points</p>
              </div>
              <Award className="h-8 w-8 text-accent-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Round Summary Table */}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Round-by-Round Analysis</h3>
        
        {/* Summary Statistics */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900">{report.totalRoundsCompleted}</p>
              <p className="text-sm text-gray-600">Total Rounds Completed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-success-600">{report.totalRoundsPassed}</p>
              <p className="text-sm text-gray-600">Number of Successful Passes</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-error-600">{report.totalRoundsFailed}</p>
              <p className="text-sm text-gray-600">Number of Failures</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary-600">{report.overallAccuracy}%</p>
              <p className="text-sm text-gray-600">Final Accuracy Score</p>
            </div>
          </div>
        </div>

        {/* Detailed Round Results Table */}
        {showDetailedBreakdown && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Round
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Percentage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Questions Correct
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completed
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {report.rounds.map((round) => (
                  <tr key={round.roundNumber} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          Round {round.roundNumber}
                        </div>
                        <div className="text-sm text-gray-500 ml-2">
                          ({round.roundName})
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(round.status)}
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${getStatusColor(round.status)}-100 text-${getStatusColor(round.status)}-800`}>
                          {round.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {round.score} / {round.maxScore}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">{round.percentage}%</div>
                        <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full bg-${getStatusColor(round.status)}-500`}
                            style={{ width: `${Math.min(round.percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {round.questionsCorrect} / {round.totalQuestions}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {round.completedAt ? new Date(round.completedAt).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Bullet Point Summary */}
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Summary Points:</h4>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-center">
              <span className="w-2 h-2 bg-primary-500 rounded-full mr-3"></span>
              <strong>Overall Accuracy:</strong> {report.overallAccuracy}% (number of passes / total rounds)
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-success-500 rounded-full mr-3"></span>
              <strong>Individual Round Results:</strong> {report.rounds.map(r => `Round ${r.roundNumber}: ${r.status}`).join(', ')}
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-accent-500 rounded-full mr-3"></span>
              <strong>Final Accuracy Score:</strong> {report.overallAccuracy}% based on {report.totalRoundsPassed} passes out of {report.totalRoundsCompleted} completed rounds
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-secondary-500 rounded-full mr-3"></span>
              <strong>Total Performance:</strong> {report.totalScore} points earned out of {report.maxPossibleScore} possible points
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SummaryReportDisplay;