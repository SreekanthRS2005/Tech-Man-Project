import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useToast } from '../../hooks/useToast';
import { useNotifications } from '../../hooks/useNotifications';
import supabase from '../../lib/supabase';
import { Assessment, AssessmentResponse, CodingSubmission } from '../../types/assessment';
import { calculateTestResults, TestQuestion } from '../../utils/testCalculations';
import { generateSummaryReport, formatSummaryReport } from '../../utils/summaryReportCalculations';
import TestResultsDisplay from '../../components/ui/TestResultsDisplay';
import SummaryReportDisplay from '../../components/ui/SummaryReportDisplay';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Button from '../../components/ui/Button';
import { Download, FileText } from 'lucide-react';

const Results = () => {
  const { assessmentId } = useParams();
  const { showToast } = useToast();
  const { addNotification } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [responses, setResponses] = useState<AssessmentResponse[]>([]);
  const [submissions, setSubmissions] = useState<CodingSubmission[]>([]);
  const [showSummaryReport, setShowSummaryReport] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        // Fetch assessment details
        const { data: assessmentData, error: assessmentError } = await supabase
          .from('assessments')
          .select(`
            *,
            domains (
              name
            )
          `)
          .eq('id', assessmentId)
          .single();

        if (assessmentError) throw assessmentError;
        setAssessment(assessmentData);

        // Fetch responses
        const { data: responsesData, error: responsesError } = await supabase
          .from('assessment_responses')
          .select(`
            *,
            questions (
              question_text,
              correct_answer,
              marks,
              question_type
            )
          `)
          .eq('assessment_id', assessmentId);

        if (responsesError) throw responsesError;
        setResponses(responsesData);

        // Fetch coding submissions
        const { data: submissionsData, error: submissionsError } = await supabase
          .from('coding_submissions')
          .select(`
            *,
            coding_problems (
              title,
              marks
            )
          `)
          .eq('assessment_id', assessmentId);

        if (submissionsError) throw submissionsError;
        setSubmissions(submissionsData);

        // Add completion notification if assessment is completed
        if (assessmentData.status === 'completed' && assessmentData.total_score !== null) {
          const percentage = calculatePercentage(assessmentData.total_score, 100);
          addNotification({
            type: percentage >= 70 ? 'success' : 'warning',
            title: 'Assessment Completed!',
            message: `You have successfully completed the ${assessmentData.domains?.name} assessment with a score of ${percentage}%.`,
            data: {
              score: percentage,
              domain: assessmentData.domains?.name,
              assessmentId: assessmentData.id,
              status: percentage >= 70 ? 'PASS' : 'FAIL',
              timestamp: new Date().toISOString()
            }
          });
        }
      } catch (error: any) {
        showToast(error.message, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [assessmentId, addNotification]);

  const calculatePercentage = (score: number, total: number) => {
    return ((score / total) * 100).toFixed(1);
  };

  // Calculate detailed results using our utility functions
  const calculateDetailedResults = () => {
    if (!responses.length && !submissions.length) {
      return null;
    }

    // Convert responses to TestQuestion format
    const mcqQuestions: TestQuestion[] = responses.map((response, index) => ({
      id: response.id,
      question: response.questions?.question_text || `Question ${index + 1}`,
      userAnswer: response.selected_answer,
      correctAnswer: response.questions?.correct_answer || '',
      isCorrect: response.is_correct,
      points: response.questions?.marks || 0
    }));

    // Convert coding submissions to TestQuestion format
    const codingQuestions: TestQuestion[] = submissions.map((submission, index) => ({
      id: submission.id,
      question: submission.coding_problems?.title || `Coding Problem ${index + 1}`,
      userAnswer: 'Code submitted',
      correctAnswer: 'Correct implementation',
      isCorrect: submission.marks_obtained > 0,
      points: submission.coding_problems?.marks || 0
    }));

    // Combine all questions
    const allQuestions = [...mcqQuestions, ...codingQuestions];

    return calculateTestResults({ questions: allQuestions });
  };

  // Generate summary report
  const generateReport = () => {
    if (!assessment) return null;
    
    return generateSummaryReport(
      assessment.round1_score,
      assessment.round2_score,
      responses,
      responses.filter(r => r.questions?.question_type === 'technical'),
      submissions
    );
  };

  // Download summary report as text file
  const downloadSummaryReport = () => {
    const report = generateReport();
    if (!report) return;

    const formattedReport = formatSummaryReport(report);
    const blob = new Blob([formattedReport], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assessment-summary-${assessmentId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Summary report downloaded successfully', 'success');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Assessment Not Found</h1>
          <p className="text-gray-600 mb-6">
            The assessment you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const detailedResults = calculateDetailedResults();
  const summaryReport = generateReport();

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Assessment Results</h1>
            <p className="text-lg text-gray-600">
              Domain: {assessment.domains?.name}
            </p>
          </div>
          <div className="flex space-x-3">
            <Button
              variant={showSummaryReport ? "outline" : "primary"}
              onClick={() => setShowSummaryReport(!showSummaryReport)}
              icon={<FileText size={18} />}
            >
              {showSummaryReport ? 'Hide Summary' : 'Show Summary Report'}
            </Button>
            {summaryReport && (
              <Button
                variant="secondary"
                onClick={downloadSummaryReport}
                icon={<Download size={18} />}
              >
                Download Report
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Summary Report Display */}
      {showSummaryReport && summaryReport && (
        <div className="mb-8">
          <SummaryReportDisplay 
            report={summaryReport}
            showDetailedBreakdown={true}
            className="shadow-lg"
          />
        </div>
      )}

      {/* Main Results Display */}
      {detailedResults && (
        <div className="mb-8">
          <TestResultsDisplay 
            results={detailedResults}
            showBreakdown={true}
            className="shadow-lg"
          />
        </div>
      )}

      {/* Legacy Score Cards for Backward Compatibility */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Round 1</h2>
          <p className="text-3xl font-bold text-primary-600">
            {calculatePercentage(assessment.round1_score || 0, 30)}%
          </p>
          <p className="text-sm text-gray-600">Aptitude Score</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Round 2</h2>
          <p className="text-3xl font-bold text-primary-600">
            {calculatePercentage(assessment.round2_score || 0, 70)}%
          </p>
          <p className="text-sm text-gray-600">Technical Score</p>
        </div>

        <div className="bg-primary-50 rounded-lg p-6 text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Overall</h2>
          <p className="text-3xl font-bold text-primary-600">
            {calculatePercentage(assessment.total_score || 0, 100)}%
          </p>
          <p className="text-sm text-gray-600">Total Score</p>
        </div>
      </div>

      {/* Detailed Breakdown Sections */}
      <div className="space-y-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Round 1: Aptitude Questions</h2>
          <div className="space-y-4">
            {responses
              .filter((response) => response.questions?.question_type === 'aptitude')
              .map((response, index) => (
                <div
                  key={response.id}
                  className={`p-4 rounded-lg ${
                    response.is_correct ? 'bg-success-50 border border-success-200' : 'bg-error-50 border border-error-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        Question {index + 1}
                      </h3>
                      <p className="text-gray-600 mt-1">
                        {response.questions?.question_text}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Your answer: {response.selected_answer}
                      </p>
                      {!response.is_correct && (
                        <p className="text-sm text-gray-500">
                          Correct answer: {response.questions?.correct_answer}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${
                        response.is_correct ? 'text-success-600' : 'text-error-600'
                      }`}>
                        {response.is_correct ? 'Correct' : 'Incorrect'}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {response.marks_obtained} / {response.questions?.marks} marks
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Round 2: Technical Assessment</h2>
          
          <h3 className="text-lg font-medium text-gray-900 mb-3">Multiple Choice Questions</h3>
          <div className="space-y-4 mb-6">
            {responses
              .filter((response) => response.questions?.question_type === 'technical')
              .map((response, index) => (
                <div
                  key={response.id}
                  className={`p-4 rounded-lg ${
                    response.is_correct ? 'bg-success-50 border border-success-200' : 'bg-error-50 border border-error-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        Question {index + 1}
                      </h3>
                      <p className="text-gray-600 mt-1">
                        {response.questions?.question_text}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Your answer: {response.selected_answer}
                      </p>
                      {!response.is_correct && (
                        <p className="text-sm text-gray-500">
                          Correct answer: {response.questions?.correct_answer}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${
                        response.is_correct ? 'text-success-600' : 'text-error-600'
                      }`}>
                        {response.is_correct ? 'Correct' : 'Incorrect'}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {response.marks_obtained} / {response.questions?.marks} marks
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>

          <h3 className="text-lg font-medium text-gray-900 mb-3">Coding Problems</h3>
          <div className="space-y-4">
            {submissions.map((submission, index) => (
              <div
                key={submission.id}
                className="p-4 rounded-lg bg-gray-50 border border-gray-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">
                      Problem {index + 1}: {submission.coding_problems?.title}
                    </h3>
                    <div className="mt-2">
                      <h4 className="text-sm font-medium text-gray-900">Your Solution:</h4>
                      <pre className="mt-1 p-3 bg-gray-800 text-white rounded-md overflow-x-auto text-sm">
                        <code>{submission.code_solution}</code>
                      </pre>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm text-gray-600">
                      {submission.marks_obtained} / {submission.coding_problems?.marks} marks
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link
          to="/dashboard"
          className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default Results;