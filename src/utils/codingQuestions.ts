/**
 * Coding Questions Pool - 100 Questions for Coding Challenges
 * Organized by difficulty and programming concepts
 */

export interface CodingQuestion {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  inputExample: string;
  outputExample: string;
  testCases: Array<{
    input: string;
    expectedOutput: string;
    hidden?: boolean;
  }>;
  hints: string[];
  timeLimit: number; // in minutes
  points: number;
}

export const CODING_QUESTIONS_POOL: CodingQuestion[] = [
  // EASY QUESTIONS (1-40)
  {
    id: 'easy_001',
    title: 'Sum of Two Numbers',
    description: 'Write a function that takes two numbers and returns their sum.',
    difficulty: 'easy',
    category: 'Basic Math',
    inputExample: 'add(5, 3)',
    outputExample: '8',
    testCases: [
      { input: '5, 3', expectedOutput: '8' },
      { input: '10, -2', expectedOutput: '8' },
      { input: '0, 0', expectedOutput: '0', hidden: true },
      { input: '-5, -3', expectedOutput: '-8', hidden: true }
    ],
    hints: ['Use the + operator', 'Handle negative numbers'],
    timeLimit: 5,
    points: 10
  },
  {
    id: 'easy_002',
    title: 'Check Even or Odd',
    description: 'Write a function that determines if a number is even or odd.',
    difficulty: 'easy',
    category: 'Basic Logic',
    inputExample: 'isEven(4)',
    outputExample: 'true',
    testCases: [
      { input: '4', expectedOutput: 'true' },
      { input: '7', expectedOutput: 'false' },
      { input: '0', expectedOutput: 'true', hidden: true },
      { input: '-2', expectedOutput: 'true', hidden: true }
    ],
    hints: ['Use the modulo operator %', 'Even numbers are divisible by 2'],
    timeLimit: 5,
    points: 10
  },
  {
    id: 'easy_003',
    title: 'String Length',
    description: 'Write a function that returns the length of a string.',
    difficulty: 'easy',
    category: 'String Manipulation',
    inputExample: 'getLength("hello")',
    outputExample: '5',
    testCases: [
      { input: '"hello"', expectedOutput: '5' },
      { input: '""', expectedOutput: '0' },
      { input: '"a"', expectedOutput: '1', hidden: true },
      { input: '"programming"', expectedOutput: '11', hidden: true }
    ],
    hints: ['Use the length property', 'Handle empty strings'],
    timeLimit: 3,
    points: 8
  },
  {
    id: 'easy_004',
    title: 'Maximum of Two Numbers',
    description: 'Write a function that returns the larger of two numbers.',
    difficulty: 'easy',
    category: 'Basic Logic',
    inputExample: 'max(5, 8)',
    outputExample: '8',
    testCases: [
      { input: '5, 8', expectedOutput: '8' },
      { input: '10, 3', expectedOutput: '10' },
      { input: '7, 7', expectedOutput: '7', hidden: true },
      { input: '-5, -2', expectedOutput: '-2', hidden: true }
    ],
    hints: ['Use conditional statements', 'Consider equal numbers'],
    timeLimit: 5,
    points: 10
  },
  {
    id: 'easy_005',
    title: 'Reverse a String',
    description: 'Write a function that reverses a given string.',
    difficulty: 'easy',
    category: 'String Manipulation',
    inputExample: 'reverse("hello")',
    outputExample: '"olleh"',
    testCases: [
      { input: '"hello"', expectedOutput: '"olleh"' },
      { input: '"world"', expectedOutput: '"dlrow"' },
      { input: '"a"', expectedOutput: '"a"', hidden: true },
      { input: '""', expectedOutput: '""', hidden: true }
    ],
    hints: ['Convert to array, reverse, join back', 'Or use a loop'],
    timeLimit: 8,
    points: 12
  },
  // Continue with more easy questions...
  {
    id: 'easy_006',
    title: 'Count Vowels',
    description: 'Write a function that counts the number of vowels in a string.',
    difficulty: 'easy',
    category: 'String Manipulation',
    inputExample: 'countVowels("hello")',
    outputExample: '2',
    testCases: [
      { input: '"hello"', expectedOutput: '2' },
      { input: '"programming"', expectedOutput: '3' },
      { input: '"xyz"', expectedOutput: '0', hidden: true },
      { input: '"AEIOU"', expectedOutput: '5', hidden: true }
    ],
    hints: ['Check each character', 'Consider both uppercase and lowercase'],
    timeLimit: 10,
    points: 15
  },
  {
    id: 'easy_007',
    title: 'Factorial',
    description: 'Write a function that calculates the factorial of a number.',
    difficulty: 'easy',
    category: 'Math',
    inputExample: 'factorial(5)',
    outputExample: '120',
    testCases: [
      { input: '5', expectedOutput: '120' },
      { input: '0', expectedOutput: '1' },
      { input: '1', expectedOutput: '1', hidden: true },
      { input: '4', expectedOutput: '24', hidden: true }
    ],
    hints: ['Use recursion or iteration', 'Handle base cases'],
    timeLimit: 10,
    points: 15
  },
  {
    id: 'easy_008',
    title: 'Array Sum',
    description: 'Write a function that calculates the sum of all elements in an array.',
    difficulty: 'easy',
    category: 'Arrays',
    inputExample: 'arraySum([1, 2, 3, 4])',
    outputExample: '10',
    testCases: [
      { input: '[1, 2, 3, 4]', expectedOutput: '10' },
      { input: '[]', expectedOutput: '0' },
      { input: '[5]', expectedOutput: '5', hidden: true },
      { input: '[-1, 1, -2, 2]', expectedOutput: '0', hidden: true }
    ],
    hints: ['Use a loop or reduce method', 'Handle empty arrays'],
    timeLimit: 8,
    points: 12
  },
  {
    id: 'easy_009',
    title: 'Find Minimum',
    description: 'Write a function that finds the minimum element in an array.',
    difficulty: 'easy',
    category: 'Arrays',
    inputExample: 'findMin([3, 1, 4, 1, 5])',
    outputExample: '1',
    testCases: [
      { input: '[3, 1, 4, 1, 5]', expectedOutput: '1' },
      { input: '[10]', expectedOutput: '10' },
      { input: '[-5, -1, -10]', expectedOutput: '-10', hidden: true },
      { input: '[0, 0, 0]', expectedOutput: '0', hidden: true }
    ],
    hints: ['Compare each element', 'Use Math.min or iteration'],
    timeLimit: 8,
    points: 12
  },
  {
    id: 'easy_010',
    title: 'Palindrome Check',
    description: 'Write a function that checks if a string is a palindrome.',
    difficulty: 'easy',
    category: 'String Manipulation',
    inputExample: 'isPalindrome("racecar")',
    outputExample: 'true',
    testCases: [
      { input: '"racecar"', expectedOutput: 'true' },
      { input: '"hello"', expectedOutput: 'false' },
      { input: '"a"', expectedOutput: 'true', hidden: true },
      { input: '""', expectedOutput: 'true', hidden: true }
    ],
    hints: ['Compare string with its reverse', 'Consider case sensitivity'],
    timeLimit: 10,
    points: 15
  },

  // MEDIUM QUESTIONS (11-70)
  {
    id: 'medium_001',
    title: 'Fibonacci Sequence',
    description: 'Write a function that returns the nth Fibonacci number.',
    difficulty: 'medium',
    category: 'Dynamic Programming',
    inputExample: 'fibonacci(6)',
    outputExample: '8',
    testCases: [
      { input: '6', expectedOutput: '8' },
      { input: '1', expectedOutput: '1' },
      { input: '0', expectedOutput: '0', hidden: true },
      { input: '10', expectedOutput: '55', hidden: true }
    ],
    hints: ['Use recursion or iteration', 'Consider memoization for efficiency'],
    timeLimit: 15,
    points: 20
  },
  {
    id: 'medium_002',
    title: 'Two Sum',
    description: 'Given an array and a target sum, return indices of two numbers that add up to the target.',
    difficulty: 'medium',
    category: 'Arrays',
    inputExample: 'twoSum([2, 7, 11, 15], 9)',
    outputExample: '[0, 1]',
    testCases: [
      { input: '[2, 7, 11, 15], 9', expectedOutput: '[0, 1]' },
      { input: '[3, 2, 4], 6', expectedOutput: '[1, 2]' },
      { input: '[3, 3], 6', expectedOutput: '[0, 1]', hidden: true },
      { input: '[1, 2, 3, 4], 7', expectedOutput: '[2, 3]', hidden: true }
    ],
    hints: ['Use a hash map for O(n) solution', 'Check for complements'],
    timeLimit: 20,
    points: 25
  },
  {
    id: 'medium_003',
    title: 'Valid Parentheses',
    description: 'Check if a string of parentheses is valid (properly opened and closed).',
    difficulty: 'medium',
    category: 'Stack',
    inputExample: 'isValid("()[]{}")',
    outputExample: 'true',
    testCases: [
      { input: '"()[]{}"', expectedOutput: 'true' },
      { input: '"([)]"', expectedOutput: 'false' },
      { input: '"{[]}"', expectedOutput: 'true', hidden: true },
      { input: '"((("', expectedOutput: 'false', hidden: true }
    ],
    hints: ['Use a stack data structure', 'Match opening with closing brackets'],
    timeLimit: 20,
    points: 25
  },
  {
    id: 'medium_004',
    title: 'Merge Sorted Arrays',
    description: 'Merge two sorted arrays into one sorted array.',
    difficulty: 'medium',
    category: 'Arrays',
    inputExample: 'merge([1, 3, 5], [2, 4, 6])',
    outputExample: '[1, 2, 3, 4, 5, 6]',
    testCases: [
      { input: '[1, 3, 5], [2, 4, 6]', expectedOutput: '[1, 2, 3, 4, 5, 6]' },
      { input: '[], [1, 2, 3]', expectedOutput: '[1, 2, 3]' },
      { input: '[1], []', expectedOutput: '[1]', hidden: true },
      { input: '[1, 2], [3, 4]', expectedOutput: '[1, 2, 3, 4]', hidden: true }
    ],
    hints: ['Use two pointers', 'Compare elements from both arrays'],
    timeLimit: 20,
    points: 25
  },
  {
    id: 'medium_005',
    title: 'Binary Search',
    description: 'Implement binary search to find an element in a sorted array.',
    difficulty: 'medium',
    category: 'Search Algorithms',
    inputExample: 'binarySearch([1, 3, 5, 7, 9], 5)',
    outputExample: '2',
    testCases: [
      { input: '[1, 3, 5, 7, 9], 5', expectedOutput: '2' },
      { input: '[1, 3, 5, 7, 9], 1', expectedOutput: '0' },
      { input: '[1, 3, 5, 7, 9], 10', expectedOutput: '-1', hidden: true },
      { input: '[2], 2', expectedOutput: '0', hidden: true }
    ],
    hints: ['Divide and conquer', 'Compare with middle element'],
    timeLimit: 20,
    points: 25
  },

  // HARD QUESTIONS (71-100)
  {
    id: 'hard_001',
    title: 'Longest Common Subsequence',
    description: 'Find the length of the longest common subsequence between two strings.',
    difficulty: 'hard',
    category: 'Dynamic Programming',
    inputExample: 'lcs("ABCDGH", "AEDFHR")',
    outputExample: '3',
    testCases: [
      { input: '"ABCDGH", "AEDFHR"', expectedOutput: '3' },
      { input: '"AGGTAB", "GXTXAYB"', expectedOutput: '4' },
      { input: '"", "ABC"', expectedOutput: '0', hidden: true },
      { input: '"ABC", "ABC"', expectedOutput: '3', hidden: true }
    ],
    hints: ['Use dynamic programming', 'Build a 2D table'],
    timeLimit: 30,
    points: 35
  },
  {
    id: 'hard_002',
    title: 'N-Queens Problem',
    description: 'Solve the N-Queens problem and return the number of solutions.',
    difficulty: 'hard',
    category: 'Backtracking',
    inputExample: 'nQueens(4)',
    outputExample: '2',
    testCases: [
      { input: '4', expectedOutput: '2' },
      { input: '1', expectedOutput: '1' },
      { input: '8', expectedOutput: '92', hidden: true },
      { input: '2', expectedOutput: '0', hidden: true }
    ],
    hints: ['Use backtracking', 'Check diagonal conflicts'],
    timeLimit: 45,
    points: 40
  },
  {
    id: 'hard_003',
    title: 'Graph Shortest Path',
    description: 'Find the shortest path between two nodes in a weighted graph using Dijkstra\'s algorithm.',
    difficulty: 'hard',
    category: 'Graph Algorithms',
    inputExample: 'shortestPath(graph, "A", "D")',
    outputExample: '7',
    testCases: [
      { input: 'graph1, "A", "D"', expectedOutput: '7' },
      { input: 'graph1, "A", "C"', expectedOutput: '4' },
      { input: 'graph2, "X", "Y"', expectedOutput: '-1', hidden: true },
      { input: 'graph1, "A", "A"', expectedOutput: '0', hidden: true }
    ],
    hints: ['Use priority queue', 'Track distances and visited nodes'],
    timeLimit: 45,
    points: 40
  },
  {
    id: 'hard_004',
    title: 'Serialize Binary Tree',
    description: 'Serialize and deserialize a binary tree.',
    difficulty: 'hard',
    category: 'Trees',
    inputExample: 'serialize(tree)',
    outputExample: '"1,2,3,null,null,4,5"',
    testCases: [
      { input: 'tree1', expectedOutput: '"1,2,3,null,null,4,5"' },
      { input: 'null', expectedOutput: '""' },
      { input: 'tree2', expectedOutput: '"1"', hidden: true },
      { input: 'tree3', expectedOutput: '"1,2,null,3"', hidden: true }
    ],
    hints: ['Use preorder traversal', 'Handle null nodes'],
    timeLimit: 40,
    points: 38
  },
  {
    id: 'hard_005',
    title: 'Regular Expression Matching',
    description: 'Implement regular expression matching with . and * wildcards.',
    difficulty: 'hard',
    category: 'Dynamic Programming',
    inputExample: 'isMatch("aa", "a*")',
    outputExample: 'true',
    testCases: [
      { input: '"aa", "a*"', expectedOutput: 'true' },
      { input: '"ab", ".*"', expectedOutput: 'true' },
      { input: '"aab", "c*a*b"', expectedOutput: 'true', hidden: true },
      { input: '"mississippi", "mis*is*p*."', expectedOutput: 'false', hidden: true }
    ],
    hints: ['Use dynamic programming', 'Handle . and * cases separately'],
    timeLimit: 50,
    points: 45
  }

  // Note: This is a condensed version showing the structure.
  // In a real implementation, you would have all 100 questions here.
];

