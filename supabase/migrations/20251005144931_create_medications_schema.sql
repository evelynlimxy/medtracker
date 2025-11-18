/*
  # Medication Timetable Schema

  1. New Tables
    - `medications`
      - `id` (uuid, primary key) - Unique identifier for each medication
      - `user_id` (uuid) - Reference to the user (for future auth integration)
      - `name` (text) - Name of the medication
      - `dosage` (text) - Dosage information (e.g., "500mg", "2 pills")
      - `frequency` (text) - How often to take (e.g., "daily", "twice daily")
      - `times` (jsonb) - Array of times to take medication (e.g., ["08:00", "20:00"])
      - `notes` (text, optional) - Additional notes about the medication
      - `active` (boolean) - Whether medication is currently being taken
      - `created_at` (timestamptz) - When the medication was added
      - `updated_at` (timestamptz) - Last update timestamp

    - `medication_logs`
      - `id` (uuid, primary key) - Unique identifier for each log entry
      - `medication_id` (uuid, foreign key) - Reference to medications table
      - `scheduled_time` (timestamptz) - When the medication was scheduled
      - `taken_at` (timestamptz, optional) - When the medication was actually taken
      - `status` (text) - Status: "pending", "taken", "missed", "skipped"
      - `notes` (text, optional) - Optional notes for this specific dose
      - `created_at` (timestamptz) - When the log entry was created

  2. Security
    - Enable RLS on both tables
    - Add policies for public access (auth can be added later)
    
  3. Important Notes
    - Using JSONB for flexible time storage
    - Medication logs track each individual dose
    - Status field allows tracking compliance
    - Timestamps use timestamptz for timezone support
*/

CREATE TABLE IF NOT EXISTS medications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  name text NOT NULL,
  dosage text NOT NULL,
  frequency text NOT NULL,
  times jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text DEFAULT '',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS medication_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id uuid NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  scheduled_time timestamptz NOT NULL,
  taken_at timestamptz,
  status text NOT NULL DEFAULT 'pending',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_medication_logs_medication_id ON medication_logs(medication_id);
CREATE INDEX IF NOT EXISTS idx_medication_logs_scheduled_time ON medication_logs(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_medication_logs_status ON medication_logs(status);

ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can manage medications"
  ON medications FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can manage medication logs"
  ON medication_logs FOR ALL
  USING (true)
  WITH CHECK (true);