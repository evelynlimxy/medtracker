/*
  # Update Medications Schema for Meal-Based Timing

  1. Changes to Tables
    - `medications`
      - Replace `times` (jsonb) with `meal_times` (jsonb) to store meal periods
      - Meal periods: "before_breakfast", "after_breakfast", "before_lunch", 
        "after_lunch", "before_dinner", "after_dinner", "before_sleep"
      - Each medication can be associated with multiple meal periods
      - Remove `frequency` field as it's implied by the meal_times array

  2. Migration Strategy
    - Add new `meal_times` column with default empty array
    - Keep existing `times` and `frequency` columns for backward compatibility
    - New records will use `meal_times` while old records continue to work
  
  3. Important Notes
    - This is a non-destructive migration
    - Existing data remains intact
    - Frontend will be updated to use meal_times for new entries
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'medications' AND column_name = 'meal_times'
  ) THEN
    ALTER TABLE medications ADD COLUMN meal_times jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;