/**
 * Get random questions for a round
 * @param count - Number of questions to select
 * @param difficulty - Optional difficulty filter
 * @param excludeIds - Questions to exclude (to avoid repeats)
 * @returns Array of random questions
 */
export function getRandomQuestions(
  count: number, 
  difficulty?: 'easy' | 'medium' | 'hard',
  excludeIds: string[] = []
): CodingQuestion[] {
  let availableQuestions = CODING_QUESTIONS_POOL.filter(
    q => !excludeIds.includes(q.id)
  );

  if (difficulty) {
    availableQuestions = availableQuestions.filter(q => q.difficulty === difficulty);
  }

  // Shuffle and select
  const shuffled = [...availableQuestions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Get questions by category
 */
export function getQuestionsByCategory(category: string): CodingQuestion[] {
  return CODING_QUESTIONS_POOL.filter(q => q.category === category);
}

/**
 * Get question by ID
 */
export function getQuestionById(id: string): CodingQuestion | undefined {
  return CODING_QUESTIONS_POOL.find(q => q.id === id);
}

/**
 * Get all available categories
 */
export function getCategories(): string[] {
  const categories = new Set(CODING_QUESTIONS_POOL.map(q => q.category));
  return Array.from(categories).sort();
}

/**
 * Get questions by difficulty
 */
export function getQuestionsByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): CodingQuestion[] {
  return CODING_QUESTIONS_POOL.filter(q => q.difficulty === difficulty);
}

/**
 * Validate user solution against test cases
 */
export function validateSolution(
  question: CodingQuestion,
  userCode: string,
  language: string = 'javascript'
): {
  passed: boolean;
  score: number;
  feedback: string[];
  testResults: Array<{
    input: string;
    expected: string;
    actual: string;
    passed: boolean;
    hidden: boolean;
  }>;
} {
  const feedback: string[] = [];
  const testResults: Array<{
    input: string;
    expected: string;
    actual: string;
    passed: boolean;
    hidden: boolean;
  }> = [];

  let passedTests = 0;
  let totalTests = question.testCases.length;

  // Basic code analysis
  if (!userCode || userCode.trim().length === 0) {
    feedback.push("❌ No code submitted. Please provide a solution.");
    return { passed: false, score: 0, feedback, testResults };
  }

  // Simulate test case execution (in a real app, you'd run the code)
  question.testCases.forEach(testCase => {
    // This is a simplified simulation - in reality you'd execute the code
    const mockResult = simulateCodeExecution(userCode, testCase.input, language);
    const passed = mockResult === testCase.expectedOutput;
    
    if (passed) passedTests++;
    
    testResults.push({
      input: testCase.input,
      expected: testCase.expectedOutput,
      actual: mockResult,
      passed,
      hidden: testCase.hidden || false
    });
  });

  const score = Math.round((passedTests / totalTests) * question.points);
  const passed = passedTests === totalTests;

  // Generate feedback
  if (passed) {
    feedback.push("🎉 Excellent! All test cases passed!");
    feedback.push(`✅ Score: ${score}/${question.points} points`);
  } else {
    feedback.push(`⚠️ ${passedTests}/${totalTests} test cases passed`);
    feedback.push(`📊 Score: ${score}/${question.points} points`);
    
    if (passedTests > 0) {
      feedback.push("👍 Good progress! Some test cases are working.");
    }
    
    // Provide hints for failed cases
    const failedVisible = testResults.filter(r => !r.passed && !r.hidden);
    if (failedVisible.length > 0) {
      feedback.push("💡 Check these test cases:");
      failedVisible.forEach(result => {
        feedback.push(`   Input: ${result.input} → Expected: ${result.expected}, Got: ${result.actual}`);
      });
    }
  }

  return { passed, score, feedback, testResults };
}

/**
 * Simulate code execution (simplified for demo)
 * In a real implementation, you'd use a code execution service
 */
function simulateCodeExecution(code: string, input: string, language: string): string {
  // This is a mock function - in reality you'd execute the actual code
  // For demo purposes, we'll do basic pattern matching
  
  if (code.includes('return') && code.includes('+')) {
    // Likely an addition function
    const numbers = input.split(',').map(s => parseInt(s.trim()));
    if (numbers.length === 2 && !isNaN(numbers[0]) && !isNaN(numbers[1])) {
      return (numbers[0] + numbers[1]).toString();
    }
  }
  
  if (code.includes('length')) {
    // Likely a string length function
    const match = input.match(/"([^"]*)"/);
    if (match) {
      return match[1].length.toString();
    }
  }
  
  if (code.includes('%') && code.includes('2')) {
    // Likely an even/odd check
    const num = parseInt(input);
    if (!isNaN(num)) {
      return (num % 2 === 0).toString();
    }
  }
  
  // Default simulation - return a plausible result
  return "simulated_result";
}