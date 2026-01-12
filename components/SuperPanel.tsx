import React from 'react';
import { useSuperAdmin } from '../hooks/useSuperAdmin';
import { IconSettings } from './Icons';

const SuperPanel: React.FC = () => {
  const isSuperAdmin = useSuperAdmin();
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Simular tiempo de verificación
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    if (!loading && !isSuperAdmin) {
      window.location.href = '/'; // Redirigir al inicio si no es super admin
    }
  }, [isSuperAdmin, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Verificando permisos...</div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <div className="bg-slate-900 text-white min-h-screen p-8">
      <header className="mb-10 flex items-center justify-between border-b border-slate-700 pb-6">
        <div className="flex items-center gap-4">
          <IconSettings className="w-10 h-10 text-red-500" />
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter">PANEL <span className="text-red-500">MAESTRO</span></h1>
            <p className="text-slate-400 text-xs">Control Global del Sistema</p>
          </div>
        </div>
      </header>

      <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-xl">
        <h2 className="text-2xl font-bold mb-6">🔧 Panel Maestro - Control Global</h2>
        <p className="text-slate-400">
          Aquí podrás gestionar configuraciones globales del sistema, supervisar todos los centros,
          y administrar usuarios a nivel sistema.
        </p>
      </div>
    </div>
  );
};

export default SuperPanel;