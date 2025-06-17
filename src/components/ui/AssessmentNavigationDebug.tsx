import React from 'react';
import { useParams } from 'react-router-dom';
import { useAssessmentNavigation } from '../../hooks/useAssessmentNavigation';
import Button from './Button';
import { RefreshCw, Bug } from 'lucide-react';

interface AssessmentNavigationDebugProps {
  className?: string;
}

const AssessmentNavigationDebug: React.FC<AssessmentNavigationDebugProps> = ({ className }) => {
  const { assessmentId } = useParams();
  const {
    isLoading,
    canAccessRound1,
    canAccessRound2,
    canAccessResults,
    assessmentState,
    error,
    navigateToRound,
    navigateToResults,
    refreshAssessmentState,
  } = useAssessmentNavigation(assessmentId);

  // Only show in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className={`bg-gray-100 border border-gray-300 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Bug className="h-5 w-5 mr-2" />
          Navigation Debug Panel
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshAssessmentState}
          icon={<RefreshCw size={16} />}
          disabled={isLoading}
        >
          Refresh
        </Button>
      </div>

      {/* Assessment State */}
      <div className="mb-4">
        <h4 className="font-medium text-gray-800 mb-2">Assessment State:</h4>
        <div className="bg-white rounded p-3 text-sm">
          <pre className="whitespace-pre-wrap">
            {JSON.stringify(assessmentState, null, 2)}
          </pre>
        </div>
      </div>

      {/* Navigation Permissions */}
      <div className="mb-4">
        <h4 className="font-medium text-gray-800 mb-2">Navigation Permissions:</h4>
        <div className="grid grid-cols-3 gap-2">
          <div className={`p-2 rounded text-center text-sm ${
            canAccessRound1 ? 'bg-success-100 text-success-800' : 'bg-error-100 text-error-800'
          }`}>
            Round 1: {canAccessRound1 ? 'Accessible' : 'Blocked'}
          </div>
          <div className={`p-2 rounded text-center text-sm ${
            canAccessRound2 ? 'bg-success-100 text-success-800' : 'bg-error-100 text-error-800'
          }`}>
            Round 2: {canAccessRound2 ? 'Accessible' : 'Blocked'}
          </div>
          <div className={`p-2 rounded text-center text-sm ${
            canAccessResults ? 'bg-success-100 text-success-800' : 'bg-error-100 text-error-800'
          }`}>
            Results: {canAccessResults ? 'Accessible' : 'Blocked'}
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="mb-4">
        <h4 className="font-medium text-gray-800 mb-2">Test Navigation:</h4>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateToRound(1)}
            disabled={isLoading}
          >
            Go to Round 1
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateToRound(2)}
            disabled={isLoading}
          >
            Go to Round 2
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={navigateToResults}
            disabled={isLoading}
          >
            Go to Results
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4">
          <h4 className="font-medium text-error-800 mb-2">Error:</h4>
          <div className="bg-error-50 border border-error-200 rounded p-3 text-sm text-error-700">
            {error}
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500 mx-auto"></div>
          <p className="text-sm text-gray-600 mt-2">Validating navigation state...</p>
        </div>
      )}
    </div>
  );
};

export default AssessmentNavigationDebug;