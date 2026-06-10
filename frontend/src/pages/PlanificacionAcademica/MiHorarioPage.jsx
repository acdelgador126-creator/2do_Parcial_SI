import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

const DIAS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'];

function celdaHorario(franjas, diaNum) {
  const f = franjas?.find((x) => x.dia_semana === diaNum);
  if (!f) return '—';
  return `${f.hora_inicio} – ${f.hora_fin}`;
}

export default function MiHorarioPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHorario = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/mi-horario');
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'No se pudo cargar su horario.');
      } finally {
        setLoading(false);
      }
    };
    fetchHorario();
  }, []);

  const esPostulante = data?.tipo === 'postulante';
  const esDocente = data?.tipo === 'docente';

  return (
    <div className="py-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <span className="text-xs font-semibold text-blue-400 uppercase tracking-widest">Planificación</span>
        <h1 className="text-2xl font-bold text-slate-100 mt-1">Mi Horario de Clases</h1>
        <p className="text-xs text-slate-500 mt-1">
          {user?.role === 'Postulante'
            ? 'Horario de su grupo asignado y materias del CUP.'
            : 'Grupos y materias donde esta asignado como docente.'}
        </p>
      </div>

      {loading && (
        <div className="glass-panel p-12 rounded-2xl text-center text-slate-400 text-sm">
          Cargando horario...
        </div>
      )}

      {error && (
        <div className="glass-panel p-6 rounded-2xl border border-red-500/20 text-red-300 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && data?.mensaje && (
        <div className="glass-panel p-6 rounded-2xl border border-amber-500/20 text-amber-300 text-sm mb-6">
          {data.mensaje}
        </div>
      )}

      {!loading && !error && esPostulante && data.grupo && (
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl">
            <h2 className="text-sm font-bold text-slate-200 mb-3">Datos del paralelo</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block">Grupo</span>
                <span className="text-slate-100 font-semibold">#{data.grupo.numero}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Turno</span>
                <span className="text-slate-100 font-semibold">{data.grupo.turno}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Aula</span>
                <span className="text-slate-100 font-semibold">{data.grupo.aula?.nombre || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Ubicación</span>
                <span className="text-slate-100 font-semibold">{data.grupo.aula?.ubicacion || '—'}</span>
              </div>
            </div>
          </div>

          {data.materias?.length > 0 ? (
            <div className="space-y-4">
              {data.materias.map((m) => (
                <div key={m.materia_id} className="glass-panel p-6 rounded-2xl">
                  <div className="flex flex-wrap justify-between items-start gap-2 mb-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-100">{m.materia}</h3>
                      <p className="text-xs text-blue-300 font-mono mt-1">{m.horario_resumen}</p>
                    </div>
                    <div className="text-right text-xs">
                      <span className="text-slate-500 block">Docente</span>
                      <span className="text-slate-200 font-medium">{m.docente || 'Por asignar'}</span>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse min-w-[400px]">
                      <thead>
                        <tr className="border-b border-slate-700 text-slate-400">
                          {DIAS.map((d, i) => (
                            <th key={d} className="py-2 px-2 text-center font-semibold">{d}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-slate-800/60">
                          {[1, 2, 3, 4, 5].map((dia) => (
                            <td key={dia} className="py-3 px-2 text-center font-mono text-slate-200">
                              {celdaHorario(m.franjas, dia)}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-panel p-6 rounded-2xl text-slate-400 text-sm">
              No hay horarios registrados para su grupo.
            </div>
          )}
        </div>
      )}

      {!loading && !error && esDocente && (
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl flex flex-wrap justify-between items-center gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-200">
                {data.docente?.apellidos}, {data.docente?.nombres}
              </h2>
              <p className="text-xs text-slate-400 mt-1">{data.docente?.especialidad}</p>
            </div>
            <span className="px-3 py-1 rounded-lg bg-blue-600/10 text-blue-400 border border-blue-500/20 text-xs font-bold">
              {data.carga_actual ?? 0} / 4 grupos asignados
            </span>
          </div>

          {data.asignaciones?.length > 0 ? (
            <div className="space-y-4">
              {data.asignaciones.map((a, idx) => (
                <div key={idx} className="glass-panel p-6 rounded-2xl">
                  <div className="flex flex-wrap justify-between items-start gap-2 mb-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-100">{a.materia}</h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Grupo #{a.grupo.numero} — Turno {a.grupo.turno}
                        {a.grupo.aula && ` · Aula ${a.grupo.aula}`}
                      </p>
                    </div>
                    <p className="text-xs text-blue-300 font-mono">{a.horario_resumen}</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse min-w-[400px]">
                      <thead>
                        <tr className="border-b border-slate-700 text-slate-400">
                          {DIAS.map((d) => (
                            <th key={d} className="py-2 px-2 text-center font-semibold">{d}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          {[1, 2, 3, 4, 5].map((dia) => (
                            <td key={dia} className="py-3 px-2 text-center font-mono text-slate-200">
                              {celdaHorario(a.franjas, dia)}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          ) : !data.mensaje && (
            <div className="glass-panel p-6 rounded-2xl text-slate-400 text-sm">
              Aun no tiene grupos asignados. El coordinador le asignara materias desde Planificación Docente.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
