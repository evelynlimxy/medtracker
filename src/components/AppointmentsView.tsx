import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Plus, CreditCard as Edit, Trash2 } from 'lucide-react';
import { supabase, Appointment } from '../lib/supabase';

interface AppointmentsViewProps {
  profileId: string;
  onAddAppointment: () => void;
  onEditAppointment: (appointment: Appointment) => void;
}

export function AppointmentsView({
  profileId,
  onAddAppointment,
  onEditAppointment,
}: AppointmentsViewProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    loadAppointments();
  }, [profileId]);

  const loadAppointments = async () => {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('profile_id', profileId)
      .order('appointment_date', { ascending: true });

    if (!error && data) {
      setAppointments(data);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this appointment?')) {
      return;
    }

    const { error } = await supabase.from('appointments').delete().eq('id', id);

    if (!error) {
      loadAppointments();
    }
  };

  const isUpcoming = (date: string) => {
    return new Date(date) >= new Date(new Date().setHours(0, 0, 0, 0));
  };

  const isPast = (date: string) => {
    return new Date(date) < new Date(new Date().setHours(0, 0, 0, 0));
  };

  const upcomingAppointments = appointments.filter((apt) => isUpcoming(apt.appointment_date));
  const pastAppointments = appointments.filter((apt) => isPast(apt.appointment_date));

  return (
    <div className="space-y-6">
      {appointments.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 mb-4">No appointments scheduled</p>
          <button
            onClick={onAddAppointment}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Add Your First Appointment
          </button>
        </div>
      ) : (
        <>
          {upcomingAppointments.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Upcoming</h3>
              <div className="space-y-3">
                {upcomingAppointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    onEdit={() => onEditAppointment(appointment)}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}

          {pastAppointments.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-500 mb-3">Past</h3>
              <div className="space-y-3 opacity-60">
                {pastAppointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    onEdit={() => onEditAppointment(appointment)}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function AppointmentCard({
  appointment,
  onEdit,
  onDelete,
}: {
  appointment: Appointment;
  onEdit: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 p-4 hover:border-blue-300 transition-all">
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-semibold text-gray-900 text-lg">{appointment.title}</h4>
        <div className="flex gap-1">
          <button
            onClick={onEdit}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(appointment.id)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>{new Date(appointment.appointment_date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}</span>
        </div>

        {appointment.appointment_time && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>{appointment.appointment_time}</span>
          </div>
        )}

        {appointment.location && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4" />
            <span>{appointment.location}</span>
          </div>
        )}

        {appointment.notes && (
          <p className="text-sm text-gray-500 mt-2 italic">{appointment.notes}</p>
        )}
      </div>
    </div>
  );
}
