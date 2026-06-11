import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

export default function AdmisionesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Administrador';
  // --- Estado de Gestiones (CU18) ---
  const [gestiones, setGestiones] = useState([]);
  const [selectedGestionId, setSelectedGestionId] = useState('new');
  const [gestionForm, setGestionForm] = useState({
    codigo: '',
    fecha_inicio: '',
    fecha_fin: '',
    activa: true
  });

  // --- Estado de Cupos ---
  const [carreras, setCarreras] = useState([]);
  const [cuposConfig, setCuposConfig] = useState({});

  // --- Estado de Admitidos (CU17) ---
  const [admitidos, setAdmitidos] = useState([]);
  const [resumen, setResumen] = useState(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // ==================== FETCH DATA ====================
  const fetchGestiones = async () => {
    try {
      const res = await api.get('/gestiones');
      setGestiones(res.data);
    } catch (err) {
      console.error('Error cargando gestiones:', err);
    }
  };

  const fetchCupos = async () => {
    try {
      const resStats = await api.get('/dashboard/estadisticas');
      setCarreras(resStats.data.cupos || []);

      const tempConfig = {};
      (resStats.data.cupos || []).forEach((c) => {
        tempConfig[c.nombre] = c.cupo_maximo;
      });
      setCuposConfig(tempConfig);
    } catch (err) {
      console.error('Error cargando cupos:', err);
    }
  };

  const fetchAdmitidos = async () => {
    try {
      const resAdmitidos = await api.get('/reportes/estructurado?tipo=admisiones');
      setAdmitidos(resAdmitidos.data.data || []);
    } catch (err) {
      console.error('Error cargando admitidos:', err);
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'No se pudo cargar la lista de admitidos.',
      });
    }
  };

  const fetchCuposYAdmitidos = async () => {
    await Promise.allSettled([fetchCupos(), fetchAdmitidos()]);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchGestiones();
      await fetchCuposYAdmitidos();
      setLoading(false);
    };
    init();
  }, []);

  // ==================== SELECTION & CHANGES ====================
  const handleGestionSelectChange = (id) => {
    setSelectedGestionId(id);
    if (id === 'new') {
      setGestionForm({ codigo: '', fecha_inicio: '', fecha_fin: '', activa: true });
    } else {
      const g = gestiones.find(item => item.id === parseInt(id));
      if (g) {
        setGestionForm({
          codigo: g.codigo,
          fecha_inicio: g.fecha_inicio ? g.fecha_inicio.substring(0, 10) : '',
          fecha_fin: g.fecha_fin ? g.fecha_fin.substring(0, 10) : '',
          activa: g.activa
        });
      }
    }
  };

  const handleCupoChange = (carreraNombre, val) => {
    setCuposConfig({
      ...cuposConfig,
      [carreraNombre]: parseInt(val) || 0,
    });
  };

  const saveConfigUnificada = async (e) => {
    // CU18 - Paso 1: Act -> B_Int : + EstablecerLimites(cuposPorCarrera)
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const defaultCarreras = [
        { id: 1, nombre: 'Ingenieria Informatica' },
        { id: 2, nombre: 'Ingenieria de Sistemas' },
        { id: 3, nombre: 'Ingenieria en Redes y Telecomunicaciones' },
        { id: 4, nombre: 'Ingenieria en Robotica' }
      ];

      const cuposPayload = defaultCarreras.map((c) => ({
        carrera_id: c.id,
        cupo_maximo: cuposConfig[c.nombre] !== undefined ? cuposConfig[c.nombre] : 0
      }));

      const payload = {
        gestion_codigo: gestionForm.codigo,
        fecha_inicio: gestionForm.fecha_inicio,
        fecha_fin: gestionForm.fecha_fin,
        activa: gestionForm.activa,
        cupos: cuposPayload
      };

      // CU18 - Paso 2: B_Int -> C_Ctrl : + store(request)
      await api.post('/cupos', payload);
      
      // CU18 - Paso 5: B_Int --> Act : + MostrarMensajeGuardado()
      setMessage({ type: 'success', text: 'Configuración de gestión y cupos guardada exitosamente.' });
      
      await fetchGestiones();
      await fetchCuposYAdmitidos();
      setSelectedGestionId('new');
      setGestionForm({ codigo: '', fecha_inicio: '', fecha_fin: '', activa: true });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Error al guardar la configuración.' });
    } finally {
      setLoading(false);
    }
  };

  const desactivarGestion = async (id) => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await api.post(`/gestiones/${id}/desactivar`);
      setMessage({ type: 'success', text: res.data.message });
      await fetchGestiones();
      await fetchCuposYAdmitidos();
      setSelectedGestionId('new');
      setGestionForm({ codigo: '', fecha_inicio: '', fecha_fin: '', activa: true });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Error al desactivar la gestión.' });
    } finally {
      setLoading(false);
    }
  };

  // ==================== ASIGNACIÓN MASIVA (CU17) ====================
  const runAsignacionMasiva = async () => {
    // CU17 - Paso 1: Act -> B_Admi : + ProcesarAsignacionCarreras()
    setLoading(true);
    setMessage(null);
    setResumen(null);
    try {
      // CU17 - Paso 2: B_Admi -> C_Asig : + asignacionMasiva()
      const res = await api.post('/admisiones/procesar');
      setResumen(res.data.estadisticas || res.data.resumen);
      
      // CU17 - Paso 12: B_Admi --> Act : + MostrarResultadosYAlertas()
      setMessage({ type: 'success', text: res.data.message });
      await fetchCuposYAdmitidos();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Error al ejecutar el algoritmo de admisión.' });
    } finally {
      setLoading(false);
    }
  };

  // ==================== HELPERS ====================
  const gestionActiva = gestiones.find(g => g.activa);

  return (
    <div className="py-6 max-w-7xl mx-auto px-4">
      {/* Encabezado */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-semibold text-blue-400 uppercase tracking-widest">Admisión Universitaria</span>
          <h1 className="text-2xl font-bold text-slate-100 mt-1">Gestión Académica, Cupos & Admisiones</h1>
          {gestionActiva && (
            <span className="text-xs text-emerald-400 mt-1 inline-block">
              Gestión Activa: <strong>{gestionActiva.codigo}</strong> ({new Date(gestionActiva.fecha_inicio).toLocaleDateString()} – {new Date(gestionActiva.fecha_fin).toLocaleDateString()})
            </span>
          )}
        </div>
        <button
          onClick={runAsignacionMasiva}
          disabled={loading}
          className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
        >
          {loading ? 'Procesando...' : 'Ejecutar Algoritmo de Admisión (CU17)'}
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl mb-6 border text-sm ${
          message.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      {resumen && (
        <div className="glass-panel p-4 rounded-xl mb-6 border border-blue-500/20 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <span className="text-[10px] text-slate-500 uppercase block">Procesados</span>
            <span className="text-lg font-bold text-slate-100">{resumen.procesados ?? 0}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase block">1ra Opción</span>
            <span className="text-lg font-bold text-emerald-400">{resumen.admitidos_1ra_opcion ?? 0}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase block">2da Opción</span>
            <span className="text-lg font-bold text-blue-400">{resumen.admitidos_2da_opcion ?? 0}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase block">Pendientes</span>
            <span className="text-lg font-bold text-amber-400">{resumen.pendientes_reasignacion ?? 0}</span>
          </div>
        </div>
      )}

      {/* ========== CONFIGURACIÓN UNIFICADA DE GESTIÓN Y CUPOS (CU18) ========== */}
      <div className={`grid grid-cols-1 gap-8 mb-8 ${isAdmin ? 'lg:grid-cols-3' : ''}`}>
        {/* Panel de Configuración Unificada (CU18) — solo Administrador */}
        {isAdmin && (
        <div className="glass-panel p-6 rounded-2xl lg:col-span-1 flex flex-col justify-between border border-slate-800">
          <div>
            <h2 className="text-lg font-semibold text-slate-200 mb-2">Configuración de Sistema (CU18)</h2>
            <p className="text-xs text-slate-400 mb-6">Cree/edite gestiones y configure sus límites de cupo por carrera en un único paso.</p>
            
            <div className="mb-5">
              <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">Seleccionar Gestión</label>
              <select
                value={selectedGestionId}
                onChange={(e) => handleGestionSelectChange(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-blue-500 outline-none"
              >
                <option value="new">-- Crear Nueva Gestión --</option>
                {gestiones.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.codigo} {g.activa ? '(Activa)' : '(Inactiva/Cerrada)'}
                  </option>
                ))}
              </select>
            </div>

            <form onSubmit={saveConfigUnificada} className="space-y-4">
              <div className="bg-slate-950/20 p-4 rounded-xl border border-slate-800/40 space-y-3">
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Parámetros de Gestión</h3>
                
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-500 uppercase">Código de Gestión</label>
                  <input
                    type="text"
                    value={gestionForm.codigo}
                    onChange={(e) => setGestionForm({ ...gestionForm, codigo: e.target.value })}
                    placeholder="1-2026"
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-blue-500 outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-500 uppercase">Fecha Inicio</label>
                    <input
                      type="date"
                      value={gestionForm.fecha_inicio}
                      onChange={(e) => setGestionForm({ ...gestionForm, fecha_inicio: e.target.value })}
                      className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-blue-500 outline-none"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-500 uppercase">Fecha Fin</label>
                    <input
                      type="date"
                      value={gestionForm.fecha_fin}
                      onChange={(e) => setGestionForm({ ...gestionForm, fecha_fin: e.target.value })}
                      className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-blue-500 outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="activa"
                    checked={gestionForm.activa}
                    onChange={(e) => setGestionForm({ ...gestionForm, activa: e.target.checked })}
                    className="w-4 h-4 rounded accent-blue-600 bg-slate-900 border-slate-850"
                  />
                  <label htmlFor="activa" className="text-xs text-slate-300 select-none cursor-pointer">
                    Establecer como Gestión Activa
                  </label>
                </div>
              </div>

              <div className="bg-slate-950/20 p-4 rounded-xl border border-slate-800/40 space-y-3">
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Límites de Cupo</h3>
                
                {[
                  'Ingenieria Informatica',
                  'Ingenieria de Sistemas',
                  'Ingenieria en Redes y Telecomunicaciones',
                  'Ingenieria en Robotica'
                ].map((nombre) => {
                  const c = carreras.find(item => item.nombre === nombre);
                  return (
                    <div key={nombre} className="flex flex-col gap-1">
                      <label className="text-[11px] text-slate-400 font-medium">{nombre}</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min="0"
                          value={cuposConfig[nombre] !== undefined ? cuposConfig[nombre] : 0}
                          onChange={(e) => handleCupoChange(nombre, e.target.value)}
                          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:border-blue-500 outline-none w-20 text-center font-mono"
                          required
                        />
                        {c && (
                          <span className="text-[10px] text-slate-500 font-mono">
                            Ocupados: {c.ocupados} | Libres: {c.cupos_disponibles}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600/15 text-blue-400 border border-blue-500/35 font-semibold text-xs py-2 rounded-xl hover:bg-blue-600/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : 'Guardar Configuración Unificada'}
                </button>

                {selectedGestionId !== 'new' && (
                  <button
                    type="button"
                    onClick={() => desactivarGestion(selectedGestionId)}
                    disabled={loading}
                    className="w-full bg-red-600/10 text-red-400 border border-red-500/25 font-semibold text-xs py-2 rounded-xl hover:bg-red-600/20 transition-all cursor-pointer"
                  >
                    Cierre de Gestión (Desactivar)
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
        )}

        {/* Listado de Admitidos y Asignados */}
        <div className={`glass-panel p-6 rounded-2xl ${isAdmin ? 'lg:col-span-2' : ''}`}>
          <h2 className="text-lg font-semibold text-slate-200 mb-4">Postulantes Admitidos a Carreras</h2>
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm">Cargando resultados...</div>
          ) : admitidos.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">No hay postulantes admitidos todavía. Ejecute el algoritmo de admisión.</div>
          ) : (
            <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-widest text-[10px] font-bold">
                    <th className="py-3 px-2">Postulante</th>
                    <th className="py-3 px-2">CI</th>
                    <th className="py-3 px-2">Carrera Asignada</th>
                    <th className="py-3 px-2">Mecanismo</th>
                    <th className="py-3 px-2">Recurrente</th>
                  </tr>
                </thead>
                <tbody>
                  {admitidos.map((p) => (
                    <tr key={p.id} className="border-b border-slate-800/50 hover:bg-slate-900/10 text-slate-300">
                      <td className="py-3 px-2 font-medium">{p.apellidos}, {p.nombres}</td>
                      <td className="py-3 px-2 font-mono">{p.ci}</td>
                      <td className="py-3 px-2">
                        <span className="font-semibold text-slate-200">{p.admision?.carrera?.nombre || '-'}</span>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          p.admision?.via === '1ra Opcion'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-blue-500/10 text-blue-400'
                        }`}>
                          {p.admision?.via || 'Reasignación'}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        {p.recurrente ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[9px] font-bold">Sí</span>
                        ) : (
                          <span className="text-slate-600 text-[9px]">No</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
