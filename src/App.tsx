import { useState, useEffect } from 'react';
import { Plus, Pill, Calendar, LogOut, Bell } from 'lucide-react';
import { supabase, Medication, Profile, Appointment } from './lib/supabase';
import { Auth } from './components/Auth';
import { AddMedicationModal } from './components/AddMedicationModal';
import { MedicationCard } from './components/MedicationCard';
import { TimetableView } from './components/TimetableView';
import { ProfileSelector } from './components/ProfileSelector';
import { AddProfileModal } from './components/AddProfileModal';
import { AppointmentsView } from './components/AppointmentsView';
import { AddAppointmentModal } from './components/AddAppointmentModal';

type View = 'medications' | 'timetable' | 'appointments';

function App() {
  const [view, setView] = useState<View>('timetable');
  const [user, setUser] = useState<any>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    checkUser();
    checkNotificationPermission();
  }, []);

  useEffect(() => {
    if (user) {
      loadProfiles();
    }
  }, [user]);

  useEffect(() => {
    if (currentProfile) {
      loadMedications();
      setupMedicationReminders();
    }
  }, [currentProfile]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);

    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
  };

  const checkNotificationPermission = () => {
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === 'granted');
      if (permission === 'granted') {
        new Notification('MedTracker Notifications Enabled', {
          body: 'You will receive reminders for your medications.',
          icon: '/pill-icon.png',
        });
      }
    }
  };

  const loadProfiles = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true });

    if (!error && data) {
      setProfiles(data);
      if (!currentProfile && data.length > 0) {
        setCurrentProfile(data[0]);
      }
    }
  };

  const loadMedications = async () => {
    if (!currentProfile) return;

    const { data, error } = await supabase
      .from('medications')
      .select('*')
      .eq('profile_id', currentProfile.id)
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setMedications(data);
    }
  };

  const setupMedicationReminders = () => {
    if (!notificationsEnabled || !currentProfile) return;

    const checkMedications = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      medications.forEach((medication) => {
        if (medication.meal_times) {
          medication.meal_times.forEach((mealPeriod) => {
            const reminderTime = getMealPeriodTime(mealPeriod);
            if (reminderTime && currentHour === reminderTime.hour && currentMinute === reminderTime.minute) {
              new Notification(`Time to take ${medication.name}`, {
                body: `${mealPeriod.replace('_', ' ')} - ${medication.dosage}`,
                icon: '/pill-icon.png',
                tag: `${medication.id}-${mealPeriod}`,
              });
            }
          });
        }
      });
    };

    const interval = setInterval(checkMedications, 60000);
    return () => clearInterval(interval);
  };

  const getMealPeriodTime = (mealPeriod: string): { hour: number; minute: number } | null => {
    const timings: Record<string, { hour: number; minute: number }> = {
      before_breakfast: { hour: 7, minute: 0 },
      after_breakfast: { hour: 9, minute: 0 },
      before_lunch: { hour: 12, minute: 0 },
      after_lunch: { hour: 14, minute: 0 },
      before_dinner: { hour: 18, minute: 0 },
      after_dinner: { hour: 20, minute: 0 },
      before_sleep: { hour: 22, minute: 0 },
    };
    return timings[mealPeriod] || null;
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setCurrentProfile(null);
    setProfiles([]);
    setMedications([]);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this medication?')) {
      return;
    }

    const { error } = await supabase
      .from('medications')
      .update({ active: false })
      .eq('id', id);

    if (!error) {
      loadMedications();
    }
  };

  const handleEdit = (medication: Medication) => {
    setEditingMedication(medication);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingMedication(null);
  };

  const handleAppointmentModalClose = () => {
    setShowAppointmentModal(false);
    setEditingAppointment(null);
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setShowAppointmentModal(true);
  };

  const handleModalSuccess = () => {
    loadMedications();
    handleModalClose();
  };

  if (!user) {
    return <Auth onSuccess={() => {}} />;
  }

  if (profiles.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Pill className="w-9 h-9 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading your profile...</h2>
          <p className="text-gray-600">Please wait</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Pill className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">MedTracker</h1>
            </div>
            <div className="flex items-center gap-3">
              {!notificationsEnabled && (
                <button
                  onClick={requestNotificationPermission}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors text-sm font-medium"
                >
                  <Bell className="w-4 h-4" />
                  Enable Reminders
                </button>
              )}
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between ml-[60px]">
            <ProfileSelector
              profiles={profiles}
              currentProfile={currentProfile}
              onSelectProfile={(profile) => setCurrentProfile(profile)}
              onAddProfile={() => setShowProfileModal(true)}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setView('timetable')}
              className={`flex-1 px-6 py-4 font-medium transition-colors flex items-center justify-center gap-2 ${
                view === 'timetable'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Calendar className="w-5 h-5" />
              Timetable
            </button>
            <button
              onClick={() => setView('medications')}
              className={`flex-1 px-6 py-4 font-medium transition-colors flex items-center justify-center gap-2 ${
                view === 'medications'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Pill className="w-5 h-5" />
              Medications
            </button>
            <button
              onClick={() => setView('appointments')}
              className={`flex-1 px-6 py-4 font-medium transition-colors flex items-center justify-center gap-2 ${
                view === 'appointments'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Calendar className="w-5 h-5" />
              Appointments
            </button>
          </div>

          <div className="p-6">
            {view === 'timetable' ? (
              <TimetableView medications={medications} onRefresh={loadMedications} />
            ) : view === 'appointments' ? (
              currentProfile && (
                <AppointmentsView
                  profileId={currentProfile.id}
                  onAddAppointment={() => setShowAppointmentModal(true)}
                  onEditAppointment={handleEditAppointment}
                />
              )
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {medications.length} {medications.length === 1 ? 'Medication' : 'Medications'}
                  </h2>
                  <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                  >
                    <Plus className="w-5 h-5" />
                    Add Medication
                  </button>
                </div>

                {medications.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Pill className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 mb-4">No medications added yet</p>
                    <button
                      onClick={() => setShowModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      <Plus className="w-5 h-5" />
                      Add Your First Medication
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {medications.map((medication) => (
                      <MedicationCard
                        key={medication.id}
                        medication={medication}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {view === 'timetable' && medications.length > 0 && (
          <button
            onClick={() => setView('medications')}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Manage Medications
          </button>
        )}
      </div>

      {showModal && currentProfile && (
        <AddMedicationModal
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
          editMedication={editingMedication}
          profileId={currentProfile.id}
        />
      )}

      {showProfileModal && user && (
        <AddProfileModal
          onClose={() => setShowProfileModal(false)}
          onSuccess={() => {
            loadProfiles();
            setShowProfileModal(false);
          }}
          userId={user.id}
        />
      )}

      {showAppointmentModal && currentProfile && (
        <AddAppointmentModal
          onClose={handleAppointmentModalClose}
          onSuccess={() => {
            handleAppointmentModalClose();
          }}
          editAppointment={editingAppointment}
          profileId={currentProfile.id}
        />
      )}
    </div>
  );
}

export default App;
