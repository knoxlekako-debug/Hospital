import React, { useState, useEffect, useMemo } from 'react';
import { Doctor, NewsItem, Service, HealthCenter, Appointment, TreatedPatient } from '../src/Types';
import { fileToBase64 } from '../src/Utils';
import * as api from '../src/Api';
import { IconTrash, IconPause, IconPlay, IconSettings, IconCheck, IconDownload, IconCalendar, IconUser } from './Icons';
import Spinner from './Spinner';
import AdminTeamManagement from './AdminTeamManagement';

interface AdminPanelProps {
  activeCenter: HealthCenter;
  news: NewsItem[];
  setNews: React.Dispatch<React.SetStateAction<NewsItem[]>>;
  doctors: Doctor[];
  setDoctors: React.Dispatch<React.SetStateAction<Doctor[]>>;
  services: Service[];
  setServices: React.Dispatch<React.SetStateAction<Service[]>>;
}

const AdminPanel: React.FC<AdminPanelProps> = ({
  activeCenter, news, setNews,
  doctors, setDoctors,
  services, setServices
}) => {
  const [activeTab, setActiveTab] = useState<'news' | 'doctors' | 'services' | 'appointments' | 'history' | 'team'>('news');
  const [isLoading, setIsLoading] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [treatedHistory, setTreatedHistory] = useState<TreatedPatient[]>([]);
  const [historyFilter, setHistoryFilter] = useState<'today' | 'week' | 'all'>('week');

  // --- Forms State ---
  const [newsTitle, setNewsTitle] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [newsDuration, setNewsDuration] = useState('24');
  const [newsMediaUrl, setNewsMediaUrl] = useState('');
  const [newsMediaType, setNewsMediaType] = useState<'image' | 'video' | 'none'>('none');

  const [docName, setDocName] = useState('');
  const [docSpec, setDocSpec] = useState('');
  const [docBio, setDocBio] = useState('');
  const [docImage, setDocImage] = useState<string>('');

  const [srvName, setSrvName] = useState('');
  const [srvCap, setSrvCap] = useState(15);
  const [srvStartTime, setSrvStartTime] = useState('');
  const [srvInterval, setSrvInterval] = useState(30);

  useEffect(() => {
    if (activeTab === 'appointments' || activeTab === 'history') {
      loadAdminData();
    }
  }, [activeTab]);

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const [apps, history] = await Promise.all([
        api.fetchAppointments(activeCenter.id),
        api.fetchTreatedPatients(activeCenter.id)
      ]);
      setAppointments(apps);
      setTreatedHistory(history);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const performAction = async (action: () => Promise<void>) => {
    setIsLoading(true);
    try { await action(); } catch (e) { alert("Error al procesar."); }
    finally { setIsLoading(false); }
  };

  const handleAddNews = (e: React.FormEvent) => {
    e.preventDefault();
    performAction(async () => {
      const newItem: NewsItem = {
        id: crypto.randomUUID(),
        centerId: activeCenter.id,
        title: newsTitle,
        content: newsContent,
        createdAt: Date.now(),
        expiresAt: Date.now() + (parseFloat(newsDuration) * 3600000),
        mediaUrl: newsMediaType !== 'none' ? newsMediaUrl : undefined,
        mediaType: newsMediaType !== 'none' ? newsMediaType as any : undefined,
      };
      await api.createNews(newItem);
      setNews(prev => [newItem, ...prev]);
      setNewsTitle(''); setNewsContent('');
    });
  };

  const handleMarkAsTreated = (app: Appointment) => {
    const serviceName = services.find(s => s.id === app.serviceId)?.name || 'Consulta General';
    performAction(async () => {
      await api.markAsTreated(app, serviceName);
      setAppointments(prev => prev.filter(a => a.id !== app.id));
      await loadAdminData(); // Refresh history
    });
  };

  // --- Filtered History ---
  const filteredHistory = useMemo(() => {
    const now = new Date();
    return treatedHistory.filter(p => {
      const treatedDate = new Date(p.treatedAt);
      if (historyFilter === 'today') {
        return treatedDate.toDateString() === now.toDateString();
      }
      if (historyFilter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        return treatedDate >= weekAgo;
      }
      return true;
    });
  }, [treatedHistory, historyFilter]);

  // --- Export to CSV ---
  const exportToCSV = () => {
    const headers = ['Nombre', 'Cedula', 'Telefono', 'Especialidad', 'Fecha Atencion'];
    const rows = filteredHistory.map(p => [
      p.patientName,
      p.patientId,
      p.patientPhone,
      p.serviceName,
      new Date(p.treatedAt).toLocaleString()
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `reporte_pacientes_${activeCenter.id}_${new Date().toLocaleDateString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // If team tab is selected, render the team management component
  if (activeTab === 'team') {
    return <AdminTeamManagement activeCenter={activeCenter} />;
  }

  return (
    <div className="bg-slate-900 text-white min-h-screen p-8 relative">
      {isLoading && (
        <div className="absolute inset-0 bg-slate-900/90 z-50 flex flex-col justify-center items-center backdrop-blur-sm">
          <Spinner />
          <p className="mt-4 text-blue-400 font-bold">Procesando {activeCenter.name}...</p>
        </div>
      )}

      <header className="mb-10 flex items-center justify-between border-b border-slate-700 pb-6">
        <div className="flex items-center gap-4">
          <IconSettings className="w-10 h-10 text-blue-500" />
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter">ADMIN <span className="text-blue-500">PRO</span></h1>
            <p className="text-slate-400 text-xs">Centro Activo: <span className="text-blue-400 font-bold uppercase">{activeCenter.name}</span></p>
          </div>
        </div>
      </header>

      <div className="flex flex-wrap gap-1 sm:gap-2 mb-8 bg-slate-800/50 p-2 rounded-2xl w-fit border border-slate-700">
        {['news', 'doctors', 'services', 'appointments', 'history', 'team'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-6 py-2.5 rounded-xl font-bold transition-all text-xs uppercase tracking-wider ${activeTab === tab ? 'bg-blue-600 shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-white'}`}
          >
            {tab === 'news' ? 'Noticias' :
              tab === 'doctors' ? 'Doctores' :
                tab === 'services' ? 'Servicios' :
                  tab === 'appointments' ? 'Citas Pendientes' :
                    tab === 'history' ? 'Historial de Pacientes' : 'Equipo Admin'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8">
        {/* LEFT COLUMN: FORMS (Only for some tabs) */}
        {(activeTab === 'news' || activeTab === 'doctors' || activeTab === 'services') && (
          <div className="lg:col-span-4 bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-xl self-start sticky top-8">
            {activeTab === 'news' && (
              <form onSubmit={handleAddNews} className="space-y-4">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><div className="w-1 h-4 bg-blue-500"></div> Nueva Noticia</h2>
                <input value={newsTitle} onChange={e => setNewsTitle(e.target.value)} placeholder="Título" className="w-full bg-slate-700 p-3 rounded-lg border border-slate-600" required />
                <textarea value={newsContent} onChange={e => setNewsContent(e.target.value)} placeholder="Contenido..." className="w-full bg-slate-700 p-3 rounded-lg h-32 border border-slate-600" required />
                <div className="flex gap-2">
                  <select value={newsMediaType} onChange={e => setNewsMediaType(e.target.value as any)} className="bg-slate-700 p-3 rounded-lg flex-1 border border-slate-600">
                    <option value="none">Sin Multimedia</option>
                    <option value="image">Imagen (Link)</option>
                    <option value="video">Video (Link)</option>
                  </select>
                  <input value={newsDuration} onChange={e => setNewsDuration(e.target.value)} type="number" placeholder="Horas" className="w-20 bg-slate-700 p-3 rounded-lg border border-slate-600" />
                </div>
                {newsMediaType !== 'none' && <input value={newsMediaUrl} onChange={e => setNewsMediaUrl(e.target.value)} placeholder="URL Multimedia" className="w-full bg-slate-700 p-3 rounded-lg border border-slate-600" />}
                <button className="w-full bg-blue-600 py-4 rounded-xl font-bold shadow-lg hover:bg-blue-500 transition-colors">PUBLICAR</button>
              </form>
            )}

            {activeTab === 'doctors' && (
              <form onSubmit={(e) => {
                e.preventDefault();
                performAction(async () => {
                  const newDoc: Doctor = {
                    id: crypto.randomUUID(),
                    centerId: activeCenter.id,
                    name: docName,
                    specialty: docSpec,
                    description: docBio,
                    imageUrl: docImage,
                  };
                  await api.createDoctor(newDoc);
                  setDoctors(prev => [...prev, newDoc]);
                  setDocName(''); setDocSpec(''); setDocBio(''); setDocImage('');
                });
              }} className="space-y-4">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><div className="w-1 h-4 bg-blue-500"></div> Agregar Doctor</h2>
                <input value={docName} onChange={e => setDocName(e.target.value)} placeholder="Nombre del Doctor" className="w-full bg-slate-700 p-3 rounded-lg border border-slate-600" required />
                <input value={docSpec} onChange={e => setDocSpec(e.target.value)} placeholder="Especialidad" className="w-full bg-slate-700 p-3 rounded-lg border border-slate-600" required />
                <textarea value={docBio} onChange={e => setDocBio(e.target.value)} placeholder="Resumen profesional..." className="w-full bg-slate-700 p-3 rounded-lg h-24 border border-slate-600" required />
                <input type="file" accept="image/*" onChange={async e => { if (e.target.files) setDocImage(await fileToBase64(e.target.files[0])) }} className="text-xs bg-slate-900 p-2 rounded w-full" />
                <button className="w-full bg-blue-600 py-4 rounded-xl font-bold">GUARDAR DOCTOR</button>
              </form>
            )}

            {activeTab === 'services' && (
              <form onSubmit={(e) => {
                e.preventDefault();
                performAction(async () => {
                  const newSrv: Service = {
                    id: crypto.randomUUID(),
                    centerId: activeCenter.id,
                    name: srvName,
                    dailyCapacity: srvCap,
                    allowedDays: [1, 2, 3, 4, 5],
                    isPaused: false,
                    startTime: srvStartTime || '07:00 AM',
                    intervalMinutes: srvInterval || 30,
                  };
                  await api.createService(newSrv);
                  setServices(prev => [...prev, newSrv]);
                  setSrvName(''); setSrvStartTime(''); setSrvInterval(30);
                });
              }} className="space-y-4">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><div className="w-1 h-4 bg-blue-500"></div> Nuevo Servicio</h2>
                <input value={srvName} onChange={e => setSrvName(e.target.value)} placeholder="Nombre del Servicio" className="w-full bg-slate-700 p-3 rounded-lg border border-slate-600" required />
                <label className="text-xs text-slate-400 px-1">Capacidad Diaria</label>
                <input value={srvCap} type="number" onChange={e => setSrvCap(parseInt(e.target.value))} className="w-full bg-slate-700 p-3 rounded-lg border border-slate-600" />
                <label className="text-xs text-slate-400 px-1">Hora de Inicio (ej: 07:00 AM)</label>
                <input value={srvStartTime} onChange={e => setSrvStartTime(e.target.value)} placeholder="07:00 AM" className="w-full bg-slate-700 p-3 rounded-lg border border-slate-600" />
                <label className="text-xs text-slate-400 px-1">Duración por Paciente (minutos)</label>
                <input value={srvInterval} type="number" onChange={e => setSrvInterval(parseInt(e.target.value))} className="w-full bg-slate-700 p-3 rounded-lg border border-slate-600" />
                <button className="w-full bg-blue-600 py-4 rounded-xl font-bold">HABILITAR</button>
              </form>
            )}
          </div>
        )}

        {/* RIGHT COLUMN: LISTS / DATA */}
        <div className={`${(activeTab === 'news' || activeTab === 'doctors' || activeTab === 'services') ? 'lg:col-span-8' : 'lg:col-span-12'} bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-xl overflow-hidden flex flex-col`}>

          {activeTab === 'history' && (
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex gap-2 bg-slate-900 p-1 rounded-xl">
                <button onClick={() => setHistoryFilter('today')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${historyFilter === 'today' ? 'bg-blue-600' : 'text-slate-500'}`}>HOY</button>
                <button onClick={() => setHistoryFilter('week')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${historyFilter === 'week' ? 'bg-blue-600' : 'text-slate-500'}`}>7 DÍAS</button>
                <button onClick={() => setHistoryFilter('all')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${historyFilter === 'all' ? 'bg-blue-600' : 'text-slate-500'}`}>TODO</button>
              </div>
              <button onClick={exportToCSV} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-emerald-900/20">
                <IconDownload className="w-4 h-4" /> DESCARGAR EXCEL
              </button>
            </div>
          )}

          <div className="overflow-y-auto max-h-[70vh] custom-scrollbar pr-2">
            {activeTab === 'news' && (
              <div className="grid gap-4">
                {news.length === 0 && <p className="text-center text-slate-500 py-10 italic">No hay noticias publicadas.</p>}
                {news.map(n => (
                  <div key={n.id} className="bg-slate-700/50 p-5 rounded-2xl flex justify-between items-center group hover:bg-slate-700 transition-colors border border-slate-600/50">
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-100">{n.title}</h4>
                      <p className="text-xs text-slate-400 mt-1">Vence el: {new Date(n.expiresAt).toLocaleString()}</p>
                    </div>
                    <button onClick={() => api.deleteNews(n.id).then(() => setNews(prev => prev.filter(x => x.id !== n.id)))} className="p-2 text-slate-500 hover:text-red-400 transition-colors">
                      <IconTrash className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'doctors' && (
              <div className="grid gap-4 md:grid-cols-2">
                {doctors.map(d => (
                  <div key={d.id} className="bg-slate-700/50 p-4 rounded-2xl flex items-center gap-4 border border-slate-600/50">
                    <img src={d.imageUrl} className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-500/20" />
                    <div className="flex-1">
                      <h4 className="font-bold text-sm">{d.name}</h4>
                      <p className="text-[10px] text-blue-400 font-bold uppercase tracking-tight">{d.specialty}</p>
                    </div>
                    <button onClick={() => api.deleteDoctor(d.id).then(() => setDoctors(prev => prev.filter(x => x.id !== d.id)))} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"><IconTrash /></button>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'services' && (
              <div className="grid gap-3">
                {services.map(s => (
                  <div key={s.id} className="bg-slate-700/50 p-5 rounded-2xl flex justify-between items-center border border-slate-600/50">
                    <div>
                      <h4 className="font-bold">{s.name}</h4>
                      <p className="text-xs text-slate-400">Cupos diarios: {s.dailyCapacity}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => api.updateService(s.id, { isPaused: !s.isPaused }).then(() => setServices(prev => prev.map(x => x.id === s.id ? { ...x, isPaused: !x.isPaused } : x)))} className={`p-2 rounded-xl transition-all ${s.isPaused ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        {s.isPaused ? <IconPlay className="w-5 h-5" /> : <IconPause className="w-5 h-5" />}
                      </button>
                      <button onClick={() => api.deleteService(s.id).then(() => setServices(prev => prev.filter(x => x.id !== s.id)))} className="p-2 bg-red-500/10 text-red-400 rounded-xl"><IconTrash /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'appointments' && (
              <div className="space-y-4">
                {appointments.length === 0 && <div className="text-center py-20 text-slate-500 italic">No hay citas registradas en espera.</div>}
                {appointments.sort((a, b) => a.date.localeCompare(b.date)).map(app => (
                  <div key={app.id} className="bg-slate-900/50 border border-slate-700 p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-blue-500/30 transition-all">
                    <div className="flex items-start gap-4">
                      <div className="bg-blue-600/20 p-3 rounded-2xl text-blue-400">
                        <IconUser className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg text-slate-100">{app.patientName}</h4>
                        <div className="flex gap-4 mt-1">
                          <span className="text-xs text-slate-400 flex items-center gap-1"><IconCalendar className="w-3 h-3" /> {app.date}</span>
                          <span className="text-xs text-slate-400 flex items-center gap-1">ID: {app.patientId}</span>
                          <span className="text-xs text-blue-400 font-bold">{services.find(s => s.id === app.serviceId)?.name}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleMarkAsTreated(app)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-2xl font-black text-sm transition-all flex items-center gap-2"
                      >
                        <IconCheck className="w-4 h-4" /> ATENDIDO
                      </button>
                      <button
                        onClick={() => api.deleteAppointment(app.id).then(() => setAppointments(prev => prev.filter(a => a.id !== app.id)))}
                        className="bg-slate-800 hover:bg-red-600 text-slate-400 hover:text-white px-4 py-3 rounded-2xl transition-all"
                      >
                        <IconTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="bg-slate-900/40 rounded-2xl overflow-hidden border border-slate-700">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-900/80 text-slate-400 uppercase font-black border-b border-slate-700">
                    <tr>
                      <th className="px-6 py-4">Paciente</th>
                      <th className="px-6 py-4 hidden sm:table-cell">Especialidad</th>
                      <th className="px-6 py-4">Fecha Atención</th>
                      <th className="px-6 py-4 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredHistory.map(p => (
                      <tr key={p.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-200">{p.patientName}</div>
                          <div className="text-[10px] text-slate-500">{p.patientId}</div>
                        </td>
                        <td className="px-6 py-4 hidden sm:table-cell">
                          <span className="bg-slate-800 text-blue-400 px-2 py-1 rounded-md font-bold">{p.serviceName}</span>
                        </td>
                        <td className="px-6 py-4 text-slate-400">
                          {new Date(p.treatedAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {/* Fixed "Cannot find name 'supabase'" error by using the appropriate api function */}
                          <button onClick={() => api.deleteTreatedPatient(p.id).then(() => setTreatedHistory(prev => prev.filter(x => x.id !== p.id)))} className="text-slate-600 hover:text-red-400"><IconTrash className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredHistory.length === 0 && <div className="p-10 text-center text-slate-500 italic">No hay registros para este periodo.</div>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
