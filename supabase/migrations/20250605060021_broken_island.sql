/*
  # Add INSERT policy for users table
  
  1. Changes
    - Add INSERT policy to users table to allow new user creation during signup
    
  2. Security
    - Policy ensures users can only insert their own data
    - Maintains data integrity by matching auth.uid() with user id
*/

CREATE POLICY "Users can insert their own data"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);