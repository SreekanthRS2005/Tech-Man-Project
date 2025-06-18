/**
 * Test Results Calculation Utilities
 * Handles score calculation, validation, and formatting for assessment results
 */

// Constants - Updated pass threshold to 40%
export const PASSING_THRESHOLD = 40;
export const MAX_PERCENTAGE = 100;
export const MIN_PERCENTAGE = 0;

// Types for better type safety
export interface TestQuestion {
  id: string;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  points: number;
}

export interface TestResults {
  totalQuestions: number;
  correctAnswers: number;
  totalPoints: number;
  earnedPoints: number;
  percentage: number;
  status: 'PASS' | 'FAIL';
  breakdown: TestQuestion[];
  errors: string[];
}

export interface CalculationInput {
  questions: TestQuestion[];
  totalPossiblePoints?: number;
}

/**
 * Validates input data for test calculation
 * @param input - The calculation input to validate
 * @returns Array of error messages, empty if valid
 */
export function validateCalculationInput(input: CalculationInput): string[] {
  const errors: string[] = [];

  // Check if input exists
  if (!input) {
    errors.push('Invalid input: calculation input is required');
    return errors;
  }

  // Check if questions array exists and is valid
  if (!input.questions) {
    errors.push('Invalid input: questions array is required');
    return errors;
  }

  if (!Array.isArray(input.questions)) {
    errors.push('Invalid input: questions must be an array');
    return errors;
  }

  if (input.questions.length === 0) {
    errors.push('Invalid input: at least one question is required');
    return errors;
  }

  // Validate each question
  input.questions.forEach((question, index) => {
    if (!question) {
      errors.push(`Invalid question at index ${index}: question is null or undefined`);
      return;
    }

    if (typeof question.points !== 'number' || question.points < 0) {
      errors.push(`Invalid question at index ${index}: points must be a non-negative number`);
    }

    if (typeof question.isCorrect !== 'boolean') {
      errors.push(`Invalid question at index ${index}: isCorrect must be a boolean`);
    }
  });

  return errors;
}

/**
 * Calculates the percentage score with proper error handling
 * @param earnedPoints - Points earned by the user
 * @param totalPoints - Total possible points
 * @returns Calculated percentage or 0 if invalid
 */
export function calculatePercentage(earnedPoints: number, totalPoints: number): number {
  // Validate inputs
  if (typeof earnedPoints !== 'number' || typeof totalPoints !== 'number') {
    return 0;
  }

  if (earnedPoints < 0 || totalPoints < 0) {
    return 0;
  }

  // Handle division by zero
  if (totalPoints === 0) {
    return 0;
  }

  // Calculate percentage
  const percentage = (earnedPoints / totalPoints) * MAX_PERCENTAGE;
  
  // Ensure percentage is within valid range
  return Math.max(MIN_PERCENTAGE, Math.min(MAX_PERCENTAGE, Math.round(percentage * 100) / 100));
}

/**
 * Determines pass/fail status based on percentage (40% threshold)
 * @param percentage - The calculated percentage score
 * @returns 'PASS' or 'FAIL' status
 */
export function determineStatus(percentage: number): 'PASS' | 'FAIL' {
  if (typeof percentage !== 'number' || isNaN(percentage)) {
    return 'FAIL';
  }
  
  return percentage >= PASSING_THRESHOLD ? 'PASS' : 'FAIL';
}

/**
 * Main function to calculate test results
 * @param input - The calculation input containing questions and optional total points
 * @returns Complete test results with error handling
 */
export function calculateTestResults(input: CalculationInput): TestResults {
  // Initialize default result structure
  const defaultResult: TestResults = {
    totalQuestions: 0,
    correctAnswers: 0,
    totalPoints: 0,
    earnedPoints: 0,
    percentage: 0,
    status: 'FAIL',
    breakdown: [],
    errors: []
  };

  try {
    // Validate input
    const validationErrors = validateCalculationInput(input);
    if (validationErrors.length > 0) {
      return {
        ...defaultResult,
        errors: validationErrors
      };
    }

    const { questions, totalPossiblePoints } = input;

    // Calculate totals
    let correctAnswers = 0;
    let earnedPoints = 0;
    let totalPoints = 0;

    // Process each question
    const processedQuestions: TestQuestion[] = questions.map((question, index) => {
      try {
        const points = Number(question.points) || 0;
        const isCorrect = Boolean(question.isCorrect);

        totalPoints += points;
        if (isCorrect) {
          correctAnswers++;
          earnedPoints += points;
        }

        return {
          ...question,
          points,
          isCorrect
        };
      } catch (error) {
        defaultResult.errors.push(`Error processing question ${index + 1}: ${error}`);
        return question;
      }
    });

    // Use provided total points if available, otherwise use calculated
    const finalTotalPoints = totalPossiblePoints || totalPoints;

    // Calculate percentage with error handling
    const percentage = calculatePercentage(earnedPoints, finalTotalPoints);
    
    // Determine status
    const status = determineStatus(percentage);

    // Return complete results
    return {
      totalQuestions: questions.length,
      correctAnswers,
      totalPoints: finalTotalPoints,
      earnedPoints,
      percentage,
      status,
      breakdown: processedQuestions,
      errors: defaultResult.errors
    };

  } catch (error) {
    return {
      ...defaultResult,
      errors: [`Unexpected error during calculation: ${error}`]
    };
  }
}

/**
 * Formats test results for display
 * @param results - The calculated test results
 * @returns Formatted display object
 */
