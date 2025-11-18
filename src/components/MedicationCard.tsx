import { Pill, CreditCard as Edit, Trash2, Utensils } from 'lucide-react';
import { Medication, MEAL_PERIODS } from '../lib/supabase';

interface MedicationCardProps {
  medication: Medication;
  onEdit: (medication: Medication) => void;
  onDelete: (id: string) => void;
}

export function MedicationCard({ medication, onEdit, onDelete }: MedicationCardProps) {
  const getMealPeriodLabel = (mealPeriodValue: string): string => {
    return MEAL_PERIODS.find(p => p.value === mealPeriodValue)?.label || mealPeriodValue;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Pill className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{medication.name}</h3>
            <p className="text-sm text-gray-600">{medication.dosage}</p>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(medication)}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(medication.id)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Utensils className="w-4 h-4" />
          <span className="font-medium">
            {medication.meal_times?.length || 0} time{medication.meal_times?.length !== 1 ? 's' : ''} per day
          </span>
        </div>
        {medication.meal_times && medication.meal_times.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {medication.meal_times.map((mealTime, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
              >
                {getMealPeriodLabel(mealTime)}
              </span>
            ))}
          </div>
        )}
        {medication.notes && (
          <p className="text-sm text-gray-500 mt-2 italic">{medication.notes}</p>
        )}
      </div>
    </div>
  );
}
