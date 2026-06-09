import { useState, useEffect } from 'react';
import api from '../../api/axios';

/**
 * CU10 y CU11 - Gestión de Grupos / Paralelos
 * 
 * Interfaz que implementa el cálculo automático (Asignación Masiva)
 * y la Reasignación Individual/Manual de Postulantes según los diagramas.
 */
export default function GruposPage() {
  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Alertas
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // CU11 Form State
  const [postulanteId, setPostulanteId] = useState('');
  const [nuevoGrupoId, setNuevoGrupoId] = useState('');
  const [submittingReasignar, setSubmittingReasignar] = useState(false);

  const fetchGrupos = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/grupos');
      setGrupos(data || []);
      // Pre-select first group if none selected
      if (data && data.length > 0 && !nuevoGrupoId) {
        setNuevoGrupoId(data[0].id);
      }
    } catch (e) {
      console.error(e);
      setErrorMessage('Error al cargar la distribución de grupos.');
    } finally {
      setLoading(false);
    }
  };

  // CU10 - Iniciar Asignación Masiva
  const ejecutarAsignacion = async () => {
    // CU10 - Paso 1: Act -> B_Grup : + EjecutarCalculoAsignacion()
    setMessage('');
    setErrorMessage('');
    try {
      // CU10 - Paso 2: B_Grup -> C_Plan : + asignacionMasiva()
      const { data } = await api.post('/grupos/asignacion-masiva');
      
      // CU10 - Paso 12: C_Plan --> B_Grup : + ConfirmarAsignacionExitosa()
      setMessage(data.message + ` (${data.grupos_creados} grupos creados, ${data.postulantes_assigned ?? data.postulantes_asignados} asignados)`);
      // CU10 - Paso 13: B_Grup --> Act : + MostrarGruposConPostulantes()
      fetchGrupos();
    } catch (e) {
      setErrorMessage(e.response?.data?.message || 'Error en la asignación masiva.');
    }
  };

  // CU11 - Paso 1: Act -> B_Int : + SolicitarAjusteGrupo(postulanteId, nuevoGrupoId)
  const handleReasignarSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setErrorMessage('');
    
    if (!postulanteId || !nuevoGrupoId) {
      setErrorMessage('Debe especificar el ID del Postulante y el Grupo destino.');
      return;
    }

    setSubmittingReasignar(true);

    try {
      // CU11 - Paso 2: B_Int -> C_Ctrl : + reasignar(request)
      const response = await api.post('/grupos/reasignar', {
        postulante_id: parseInt(postulanteId, 10),
        grupo_id: parseInt(nuevoGrupoId, 10)
      });

      // CU11 - Paso 8: C_Ctrl --> B_Int : + RetornarExito()
      setMessage(response.data.message || 'Postulante reasignado correctamente.');
      setPostulanteId('');

      // CU11 - Paso 9: B_Int --> Act : + ActualizarListaGrupo()
      fetchGrupos();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Error al reasignar postulante. Verifique si el postulante existe y tiene pago aprobado.');
    } finally {
      setSubmittingReasignar(false);
    }
  };

  useEffect(() => {
    fetchGrupos();
  }, []);

  return (
    <div className="py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <span className="text-xs font-semibold text-blue-400 uppercase tracking-widest font-mono">Planificación</span>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight mt-1">Organización de Paralelos</h1>
        </div>
        
        {/* Acción CU10 */}
        <button 
          onClick={ejecutarAsignacion}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-6 py-3 rounded-xl font-bold text-xs tracking-wider uppercase transition-all duration-300 btn-premium shadow-lg shadow-emerald-600/15 cursor-pointer"
        >
          Ejecutar Asignación Masiva (CU10)
        </button>
      </div>

      {/* Alertas */}
      {message && (
        <div className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 p-4 rounded-xl mb-6 text-sm flex justify-between items-center">
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="text-emerald-400 hover:text-emerald-200">✕</button>
        </div>
      )}
      {errorMessage && (
        <div className="bg-red-950/40 border border-red-500/30 text-red-300 p-4 rounded-xl mb-6 text-sm flex justify-between items-center">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage('')} className="text-red-400 hover:text-red-200">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LISTADO DE GRUPOS - COLUMNA IZQUIERDA/CENTRAL */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-lg font-bold text-slate-100">Distribución de Paralelos Activos</h2>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-3"></div>
              <p className="text-slate-400 text-sm">Cargando planificación de paralelos...</p>
            </div>
          ) : grupos.length === 0 ? (
            <div className="glass-panel rounded-2xl p-12 text-center border border-slate-700/30">
              <svg className="w-12 h-12 text-slate-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p className="text-slate-400 text-sm">No existen paralelos creados. Ejecute la Asignación Masiva arriba.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {grupos.map((g) => {
                const percentage = Math.min((g.total_estudiantes / 70) * 100, 100);
                return (
                  <div key={g.id} className="glass-panel p-6 rounded-2xl shadow-xl border border-slate-700/20 hover:border-slate-600/50 transition-all duration-300">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold text-base text-slate-100">Grupo #{g.numero}</h3>
                      <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-300 px-2 py-0.5 rounded font-semibold uppercase tracking-wider">
                        {g.turno}
                      </span>
                    </div>
                    
                    <p className="text-xs text-slate-400">
                      Aula: <span className="text-slate-300 font-medium">{g.aula?.nombre || 'S/A'}</span> — {g.aula?.ubicacion || ''}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">ID Grupo: {g.id}</p>
                    
                    <div className="mt-6">
                      <div className="flex justify-between items-center text-xs mb-2">
                        <span className="text-slate-400">Capacidad Ocupada:</span>
                        <span className="font-bold text-slate-200">{g.total_estudiantes} / 70 estudiantes</span>
                      </div>
                      <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            percentage >= 100 ? 'bg-red-500' : percentage >= 80 ? 'bg-amber-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* AJUSTE MANUAL - COLUMNA DERECHA */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-slate-100">Ajuste Manual (CU11)</h2>
          
          {/* Formulario de Reasignación Manual */}
          <div className="glass-panel p-6 rounded-2xl shadow-2xl border border-slate-700/30">
            <h3 className="font-semibold text-slate-200 text-sm mb-1">Reasignación de Postulante</h3>
            <p className="text-xs text-slate-400 mb-6">Mueva manualmente a un postulante preinscripto a otro paralelo cuidando la capacidad máxima.</p>
            
            <form onSubmit={handleReasignarSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  ID del Postulante (CI o Código)
                </label>
                <input
                  type="number"
                  value={postulanteId}
                  onChange={(e) => setPostulanteId(e.target.value)}
                  placeholder="Ej. 1, 2, 3..."
                  className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Grupo / Paralelo Destino
                </label>
                <select
                  value={nuevoGrupoId}
                  onChange={(e) => setNuevoGrupoId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  required
                >
                  {grupos.length === 0 ? (
                    <option value="">No hay grupos disponibles</option>
                  ) : (
                    grupos.map((g) => (
                      <option key={g.id} value={g.id}>
                        Grupo #{g.numero} - {g.turno} ({g.total_estudiantes}/70 Alumnos)
                      </option>
                    ))
                  )}
                </select>
              </div>

              <button
                type="submit"
                disabled={submittingReasignar || grupos.length === 0}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-3 rounded-xl text-sm transition-all duration-300 btn-premium shadow-lg shadow-blue-600/10 disabled:opacity-50 cursor-pointer"
              >
                {submittingReasignar ? 'Reasignando...' : 'Confirmar Reasignación'}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
