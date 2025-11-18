import { useState, useEffect } from 'react';
import { Check, Calendar } from 'lucide-react';
import { supabase, Medication, MedicationLog, MealPeriod, MEAL_PERIODS } from '../lib/supabase';

interface ScheduledDose {
  medication: Medication;
  mealPeriod: MealPeriod;
  log?: MedicationLog;
}

interface TimetableViewProps {
  medications: Medication[];
  onRefresh: () => void;
}

export function TimetableView({ medications, onRefresh }: TimetableViewProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduledDoses, setScheduledDoses] = useState<ScheduledDose[]>([]);
  const [logs, setLogs] = useState<MedicationLog[]>([]);

  useEffect(() => {
    loadLogs();
  }, [selectedDate]);

  useEffect(() => {
    generateSchedule();
  }, [medications, logs, selectedDate]);

  const loadLogs = async () => {
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('medication_logs')
      .select('*')
      .gte('scheduled_time', startOfDay.toISOString())
      .lte('scheduled_time', endOfDay.toISOString());

    if (!error && data) {
      setLogs(data);
    }
  };

  const generateSchedule = () => {
    const doses: ScheduledDose[] = [];

    medications.forEach((medication) => {
      if (medication.active && medication.meal_times) {
        medication.meal_times.forEach((mealPeriod) => {
          const existingLog = logs.find(
            (log) =>
              log.medication_id === medication.id &&
              log.meal_period === mealPeriod
          );

          doses.push({
            medication,
            mealPeriod,
            log: existingLog,
          });
        });
      }
    });

    setScheduledDoses(doses);
  };

  const markAsTaken = async (dose: ScheduledDose) => {
    const scheduledDateTime = new Date(selectedDate);
    scheduledDateTime.setHours(12, 0, 0, 0);

    if (dose.log) {
      const { error } = await supabase
        .from('medication_logs')
        .update({
          taken_at: new Date().toISOString(),
          status: 'taken',
        })
        .eq('id', dose.log.id);

      if (error) {
        console.error('Error updating log:', error);
        return;
      }
    } else {
      const { error } = await supabase.from('medication_logs').insert({
        medication_id: dose.medication.id,
        scheduled_time: scheduledDateTime.toISOString(),
        meal_period: dose.mealPeriod,
        taken_at: new Date().toISOString(),
        status: 'taken',
      });

      if (error) {
        console.error('Error creating log:', error);
        return;
      }
    }

    await loadLogs();
    onRefresh();
  };

  const markAsMissed = async (dose: ScheduledDose) => {
    const scheduledDateTime = new Date(selectedDate);
    scheduledDateTime.setHours(12, 0, 0, 0);

    if (dose.log) {
      const { error } = await supabase
        .from('medication_logs')
        .update({
          missed_at: new Date().toISOString(),
          status: 'missed_taken',
        })
        .eq('id', dose.log.id);

      if (error) {
        console.error('Error updating log:', error);
        return;
      }
    } else {
      const { error } = await supabase.from('medication_logs').insert({
        medication_id: dose.medication.id,
        scheduled_time: scheduledDateTime.toISOString(),
        meal_period: dose.mealPeriod,
        missed_at: new Date().toISOString(),
        status: 'missed_taken',
      });

      if (error) {
        console.error('Error creating log:', error);
        return;
      }
    }

    await loadLogs();
    onRefresh();
  };

  const markAsSkipped = async (dose: ScheduledDose) => {
    const scheduledDateTime = new Date(selectedDate);
    scheduledDateTime.setHours(12, 0, 0, 0);

    if (dose.log) {
      const { error } = await supabase
        .from('medication_logs')
        .update({
          status: 'skipped',
        })
        .eq('id', dose.log.id);

      if (error) {
        console.error('Error updating log:', error);
        return;
      }
    } else {
      const { error } = await supabase.from('medication_logs').insert({
        medication_id: dose.medication.id,
        scheduled_time: scheduledDateTime.toISOString(),
        meal_period: dose.mealPeriod,
        status: 'skipped',
      });

      if (error) {
        console.error('Error creating log:', error);
        return;
      }
    }

    await loadLogs();
    onRefresh();
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  const getMealPeriodLabel = (mealPeriod: MealPeriod): string => {
    return MEAL_PERIODS.find(p => p.value === mealPeriod)?.label || mealPeriod;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <Calendar className="w-5 h-5 text-gray-600" />
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {isToday && (
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            Today
          </span>
        )}
      </div>

      {scheduledDoses.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500">No medications scheduled for this day</p>
        </div>
      ) : (
        <div className="space-y-6">
          {MEAL_PERIODS.map((period) => {
            const dosesForPeriod = scheduledDoses.filter(
              (dose) => dose.mealPeriod === period.value
            );

            if (dosesForPeriod.length === 0) return null;

            return (
              <div key={period.value}>
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  {period.label}
                </h3>
                <div className="space-y-3">
                  {dosesForPeriod.map((dose, index) => {
                    const status = dose.log?.status;
                    const isDone = status === 'taken' || status === 'skipped' || status === 'missed_taken';

                    return (
                      <div
                        key={`${dose.medication.id}-${dose.mealPeriod}-${index}`}
                        className={`bg-white rounded-lg border-2 p-4 transition-all ${
                          status === 'taken'
                            ? 'border-green-200 bg-green-50'
                            : status === 'skipped'
                            ? 'border-gray-300 bg-gray-50'
                            : status === 'missed_taken'
                            ? 'border-yellow-200 bg-yellow-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">
                                {dose.medication.name}
                              </h4>
                              <p className="text-sm text-gray-600">{dose.medication.dosage}</p>
                              {dose.medication.notes && (
                                <p className="text-xs text-gray-500 mt-1 italic">
                                  {dose.medication.notes}
                                </p>
                              )}
                              {status === 'taken' && dose.log?.taken_at && (
                                <p className="text-xs text-green-600 mt-2 font-medium">
                                  ✓ Taken at{' '}
                                  {new Date(dose.log.taken_at).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                              )}
                              {status === 'missed_taken' && dose.log?.missed_at && (
                                <p className="text-xs text-yellow-600 mt-2 font-medium">
                                  ⚠ Taken late at{' '}
                                  {new Date(dose.log.missed_at).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                              )}
                              {status === 'skipped' && (
                                <p className="text-xs text-gray-600 mt-2 font-medium">
                                  ⊘ Skipped
                                </p>
                              )}
                            </div>
                          </div>
                          {!isDone && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => markAsTaken(dose)}
                                className="flex-1 px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 bg-green-600 text-white hover:bg-green-700 active:scale-95"
                              >
                                <Check className="w-4 h-4" />
                                Take
                              </button>
                              <button
                                onClick={() => markAsMissed(dose)}
                                className="flex-1 px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 bg-yellow-600 text-white hover:bg-yellow-700 active:scale-95"
                              >
                                Missed
                              </button>
                              <button
                                onClick={() => markAsSkipped(dose)}
                                className="flex-1 px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 bg-gray-600 text-white hover:bg-gray-700 active:scale-95"
                              >
                                Skip
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
