/**
 * Enhanced Marks Calculation with Double Validation and Logging
 */

import supabase from '../lib/supabase';
import { cacheManager, CacheKeys } from './cacheManager';

export interface CalculationStep {
  step: string;
  description: string;
  input: any;
  output: any;
  timestamp: string;
}

export interface MarksCalculationResult {
  round1Score: number;
  round2Score: number;
  totalScore: number;
  percentage: number;
  status: 'PASS' | 'FAIL';
  calculationSteps: CalculationStep[];
  validationPassed: boolean;
  errors: string[];
}

export interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  backoffMultiplier: 2
};

/**
 * Calculate marks with double validation and detailed logging
 */
export async function calculateMarksWithValidation(
  assessmentId: string,
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<MarksCalculationResult> {
  const calculationSteps: CalculationStep[] = [];
  const errors: string[] = [];

  try {
    // Step 1: Fetch assessment data
    const step1 = await logStep('fetch_assessment', 'Fetching assessment data', { assessmentId }, async () => {
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('id', assessmentId)
        .single();

      if (error) throw error;
      return data;
    });
    calculationSteps.push(step1);

    // Step 2: Fetch Round 1 responses
    const step2 = await logStep('fetch_round1', 'Fetching Round 1 responses', { assessmentId }, async () => {
      const { data, error } = await supabase
        .from('assessment_responses')
        .select(`
          *,
          questions (
            marks,
            question_type
          )
        `)
        .eq('assessment_id', assessmentId);

      if (error) throw error;
      return data || [];
    });
    calculationSteps.push(step2);

    // Step 3: Fetch Round 2 coding submissions
    const step3 = await logStep('fetch_round2', 'Fetching Round 2 submissions', { assessmentId }, async () => {
      const { data, error } = await supabase
        .from('coding_submissions')
        .select(`
          *,
          coding_problems (
            marks
          )
        `)
        .eq('assessment_id', assessmentId);

      if (error) throw error;
      return data || [];
    });
    calculationSteps.push(step3);

    // Step 4: Calculate Round 1 score
    const round1Responses = step2.output.filter((r: any) => r.questions?.question_type === 'aptitude');
    const step4 = await logStep('calculate_round1', 'Calculating Round 1 score', { responses: round1Responses.length }, async () => {
      return round1Responses.reduce((sum: number, response: any) => sum + (response.marks_obtained || 0), 0);
    });
    calculationSteps.push(step4);

    // Step 5: Calculate Round 2 score
    const technicalResponses = step2.output.filter((r: any) => r.questions?.question_type === 'technical');
    const codingSubmissions = step3.output;
    
    const step5 = await logStep('calculate_round2', 'Calculating Round 2 score', { 
      technicalResponses: technicalResponses.length,
      codingSubmissions: codingSubmissions.length 
    }, async () => {
      const technicalMarks = technicalResponses.reduce((sum: number, response: any) => sum + (response.marks_obtained || 0), 0);
      const codingMarks = codingSubmissions.reduce((sum: number, submission: any) => sum + (submission.marks_obtained || 0), 0);
      return technicalMarks + codingMarks;
    });
    calculationSteps.push(step5);

    // Step 6: Calculate total and percentage
    const round1Score = step4.output;
    const round2Score = step5.output;
    const totalScore = round1Score + round2Score;
    const maxPossibleScore = 100; // 30 for Round 1 + 70 for Round 2
    const percentage = (totalScore / maxPossibleScore) * 100;
    const status = percentage >= 40 ? 'PASS' : 'FAIL';

    const step6 = await logStep('calculate_final', 'Calculating final scores', {
      round1Score,
      round2Score,
      totalScore,
      percentage
    }, async () => ({
      round1Score,
      round2Score,
      totalScore,
      percentage,
      status
    }));
    calculationSteps.push(step6);

    // Step 7: Double validation
    const step7 = await logStep('double_validation', 'Performing double validation', { totalScore }, async () => {
      return await performDoubleValidation(assessmentId, round1Score, round2Score, totalScore);
    });
    calculationSteps.push(step7);

    // Step 8: Store calculation steps
    await storeCalculationSteps(assessmentId, calculationSteps);

    // Cache the result
    cacheManager.set(CacheKeys.marksCalculation(assessmentId), step6.output, 30 * 60 * 1000);

    return {
      round1Score,
      round2Score,
      totalScore,
      percentage,
      status,
      calculationSteps,
      validationPassed: step7.output.isValid,
      errors
    };

  } catch (error) {
    errors.push(`Calculation failed: ${error}`);
    
    // Retry mechanism
    if (retryConfig.maxRetries > 0) {
      console.log(`Retrying calculation in ${retryConfig.retryDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, retryConfig.retryDelay));
      
      return calculateMarksWithValidation(assessmentId, {
        ...retryConfig,
        maxRetries: retryConfig.maxRetries - 1,
        retryDelay: retryConfig.retryDelay * retryConfig.backoffMultiplier
      });
    }

    throw new Error(`Failed to calculate marks after retries: ${errors.join(', ')}`);
  }
}

/**
 * Log a calculation step
 */
async function logStep<T>(
  step: string,
  description: string,
  input: any,
  operation: () => Promise<T>
): Promise<CalculationStep & { output: T }> {
  const timestamp = new Date().toISOString();
  
  try {
    const output = await operation();
    
    const calculationStep: CalculationStep = {
      step,
      description,
      input,
      output,
      timestamp
    };

    console.log(`[${timestamp}] ${step}: ${description}`, { input, output });
    
    return { ...calculationStep, output };
  } catch (error) {
    console.error(`[${timestamp}] ${step} FAILED: ${description}`, { input, error });
    throw error;
  }
}

/**
 * Perform double validation of calculated marks
 */
async function performDoubleValidation(
  assessmentId: string,
  round1Score: number,
  round2Score: number,
  totalScore: number
): Promise<{ isValid: boolean; discrepancies: string[] }> {
  const discrepancies: string[] = [];

  try {
    // Validation 1: Recalculate from raw data
    const { data: responses } = await supabase
      .from('assessment_responses')
      .select('marks_obtained')
      .eq('assessment_id', assessmentId);

    const { data: submissions } = await supabase
      .from('coding_submissions')
      .select('marks_obtained')
      .eq('assessment_id', assessmentId);

    const recalculatedTotal = 
      (responses?.reduce((sum, r) => sum + (r.marks_obtained || 0), 0) || 0) +
      (submissions?.reduce((sum, s) => sum + (s.marks_obtained || 0), 0) || 0);

    if (Math.abs(recalculatedTotal - totalScore) > 0.01) {
      discrepancies.push(`Total score mismatch: calculated ${totalScore}, recalculated ${recalculatedTotal}`);
    }

    // Validation 2: Check score bounds
    if (round1Score < 0 || round1Score > 30) {
      discrepancies.push(`Round 1 score out of bounds: ${round1Score} (expected 0-30)`);
    }

    if (round2Score < 0 || round2Score > 70) {
      discrepancies.push(`Round 2 score out of bounds: ${round2Score} (expected 0-70)`);
    }

    if (totalScore < 0 || totalScore > 100) {
      discrepancies.push(`Total score out of bounds: ${totalScore} (expected 0-100)`);
    }

    // Validation 3: Check data consistency
    const { data: assessment } = await supabase
      .from('assessments')
      .select('round1_score, round2_score, total_score')
      .eq('id', assessmentId)
      .single();

    if (assessment) {
      if (assessment.round1_score !== null && Math.abs(assessment.round1_score - round1Score) > 0.01) {
        discrepancies.push(`Round 1 score inconsistency in database`);
      }
      if (assessment.round2_score !== null && Math.abs(assessment.round2_score - round2Score) > 0.01) {
        discrepancies.push(`Round 2 score inconsistency in database`);
      }
    }

    return {
      isValid: discrepancies.length === 0,
      discrepancies
    };

  } catch (error) {
    discrepancies.push(`Validation error: ${error}`);
    return { isValid: false, discrepancies };
  }
}

/**
 * Store calculation steps in database for debugging
 */
async function storeCalculationSteps(assessmentId: string, steps: CalculationStep[]): Promise<void> {
  try {
    // In a real application, you might store this in a separate table
    // For now, we'll just log it
    console.log(`Calculation steps for assessment ${assessmentId}:`, steps);
    
    // You could also store in a calculation_logs table:
    // await supabase.from('calculation_logs').insert({
    //   assessment_id: assessmentId,
    //   steps: JSON.stringify(steps),
    //   created_at: new Date().toISOString()
    // });
  } catch (error) {
    console.error('Failed to store calculation steps:', error);
  }
}

/**
 * Get cached calculation result
 */
export function getCachedCalculation(assessmentId: string): MarksCalculationResult | null {
  return cacheManager.get(CacheKeys.marksCalculation(assessmentId));
}

/**
 * Clear calculation cache
 */
export function clearCalculationCache(assessmentId: string): void {
  cacheManager.delete(CacheKeys.marksCalculation(assessmentId));
}