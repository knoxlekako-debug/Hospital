import React, { useState, useEffect } from 'react';
import { NewsItem, Doctor, Service, Appointment, HealthCenter } from './Types';
import * as api from './Api';

// Componentes
import NewsSection from '../components/NewsSection';
import DoctorsSection from '../components/DoctorsSection';
import AppointmentSection from '../components/AppointmentSection';
import AdminPanel from '../components/AdminPanel';
import SuperAdminDashboard from '../components/SuperAdminDashboard';
import SetupRequired from '../components/SetupRequired';
import LoginModal from '../components/LoginModal';
import Spinner from '../components/Spinner';
import ShaderBackground from './components/ui/shader-background';
import VaporizeTextCycle, { Tag } from './components/ui/vapour-text-effect';

// Iconos
import { IconHospital, IconSettings, IconDatabase, IconUser, IconMenu } from '../components/Icons';

// Hooks
import { useSuperAdmin } from '../hooks/useSuperAdmin';

type ViewState = 'news' | 'doctors' | 'appointments';

const App: React.FC = () => {
  // Estado Global
  const [activeCenter, setActiveCenter] = useState<HealthCenter | null>(null);
  const [allCenters, setAllCenters] = useState<HealthCenter[]>([]);
  const [currentView, setCurrentView] = useState<ViewState>('news');

  // Estado de Sesión
  const [user, setUser] = useState<any>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isSuperAdminMode, setIsSuperAdminMode] = useState(false);
  const isSuperUser = useSuperAdmin();

  // Estado de UI/Carga
  const [isLoading, setIsLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Datos
  const [news, setNews] = useState<NewsItem[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [appointments, setAppointments] = useState<Partial<Appointment>[]>([]);

  // 1. Inicialización
  useEffect(() => {
    const initApp = async () => {
      try {
        const u = await api.getUser();
        setUser(u);

        const status = await api.checkSystemStatus();
        if (status === 'MISSING_TABLES') { setNeedsSetup(true); return; }
        if (status === 'AUTH_ERROR') { setAuthError(true); return; }
        if (status === 'CONNECTION_ERROR') { setConnectionError(true); return; }

        const centers = await api.fetchCenters();
        setAllCenters(centers);

        if (centers.length > 0) {
          const hash = window.location.hash.replace('#', '');
          const center = centers.find(c => c.id === hash) || centers[0];
          setActiveCenter(center);

        }
      } catch (e) {
        console.error("Critical Init Error:", e);
        setConnectionError(true);
      } finally {
        setIsLoading(false);
      }
    };
    initApp();
  }, []);

  // 2. Efecto para detectar cambios de Hash (Navegación entre centros)
  useEffect(() => {
    const handleHashChange = async () => {
      const hash = window.location.hash.replace('#', '');
      if (!hash) return;

      let center = allCenters.find(c => c.id === hash);
      if (!center) {
        const freshCenters = await api.fetchCenters();
        setAllCenters(freshCenters);
        center = freshCenters.find(c => c.id === hash);
      }
      if (center) {
        setActiveCenter(center);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [allCenters]);

  // 3. Carga de datos del centro activo
  useEffect(() => {
    if (!activeCenter) return;
    const loadData = async () => {
      try {
        const [n, d, s, a] = await Promise.all([
          api.fetchNews(activeCenter.id),
          api.fetchDoctors(activeCenter.id),
          api.fetchServices(activeCenter.id),
          api.fetchPublicAppointments(activeCenter.id)
        ]);
        setNews(n); setDoctors(d); setServices(s); setAppointments(a);
      } catch (e) { console.error("Data Load Error:", e); }
    };
    loadData();
  }, [activeCenter]);

  // Logout Handler
  const handleLogout = async () => {
    await api.signOut();
    setUser(null);
    setIsAdminMode(false);
    setIsSuperAdminMode(false);
  };

  // --- RENDERERS ---

  // Wrapper común para errores y loading (Mantiene el fondo visible)
  const ErrorWrapper = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen flex flex-col justify-center items-center p-6 text-center relative z-10">
      {children}
    </div>
  );

  return (
    <div className="relative min-h-screen w-full font-sans text-slate-100">
      {/* FONDO SHADER ANIMADO */}
      <ShaderBackground />

      {/* CAPA DE CONTENIDO */}
      <div className="relative min-h-screen flex flex-col">

        {/* LOADING STATE */}
        {isLoading && (
          <ErrorWrapper>
            <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 shadow-2xl">
              <Spinner />
              <p className="mt-4 text-white font-medium animate-pulse">Conectando con Red de Salud...</p>
            </div>
          </ErrorWrapper>
        )}

        {/* ERROR STATES */}
        {!isLoading && authError && (
          <ErrorWrapper>
            <div className="bg-white/80 backdrop-blur-xl p-10 rounded-3xl shadow-2xl max-w-lg border border-red-200">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <IconSettings className="w-8 h-8 text-orange-600" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 mb-2">Error de Configuración</h1>
              <p className="text-slate-600 mb-6">La clave de API pública es inválida.</p>
              <button onClick={() => window.location.reload()} className="bg-orange-600 text-white font-bold py-3 px-8 rounded-full hover:bg-orange-700 transition-all">Reintentar</button>
            </div>
          </ErrorWrapper>
        )}

        {!isLoading && connectionError && (
          <ErrorWrapper>
            <div className="bg-white/80 backdrop-blur-xl p-10 rounded-3xl shadow-2xl max-w-lg border border-red-200">
              <IconDatabase className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-black text-slate-900">Sin Conexión</h1>
              <p className="text-slate-600 mb-8 mt-2">No se pudo contactar con la base de datos central.</p>
              <button onClick={() => window.location.reload()} className="bg-slate-900 text-white font-bold py-3 px-8 rounded-full hover:bg-slate-800 transition-all">Reconectar</button>
            </div>
          </ErrorWrapper>
        )}

        {!isLoading && needsSetup && (
          <ErrorWrapper><SetupRequired /></ErrorWrapper>
        )}

        {/* ADMIN VIEWS */}
        {!isLoading && !authError && !connectionError && activeCenter && (
          <>
            {isSuperAdminMode && user ? (
              <SuperAdminDashboard onLogout={handleLogout} />
            ) : isAdminMode && user ? (
              <>
                <AdminPanel
                  activeCenter={activeCenter}
                  news={news} setNews={setNews}
                  doctors={doctors} setDoctors={setDoctors}
                  services={services} setServices={setServices}
                />
                <button onClick={() => setIsAdminMode(false)} className="fixed bottom-6 right-6 bg-slate-900 text-white px-6 py-3 rounded-full shadow-lg z-50 font-bold hover:scale-105 transition-transform border border-slate-700 hover:shadow-cyan-500/20">
                  Vista Pública
                </button>
              </>
            ) : (
              // PUBLIC VIEW
              <>
                {showLogin && (
                  <LoginModal
                    activeCenterId={activeCenter?.id}
                    onClose={() => setShowLogin(false)}
                    onLoginSuccess={async () => {
                      const u = await api.getUser();
                      setUser(u);
                      if (isSuperUser) setIsSuperAdminMode(true);
                      else setIsAdminMode(true);
                    }}
                  />
                )}

                {/* NAVBAR GLASSMORPHISM */}
                <nav className="sticky top-0 z-40 bg-white/10 backdrop-blur-xl min-h-[72px] flex items-center justify-between px-4 md:px-8 shadow-lg shadow-black/10 transition-all duration-300">
                  <div className="flex items-center gap-3 cursor-pointer group" onClick={() => { setCurrentView('news'); setMobileMenuOpen(false); }}>
                    <div className="bg-cyan-400/20 p-2 rounded-xl group-hover:bg-cyan-400/30 transition-colors">
                      <IconHospital className="w-8 h-8 text-cyan-400" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-cyan-400 tracking-[0.2em] leading-none mb-0.5">RED PÚBLICA</span>
                      <span className="text-lg md:text-xl font-extrabold uppercase tracking-tight leading-none text-white">{activeCenter.name}</span>
                    </div>
                  </div>

                  {/* Desktop Nav */}
                  <div className="hidden md:flex bg-white/10 backdrop-blur-md p-1 rounded-full border border-white/20">
                    {(['news', 'doctors', 'appointments'] as const).map((view) => (
                      <button
                        key={view}
                        onClick={() => setCurrentView(view)}
                        className={`px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 ${currentView === view
                          ? 'bg-cyan-400/20 text-cyan-300 shadow-lg shadow-cyan-500/20 border border-cyan-400/30 transform scale-105'
                          : 'text-white/70 hover:text-white hover:bg-white/10'
                          }`}
                      >
                        {view === 'news' ? 'Noticias' : view === 'doctors' ? 'Equipo Médico' : 'Citas'}
                      </button>
                    ))}
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-3">
                    {user ? (
                      <div className="flex items-center gap-2 bg-white/10 rounded-full pl-4 pr-1 py-1 border border-white/20">
                        <span className="text-xs font-semibold text-cyan-300 hidden sm:block">Admin Activo</span>
                        <button onClick={() => setIsAdminMode(true)} className="bg-cyan-500 text-slate-900 px-4 py-2 rounded-full text-xs font-bold hover:bg-cyan-400 transition-colors">PANEL</button>
                        <button onClick={handleLogout} className="text-white/60 hover:text-red-400 p-2 rounded-full hover:bg-red-500/20"><IconSettings className="w-5 h-5" /></button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowLogin(true)}
                        className="flex items-center gap-2 text-white/70 hover:text-cyan-300 px-3 py-2 rounded-xl hover:bg-white/10 border border-transparent hover:border-cyan-400/30 transition-all font-medium text-sm"
                      >
                        <IconUser className="w-5 h-5" />
                        <span className="hidden sm:inline">Acceso Personal</span>
                      </button>
                    )}

                    {/* Mobile Toggle */}
                    <button
                      onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                      className="md:hidden p-2 text-white/70 hover:bg-white/10 rounded-xl border border-transparent hover:border-white/20"
                    >
                      <IconMenu className="w-6 h-6" />
                    </button>
                  </div>
                </nav>

                {/* MAIN CONTENT */}
                <main className="flex-grow container mx-auto px-4 py-8 max-w-7xl">
                  {currentView === 'news' && (
                    <div className="animate-fade-in space-y-8">
                      {/* HERO SECTION GLASSMORPHISM */}
                      <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-white/5 backdrop-blur-md text-white py-20 px-6 text-center">
                        {/* Gradiente superpuesto sutil */}
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-blue-500/10"></div>
                        <div className="relative z-10 max-w-3xl mx-auto">
                          <span className="inline-block py-1 px-3 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 text-xs font-bold tracking-wider mb-4">SISTEMA INTEGRAL DE SALUD</span>
                          <div className="h-24 md:h-32 flex items-center justify-center mb-4">
                            <VaporizeTextCycle
                              texts={["AQUITA+", "ES", "Tu Aliado"]}
                              font={{
                                fontFamily: "Inter, system-ui, sans-serif",
                                fontSize: "70px",
                                fontWeight: 900
                              }}
                              color="rgb(103, 232, 249)"
                              spread={5}
                              density={5}
                              animation={{
                                vaporizeDuration: 2,
                                fadeInDuration: 1,
                                waitDuration: 0.5
                              }}
                              direction="left-to-right"
                              alignment="center"
                              tag={Tag.H1}
                            />
                          </div>
                          <p className="text-lg md:text-xl text-blue-100 font-light max-w-2xl mx-auto leading-relaxed">
                            Gestión digital avanzada para el {activeCenter.name}. <br />
                            <span className="text-cyan-400 font-normal">{activeCenter.location}</span>
                          </p>
                        </div>
                      </div>

                      <NewsSection news={news} onExpired={(id) => setNews(prev => prev.filter(n => n.id !== id))} />
                    </div>
                  )}

                  {currentView === 'doctors' && (
                    <div className="animate-fade-in">
                      <DoctorsSection doctors={doctors} />
                    </div>
                  )}

                  {currentView === 'appointments' && (
                    <div className="animate-fade-in">
                      <AppointmentSection
                        services={services}
                        appointments={appointments}
                        onBook={(app) => setAppointments(prev => [...prev, app])}
                        centerId={activeCenter.id}
                      />
                    </div>
                  )}
                </main>

                {/* FOOTER GLASSMORPHISM */}
                <footer className="relative bg-white/5 backdrop-blur-xl py-12 mt-12">
                  <div className="container mx-auto px-4 text-center">
                    <h3 className="font-black text-xl text-white mb-2">AQUITA+</h3>
                    <p className="text-white/50 text-sm mb-6 max-w-md mx-auto">Salud Pública a Disposición del pueblo Venezolano. Tecnología al servicio del ciudadano.</p>
                    <p className="text-xs text-cyan-400/60 font-mono">© 2026 CDI RED SYSTEM | v2.4.0 Secure</p>
                  </div>
                </footer>
              </>
            )}
          </>
        )}
      </div>

    </div>
  );
};

export default App;
