/*
  # Fix assessments-users foreign key relationship
  
  1. Ensure all users referenced in assessments exist in public.users
  2. Update foreign key constraint to reference public.users instead of auth.users
  
  This migration handles existing data by creating missing user records
  before establishing the foreign key constraint.
*/

-- First, insert any missing users into public.users table
-- This handles cases where assessments reference auth.users that don't exist in public.users
INSERT INTO public.users (id, full_name, email, created_at, updated_at)
SELECT DISTINCT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'full_name', 'Unknown User') as full_name,
  COALESCE(au.email, 'unknown@example.com') as email,
  COALESCE(au.created_at, now()) as created_at,
  now() as updated_at
FROM auth.users au
INNER JOIN assessments a ON a.user_id = au.id
LEFT JOIN public.users pu ON pu.id = au.id
WHERE pu.id IS NULL;

-- Now drop the existing foreign key constraint to auth.users
ALTER TABLE assessments DROP CONSTRAINT IF EXISTS assessments_user_id_fkey;

-- Add the new foreign key constraint to public.users
ALTER TABLE assessments 
ADD CONSTRAINT assessments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Verify the constraint was added successfully
SELECT 'Foreign key constraint added successfully' as status;