import { supabase } from './supabaseClient';
import { NewsItem, Doctor, Service, Appointment, HealthCenter, TreatedPatient } from './Types';

// --- Auth API ---
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
};

export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const registerAdminForCenter = async (userId: string, centerId: string) => {
  const { error } = await supabase.from('center_admins').insert({ user_id: userId, center_id: centerId });
  if (error) throw error;
};

export const getUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// --- System Check ---
export const checkSystemStatus = async (): Promise<'OK' | 'MISSING_TABLES' | 'AUTH_ERROR' | 'CONNECTION_ERROR'> => {
  try {
    const { error, data, status } = await supabase.from('centers').select('id').limit(1);

    if (error) {
      console.error("Supabase Check Error:", error);
      if (error.code === '42P01' || error.message?.toLowerCase().includes('does not exist')) return 'MISSING_TABLES';
      if (error.code === 'PGRST301' || status === 401 || error.message?.includes('JWT')) return 'AUTH_ERROR';
      return 'CONNECTION_ERROR';
    }

    if (!data || data.length === 0) return 'MISSING_TABLES';
    return 'OK';
  } catch (e: any) {
    console.error("Critical Connection Error:", e.message || e);
    return 'CONNECTION_ERROR';
  }
};

// --- Centers API ---
export const fetchCenters = async (): Promise<HealthCenter[]> => {
  const { data, error } = await supabase.from('centers').select('*');
  if (error) { console.error("Error fetching centers:", error.message); return []; }
  return data || [];
};

// --- News API ---
export const fetchNews = async (centerId: string): Promise<NewsItem[]> => {
  const { data, error } = await supabase.from('news').select('*').eq('center_id', centerId).order('created_at', { ascending: false });
  if (error) { console.error("Error fetching news:", error.message); return []; }
  return (data || []).map(item => ({
    ...item, centerId: item.center_id, mediaUrl: item.media_url, mediaType: item.media_type, createdAt: item.created_at, expiresAt: item.expires_at,
  }));
};

export const createNews = async (item: NewsItem): Promise<void> => {
  const { error } = await supabase.from('news').insert({
    id: item.id, center_id: item.centerId, title: item.title, content: item.content, media_url: item.mediaUrl, media_type: item.mediaType, created_at: item.createdAt, expires_at: item.expiresAt,
  });
  if (error) throw error;
};

export const deleteNews = async (id: string): Promise<void> => {
  const { error } = await supabase.from('news').delete().eq('id', id);
  if (error) throw error;
};

// --- Doctors API ---
export const fetchDoctors = async (centerId: string): Promise<Doctor[]> => {
  const { data, error } = await supabase.from('doctors').select('*').eq('center_id', centerId);
  if (error) { console.error("Error fetching doctors:", error.message); return []; }
  return (data || []).map(item => ({ ...item, centerId: item.center_id, imageUrl: item.image_url }));
};

export const createDoctor = async (item: Doctor): Promise<void> => {
  const { error } = await supabase.from('doctors').insert({
    id: item.id, center_id: item.centerId, name: item.name, specialty: item.specialty, description: item.description, image_url: item.imageUrl,
  });
  if (error) throw error;
};

export const deleteDoctor = async (id: string): Promise<void> => {
  const { error } = await supabase.from('doctors').delete().eq('id', id);
  if (error) throw error;
};

// --- Services API ---
export const fetchServices = async (centerId: string): Promise<Service[]> => {
  const { data, error } = await supabase.from('services').select('*').eq('center_id', centerId);
  if (error) { console.error("Error fetching services:", error.message); return []; }
  return (data || []).map(item => ({ ...item, centerId: item.center_id, allowedDays: item.allowed_days, dailyCapacity: item.daily_capacity, isPaused: item.is_paused, startTime: item.start_time, intervalMinutes: item.interval_minutes }));
};

