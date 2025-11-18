import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type MealPeriod =
  | 'before_breakfast'
  | 'after_breakfast'
  | 'before_lunch'
  | 'after_lunch'
  | 'before_dinner'
  | 'after_dinner'
  | 'before_sleep';

export type Profile = {
  id: string;
  account_owner_id: string;
  name: string;
  date_of_birth: string | null;
  is_primary: boolean;
  language: 'en' | 'ms' | 'zh';
  alarm_enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type Medication = {
  id: string;
  user_id: string | null;
  profile_id: string;
  name: string;
  dosage: string;
  frequency: string;
  frequency_type: 'regular' | 'as_needed';
  times: string[];
  meal_times: MealPeriod[];
  custom_times: Record<string, string>;
  notes: string;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type MedicationLog = {
  id: string;
  medication_id: string;
  scheduled_time: string;
  meal_period?: MealPeriod;
  taken_at: string | null;
  missed_at: string | null;
  status: 'pending' | 'taken' | 'missed' | 'skipped' | 'missed_taken';
  notes: string;
  created_at: string;
};

export type Appointment = {
  id: string;
  profile_id: string;
  title: string;
  appointment_date: string;
  appointment_time: string | null;
  location: string;
  notes: string;
  reminded: boolean;
  created_at: string;
  updated_at: string;
};

export const MEAL_PERIODS: { value: MealPeriod; label: string }[] = [
  { value: 'before_breakfast', label: 'Before Breakfast' },
  { value: 'after_breakfast', label: 'After Breakfast' },
  { value: 'before_lunch', label: 'Before Lunch' },
  { value: 'after_lunch', label: 'After Lunch' },
  { value: 'before_dinner', label: 'Before Dinner' },
  { value: 'after_dinner', label: 'After Dinner' },
  { value: 'before_sleep', label: 'Before Sleep' },
];
