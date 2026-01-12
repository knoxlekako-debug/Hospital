export interface HealthCenter {
  id: string;
  name: string;
  location: string;
  primaryColor?: string;
  city?: string;
  uuid?: string;
  theme_preset?: 'clinical' | 'vascular' | 'xray';
}

export interface NewsItem {
  id: string;
  centerId: string;
  title: string;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  createdAt: number;
  expiresAt: number;
}

export interface Doctor {
  id: string;
  centerId: string;
  name: string;
  specialty: string;
  description: string;
  imageUrl: string;
}

export interface Service {
  id: string;
  centerId: string;
  name: string;
  allowedDays: number[];
  dailyCapacity: number;
  isPaused: boolean;
  startTime?: string; // e.g. "07:00 AM"
  intervalMinutes?: number; // e.g. 30
}

export interface Appointment {
  id: string;
  centerId: string;
  serviceId: string;
  patientName: string;
  patientId: string;
  patientPhone: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'treated';
}

export interface TreatedPatient {
  id: string;
  centerId: string;
  patientName: string;
  patientId: string;
  patientPhone: string;
  serviceName: string;
  treatedAt: string; // ISO Date
  notes?: string;
}

export interface AdminTenure {
  user_id: string;
  center_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  start_date: string; // ISO Date
  end_date?: string; // ISO Date, null if active
  is_active: boolean;
  days_in_office: number;
}

export const DAYS_OF_WEEK = [
  'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
];