export const createService = async (item: Service): Promise<void> => {
  const { error } = await supabase.from('services').insert({
    id: item.id, center_id: item.centerId, name: item.name, allowed_days: item.allowedDays, daily_capacity: item.dailyCapacity, is_paused: item.isPaused, start_time: item.startTime, interval_minutes: item.intervalMinutes
  });
  if (error) throw error;
};

export const updateService = async (id: string, updates: Partial<Service>): Promise<void> => {
  const dbUpdates: any = {};
  if (updates.isPaused !== undefined) dbUpdates.is_paused = updates.isPaused;
  const { error } = await supabase.from('services').update(dbUpdates).eq('id', id);
  if (error) throw error;
};

export const deleteService = async (id: string): Promise<void> => {
  const { error } = await supabase.from('services').delete().eq('id', id);
  if (error) throw error;
};

// --- Appointments API ---

// ADMIN ONLY: Fetch full appointment details
export const fetchAppointments = async (centerId: string): Promise<Appointment[]> => {
  const { data, error } = await supabase.from('appointments').select('*').eq('center_id', centerId);
  if (error) {
    console.error("Error fetching appointments (Admin):", error.message);
    return [];
  }
  return (data || []).map(item => ({
    ...item, centerId: item.center_id, serviceId: item.service_id, patientName: item.patient_name, patientId: item.patient_id, patientPhone: item.patient_phone, status: item.status,
  }));
};

// PUBLIC: Fetch only occupied slots (Anonymous) via RPC
export const fetchPublicAppointments = async (centerId: string): Promise<Partial<Appointment>[]> => {
  const { data, error } = await supabase.rpc('get_public_appointments', { target_center_id: centerId });

  if (error) {
    console.error("Error fetching public appointments:", error.message);
    return [];
  }

  // Map RPC result to partial Appointment objects
  return (data || []).map((item: any) => ({
    serviceId: item.service_id,
    date: item.appt_date, // Mapeo corregido
    time: item.appt_time, // Mapeo corregido
    patientName: item.masked_identity, // Usamos patientName para mostrar la identidad enmascarada en la UI pública
  }));
};

export const createAppointment = async (item: Appointment): Promise<void> => {
  const { error } = await supabase.from('appointments').insert({
    id: item.id, center_id: item.centerId, service_id: item.serviceId, patient_name: item.patientName, patient_id: item.patientId, patient_phone: item.patientPhone, date: item.date, time: item.time, status: item.status,
  });
  if (error) throw error;
};

export const deleteAppointment = async (id: string): Promise<void> => {
  const { error } = await supabase.from('appointments').delete().eq('id', id);
  if (error) throw error;
};

// --- Treated Patients API ---
export const fetchTreatedPatients = async (centerId: string): Promise<TreatedPatient[]> => {
  const { data, error } = await supabase.from('treated_patients').select('*').eq('center_id', centerId).order('treated_at', { ascending: false });
  if (error) { console.error("Error fetching history:", error.message); return []; }
  return (data || []).map(item => ({
    ...item, centerId: item.center_id, patientName: item.patient_name, patientId: item.patient_id, patientPhone: item.patient_phone, serviceName: item.service_name, treatedAt: item.treated_at,
  }));
};

export const markAsTreated = async (appointment: Appointment, serviceName: string): Promise<void> => {
  const { error: insertError } = await supabase.from('treated_patients').insert({
    id: crypto.randomUUID(), center_id: appointment.centerId, patient_name: appointment.patientName, patient_id: appointment.patientId, patient_phone: appointment.patientPhone, service_name: serviceName, treated_at: new Date().toISOString(), notes: `Atendido desde cita del ${appointment.date}`
  });
  if (insertError) throw insertError;
  await deleteAppointment(appointment.id);
};

export const deleteTreatedPatient = async (id: string): Promise<void> => {
  const { error } = await supabase.from('treated_patients').delete().eq('id', id);
  if (error) throw error;
};
