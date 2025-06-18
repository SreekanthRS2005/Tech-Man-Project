/**
 * Summary Report Calculation Utilities
 * Handles round-by-round analysis and overall accuracy calculations
 */

export interface RoundResult {
  roundNumber: number;
  roundName: string;
  status: 'PASS' | 'FAIL' | 'NOT_COMPLETED';
  score: number;
  maxScore: number;
  percentage: number;
  questionsCorrect: number;
  totalQuestions: number;
  completedAt?: string;
}

export interface SummaryReport {
  overallAccuracy: number;
  totalRoundsCompleted: number;
  totalRoundsPassed: number;
  totalRoundsFailed: number;
  rounds: RoundResult[];
  overallStatus: 'PASS' | 'FAIL' | 'INCOMPLETE';
  totalScore: number;
  maxPossibleScore: number;
  completionRate: number;
}

// Updated passing threshold to 40%
const PASSING_THRESHOLD = 40;

/**
 * Calculates the status for a round based on percentage
 */
export function calculateRoundStatus(percentage: number): 'PASS' | 'FAIL' {
  return percentage >= PASSING_THRESHOLD ? 'PASS' : 'FAIL';
}

/**
 * Calculates overall accuracy as percentage of rounds passed
 */
export function calculateOverallAccuracy(passedRounds: number, completedRounds: number): number {
  if (completedRounds === 0) return 0;
  return Math.round((passedRounds / completedRounds) * 100 * 100) / 100;
}

/**
 * Generates a comprehensive summary report from assessment data
 */
export function generateSummaryReport(
  round1Score: number | null,
  round2Score: number | null,
  round1Responses: any[],
  round2Responses: any[],
  codingSubmissions: any[]
): SummaryReport {
  const rounds: RoundResult[] = [];
  
  // Round 1 Analysis
  if (round1Score !== null && round1Responses.length > 0) {
    const round1Questions = round1Responses.filter(r => r.questions?.question_type === 'aptitude');
    const round1Correct = round1Questions.filter(r => r.is_correct).length;
    const round1Total = round1Questions.length;
    const round1Percentage = round1Total > 0 ? (round1Correct / round1Total) * 100 : 0;
    
    rounds.push({
      roundNumber: 1,
      roundName: 'Aptitude Round',
      status: calculateRoundStatus(round1Percentage),
      score: round1Score,
      maxScore: round1Total * 3, // Assuming 3 points per aptitude question
      percentage: Math.round(round1Percentage * 100) / 100,
      questionsCorrect: round1Correct,
      totalQuestions: round1Total,
      completedAt: round1Responses[0]?.created_at
    });
  }

  // Round 2 Analysis
  if (round2Score !== null && (round2Responses.length > 0 || codingSubmissions.length > 0)) {
    const technicalQuestions = round2Responses.filter(r => r.questions?.question_type === 'technical');
    const technicalCorrect = technicalQuestions.filter(r => r.is_correct).length;
    const codingCorrect = codingSubmissions.filter(s => s.marks_obtained > 0).length;
    
    const totalRound2Questions = technicalQuestions.length + codingSubmissions.length;
    const totalRound2Correct = technicalCorrect + codingCorrect;
    const round2Percentage = totalRound2Questions > 0 ? (totalRound2Correct / totalRound2Questions) * 100 : 0;
    
    rounds.push({
      roundNumber: 2,
      roundName: 'Technical Round',
      status: calculateRoundStatus(round2Percentage),
      score: round2Score,
      maxScore: (technicalQuestions.length * 7) + (codingSubmissions.length * 17), // 7 for MCQ, 17 for coding
      percentage: Math.round(round2Percentage * 100) / 100,
      questionsCorrect: totalRound2Correct,
      totalQuestions: totalRound2Questions,
      completedAt: round2Responses[0]?.created_at || codingSubmissions[0]?.created_at
    });
  }

  // Calculate overall metrics
  const completedRounds = rounds.length;
  const passedRounds = rounds.filter(r => r.status === 'PASS').length;
  const failedRounds = rounds.filter(r => r.status === 'FAIL').length;
  const overallAccuracy = calculateOverallAccuracy(passedRounds, completedRounds);
  
  const totalScore = rounds.reduce((sum, round) => sum + round.score, 0);
  const maxPossibleScore = rounds.reduce((sum, round) => sum + round.maxScore, 0);
  const completionRate = completedRounds >= 2 ? 100 : (completedRounds / 2) * 100;
  
  // Determine overall status with 40% threshold
  let overallStatus: 'PASS' | 'FAIL' | 'INCOMPLETE' = 'INCOMPLETE';
  if (completedRounds >= 2) {
    const overallPercentage = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;
    overallStatus = overallPercentage >= PASSING_THRESHOLD ? 'PASS' : 'FAIL';
  }

  return {
    overallAccuracy,
    totalRoundsCompleted: completedRounds,
    totalRoundsPassed: passedRounds,
    totalRoundsFailed: failedRounds,
    rounds,
    overallStatus,
    totalScore,
    maxPossibleScore,
    completionRate
  };
}

/**
 * Formats the summary report for display
 */
export function formatSummaryReport(report: SummaryReport): string {
  const lines: string[] = [];
  
  lines.push('='.repeat(50));
  lines.push('CODING CHALLENGE ASSESSMENT REPORT');
  lines.push('='.repeat(50));
  lines.push('');
  
  // Overall Statistics
  lines.push('OVERALL PERFORMANCE:');
  lines.push(`• Overall Status: ${report.overallStatus}`);
  lines.push(`• Overall Accuracy: ${report.overallAccuracy}%`);
  lines.push(`• Total Score: ${report.totalScore}/${report.maxPossibleScore} points`);
  lines.push(`• Completion Rate: ${report.completionRate}%`);
  lines.push(`• Pass Threshold: 40% (Updated for coding challenges)`);
  lines.push('');
  
  // Round Summary
  lines.push('ROUND SUMMARY:');
  lines.push(`• Total Rounds Completed: ${report.totalRoundsCompleted}`);
  lines.push(`• Rounds Passed: ${report.totalRoundsPassed}`);
  lines.push(`• Rounds Failed: ${report.totalRoundsFailed}`);
  lines.push('');
  
  // Individual Round Results
  lines.push('INDIVIDUAL ROUND RESULTS:');
  lines.push('-'.repeat(30));
  
  report.rounds.forEach(round => {
    lines.push(`Round ${round.roundNumber}: ${round.roundName}`);
    lines.push(`  • Status: ${round.status}`);
    lines.push(`  • Score: ${round.score}/${round.maxScore} points (${round.percentage}%)`);
    lines.push(`  • Questions Correct: ${round.questionsCorrect}/${round.totalQuestions}`);
    if (round.completedAt) {
      lines.push(`  • Completed: ${new Date(round.completedAt).toLocaleDateString()}`);
    }
    lines.push('');
  });
  
  lines.push('='.repeat(50));
  lines.push('Note: Pass threshold updated to 40% for coding challenges');
  lines.push('='.repeat(50));
  
  return lines.join('\n');
}