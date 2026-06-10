import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const packageDefinitions = [
  {
    id: 'autenticacion',
    label: 'Autenticación',
    shortLabel: 'Auth',
    icon: (className) => (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    links: [
      { to: '/admin/usuarios', label: 'Gestionar Usuarios', subtitle: 'CU04: Control de accesos RBAC', roles: ['Administrador'] }
    ]
  },
  {
    id: 'registro',
    label: 'Registro',
    shortLabel: 'Reg',
    icon: (className) => (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    links: [
      { to: '/admin/postulantes', label: 'Buscar Postulantes', subtitle: 'CU09: Búsqueda avanzada', roles: ['Administrador', 'Coordinador', 'Docente'] }
    ]
  },
  {
    id: 'planificacion',
    label: 'Planificación',
    shortLabel: 'Plan',
    icon: (className) => (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    links: [
      { to: '/admin/postulaciones-docentes', label: 'Revisar Postulaciones Docentes', subtitle: 'CU25: Aceptar o rechazar aspirantes', roles: ['Administrador', 'Coordinador'] },
      { to: '/admin/grupos', label: 'Grupos', subtitle: 'CU10/11: Calcular y balancear', roles: ['Administrador', 'Coordinador'] },
      { to: '/admin/docentes', label: 'Docentes', subtitle: 'CU12: Vincular sin solapamiento', roles: ['Administrador', 'Coordinador'] },
      { to: '/mi-horario', label: 'Mi Horario', subtitle: 'Carga horaria asignada', roles: ['Postulante', 'Docente'] },
      { to: '/simulacro', label: 'Simulacro Examen', subtitle: 'CU23: Prueba interactiva', roles: ['Postulante'] }
    ]
  },
  {
    id: 'evaluacion',
    label: 'Evaluación',
    shortLabel: 'Eval',
    icon: (className) => (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    links: [
      { to: '/admin/notas', label: 'Calificaciones', subtitle: 'CU13/14: Registro y carga CSV', roles: ['Administrador'] }
    ]
  },
  {
    id: 'admision',
    label: 'Admisión',
    shortLabel: 'Admi',
    icon: (className) => (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
      </svg>
    ),
    links: [
      { to: '/admin/admisiones', label: 'Admisiones & Cupos', subtitle: 'CU17/18: Algoritmo de vacantes', roles: ['Administrador', 'Coordinador'] }
    ]
  },
  {
    id: 'reportes',
    label: 'Reportes & IA',
    shortLabel: 'Rep & IA',
    icon: (className) => (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
      </svg>
    ),
    links: [
      { to: '/dashboard', label: 'Dashboard Estadístico', subtitle: 'CU22: Estado en tiempo real', roles: ['Administrador', 'Coordinador', 'Docente', 'Postulante'] },
      { to: '/admin/reportes', label: 'Reportes & Voz (IA)', subtitle: 'CU21: Comandos por voz NLP', roles: ['Administrador', 'Coordinador'] }
    ]
  }
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [mobileExpanded, setMobileExpanded] = useState({});

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.get('/notificaciones');
      setNotifications(res.data || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    if (!user) return;
    
    // Polling de 8 segundos (fallback robusto para WebSockets en local)
    const interval = setInterval(fetchNotifications, 8000);
    return () => clearInterval(interval);
  }, [user]);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveDropdown(null);
      setNotifOpen(false);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.post(`/notificaciones/${id}/leer`);
      setNotifications((prev) => 
        prev.map((n) => (n.id === id ? { ...n, estado: 'LEIDA' } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter((n) => n.estado === 'NO_LEIDA').length;

  const userPackages = packageDefinitions.map(pkg => {
    const filteredLinks = pkg.links.filter(link => link.roles.includes(user?.role));
    return { ...pkg, links: filteredLinks };
  }).filter(pkg => pkg.links.length > 0);

  const isPackageActive = (pkg) => {
    return pkg.links.some(l => location.pathname === l.to);
  };

  useEffect(() => {
    if (menuOpen && user) {
      const activePkg = userPackages.find(isPackageActive);
      if (activePkg) {
        setMobileExpanded({ [activePkg.id]: true });
      } else {
        setMobileExpanded({});
      }
    }
  }, [menuOpen, location.pathname, user]);

  const toggleMobileExpanded = (pkgId) => {
    setMobileExpanded(prev => ({
      ...prev,
      [pkgId]: !prev[pkgId]
    }));
  };

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800 px-4 sm:px-8 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="bg-blue-600 text-white font-extrabold px-3 py-1 rounded-lg text-sm tracking-wide">
            FICCT
          </span>
          <Link to="/dashboard" className="font-semibold text-slate-100 hover:text-white transition-colors tracking-tight text-base">
            CUP Portal
          </Link>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex gap-1 items-center">
          {userPackages.map((pkg) => {
            const isPkgActive = isPackageActive(pkg);
            return (
              <div 
                key={pkg.id} 
                className="relative"
                onMouseEnter={() => setActiveDropdown(pkg.id)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveDropdown(prev => prev === pkg.id ? null : pkg.id);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                    isPkgActive 
                      ? 'bg-blue-600/15 text-blue-400 border-b-2 border-blue-500' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                  }`}
                >
                  {pkg.icon("w-4 h-4")}
                  <span>
                    <span className="hidden lg:inline">{pkg.label}</span>
                    <span className="inline lg:hidden">{pkg.shortLabel}</span>
                  </span>
                  <svg 
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      activeDropdown === pkg.id ? 'rotate-180' : ''
                    }`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {activeDropdown === pkg.id && (
                  <div 
                    className="absolute left-0 top-full pt-2 w-64 z-50 origin-top-left"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="glass-panel bg-slate-950 border border-slate-800 rounded-xl shadow-2xl overflow-hidden py-1.5 animate-dropdown-in">
                      {pkg.links.map((link) => {
                        const isActive = location.pathname === link.to;
                        return (
                          <Link
                            key={link.to}
                            to={link.to}
                            onClick={() => {
                              setActiveDropdown(null);
                              setMenuOpen(false);
                            }}
                            className={`flex flex-col px-4 py-2.5 hover:bg-slate-900/50 transition-colors group border-l-2 ${
                              isActive 
                                ? 'bg-blue-600/10 text-blue-400 border-blue-500' 
                                : 'text-slate-300 hover:text-white border-transparent'
                            }`}
                          >
                            <span className="text-xs font-bold leading-none">{link.label}</span>
                            <span className="text-[10px] text-slate-400 mt-1 leading-normal font-medium">{link.subtitle}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Desktop User Info, Notifications & Logout */}
        <div className="hidden md:flex gap-4 items-center relative">
          {user && (
            <div className="relative">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setNotifOpen(!notifOpen);
                }}
                className="text-slate-400 hover:text-slate-200 focus:outline-none relative p-1.5 rounded-lg hover:bg-slate-900 cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-4 w-4 bg-red-600 text-white rounded-full flex items-center justify-center text-[9px] font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown de Notificaciones */}
              {notifOpen && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 mt-3 w-80 glass-panel bg-slate-950 border border-slate-800 rounded-xl shadow-2xl overflow-hidden py-1 z-50"
                >
                  <div className="px-4 py-2 border-b border-slate-850 flex justify-between items-center bg-slate-900/40">
                    <span className="text-xs font-bold text-slate-200">Notificaciones Recientes</span>
                    {unreadCount > 0 && (
                      <span className="text-[9px] font-bold bg-blue-600/10 text-blue-400 px-1.5 py-0.5 rounded-full">
                        {unreadCount} Nuevas
                      </span>
                    )}
                  </div>
                  <div className="max-h-[280px] overflow-y-auto divide-y divide-slate-900/60">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-slate-500 text-[11px]">
                        No tienes notificaciones.
                      </div>
                    ) : (
                      notifications.slice(0, 5).map((n) => (
                        <div 
                          key={n.id} 
                          onClick={() => {
                            if (n.estado === 'NO_LEIDA') markAsRead(n.id);
                          }}
                          className={`px-4 py-3 hover:bg-slate-900/30 transition-colors cursor-pointer ${
                            n.estado === 'NO_LEIDA' ? 'bg-blue-600/5' : ''
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-[10px] font-bold text-blue-400">{n.tipo_evento}</span>
                            <span className="text-[8px] text-slate-500 font-mono">
                              {new Date(n.fecha_generacion).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-relaxed">{n.mensaje}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col items-end">
            <span className="text-xs font-medium text-slate-200">{user?.name}</span>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{user?.role}</span>
          </div>
          
          <div className="h-6 w-px bg-slate-800"></div>

          <button 
            onClick={logout} 
            className="text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer"
          >
            Cerrar Sesión
          </button>
        </div>

        {/* Mobile menu button and user preview */}
        <div className="md:hidden flex items-center gap-4">
          {user && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setNotifOpen(!notifOpen);
                setMenuOpen(false);
              }}
              className="text-slate-400 hover:text-slate-200 relative p-1 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 h-3.5 w-3.5 bg-red-600 text-white rounded-full flex items-center justify-center text-[8px] font-bold">
                  {unreadCount}
                </span>
              )}
            </button>
          )}

          <div className="flex flex-col items-end text-right">
            <span className="text-xs font-medium text-slate-200 max-w-[120px] truncate">{user?.name}</span>
            <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">{user?.role}</span>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
              setNotifOpen(false);
            }}
            className="text-slate-400 hover:text-slate-200 focus:outline-none cursor-pointer"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Notifications dropdown */}
      {notifOpen && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="md:hidden mt-4 pt-4 border-t border-slate-800 glass-panel bg-slate-950 p-3 rounded-xl"
        >
          <div className="text-[10px] font-bold text-slate-400 mb-2">Notificaciones Recientes</div>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center text-slate-500 text-[10px] py-4">No tienes notificaciones.</div>
            ) : (
              notifications.slice(0, 4).map((n) => (
                <div 
                  key={n.id} 
                  onClick={() => {
                    if (n.estado === 'NO_LEIDA') markAsRead(n.id);
                  }}
                  className={`p-2 rounded-lg bg-slate-900/30 border border-slate-800/40 text-[11px] ${
                    n.estado === 'NO_LEIDA' ? 'border-blue-500/20 bg-blue-600/5' : ''
                  }`}
                >
                  <div className="flex justify-between font-bold text-blue-400 text-[9px] mb-1">
                    <span>{n.tipo_evento}</span>
                    <span>{new Date(n.fecha_generacion).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-slate-300">{n.mensaje}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Mobile Links & Menu */}
      {menuOpen && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="md:hidden mt-4 pt-4 border-t border-slate-800 flex flex-col gap-2 animate-dropdown-in"
        >
          {userPackages.map((pkg) => {
            const isPkgActive = isPackageActive(pkg);
            const isExpanded = mobileExpanded[pkg.id];
            return (
              <div key={pkg.id} className="flex flex-col">
                <button
                  onClick={() => toggleMobileExpanded(pkg.id)}
                  className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    isPkgActive
                      ? 'bg-blue-600/10 text-blue-400 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {pkg.icon("w-4 h-4")}
                    <span>{pkg.label}</span>
                  </div>
                  <svg 
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isExpanded && (
                  <div className="pl-6 pr-2 py-1 flex flex-col gap-1 mt-1 border-l border-slate-800 ml-5">
                    {pkg.links.map((link) => {
                      const isActive = location.pathname === link.to;
                      return (
                        <Link
                          key={link.to}
                          to={link.to}
                          onClick={() => setMenuOpen(false)}
                          className={`flex flex-col py-1.5 px-3 rounded-lg transition-all ${
                            isActive
                              ? 'bg-blue-600/15 text-blue-400 font-bold'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
                          }`}
                        >
                          <span className="text-xs">{link.label}</span>
                          <span className="text-[9px] text-slate-500 font-medium">{link.subtitle}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          
          <div className="border-t border-slate-850 my-2"></div>
          
          <button 
            onClick={() => {
              setMenuOpen(false);
              logout();
            }} 
            className="w-full text-left text-xs font-semibold text-red-400 hover:bg-red-500/10 px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer"
          >
            Cerrar Sesión
          </button>
        </div>
      )}
    </nav>
  );
}
