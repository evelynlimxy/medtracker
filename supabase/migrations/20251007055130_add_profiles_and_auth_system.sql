/*
  # Add Authentication and User Profile System

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key) - Unique identifier for each profile
      - `account_owner_id` (uuid) - Links to auth.users (the logged-in user)
      - `name` (text) - Profile name (can be "Me", parent's name, etc.)
      - `date_of_birth` (date) - Date of birth
      - `is_primary` (boolean) - Whether this is the account owner's own profile
      - `created_at` (timestamptz) - When profile was created
      - `updated_at` (timestamptz) - Last update

  2. Changes to Existing Tables
    - `medications`
      - Add `profile_id` (uuid) - Links medication to a specific profile
      - Update existing records to use NULL for now
    
    - `medication_logs`
      - Already has the structure we need

  3. Security
    - Enable RLS on profiles table
    - Users can only see/manage profiles they own
    - Medications are linked to profiles, users can only access their profiles' medications
    - Update existing RLS policies to check profile ownership

  4. Important Notes
    - One account can have multiple profiles (e.g., managing parents' meds)
    - Each profile has its own medications and logs
    - Primary profile is the account owner themselves
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  date_of_birth date,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'medications' AND column_name = 'profile_id'
  ) THEN
    ALTER TABLE medications ADD COLUMN profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_account_owner ON profiles(account_owner_id);
CREATE INDEX IF NOT EXISTS idx_medications_profile_id ON medications(profile_id);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can manage medications" ON medications;
DROP POLICY IF EXISTS "Anyone can manage medication logs" ON medication_logs;

CREATE POLICY "Users can view own profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = account_owner_id);

CREATE POLICY "Users can insert own profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = account_owner_id);

CREATE POLICY "Users can update own profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = account_owner_id)
  WITH CHECK (auth.uid() = account_owner_id);

CREATE POLICY "Users can delete own profiles"
  ON profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = account_owner_id);

CREATE POLICY "Users can view medications for their profiles"
  ON medications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = medications.profile_id
      AND profiles.account_owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert medications for their profiles"
  ON medications FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = medications.profile_id
      AND profiles.account_owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update medications for their profiles"
  ON medications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = medications.profile_id
      AND profiles.account_owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = medications.profile_id
      AND profiles.account_owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete medications for their profiles"
  ON medications FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = medications.profile_id
      AND profiles.account_owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can view logs for their profile medications"
  ON medication_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM medications
      JOIN profiles ON profiles.id = medications.profile_id
      WHERE medications.id = medication_logs.medication_id
      AND profiles.account_owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert logs for their profile medications"
  ON medication_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM medications
      JOIN profiles ON profiles.id = medications.profile_id
      WHERE medications.id = medication_logs.medication_id
      AND profiles.account_owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update logs for their profile medications"
  ON medication_logs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM medications
      JOIN profiles ON profiles.id = medications.profile_id
      WHERE medications.id = medication_logs.medication_id
      AND profiles.account_owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM medications
      JOIN profiles ON profiles.id = medications.profile_id
      WHERE medications.id = medication_logs.medication_id
      AND profiles.account_owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete logs for their profile medications"
  ON medication_logs FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM medications
      JOIN profiles ON profiles.id = medications.profile_id
      WHERE medications.id = medication_logs.medication_id
      AND profiles.account_owner_id = auth.uid()
    )
  );