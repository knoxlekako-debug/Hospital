import React, { useState, useEffect } from 'react';
import { AdminTenure, HealthCenter } from '../src/Types';
import { supabase } from '../src/supabaseClient';
import { IconUser, IconTrash } from './Icons';
import Spinner from './Spinner';

interface AdminTeamManagementProps {
  activeCenter: HealthCenter;
}

const AdminTeamManagement: React.FC<AdminTeamManagementProps> = ({ activeCenter }) => {
  const [admins, setAdmins] = useState<AdminTenure[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAdmins();
  }, [activeCenter.id]);

  const loadAdmins = async () => {
    setIsLoading(true);
    setError('');
    try {
      const { data, error } = await supabase
        .from('view_admin_tenure')
        .select('*')
        .eq('center_id', activeCenter.id)
        .order('is_active', { ascending: false });

      if (error) throw error;
      setAdmins(data || []);
    } catch (err: any) {
      console.error('Error loading admins:', err);
      setError('Error al cargar el equipo administrativo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeAdmin = async (admin: AdminTenure) => {
    if (!confirm(`¿Estás seguro de dar de baja a ${admin.first_name} ${admin.last_name}?`)) {
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.rpc('revoke_admin_role', {
        target_user_id: admin.user_id,
        target_center_id: activeCenter.id
      });

      if (error) throw error;
      await loadAdmins();
    } catch (err: any) {
      console.error('Error revoking admin:', err);
      alert('Error al dar de baja al administrador');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="bg-slate-900 text-white min-h-screen p-8">
      <header className="mb-10 flex items-center justify-between border-b border-slate-700 pb-6">
        <div className="flex items-center gap-4">
          <IconUser className="w-10 h-10 text-blue-500" />
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter">EQUIPO <span className="text-blue-500">ADMIN</span></h1>
            <p className="text-slate-400 text-xs">Centro Activo: <span className="text-blue-400 font-bold uppercase">{activeCenter.name}</span></p>
          </div>
        </div>
      </header>

      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 p-4 rounded-xl mb-6">
          {error}
        </div>
      )}

      <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-xl">
        <h2 className="text-xl font-bold mb-6">Historial de Administradores</h2>

        {admins.length === 0 ? (
          <p className="text-center text-slate-500 py-10 italic">No hay administradores registrados.</p>
        ) : (
          <div className="space-y-4">
            {admins.map((admin) => (
              <div key={admin.user_id} className="bg-slate-700/50 p-6 rounded-2xl border border-slate-600/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-600/20 p-3 rounded-2xl text-blue-400">
                    <IconUser className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-slate-100">
                      {admin.first_name} {admin.last_name}
                    </h4>
                    <p className="text-slate-400 text-sm">{admin.phone}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${admin.is_active
                        ? 'bg-green-600/20 text-green-400 border border-green-600/30'
                        : 'bg-slate-600/20 text-slate-400 border border-slate-600/30'
                        }`}>
                        {admin.is_active ? 'ACTIVO' : 'HISTÓRICO'}
                      </span>
                      <span className="text-xs text-slate-400">
                        {admin.days_in_office} días en el cargo
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Inicio: {new Date(admin.start_date).toLocaleDateString()}
                      {admin.end_date && ` - Fin: ${new Date(admin.end_date).toLocaleDateString()}`}
                    </div>
                  </div>
                </div>

                {admin.is_active && (
                  <button
                    onClick={() => handleRevokeAdmin(admin)}
                    className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2"
                  >
                    <IconTrash className="w-4 h-4" />
                    DAR DE BAJA
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTeamManagement;