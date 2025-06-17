import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './useToast';
import supabase from '../lib/supabase';

interface AssessmentState {
  id: string;
  round1_score: number | null;
  round2_score: number | null;
  status: 'in_progress' | 'completed';
  domain_id: string | null;
}

interface NavigationState {
  isLoading: boolean;
  canAccessRound1: boolean;
  canAccessRound2: boolean;
  canAccessResults: boolean;
  assessmentState: AssessmentState | null;
  error: string | null;
}

export const useAssessmentNavigation = (assessmentId: string | undefined) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [navigationState, setNavigationState] = useState<NavigationState>({
    isLoading: true,
    canAccessRound1: false,
    canAccessRound2: false,
    canAccessResults: false,
    assessmentState: null,
    error: null,
  });

  const validateAssessmentAccess = useCallback(async () => {
    if (!assessmentId) {
      console.error('Assessment ID is missing');
      setNavigationState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Assessment ID is required',
      }));
      return;
    }

    try {
      console.log('Validating assessment access for:', assessmentId);
      
      const { data: assessment, error } = await supabase
        .from('assessments')
        .select('id, round1_score, round2_score, status, domain_id, user_id')
        .eq('id', assessmentId)
        .single();

      if (error) {
        console.error('Error fetching assessment:', error);
        throw error;
      }

      if (!assessment) {
        throw new Error('Assessment not found');
      }

      console.log('Assessment validation result:', assessment);

      // Determine access permissions
      const canAccessRound1 = true; // Always can access Round 1
      const canAccessRound2 = assessment.round1_score !== null;
      const canAccessResults = assessment.round2_score !== null && assessment.status === 'completed';

      setNavigationState({
        isLoading: false,
        canAccessRound1,
        canAccessRound2,
        canAccessResults,
        assessmentState: assessment,
        error: null,
      });

      console.log('Navigation permissions:', {
        canAccessRound1,
        canAccessRound2,
        canAccessResults,
      });

    } catch (error: any) {
      console.error('Assessment validation error:', error);
      setNavigationState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to validate assessment access',
      }));
    }
  }, [assessmentId]);

  const navigateToRound = useCallback((round: 1 | 2) => {
    if (!assessmentId) {
      showToast('Assessment ID is missing', 'error');
      return false;
    }

    const { canAccessRound1, canAccessRound2, assessmentState } = navigationState;

    if (round === 1) {
      if (!canAccessRound1) {
        showToast('Cannot access Round 1', 'error');
        return false;
      }
      
      // Check if Round 1 is already completed
      if (assessmentState?.round1_score !== null) {
        showToast('Round 1 already completed', 'info');
        // Redirect to Round 2 if available, otherwise to results
        if (canAccessRound2) {
          navigate(`/assessment/${assessmentId}/round2`);
        } else {
          navigate(`/assessment/${assessmentId}/results`);
        }
        return true;
      }
      
      console.log('Navigating to Round 1');
      navigate(`/assessment/${assessmentId}/round1`);
      return true;
    }

    if (round === 2) {
      if (!canAccessRound2) {
        showToast('Please complete Round 1 first', 'warning');
        navigate(`/assessment/${assessmentId}/round1`);
        return false;
      }
      
      // Check if Round 2 is already completed
      if (assessmentState?.round2_score !== null) {
        showToast('Round 2 already completed', 'info');
        navigate(`/assessment/${assessmentId}/results`);
        return true;
      }
      
      console.log('Navigating to Round 2');
      navigate(`/assessment/${assessmentId}/round2`);
      return true;
    }

    return false;
  }, [assessmentId, navigationState, navigate, showToast]);

  const navigateToResults = useCallback(() => {
    if (!assessmentId) {
      showToast('Assessment ID is missing', 'error');
      return false;
    }

    const { canAccessResults } = navigationState;

    if (!canAccessResults) {
      showToast('Assessment not completed yet', 'warning');
      return false;
    }

    console.log('Navigating to Results');
    navigate(`/assessment/${assessmentId}/results`);
    return true;
  }, [assessmentId, navigationState, navigate, showToast]);

  const refreshAssessmentState = useCallback(() => {
    setNavigationState(prev => ({ ...prev, isLoading: true }));
    validateAssessmentAccess();
  }, [validateAssessmentAccess]);

  // Initial validation
  useEffect(() => {
    validateAssessmentAccess();
  }, [validateAssessmentAccess]);

  return {
    ...navigationState,
    navigateToRound,
    navigateToResults,
    refreshAssessmentState,
    validateAssessmentAccess,
  };
};