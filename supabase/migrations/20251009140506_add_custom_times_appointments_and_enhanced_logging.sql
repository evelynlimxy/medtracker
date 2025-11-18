/*
  # Enhanced Medication and Appointment System

  1. Changes to Tables
    - `medications`
      - Add `frequency_type` (text) - 'regular' or 'as_needed'
      - Add `custom_times` (jsonb) - Map of meal_period to custom time
        Example: {"before_breakfast": "07:30", "after_lunch": "14:45"}
    
    - `medication_logs`
      - Add `missed_at` (timestamptz) - When patient realized they missed and took it
      - Update status to include 'missed_taken' for late doses
    
    - `profiles`
      - Add `language` (text) - User's preferred language: 'en', 'ms', 'zh'
      - Add `alarm_enabled` (boolean) - Whether to play alarm sound
  
  2. New Tables
    - `appointments`
      - `id` (uuid, primary key)
      - `profile_id` (uuid) - Links to profile
      - `title` (text) - Appointment title
      - `appointment_date` (date) - Date of appointment
      - `appointment_time` (time) - Time of appointment
      - `location` (text) - Where the appointment is
      - `notes` (text) - Additional notes
      - `reminded` (boolean) - Whether reminder was sent
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  3. Security
    - Enable RLS on appointments table
    - Users can only access appointments for their profiles

  4. Important Notes
    - Custom times override default meal period times
    - Missed doses track when patient took late medication
    - Appointments send reminders 24 hours before
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'medications' AND column_name = 'frequency_type'
  ) THEN
    ALTER TABLE medications ADD COLUMN frequency_type text DEFAULT 'regular';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'medications' AND column_name = 'custom_times'
  ) THEN
    ALTER TABLE medications ADD COLUMN custom_times jsonb DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'medication_logs' AND column_name = 'missed_at'
  ) THEN
    ALTER TABLE medication_logs ADD COLUMN missed_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'language'
  ) THEN
    ALTER TABLE profiles ADD COLUMN language text DEFAULT 'en';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'alarm_enabled'
  ) THEN
    ALTER TABLE profiles ADD COLUMN alarm_enabled boolean DEFAULT true;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  appointment_date date NOT NULL,
  appointment_time time,
  location text DEFAULT '',
  notes text DEFAULT '',
  reminded boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appointments_profile_id ON appointments(profile_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view appointments for their profiles"
  ON appointments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = appointments.profile_id
      AND profiles.account_owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert appointments for their profiles"
  ON appointments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = appointments.profile_id
      AND profiles.account_owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update appointments for their profiles"
  ON appointments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = appointments.profile_id
      AND profiles.account_owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = appointments.profile_id
      AND profiles.account_owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete appointments for their profiles"
  ON appointments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = appointments.profile_id
      AND profiles.account_owner_id = auth.uid()
    )
  );