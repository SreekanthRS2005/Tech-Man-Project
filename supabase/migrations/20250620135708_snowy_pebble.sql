/*
  # Fix assessments-users relationship

  1. Changes
    - Add foreign key constraint between assessments.user_id and public.users.id
    - This enables Supabase to perform joins between assessments and users tables
  
  2. Security
    - No changes to existing RLS policies
    - Maintains data integrity with proper foreign key constraints
*/

-- Add foreign key constraint between assessments and public.users
-- First, we need to drop the existing foreign key to auth.users
ALTER TABLE assessments DROP CONSTRAINT IF EXISTS assessments_user_id_fkey;

-- Add the new foreign key constraint to public.users
ALTER TABLE assessments 
ADD CONSTRAINT assessments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;