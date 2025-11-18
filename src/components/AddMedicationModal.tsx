import { useState, useEffect, useRef } from 'react';
import { X, Search } from 'lucide-react';
import { supabase, Medication, MealPeriod, MEAL_PERIODS } from '../lib/supabase';

interface DrugSuggestion {
  name: string;
  strengths?: string[];
}

interface AddMedicationModalProps {
  onClose: () => void;
  onSuccess: () => void;
  editMedication?: Medication | null;
  profileId: string;
}

export function AddMedicationModal({ onClose, onSuccess, editMedication, profileId }: AddMedicationModalProps) {
  const [name, setName] = useState(editMedication?.name || '');
  const [dosage, setDosage] = useState(editMedication?.dosage || '');
  const [frequency, setFrequency] = useState(editMedication?.frequency || '');
  const [frequencyType, setFrequencyType] = useState<'regular' | 'as_needed'>(
    editMedication?.frequency_type || 'regular'
  );
  const [mealTimes, setMealTimes] = useState<MealPeriod[]>(
    editMedication?.meal_times || []
  );
  const [customTimes, setCustomTimes] = useState<Record<string, string>>(
    editMedication?.custom_times || {}
  );
  const [notes, setNotes] = useState(editMedication?.notes || '');
  const [loading, setLoading] = useState(false);
  const [drugSuggestions, setDrugSuggestions] = useState<DrugSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchingDrugs, setSearchingDrugs] = useState(false);
  const searchTimeoutRef = useRef<number>();

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const searchDrugs = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      setDrugSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setSearchingDrugs(true);
    try {
      const response = await fetch(
        `https://clinicaltables.nlm.nih.gov/api/rxterms/v3/search?terms=${encodeURIComponent(
          searchTerm
        )}&ef=STRENGTHS_AND_FORMS&maxList=10`
      );
      const data = await response.json();

      if (data[1] && Array.isArray(data[1])) {
        const suggestions: DrugSuggestion[] = data[1].map((drugName: string, index: number) => ({
          name: drugName,
          strengths: data[2]?.STRENGTHS_AND_FORMS?.[index] || [],
        }));
        setDrugSuggestions(suggestions);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error fetching drug suggestions:', error);
    } finally {
      setSearchingDrugs(false);
    }
  };

  const handleNameChange = (value: string) => {
    setName(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = window.setTimeout(() => {
      searchDrugs(value);
    }, 300);
  };

  const selectDrug = (suggestion: DrugSuggestion) => {
    setName(suggestion.name);
    if (suggestion.strengths && suggestion.strengths.length > 0 && !dosage) {
      setDosage(suggestion.strengths[0]);
    }
    setShowSuggestions(false);
  };

  const toggleMealTime = (mealPeriod: MealPeriod) => {
    if (mealTimes.includes(mealPeriod)) {
      setMealTimes(mealTimes.filter((mt) => mt !== mealPeriod));
    } else {
      setMealTimes([...mealTimes, mealPeriod]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mealTimes.length === 0) {
      alert('Please select at least one meal period');
      return;
    }

    setLoading(true);

    try {
      if (editMedication) {
        const { error } = await supabase
          .from('medications')
          .update({
            name,
            dosage,
            frequency,
            frequency_type: frequencyType,
            meal_times: mealTimes,
            custom_times: customTimes,
            notes,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editMedication.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('medications')
          .insert({
            profile_id: profileId,
            name,
            dosage,
            frequency,
            frequency_type: frequencyType,
            meal_times: mealTimes,
            custom_times: customTimes,
            notes,
          });

        if (error) throw error;
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving medication:', error);
      alert('Failed to save medication. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {editMedication ? 'Edit Medication' : 'Add Medication'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Medication Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                onFocus={() => name.length >= 2 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                required
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Start typing medication name..."
              />
              {searchingDrugs && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Search className="w-4 h-4 text-gray-400 animate-pulse" />
                </div>
              )}
            </div>

            {showSuggestions && drugSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {drugSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => selectDrug(suggestion)}
                    className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium text-gray-900">{suggestion.name}</div>
                    {suggestion.strengths && suggestion.strengths.length > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        Available strengths: {suggestion.strengths.slice(0, 3).join(', ')}
                        {suggestion.strengths.length > 3 && '...'}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dosage
            </label>
            <input
              type="text"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., 500mg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Frequency Type
            </label>
            <select
              value={frequencyType}
              onChange={(e) => setFrequencyType(e.target.value as 'regular' | 'as_needed')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="regular">Regular</option>
              <option value="as_needed">As Needed</option>
            </select>
          </div>

          {frequencyType === 'regular' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Frequency
              </label>
              <input
                type="text"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Daily, Once a week"
              />
            </div>
          )}

          {frequencyType === 'regular' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                When to take
              </label>
              <div className="grid grid-cols-1 gap-2">
                {MEAL_PERIODS.map((period) => (
                  <div key={period.value} className="space-y-2">
                    <button
                      type="button"
                      onClick={() => toggleMealTime(period.value)}
                      className={`w-full px-4 py-3 rounded-lg border-2 text-left font-medium transition-all ${
                        mealTimes.includes(period.value)
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {period.label}
                    </button>
                    {mealTimes.includes(period.value) && (
                      <div className="ml-4">
                        <label className="block text-xs text-gray-600 mb-1">
                          Custom Time (Optional)
                        </label>
                        <input
                          type="time"
                          value={customTimes[period.value] || ''}
                          onChange={(e) => setCustomTimes({
                            ...customTimes,
                            [period.value]: e.target.value
                          })}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Any special instructions..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : editMedication ? 'Update' : 'Add Medication'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
