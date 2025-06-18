/*
  # Update Pass Threshold to 40% for Coding Challenges

  1. Updates
    - This migration documents the change from 70% to 40% pass threshold
    - The actual threshold is implemented in the application code
    - No database schema changes needed
    
  2. Notes
    - Pass threshold changed from 70% to 40% to align with coding challenge requirements
    - This affects all assessment calculations and status determinations
    - Updated in utils/testCalculations.ts and utils/summaryReportCalculations.ts
*/

-- This migration serves as documentation for the pass threshold change
-- The actual implementation is in the application code, not the database

-- Add a comment to track this change
COMMENT ON TABLE assessments IS 'Assessment table - Pass threshold updated to 40% for coding challenges (2024-12-16)';

-- No actual schema changes needed as the threshold is handled in application logic
SELECT 'Pass threshold updated to 40% for coding challenges' as migration_note;