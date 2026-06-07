import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);

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

  const adminLinks = [
    { to: '/admin/usuarios', label: 'Usuarios' },
    { to: '/admin/postulantes', label: 'Postulantes' },
    { to: '/admin/grupos', label: 'Grupos' },
    { to: '/admin/docentes', label: 'Docentes' },
    { to: '/admin/notas', label: 'Calificaciones' },
    { to: '/admin/admisiones', label: 'Admisiones & Cupos' },
    { to: '/admin/reportes', label: 'Reportes & Voz' },
  ];

  const coordinadorLinks = [
    { to: '/admin/postulantes', label: 'Postulantes' },
    { to: '/admin/grupos', label: 'Grupos' },
    { to: '/admin/docentes', label: 'Docentes' },
    { to: '/admin/admisiones', label: 'Admisiones & Cupos' },
    { to: '/admin/reportes', label: 'Reportes & Voz' },
  ];

  const postulanteLinks = [
    { to: '/simulacro', label: 'Simulacro Examen' },
  ];

  const links = user?.role === 'Administrador'
    ? adminLinks
    : user?.role === 'Coordinador'
    ? coordinadorLinks
    : user?.role === 'Postulante'
    ? postulanteLinks
    : [];

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
          {links.map((l) => {
            const isActive = location.pathname === l.to;
            return (
              <Link 
                key={l.to} 
                to={l.to} 
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-600/15 text-blue-400 border-b-2 border-blue-500' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </div>

        {/* Desktop User Info, Notifications & Logout */}
        <div className="hidden md:flex gap-4 items-center relative">
          {user && (
            <div className="relative">
              <button 
                onClick={() => setNotifOpen(!notifOpen)}
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
                <div className="absolute right-0 mt-3 w-80 glass-panel bg-slate-950 border border-slate-800 rounded-xl shadow-2xl overflow-hidden py-1 z-50">
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
              onClick={() => {
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
            onClick={() => {
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
        <div className="md:hidden mt-4 pt-4 border-t border-slate-800 glass-panel bg-slate-950 p-3 rounded-xl">
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
        <div className="md:hidden mt-4 pt-4 border-t border-slate-800 flex flex-col gap-2">
          {links.map((l) => {
            const isActive = location.pathname === l.to;
            return (
              <Link 
                key={l.to} 
                to={l.to} 
                onClick={() => setMenuOpen(false)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-600/15 text-blue-400' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
              >
                {l.label}
              </Link>
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
