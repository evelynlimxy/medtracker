/*
  # Add meal_period to medication_logs and fix frequency requirement

  1. Changes to Tables
    - `medication_logs`
      - Add `meal_period` (text) column to track which meal period the log is for
      - This links logs to specific meal times in the timetable
    
    - `medications`
      - Make `frequency` field optional (remove NOT NULL constraint)
      - This allows flexibility for meal-based or clock-based scheduling

  2. Important Notes
    - Non-destructive migration
    - Existing data remains intact
    - Supports both meal-based and clock-based medication tracking
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'medication_logs' AND column_name = 'meal_period'
  ) THEN
    ALTER TABLE medication_logs ADD COLUMN meal_period text;
  END IF;
END $$;

ALTER TABLE medications ALTER COLUMN frequency DROP NOT NULL;