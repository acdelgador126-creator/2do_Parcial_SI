import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [postulanteInfo, setPostulanteInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    // CU22 - Paso 1: Act -> B_Dash : + AbrirDashboard()
    try {
      setError(null);
      if (['Administrador', 'Coordinador', 'Docente'].includes(user?.role)) {
        // CU22 - Paso 2: B_Dash -> C_Rep : + getEstadisticas()
        const res = await api.get('/dashboard/estadisticas');
        // CU22 - Paso 9: C_Rep --> B_Dash : + EnviarDatosEstadisticos()
        setStats(res.data);
      } else if (user?.role === 'Postulante') {
        // CU22 - Caso B - Paso 2: B_Dash -> C_Rep : + getNotasIndividuales()
        const res = await api.get('/dashboard/notas-individuales');
        // CU22 - Caso B - Paso 9: C_Rep --> B_Dash : + EnviarNotasIndividuales()
        setPostulanteInfo(res.data);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    if (!user) return;

    // Polling cada 8 segundos (transmisión en tiempo real en local)
    const interval = setInterval(fetchStats, 8000);
    return () => clearInterval(interval);
  }, [user]);

  const adminCards = [
    { title: 'Usuarios', desc: 'Administrar accesos, roles y cuentas.', path: '/admin/usuarios' },
    { title: 'Postulantes', desc: 'Búsqueda avanzada y verificación de expedientes.', path: '/admin/postulantes' },
    { title: 'Planificación de Grupos', desc: 'Distribución y asignación automática por turnos.', path: '/admin/grupos' },
    { title: 'Gestión Docente', desc: 'Asignación de materias a paralelos y control de cátedras.', path: '/admin/docentes' },
    { title: 'Calificaciones', desc: 'Registrar notas individuales e importar CSV de laboratorios.', path: '/admin/notas' },
    { title: 'Admisiones & Cupos', desc: 'Establecer límites de vacantes y ejecutar algoritmo de ingreso.', path: '/admin/admisiones' },
    { title: 'Reportes & Voz', desc: 'Descarga de reportes estructurados, dinámicos y comandos de voz.', path: '/admin/reportes' },
  ];

  if (loading) {
    return <div className="py-12 text-center text-slate-400 text-sm">Cargando panel de control...</div>;
  }

  // VISTA PARA POSTULANTE
  if (user?.role === 'Postulante') {
    if (!postulanteInfo) {
      if (error) {
        return (
          <div className="glass-panel p-8 rounded-2xl border-l-4 border-red-500 max-w-2xl mx-auto text-center space-y-4">
            <svg className="w-12 h-12 text-red-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="font-bold text-slate-100 text-lg">No se pudieron cargar tus datos</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{error}</p>
          </div>
        );
      }
      return (
        <div className="py-8 text-center text-slate-400 text-sm glass-panel p-6 rounded-2xl max-w-md mx-auto">
          No se encontró expediente asociado a tu cuenta de postulante. Contacta a soporte técnico.
        </div>
      );
    }

    const materias = [
      { label: 'Computación', key: 'COMPUTACION' },
      { label: 'Matemáticas', key: 'MATEMATICAS' },
      { label: 'Física', key: 'FISICA' },
      { label: 'Inglés', key: 'INGLES' },
    ];
    const matchMateria = (nombre, key) =>
      nombre?.toUpperCase() === key || nombre?.toUpperCase() === key.slice(0, -1);

    const getNotaExamenPost = (mKey, examNum) => {
      const ex = postulanteInfo.examenes?.find(
        (e) => matchMateria(e.materia?.nombre, mKey) && e.numero_examen === examNum
      );
      return ex ? ex.nota : '-';
    };

    const getPromedioMateriaPost = (mKey) => {
      const nf = postulanteInfo.notasFinales?.find((n) => matchMateria(n.materia?.nombre, mKey));
      return nf ? nf.promedio : '-';
    };

    return (
      <div className="py-6 max-w-5xl mx-auto px-4 space-y-8">
        {/* Encabezado */}
        <div>
          <span className="text-xs font-semibold text-blue-400 uppercase tracking-widest">Portal del Postulante</span>
          <h1 className="text-2xl font-bold text-slate-100 mt-1">Expediente de Admisión CUP</h1>
          <p className="text-xs text-slate-400 mt-1">Gestión Académica Activa: {postulanteInfo.gestion?.codigo}</p>
        </div>

        {/* Estado General de Admisión */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <span className="text-xs text-slate-500 block mb-1">Nombre Completo</span>
            <span className="text-base font-bold text-slate-100">{postulanteInfo.nombres} {postulanteInfo.apellidos}</span>
            <div className="text-xs text-slate-400 mt-1">CI: {postulanteInfo.ci} | ID: {postulanteInfo.id}</div>
          </div>
          <div>
            <span className="text-xs text-slate-500 block mb-1">Grupo Asignado</span>
            <span className="text-sm font-semibold text-slate-200">
              {postulanteInfo.asignacionGrupo?.grupo
                ? `Grupo ${postulanteInfo.asignacionGrupo.grupo.numero} (${postulanteInfo.asignacionGrupo.grupo.turno})`
                : 'Sin grupo asignado.'}
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-500 block mb-1">Estado de Aprobación</span>
            <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${postulanteInfo.estado === 'Aprobado'
                ? 'bg-emerald-500/10 text-emerald-400'
                : postulanteInfo.estado === 'Reprobado'
                  ? 'bg-red-500/10 text-red-400'
                  : 'bg-blue-500/10 text-blue-400'
              }`}>
              {postulanteInfo.estado}
            </span>
          </div>
        </div>

        {/* Admisión Final Destacada */}
        {postulanteInfo.admision && (
          <div className="glass-panel p-6 rounded-2xl border-l-4 border-emerald-500 bg-emerald-950/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="font-extrabold text-emerald-400 text-sm mb-1">¡ADMISIÓN CONFIRMADA!</h3>
              <p className="text-xs text-slate-300">Has sido admitido oficialmente en la FICCT para la carrera seleccionada.</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block tracking-widest uppercase">Carrera Asignada</span>
              <span className="text-lg font-extrabold text-slate-100">{postulanteInfo.admision.carrera?.nombre}</span>
              <div className="text-[10px] text-slate-400 mt-0.5">Ingreso por: {postulanteInfo.admision.via}</div>
            </div>
          </div>
        )}

        {/* Planilla de Notas del Estudiante */}
        <div className="glass-panel p-6 rounded-2xl">
          <h2 className="text-lg font-semibold text-slate-200 mb-4">Calificaciones por Materia</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-widest text-[10px] font-bold">
                  <th className="py-3 px-2">Materia</th>
                  <th className="py-3 px-2 text-center">Parcial 1 (30%)</th>
                  <th className="py-3 px-2 text-center">Parcial 2 (30%)</th>
                  <th className="py-3 px-2 text-center">Examen Final (40%)</th>
                  <th className="py-3 px-2 text-center">Nota Final (Ponderado)</th>
                </tr>
              </thead>
              <tbody>
                {materias.map((m) => {
                  const p1 = getNotaExamenPost(m.key, 1);
                  const p2 = getNotaExamenPost(m.key, 2);
                  const ef = getNotaExamenPost(m.key, 3);
                  const pf = getPromedioMateriaPost(m.key);

                  return (
                    <tr key={m.key} className="border-b border-slate-800/40 hover:bg-slate-900/10 text-slate-300">
                      <td className="py-4 px-2 font-medium text-slate-200">{m.label}</td>
                      <td className="py-4 px-2 text-center font-mono">{p1}</td>
                      <td className="py-4 px-2 text-center font-mono">{p2}</td>
                      <td className="py-4 px-2 text-center font-mono">{ef}</td>
                      <td className={`py-4 px-2 text-center font-bold font-mono ${pf !== '-' && pf >= 60 ? 'text-emerald-400' : pf !== '-' ? 'text-red-400' : 'text-slate-500'
                        }`}>
                        {pf}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Acceso a Simulacros */}
        <div className="glass-panel p-6 rounded-2xl flex justify-between items-center bg-blue-950/10 border-blue-500/10">
          <div>
            <h3 className="font-semibold text-slate-200 text-sm">¿Deseas practicar antes de tus exámenes?</h3>
            <p className="text-xs text-slate-400 mt-1">Realiza simulacros de examen con 10 preguntas por materia del banco oficial de la facultad.</p>
          </div>
          <button
            onClick={() => navigate('/simulacro')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold tracking-wide shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
          >
            Iniciar Simulacro (CU23)
          </button>
        </div>
      </div>
    );
  }

  // VISTA PARA ADMINISTRADOR / COORDINADOR (CU22)
  // CU22 - Paso 10: B_Dash --> Act : + RenderizarGraficosYTarjetasKPI()
  return (
    <div className="py-6 max-w-7xl mx-auto px-4 space-y-8">
      {/* Encabezado */}
      <div>
        <span className="text-xs font-semibold text-blue-400 uppercase tracking-widest">Dashboard de Control</span>
        <h1 className="text-2xl font-bold text-slate-100 mt-1">Estadísticas en Tiempo Real (CU22)</h1>
        <p className="text-xs text-slate-400 mt-1">Sesión: {user?.name} ({user?.role})</p>
      </div>

      {error && (
        <div className="glass-panel p-8 rounded-2xl border-l-4 border-red-500 max-w-2xl mx-auto text-center space-y-4">
          <svg className="w-12 h-12 text-red-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="font-bold text-slate-100 text-lg">No se pudieron cargar las estadísticas</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            {error}. Asegúrese de que haya una gestión activa configurada y el servidor backend esté en funcionamiento.
          </p>
          <div className="pt-2">
            <button
              onClick={() => navigate('/admin/admisiones')}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              Configurar Gestión / Cupos
            </button>
          </div>
        </div>
      )}

      {stats && (
        <>
          {/* Tarjetas KPI */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-panel p-5 rounded-2xl">
              <span className="text-[10px] text-slate-400 tracking-wider uppercase block mb-1">Total Postulantes</span>
              <span className="text-2xl font-bold text-slate-100">{stats.total_inscritos}</span>
              <span className="text-[10px] text-slate-500 block mt-2">Registrados en la gestión</span>
            </div>
            <div className="glass-panel p-5 rounded-2xl border-l-4 border-emerald-500">
              <span className="text-[10px] text-slate-400 tracking-wider uppercase block mb-1">Aprobados CUP</span>
              <span className="text-2xl font-bold text-emerald-400">{stats.aprobados}</span>
              <span className="text-[10px] text-slate-500 block mt-2">Porcentaje: {stats.porcentaje_aprobacion}%</span>
            </div>
            <div className="glass-panel p-5 rounded-2xl border-l-4 border-red-500">
              <span className="text-[10px] text-slate-400 tracking-wider uppercase block mb-1">Reprobados CUP</span>
              <span className="text-2xl font-bold text-red-400">{stats.reprobados}</span>
              <span className="text-[10px] text-slate-500 block mt-2">Aún sin nota mínima aprobatoria</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Llenado de Cupos por Carrera (Barra de progreso visual) */}
            <div className="glass-panel p-6 rounded-2xl lg:col-span-1 space-y-6">
              <div>
                <h3 className="font-semibold text-slate-200 text-sm">Estado de Cupos por Carrera</h3>
                <p className="text-[10px] text-slate-500 mt-1">Avance de plazas cubiertas sobre el límite máximo.</p>
              </div>
              <div className="space-y-4">
                {stats.cupos?.map((c) => (
                  <div key={c.nombre} className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-300">{c.nombre}</span>
                      <span className="text-slate-400 font-mono">{c.ocupados} / {c.cupo_maximo}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${c.porcentaje_llenado >= 100 ? 'bg-red-500' : c.porcentaje_llenado >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                        style={{ width: `${Math.min(c.porcentaje_llenado, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-[9px] text-slate-500 font-bold block text-right font-mono">
                      {c.porcentaje_llenado}% completado
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ocupación de Grupos y Aulas */}
            <div className="glass-panel p-6 rounded-2xl lg:col-span-2 space-y-4">
              <h3 className="font-semibold text-slate-200 text-sm">Ocupación Física de Grupos (Máx: 70)</h3>
              <div className="overflow-x-auto max-h-[260px] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-widest text-[9px] font-bold">
                      <th className="py-2">Paralelo</th>
                      <th className="py-2">Turno</th>
                      <th className="py-2">Alumnos Asignados</th>
                      <th className="py-2">Avance de Carga</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.grupos?.map((g) => (
                      <tr key={g.id} className="border-b border-slate-800/40 text-slate-300">
                        <td className="py-2.5 font-semibold">Grupo {g.numero}</td>
                        <td className="py-2.5">{g.turno}</td>
                        <td className="py-2.5 font-mono">{g.estudiantes} / 70</td>
                        <td className="py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-24 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${Math.min(g.porcentaje, 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-[9px] font-mono text-slate-400">{g.porcentaje}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Ranking de Grupos por Tasa de Aprobación */}
            <div className="glass-panel p-6 rounded-2xl lg:col-span-1 space-y-4">
              <h3 className="font-semibold text-slate-200 text-sm">Tasa de Aprobación por Grupo</h3>
              <div className="space-y-3">
                {stats.ranking_grupos?.slice(0, 4).map((r, i) => (
                  <div key={i} className="flex justify-between items-center bg-slate-900/30 p-2.5 rounded-xl border border-slate-800/50">
                    <div>
                      <span className="text-xs font-bold text-slate-200">Grupo {r.numero}</span>
                      <span className="text-[10px] text-slate-500 block">Turno: {r.turno}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-emerald-400 font-mono">{r.tasa_aprobacion}%</span>
                      <span className="text-[9px] text-slate-500 block">Aprobados: {r.aprobados} / {r.total}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Accesos rápidos de administración */}
            <div className="glass-panel p-6 rounded-2xl lg:col-span-2">
              <h3 className="font-semibold text-slate-200 text-sm mb-4">Accesos de Configuración Rápida</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {adminCards.map((c, i) => (
                  <div
                    key={i}
                    onClick={() => navigate(c.path)}
                    className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 cursor-pointer hover:border-blue-500/35 hover:bg-slate-900/20 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <h4 className="font-semibold text-xs text-slate-200 hover:text-blue-400">{c.title}</h4>
                      <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{c.desc.slice(0, 50)}...</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