export function formatTestResults(results: TestResults) {
  if (!results) {
    return {
      scoreText: 'Test Score: 0%',
      statusText: 'Status: FAIL',
      questionsText: 'Questions Correct: 0 out of 0',
      hasErrors: true,
      errorMessages: ['Invalid results data']
    };
  }

  const scoreText = `Test Score: ${results.percentage}%`;
  const statusText = `Status: ${results.status}`;
  const questionsText = `Questions Correct: ${results.correctAnswers} out of ${results.totalQuestions}`;
  const hasErrors = results.errors.length > 0;
  const errorMessages = results.errors;

  return {
    scoreText,
    statusText,
    questionsText,
    hasErrors,
    errorMessages,
    percentage: results.percentage,
    status: results.status,
    breakdown: results.breakdown
  };
}

/**
 * Quick calculation function for simple use cases
 * @param correctAnswers - Number of correct answers
 * @param totalQuestions - Total number of questions
 * @param pointsPerQuestion - Points per question (default: 1)
 * @returns Formatted results
 */
export function quickCalculateResults(
  correctAnswers: number, 
  totalQuestions: number, 
  pointsPerQuestion: number = 1
) {
  // Validate inputs
  if (typeof correctAnswers !== 'number' || typeof totalQuestions !== 'number' || typeof pointsPerQuestion !== 'number') {
    return formatTestResults({
      totalQuestions: 0,
      correctAnswers: 0,
      totalPoints: 0,
      earnedPoints: 0,
      percentage: 0,
      status: 'FAIL',
      breakdown: [],
      errors: ['Invalid input parameters: all parameters must be numbers']
    });
  }

  if (correctAnswers < 0 || totalQuestions <= 0 || pointsPerQuestion < 0) {
    return formatTestResults({
      totalQuestions: 0,
      correctAnswers: 0,
      totalPoints: 0,
      earnedPoints: 0,
      percentage: 0,
      status: 'FAIL',
      breakdown: [],
      errors: ['Invalid input values: correctAnswers and pointsPerQuestion must be non-negative, totalQuestions must be positive']
    });
  }

  if (correctAnswers > totalQuestions) {
    return formatTestResults({
      totalQuestions: 0,
      correctAnswers: 0,
      totalPoints: 0,
      earnedPoints: 0,
      percentage: 0,
      status: 'FAIL',
      breakdown: [],
      errors: ['Invalid input: correctAnswers cannot exceed totalQuestions']
    });
  }

  // Create mock questions for calculation
  const questions: TestQuestion[] = Array.from({ length: totalQuestions }, (_, index) => ({
    id: `q${index + 1}`,
    question: `Question ${index + 1}`,
    userAnswer: index < correctAnswers ? 'correct' : 'incorrect',
    correctAnswer: 'correct',
    isCorrect: index < correctAnswers,
    points: pointsPerQuestion
  }));

  const results = calculateTestResults({ questions });
  return formatTestResults(results);
}

/**
 * Analyzes code submission and provides feedback
 * @param code - User submitted code
 * @param language - Programming language
 * @param expectedOutput - Expected output for the problem
 * @returns Analysis result with feedback
 */
export function analyzeCodeSubmission(code: string, language: string, expectedOutput?: string) {
  const feedback: string[] = [];
  let hasErrors = false;
  let score = 0;

  // Basic syntax checks
  if (!code || code.trim().length === 0) {
    feedback.push("❌ No code submitted. Please write your solution.");
    hasErrors = true;
    return { score: 0, feedback, hasErrors };
  }

  // Language-specific analysis
  switch (language.toLowerCase()) {
    case 'javascript':
      if (!code.includes('function') && !code.includes('=>')) {
        feedback.push("⚠️ Consider defining a function to organize your solution.");
      }
      if (code.includes('console.log')) {
        feedback.push("✅ Good use of console.log for debugging/output.");
        score += 20;
      }
      if (code.includes('return')) {
        feedback.push("✅ Function returns a value - good practice.");
        score += 30;
      }
      break;

    case 'python':
      if (!code.includes('def ')) {
        feedback.push("⚠️ Consider defining a function using 'def' keyword.");
      }
      if (code.includes('print(')) {
        feedback.push("✅ Good use of print() for output.");
        score += 20;
      }
      if (code.includes('return')) {
        feedback.push("✅ Function returns a value - excellent!");
        score += 30;
      }
      break;

    case 'java':
      if (!code.includes('public') && !code.includes('class')) {
        feedback.push("⚠️ Java code should typically include class definition.");
      }
      if (code.includes('System.out.println')) {
        feedback.push("✅ Good use of System.out.println for output.");
        score += 20;
      }
      break;
  }

  // General code quality checks
  if (code.length > 50) {
    score += 20; // Substantial code
    feedback.push("✅ Substantial solution provided.");
  }

  if (code.includes('if') || code.includes('for') || code.includes('while')) {
    score += 20; // Logic implementation
    feedback.push("✅ Good use of control structures.");
  }

  if (code.includes('//') || code.includes('#') || code.includes('/*')) {
    score += 10; // Comments
    feedback.push("✅ Code includes comments - great for readability!");
  }

  // Provide encouraging feedback
  if (score === 0) {
    feedback.push("💡 Try adding some logic, functions, or output statements to improve your solution.");
  } else if (score < 50) {
    feedback.push("👍 Good start! Consider adding more functionality or error handling.");
  } else if (score < 80) {
    feedback.push("🎉 Well done! Your solution shows good programming practices.");
  } else {
    feedback.push("🌟 Excellent solution! Great use of programming concepts and best practices.");
  }

  return {
    score: Math.min(score, 100),
    feedback,
    hasErrors: score === 0
  };
}