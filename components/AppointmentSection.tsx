import React, { useState, useMemo } from 'react';
import { Service, Appointment } from '../src/Types';
import * as api from '../src/Api';
import { IconClock, IconCalendar, IconUser } from './Icons';

interface AppointmentSectionProps {
  services: Service[];
  appointments: Partial<Appointment>[];
  onBook: (appointment: Appointment) => void;
  centerId: string;
}

const AppointmentSection: React.FC<AppointmentSectionProps> = ({ services, appointments, onBook, centerId }) => {
  const [selectedService, setSelectedService] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientId, setPatientId] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const activeServices = services.filter(s => !s.isPaused);

  const availableSlots = useMemo(() => {
    if (!selectedService || !selectedDate) return null;
    const service = services.find(s => s.id === selectedService);
    if (!service) return null;

    const slotsTaken = appointments.filter(a => a.serviceId === selectedService && a.date === selectedDate).length;
    return Math.max(0, service.dailyCapacity - slotsTaken);
  }, [selectedService, selectedDate, services, appointments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedDate) return;

    const service = services.find(s => s.id === selectedService);
    if (!service) return;

    // Calculate dynamic time
    const slotsTaken = appointments.filter(a => a.serviceId === selectedService && a.date === selectedDate).length;
    const interval = service.intervalMinutes || 30;
    const startStr = service.startTime || '07:00 AM';

    // Parse start time
    const [timeStr, modifier] = startStr.split(' ');
    let [hours, minutes] = timeStr.split(':').map(Number);
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;

    // Add interval * slotsTaken
    const totalMinutes = (hours * 60) + minutes + (slotsTaken * interval);

    // Convert back to string
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMinutes = totalMinutes % 60;
    const newModifier = newHours >= 12 ? 'PM' : 'AM';
    const displayHours = newHours % 12 || 12;
    const calculatedTime = `${displayHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')} ${newModifier}`;

    setLoading(true);
    const newAppointment: Appointment = {
      id: crypto.randomUUID(),
      centerId,
      serviceId: selectedService,
      patientName,
      patientId,
      patientPhone,
      date: selectedDate,
      time: calculatedTime,
      status: 'pending'
    };

    try {
      await api.createAppointment(newAppointment);

      // Mask identity for local update to maintain privacy in UI
      const maskedApp = {
        ...newAppointment,
        patientName: `${patientName.split(' ')[0]} ${patientId.slice(0, 2)}...${patientId.slice(-2)}`
      };

      onBook(maskedApp);
      setSuccessMsg('¡Cita agendada con éxito! Por favor acuda al centro el día seleccionado.');
      setPatientName('');
      setPatientId('');
      setPatientPhone('');
      setSelectedDate('');
      setSelectedService('');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (error: any) {
      console.error(error);
      if (error.message && error.message.includes('Límite excedido')) {
        alert('⚠️ Has alcanzado el límite máximo de 5 citas por hoy. Por favor intenta nuevamente en 24 horas.');
      } else {
        alert('Error al agendar la cita. Intente nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const publicList = appointments
    .filter(a => a.date && new Date(a.date) >= new Date(new Date().setHours(0, 0, 0, 0)))
    .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime())
    .slice(0, 5);

  return (
    <section className="max-w-6xl mx-auto px-6 py-12">
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-cyan-400/20 p-3 rounded-2xl border border-cyan-400/30">
          <IconCalendar className="w-8 h-8 text-cyan-400" />
        </div>
        <div>
          <h2 className="text-3xl font-black text-white">Agendar Cita</h2>
          <p className="text-white/60">Reserve su turno de atención médica</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
        <div className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl shadow-xl">
          {successMsg ? (
            <div className="bg-green-50 text-green-700 p-6 rounded-2xl text-center animate-fade-in">
              <div className="text-4xl mb-2">✅</div>
              <p className="font-bold text-lg">{successMsg}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-white/80 mb-2">Especialidad / Servicio</label>
                <select
                  value={selectedService}
                  onChange={e => setSelectedService(e.target.value)}
                  className="w-full bg-white/5 border border-white/20 rounded-xl p-4 text-white outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all"
                  required
                >
                  <option value="">Seleccione un servicio...</option>
                  {activeServices.map(s => (
                    <option key={s.id} value={s.id}>{s.name} (Capacidad: {s.dailyCapacity})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-white/80 mb-2">Fecha</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full bg-white/5 border border-white/20 rounded-xl p-4 text-white outline-none focus:ring-2 focus:ring-cyan-400/50"
                    required
                  />
                </div>
                <div className="bg-cyan-500/10 rounded-xl p-4 flex flex-col justify-center items-center text-center border border-cyan-400/30">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Cupos Disponibles</span>
                  <span className={`text-3xl font-black ${availableSlots === 0 ? 'text-red-400' : 'text-cyan-300'}`}>
                    {availableSlots !== null ? availableSlots : '-'}
                  </span>
                </div>
              </div>

              {/* Dynamic Time Display */}
              {selectedService && selectedDate && availableSlots !== null && availableSlots > 0 && (
                <div className="bg-cyan-500/10 p-4 rounded-xl border border-cyan-400/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-cyan-400/20 p-2 rounded-lg text-cyan-400">
                      <IconClock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-cyan-400 font-bold uppercase">Hora Estimada de Atención</p>
                      <p className="text-xl font-black text-cyan-300">
                        {(() => {
                          const service = services.find(s => s.id === selectedService);
                          if (!service) return '--:--';

                          const slotsTaken = appointments.filter(a => a.serviceId === selectedService && a.date === selectedDate).length;
                          const interval = service.intervalMinutes || 30;
                          const startStr = service.startTime || '07:00 AM';

                          // Parse start time
                          const [time, modifier] = startStr.split(' ');
                          let [hours, minutes] = time.split(':').map(Number);
                          if (modifier === 'PM' && hours < 12) hours += 12;
                          if (modifier === 'AM' && hours === 12) hours = 0;

                          // Add interval * slotsTaken
                          const totalMinutes = (hours * 60) + minutes + (slotsTaken * interval);

                          // Convert back to string
                          const newHours = Math.floor(totalMinutes / 60) % 24;
                          const newMinutes = totalMinutes % 60;
                          const newModifier = newHours >= 12 ? 'PM' : 'AM';
                          const displayHours = newHours % 12 || 12;

                          return `${displayHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')} ${newModifier}`;
                        })()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-cyan-400/70">Intervalo por paciente</p>
                    <p className="font-bold text-cyan-300">{services.find(s => s.id === selectedService)?.intervalMinutes || 30} min</p>
                  </div>
                </div>
              )}

              <div className="space-y-4 pt-4 border-t border-white/10">
                <input
                  type="text"
                  placeholder="Nombre Completo del Paciente"
                  value={patientName}
                  onChange={e => setPatientName(e.target.value)}
                  className="w-full bg-white/5 border border-white/20 rounded-xl p-4 text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-cyan-400/50"
                  required
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Cédula / ID"
                    value={patientId}
                    onChange={e => setPatientId(e.target.value)}
                    className="w-full bg-white/5 border border-white/20 rounded-xl p-4 text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-cyan-400/50"
                    required
                  />
                  <input
                    type="tel"
                    placeholder="Teléfono"
                    value={patientPhone}
                    onChange={e => setPatientPhone(e.target.value)}
                    className="w-full bg-white/5 border border-white/20 rounded-xl p-4 text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-cyan-400/50"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || availableSlots === 0}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-4 rounded-xl font-bold text-lg hover:from-cyan-400 hover:to-blue-400 transition-all shadow-lg shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Procesando...' : availableSlots === 0 ? 'Sin Cupos' : 'CONFIRMAR CITA'}
              </button>
            </form>
          )}
        </div>

        <div>
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <IconClock className="w-6 h-6 text-white/40" />
            Próximos Turnos Ocupados
          </h3>
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-lg overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="p-4 text-xs font-bold text-white/50 uppercase">Estado</th>
                  <th className="p-4 text-xs font-bold text-white/50 uppercase">Servicio</th>
                  <th className="p-4 text-xs font-bold text-white/50 uppercase">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {publicList.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-white/40 italic">No hay citas próximas registradas.</td>
                  </tr>
                ) : (
                  publicList.map((app, idx) => {
                    const srv = services.find(s => s.id === app.serviceId);
                    return (
                      <tr key={idx} className="border-b border-white/10 last:border-0 hover:bg-white/5 transition-colors">
                        <td className="p-4 font-bold text-white/80">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                            <span className="text-white/50 text-xs uppercase tracking-wider font-bold">{app.patientName || 'Reservado'}</span>
                          </div>
                        </td>
                        <td className="p-4 text-white/70 font-medium">{srv?.name || 'Servicio General'}</td>
                        <td className="p-4 text-white/50 text-sm">
                          {app.date} <span className="text-white/30 mx-1">|</span> {app.time}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-6 bg-cyan-500/10 p-6 rounded-2xl border border-cyan-400/30">
            <h4 className="font-bold text-cyan-300 mb-2 flex items-center gap-2">
              <IconUser className="w-5 h-5" />
              Privacidad del Paciente
            </h4>
            <p className="text-sm text-cyan-400/70 leading-relaxed">
              Por seguridad, los nombres de los pacientes no se muestran públicamente. Solo el personal administrativo autorizado tiene acceso a los datos personales.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppointmentSection;
