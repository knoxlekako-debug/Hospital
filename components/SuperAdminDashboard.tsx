import React, { useState, useEffect } from 'react';
import { HealthCenter } from '../src/Types';
import { supabase } from '../src/supabaseClient';
import { IconSettings, IconTrash } from './Icons';

interface SuperAdminDashboardProps {
  onLogout: () => void;
}

interface CenterFormData {
  id: string;
  name: string;
  location: string;
  city: string;
}

const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ onLogout }) => {
  const [centers, setCenters] = useState<HealthCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCenter, setEditingCenter] = useState<HealthCenter | null>(null);
  const [formData, setFormData] = useState<CenterFormData>({
    id: '',
    name: '',
    location: '',
    city: ''
  });

  useEffect(() => {
    loadCenters();
  }, []);

  const loadCenters = async () => {
    try {
      const { data, error } = await supabase
        .from('centers')
        .select('*')
        .order('name');

      if (error) throw error;
      setCenters(data || []);
    } catch (error) {
      console.error('Error loading centers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCenter = async () => {
    if (!formData.id || !formData.name) return;

    try {
      const { error } = await supabase
        .from('centers')
        .insert([{
          id: formData.id,
          name: formData.name,
          location: formData.location,
          city: formData.city
        }]);

      if (error) throw error;

      setShowCreateModal(false);
      setFormData({ id: '', name: '', location: '', city: '' });
      loadCenters();
    } catch (error: any) {
      alert('Error creando centro: ' + error.message);
    }
  };

  const handleUpdateCenter = async () => {
    if (!editingCenter) return;

    try {
      const { error } = await supabase
        .from('centers')
        .update({
          location: formData.location,
          city: formData.city
        })
        .eq('id', editingCenter.id);

      if (error) throw error;

      setEditingCenter(null);
      setFormData({ id: '', name: '', location: '', city: '' });
      loadCenters();
    } catch (error: any) {
      alert('Error actualizando centro: ' + error.message);
    }
  };

  const handleDeleteCenter = async (centerId: string) => {
    if (!confirm('¿Estás seguro de eliminar este centro? Esta acción no se puede deshacer.')) return;

    try {
      const { error } = await supabase
        .from('centers')
        .delete()
        .eq('id', centerId);

      if (error) throw error;
      loadCenters();
    } catch (error: any) {
      alert('Error eliminando centro: ' + error.message);
    }
  };

  const startEdit = (center: HealthCenter) => {
    setEditingCenter(center);
    setFormData({
      id: center.id,
      name: center.name,
      location: center.location,
      city: center.city || ''
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const resetForm = () => {
    setFormData({ id: '', name: '', location: '', city: '' });
    setEditingCenter(null);
    setShowCreateModal(false);
  };

  if (loading) {
    return (
      <div className="bg-slate-900 text-white min-h-screen p-8 flex items-center justify-center">
        <div className="text-xl">Cargando centros...</div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 text-white min-h-screen p-8">
      <header className="mb-10 flex items-center justify-between border-b border-slate-700 pb-6">
        <div className="flex items-center gap-4">
          <IconSettings className="w-10 h-10 text-purple-500" />
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter">PANEL <span className="text-purple-500">SUPER ADMIN</span></h1>
            <p className="text-slate-400 text-xs">Control Total del Sistema</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-full font-bold transition-all"
        >
          Cerrar Sesión
        </button>
      </header>

      <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">🏥 Gestión de Centros Médicos</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"
          >
            <span className="text-lg">+</span>
            Nuevo Centro
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-700">
              <tr>
                <th className="p-4 font-bold">ID (Hash)</th>
                <th className="p-4 font-bold">Nombre</th>
                <th className="p-4 font-bold">Ubicación</th>
                <th className="p-4 font-bold">Ciudad</th>
                <th className="p-4 font-bold">UUID</th>
                <th className="p-4 font-bold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {centers.map((center) => (
                <tr key={center.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                  <td className="p-4 font-mono text-sm">{center.id}</td>
                  <td className="p-4">{center.name}</td>
                  <td className="p-4">{center.location}</td>
                  <td className="p-4">{center.city || '-'}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs bg-slate-600 px-2 py-1 rounded">
                        {center.uuid ? center.uuid.substring(0, 8) + '...' : 'N/A'}
                      </span>
                      {center.uuid && (
                        <button
                          onClick={() => copyToClipboard(center.uuid!)}
                          className="text-slate-400 hover:text-white text-xs"
                          title="Copiar UUID completo"
                        >
                          📋
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(center)}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                      >
                        <span className="text-xs">✏️</span>
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteCenter(center.id)}
                        className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                      >
                        <IconTrash className="w-3 h-3" />
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {centers.length === 0 && (
          <div className="text-center py-10 text-slate-400">
            No hay centros registrados. Crea el primero usando el botón "Nuevo Centro".
          </div>
        )}
      </div>

      {(showCreateModal || editingCenter) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md p-8 border border-slate-700">
            <h3 className="text-xl font-bold mb-6">
              {editingCenter ? 'Editar Centro' : 'Crear Nuevo Centro'}
            </h3>

            <div className="space-y-4">
              {!editingCenter && (
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">ID (Slug)</label>
                  <input
                    type="text"
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-white"
                    placeholder="ej: centro-norte"
                    required
                  />
                </div>
              )}

              {!editingCenter && (
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">Nombre</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-white"
                    placeholder="Nombre del Centro"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Ubicación</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-white"
                  placeholder="Dirección completa"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Ciudad</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-white"
                  placeholder="Ciudad"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={editingCenter ? handleUpdateCenter : handleCreateCenter}
                className="flex-1 bg-purple-600 hover:bg-purple-500 text-white py-3 rounded-lg font-bold"
              >
                {editingCenter ? 'Actualizar' : 'Crear'}
              </button>
              <button
                onClick={resetForm}
                className="flex-1 bg-slate-600 hover:bg-slate-500 text-white py-3 rounded-lg font-bold"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;