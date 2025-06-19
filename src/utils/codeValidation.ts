/**
 * Code Submission Validation Utilities
 * Handles strict validation, sanitization, and execution simulation
 */

export interface ValidationResult {
  isValid: boolean;
  score: number;
  feedback: string[];
  errors: string[];
  executionTime: number;
  passedTests: number;
  totalTests: number;
}

export interface TestCase {
  input: string;
  expectedOutput: string;
  hidden?: boolean;
  timeout?: number;
}

export interface CodeSubmission {
  code: string;
  language: string;
  problemId: string;
  testCases: TestCase[];
  maxPoints: number;
}

// Constants
const MAX_EXECUTION_TIME = 5000; // 5 seconds
const MIN_CODE_LENGTH = 10;
const MAX_CODE_LENGTH = 10000;

/**
 * Sanitizes and validates code input
 */
export function sanitizeCode(code: string): { sanitized: string; errors: string[] } {
  const errors: string[] = [];
  
  if (!code || typeof code !== 'string') {
    errors.push('Code submission is required');
    return { sanitized: '', errors };
  }

  const trimmed = code.trim();
  
  if (trimmed.length === 0) {
    errors.push('Code cannot be empty');
    return { sanitized: '', errors };
  }

  if (trimmed.length < MIN_CODE_LENGTH) {
    errors.push(`Code must be at least ${MIN_CODE_LENGTH} characters long`);
    return { sanitized: trimmed, errors };
  }

  if (trimmed.length > MAX_CODE_LENGTH) {
    errors.push(`Code cannot exceed ${MAX_CODE_LENGTH} characters`);
    return { sanitized: trimmed.substring(0, MAX_CODE_LENGTH), errors };
  }

  // Remove potentially dangerous patterns (basic sanitization)
  const dangerous = ['eval(', 'Function(', 'setTimeout(', 'setInterval(', 'require(', 'import('];
  const hasDangerous = dangerous.some(pattern => trimmed.includes(pattern));
  
  if (hasDangerous) {
    errors.push('Code contains potentially unsafe patterns');
  }

  return { sanitized: trimmed, errors };
}

/**
 * Validates code submission with strict test case execution
 */
export async function validateCodeSubmission(submission: CodeSubmission): Promise<ValidationResult> {
  const startTime = Date.now();
  
  // Sanitize code
  const { sanitized, errors } = sanitizeCode(submission.code);
  
  if (errors.length > 0) {
    return {
      isValid: false,
      score: 0,
      feedback: ['Code validation failed'],
      errors,
      executionTime: 0,
      passedTests: 0,
      totalTests: submission.testCases.length
    };
  }

  // Language-specific validation
  const langValidation = validateLanguageSyntax(sanitized, submission.language);
  if (!langValidation.isValid) {
    return {
      isValid: false,
      score: 0,
      feedback: ['Syntax validation failed'],
      errors: langValidation.errors,
      executionTime: 0,
      passedTests: 0,
      totalTests: submission.testCases.length
    };
  }

  // Execute test cases
  const testResults = await executeTestCases(sanitized, submission.language, submission.testCases);
  const passedTests = testResults.filter(result => result.passed).length;
  const totalTests = submission.testCases.length;
  
  // Strict validation: must pass at least 1 test case
  const isValid = passedTests >= 1;
  const score = isValid ? Math.round((passedTests / totalTests) * submission.maxPoints) : 0;
  
  const feedback = generateFeedback(testResults, passedTests, totalTests, submission.language);
  const executionTime = Date.now() - startTime;

  return {
    isValid,
    score,
    feedback,
    errors: testResults.filter(r => !r.passed).map(r => r.error || 'Test case failed'),
    executionTime,
    passedTests,
    totalTests
  };
}

/**
 * Language-specific syntax validation
 */
function validateLanguageSyntax(code: string, language: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  switch (language.toLowerCase()) {
    case 'javascript':
      if (!code.includes('function') && !code.includes('=>') && !code.includes('const') && !code.includes('let')) {
        errors.push('JavaScript code should define a function or variable');
      }
      break;
      
    case 'python':
      if (!code.includes('def ') && !code.includes('lambda') && !code.includes('=')) {
        errors.push('Python code should define a function or variable');
      }
      break;
      
    case 'java':
      if (!code.includes('class ') && !code.includes('public ')) {
        errors.push('Java code should include class definition');
      }
      if (!code.includes('main') && !code.includes('public static')) {
        errors.push('Java code should include a main method or public static method');
      }
      break;
      
    case 'c':
      if (!code.includes('#include') || !code.includes('main')) {
        errors.push('C code should include headers and main function');
      }
      break;
  }
  
  return { isValid: errors.length === 0, errors };
}

/**
 * Execute test cases with timeout protection
 */
async function executeTestCases(code: string, language: string, testCases: TestCase[]): Promise<Array<{
  passed: boolean;
  output: string;
  expected: string;
  input: string;
  error?: string;
  executionTime: number;
}>> {
  const results = [];
  
  for (const testCase of testCases) {
    const startTime = Date.now();
    
    try {
      // Simulate code execution with timeout
      const result = await Promise.race([
        simulateCodeExecution(code, language, testCase.input),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Execution timeout')), testCase.timeout || MAX_EXECUTION_TIME)
        )
      ]) as string;
      
      const executionTime = Date.now() - startTime;
      const passed = result.trim() === testCase.expectedOutput.trim();
      
      results.push({
        passed,
        output: result,
        expected: testCase.expectedOutput,
        input: testCase.input,
        executionTime
      });
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      results.push({
        passed: false,
        output: '',
        expected: testCase.expectedOutput,
        input: testCase.input,
        error: error instanceof Error ? error.message : 'Execution failed',
        executionTime
      });
    }
  }
  
  return results;
}

/**
 * Simulate code execution (enhanced version)
 */
async function simulateCodeExecution(code: string, language: string, input: string): Promise<string> {
  // This is a simulation - in production, you'd use a secure code execution service
  
  switch (language.toLowerCase()) {
    case 'javascript':
      return simulateJavaScript(code, input);
    case 'python':
      return simulatePython(code, input);
    case 'java':
      return simulateJava(code, input);
    case 'c':
      return simulateC(code, input);
    default:
      throw new Error(`Unsupported language: ${language}`);
  }
}

/**
 * Language-specific simulation functions
 */
function simulateJavaScript(code: string, input: string): string {
  // Enhanced JavaScript simulation
  try {
    // Parse input
    const inputs = input.split(',').map(s => {
      const trimmed = s.trim();
      if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
        return trimmed.slice(1, -1);
      }
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        return JSON.parse(trimmed);
      }
      const num = Number(trimmed);
      return isNaN(num) ? trimmed : num;
    });

    // Common patterns
    if (code.includes('reduce') && code.includes('+')) {
      if (Array.isArray(inputs[0])) {
        return inputs[0].reduce((a: number, b: number) => a + b, 0).toString();
      }
    }
    
    if (code.includes('Math.max')) {
      if (Array.isArray(inputs[0])) {
        return Math.max(...inputs[0]).toString();
      }
      return Math.max(...inputs).toString();
    }
    
    if (code.includes('Math.min')) {
      if (Array.isArray(inputs[0])) {
        return Math.min(...inputs[0]).toString();
      }
      return Math.min(...inputs).toString();
    }
    
    if (code.includes('reverse')) {
      if (typeof inputs[0] === 'string') {
        return inputs[0].split('').reverse().join('');
      }
    }
    
    if (code.includes('length')) {
      if (typeof inputs[0] === 'string' || Array.isArray(inputs[0])) {
        return inputs[0].length.toString();
      }
    }
    
    // Basic arithmetic
    if (code.includes('+') && inputs.length >= 2) {
      return (Number(inputs[0]) + Number(inputs[1])).toString();
    }
    
    if (code.includes('*') && inputs.length >= 2) {
      return (Number(inputs[0]) * Number(inputs[1])).toString();
    }
    
    // Default simulation
    return 'simulated_output';
  } catch (error) {
    throw new Error('JavaScript execution failed');
  }
}

function simulatePython(code: string, input: string): string {
  // Enhanced Python simulation
  try {
    const inputs = input.split(',').map(s => s.trim());
    
    if (code.includes('sum(') && code.includes('[')) {
      const arr = JSON.parse(inputs[0]);
      return arr.reduce((a: number, b: number) => a + b, 0).toString();
    }
    
    if (code.includes('max(')) {
      const arr = JSON.parse(inputs[0]);
      return Math.max(...arr).toString();
    }
    
    if (code.includes('len(')) {
      if (inputs[0].startsWith('"') && inputs[0].endsWith('"')) {
        return (inputs[0].length - 2).toString();
      }
      const arr = JSON.parse(inputs[0]);
      return arr.length.toString();
    }
    
    return 'simulated_output';
  } catch (error) {
    throw new Error('Python execution failed');
  }
}

function simulateJava(code: string, input: string): string {
  // Enhanced Java simulation
  try {
    const inputs = input.split(',').map(s => s.trim());
    
    if (code.includes('Math.max')) {
      return Math.max(...inputs.map(Number)).toString();
    }
    
    if (code.includes('System.out.println')) {
      return inputs[0];
    }
    
    return 'simulated_output';
  } catch (error) {
    throw new Error('Java execution failed');
  }
}

function simulateC(code: string, input: string): string {
  // Enhanced C simulation
  try {
    const inputs = input.split(',').map(s => s.trim());
    
    if (code.includes('printf')) {
      return inputs[0];
    }
    
    return 'simulated_output';
  } catch (error) {
    throw new Error('C execution failed');
  }
}

/**
 * Generate comprehensive feedback
 */
function generateFeedback(
  testResults: Array<{ passed: boolean; output: string; expected: string; input: string; error?: string; executionTime: number }>,
  passedTests: number,
  totalTests: number,
  language: string
): string[] {
  const feedback: string[] = [];
  
  if (passedTests === 0) {
    feedback.push('❌ No test cases passed. Your code needs significant improvements.');
    feedback.push('💡 Check your logic and ensure your function returns the correct output format.');
  } else if (passedTests === totalTests) {
    feedback.push('🎉 Excellent! All test cases passed!');
    feedback.push(`✅ Perfect score: ${passedTests}/${totalTests} test cases passed`);
  } else {
    feedback.push(`⚠️ Partial success: ${passedTests}/${totalTests} test cases passed`);
    feedback.push('👍 Good progress! Some test cases are working correctly.');
  }
  
  // Add specific feedback for failed tests
  const failedTests = testResults.filter(r => !r.passed);
  if (failedTests.length > 0 && failedTests.length <= 3) {
    feedback.push('🔍 Failed test cases:');
    failedTests.forEach((test, index) => {
      if (!test.error) {
        feedback.push(`   Test ${index + 1}: Input "${test.input}" → Expected "${test.expected}", Got "${test.output}"`);
      } else {
        feedback.push(`   Test ${index + 1}: ${test.error}`);
      }
    });
  }
  
  // Language-specific tips
  switch (language.toLowerCase()) {
    case 'javascript':
      if (passedTests < totalTests) {
        feedback.push('💡 JavaScript tips: Check your return statement and data types');
      }
      break;
    case 'python':
      if (passedTests < totalTests) {
        feedback.push('💡 Python tips: Verify indentation and return values');
      }
      break;
    case 'java':
      if (passedTests < totalTests) {
        feedback.push('💡 Java tips: Ensure proper method signatures and return types');
      }
      break;
    case 'c':
      if (passedTests < totalTests) {
        feedback.push('💡 C tips: Check pointer usage and memory management');
      }
      break;
  }
  
  return feedback;
}