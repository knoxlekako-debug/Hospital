import React from 'react';
import { IconDatabase } from './Icons';

const SetupRequired: React.FC = () => {
  const sqlScript = `
-- 1. LIMPIEZA TOTAL
DROP TABLE IF EXISTS treated_patients CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS doctors CASCADE;
DROP TABLE IF EXISTS news CASCADE;
DROP TABLE IF EXISTS centers CASCADE;

-- 2. TABLA DE CENTROS
CREATE TABLE centers (
  id text PRIMARY KEY,
  name text NOT NULL,
  location text NOT NULL,
  primary_color text DEFAULT '#0ea5e9'
);

-- 3. INSERTAR CENTRO INICIAL
INSERT INTO centers (id, name, location, primary_color) 
VALUES ('baraure', 'CDI BARAURE CENTER', 'Baraure, Araure, Edo. Portuguesa', '#0ea5e9');

-- 4. TABLA DE NOTICIAS
CREATE TABLE news (
  id text PRIMARY KEY,
  center_id text NOT NULL REFERENCES centers(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  media_url text,
  media_type text,
  created_at bigint NOT NULL,
  expires_at bigint NOT NULL
);

-- 5. TABLA DE DOCTORES
CREATE TABLE doctors (
  id text PRIMARY KEY,
  center_id text NOT NULL REFERENCES centers(id) ON DELETE CASCADE,
  name text NOT NULL,
  specialty text NOT NULL,
  description text NOT NULL,
  image_url text
);

-- 6. TABLA DE SERVICIOS
CREATE TABLE services (
  id text PRIMARY KEY,
  center_id text NOT NULL REFERENCES centers(id) ON DELETE CASCADE,
  name text NOT NULL,
  allowed_days jsonb NOT NULL DEFAULT '[]'::jsonb,
  daily_capacity int NOT NULL DEFAULT 15,
  is_paused boolean NOT NULL DEFAULT false
);

-- 7. TABLA DE CITAS
CREATE TABLE appointments (
  id text PRIMARY KEY,
  center_id text NOT NULL REFERENCES centers(id) ON DELETE CASCADE,
  service_id text NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  patient_name text NOT NULL,
  patient_id text NOT NULL,
  patient_phone text NOT NULL,
  date text NOT NULL,
  time text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
);

-- 8. TABLA DE PACIENTES TRATADOS (HISTORIAL)
CREATE TABLE treated_patients (
  id text PRIMARY KEY,
  center_id text NOT NULL REFERENCES centers(id) ON DELETE CASCADE,
  patient_name text NOT NULL,
  patient_id text NOT NULL,
  patient_phone text NOT NULL,
  service_name text NOT NULL,
  treated_at timestamp with time zone DEFAULT now(),
  notes text
);

-- 9. SEGURIDAD (RLS)
ALTER TABLE centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE treated_patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read" ON centers FOR SELECT USING (true);
CREATE POLICY "Public Read News" ON news FOR SELECT USING (true);
CREATE POLICY "Public Read Doctors" ON doctors FOR SELECT USING (true);
CREATE POLICY "Public Read Services" ON services FOR SELECT USING (true);
CREATE POLICY "Public Read Appointments" ON appointments FOR SELECT USING (true);
CREATE POLICY "Public Read History" ON treated_patients FOR SELECT USING (true);
CREATE POLICY "Public Insert Appointments" ON appointments FOR INSERT WITH CHECK (true);

-- Admin Full Control
CREATE POLICY "Admin News" ON news FOR ALL USING (true);
CREATE POLICY "Admin Doctors" ON doctors FOR ALL USING (true);
CREATE POLICY "Admin Services" ON services FOR ALL USING (true);
CREATE POLICY "Admin Appointments" ON appointments FOR ALL USING (true);
CREATE POLICY "Admin Centers" ON centers FOR ALL USING (true);
CREATE POLICY "Admin History" ON treated_patients FOR ALL USING (true);

-- 10. DATOS DE PRUEBA
INSERT INTO services (id, center_id, name, allowed_days, daily_capacity) VALUES 
('s1', 'baraure', 'Medicina General', '[1,2,3,4,5]', 25),
('s2', 'baraure', 'Odontología', '[1,3,5]', 12);

INSERT INTO doctors (id, center_id, name, specialty, description, image_url) VALUES 
('d1', 'baraure', 'Dr. Roberto Méndez', 'Medicina Interna', 'Especialista en diagnóstico clínico avanzado.', 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400');
  `.trim();

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlScript);
    alert('SQL copiado. Pégalo en el SQL Editor de Supabase y presiona RUN.');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-center items-center p-4">
      <div className="max-w-4xl w-full bg-slate-800 rounded-3xl p-8 border border-slate-700 shadow-2xl">
        <IconDatabase className="w-16 h-16 text-blue-500 mb-6" />
        <h1 className="text-3xl font-black mb-4 text-blue-400">Configuración Requerida</h1>
        <p className="text-slate-400 mb-8 leading-relaxed">
          Para que la web funcione, debes crear las tablas en Supabase. Si la web "no carga", lo más probable es que falte ejecutar este código.
        </p>
        <pre className="bg-slate-950 p-6 rounded-xl text-[10px] text-emerald-400 h-64 overflow-y-auto mb-6 border border-slate-700 font-mono">
          <code>{sqlScript}</code>
        </pre>
        <div className="flex flex-col sm:flex-row gap-4">
          <button onClick={handleCopy} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-bold transition-all transform active:scale-95 shadow-lg">
            Copiar SQL y Abrir Editor
          </button>
          <button onClick={() => window.location.reload()} className="bg-slate-700 hover:bg-slate-600 px-8 py-4 rounded-xl font-bold transition-all">
            Ya lo ejecuté, Recargar Web
          </button>
        </div>
      </div>
    </div>
  );
};

export default SetupRequired;