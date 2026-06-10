import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

function formatearHorario(horarios) {
  if (!horarios?.length) return null;
  const { hora_inicio, hora_fin } = horarios[0];
  const mismoHorario = horarios.every(
    (h) => h.hora_inicio === hora_inicio && h.hora_fin === hora_fin
  );
  const diasLaborales = horarios.length === 5 && horarios.every((h, i) => h.dia_semana === i + 1);

  if (mismoHorario && diasLaborales) {
    return `Lunes a Viernes: ${hora_inicio} — ${hora_fin}`;
  }

  return horarios
    .map((h) => `${h.dia_nombre}: ${h.hora_inicio} — ${h.hora_fin}`)
    .join(' · ');
}

export default function DocentesPage() {
  const [docentes, setDocentes] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [materias, setMaterias] = useState([]);

  const [docenteId, setDocenteId] = useState('');
  const [grupoId, setGrupoId] = useState('');
  const [materiaId, setMateriaId] = useState('');
  const [horarioPreview, setHorarioPreview] = useState([]);

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [loading, setLoading] = useState(true);
  const [pendientes, setPendientes] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resDoc, resGrup, resPend, resMat] = await Promise.all([
        api.get('/docentes'),
        api.get('/grupos'),
        api.get('/postulaciones-docentes', { params: { estado: 'Pendiente de Revision' } }),
        api.get('/materias'),
      ]);
      setDocentes(resDoc.data || []);
      setGrupos(resGrup.data || []);
      setPendientes(resPend.data?.total ?? (resPend.data?.data?.length || 0));
      setMaterias(resMat.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const cargarHorario = useCallback(async (gId, mId) => {
    if (!gId || !mId) {
      setHorarioPreview([]);
      return;
    }
    try {
      const { data } = await api.get('/horarios-grupo-materia', {
        params: { grupo_id: gId, materia_id: mId },
      });
      setHorarioPreview(data || []);
    } catch {
      setHorarioPreview([]);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (grupoId && materiaId) {
      cargarHorario(grupoId, materiaId);
    } else {
      setHorarioPreview([]);
    }
  }, [grupoId, materiaId, cargarHorario]);

  const showMsg = (text, type = 'info') => {
    setMessage(text);
    setMessageType(type);
  };

  const asignarDocente = async (e, forzarEspecialidad = false) => {
    if (e) e.preventDefault();
    setMessage('');

    try {
      await api.post('/docentes/asignar', {
        docente_id: parseInt(docenteId, 10),
        grupo_id: parseInt(grupoId, 10),
        materia_id: parseInt(materiaId, 10),
        confirmar_especialidad: forzarEspecialidad,
      });

      showMsg('Docente asignado al grupo y materia. El horario institucional quedó vinculado sin choques.', 'success');
      fetchData();
    } catch (err) {
      if (err.response?.status === 428 && err.response?.data?.requires_confirmation) {
        const confirmar = window.confirm(err.response.data.message);
        if (confirmar) {
          asignarDocente(null, true);
        } else {
          showMsg('Asignacion cancelada por el usuario.', 'error');
        }
      } else {
        showMsg(err.response?.data?.message || 'Error en la asignacion', 'error');
      }
    }
  };

  const grupoLabel = (g) => `Grupo #${g.numero} — Turno ${g.turno}`;

  return (
    <div className="py-6 space-y-8">
      <div>
        <span className="text-xs font-semibold text-blue-400 uppercase tracking-widest font-mono">Personal</span>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight mt-1">Planificacion Docente</h1>
        <p className="text-xs text-slate-500 mt-1">
          CU12 — Los horarios de cada materia por grupo son fijos en el sistema. Solo asigne el docente; el sistema valida choques.
        </p>
      </div>

      {pendientes > 0 && (
        <div className="glass-panel p-4 rounded-2xl border border-slate-800/80 bg-slate-900/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600/15 text-blue-400 flex items-center justify-center text-sm font-semibold border border-blue-500/20">
              {pendientes}
            </span>
            <div>
              <p className="text-sm font-medium text-slate-200">
                {pendientes === 1 ? 'Hay 1 postulacion docente pendiente' : `Hay ${pendientes} postulaciones docentes pendientes`}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Revise y acéptelas antes de asignarlas aqui (CU25).</p>
            </div>
          </div>
          <Link
            to="/admin/postulaciones-docentes"
            className="inline-flex justify-center items-center px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700/50 transition-colors whitespace-nowrap"
          >
            Ir a Revisar Postulaciones
          </Link>
        </div>
      )}

      {message && (
        <div className={`p-4 rounded-xl text-sm border ${
          messageType === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
            : messageType === 'error'
            ? 'bg-red-500/10 border-red-500/20 text-red-300'
            : 'bg-blue-950/40 border-blue-500/20 text-blue-300'
        }`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 glass-panel p-6 rounded-2xl shadow-xl h-fit">
          <h2 className="text-lg font-bold mb-1 text-slate-100">Asignar Docente</h2>
          <p className="text-xs text-slate-500 mb-4">Seleccione docente, grupo y materia. El horario ya esta definido en la base de datos.</p>

          <form onSubmit={asignarDocente} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Docente</label>
              <select value={docenteId} onChange={(e) => setDocenteId(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-700/50 rounded-xl px-4 py-2.5 text-slate-200 text-sm" required>
                <option value="">Seleccione Docente</option>
                {docentes.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.apellidos}, {d.nombres} ({d.especialidad}) — {d.carga_actual}/4
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Grupo</label>
              <select value={grupoId} onChange={(e) => setGrupoId(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-700/50 rounded-xl px-4 py-2.5 text-slate-200 text-sm" required>
                <option value="">Seleccione Grupo</option>
                {grupos.map((g) => (
                  <option key={g.id} value={g.id}>{grupoLabel(g)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Materia</label>
              <select value={materiaId} onChange={(e) => setMateriaId(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-700/50 rounded-xl px-4 py-2.5 text-slate-200 text-sm" required>
                <option value="">Seleccione Materia</option>
                {materias.map((m) => (
                  <option key={m.id} value={m.id}>{m.nombre}</option>
                ))}
              </select>
            </div>

            {horarioPreview.length > 0 ? (
              <div className="bg-slate-950/50 border border-blue-500/20 rounded-xl p-3 text-xs text-slate-300">
                <p className="font-semibold text-blue-300 mb-2">Horario institucional (solo lectura):</p>
                <p className="font-mono text-slate-200">{formatearHorario(horarioPreview)}</p>
              </div>
            ) : grupoId && materiaId ? (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-300">
                Horario no disponible para este grupo/materia. Verifique que existan grupos creados (CU10) y que las migraciones esten aplicadas.
              </div>
            ) : null}

            <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl font-semibold text-xs uppercase cursor-pointer">
              Asignar Docente
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl shadow-xl">
          <h2 className="text-lg font-bold mb-4 text-slate-100">Docentes y Carga Horaria Asignada</h2>
          {loading ? (
            <p className="text-slate-400 text-sm">Cargando nomina...</p>
          ) : (
            <div className="space-y-4">
              {docentes.map((d) => (
                <div key={d.id} className="border border-slate-800 rounded-xl p-4 bg-slate-950/30">
                  <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-100">{d.apellidos}, {d.nombres}</p>
                      <p className="text-xs text-slate-400">{d.especialidad}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${
                      d.carga_actual >= 4
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                        : 'bg-green-500/10 text-green-400 border border-green-500/20'
                    }`}>
                      {d.carga_actual} / 4 grupos
                    </span>
                  </div>
                  {d.asignaciones?.length > 0 ? (
                    <div className="space-y-2">
                      {d.asignaciones.map((a) => (
                        <div key={a.id} className="text-xs bg-slate-900/50 rounded-lg p-2 border border-slate-800/60">
                          <p className="text-slate-200 font-medium">
                            Grupo #{a.grupo?.numero} ({a.grupo?.turno}) — {a.materia?.nombre}
                          </p>
                          {a.horarios?.length > 0 ? (
                            <p className="text-slate-400 mt-1 font-mono">
                              {formatearHorario(a.horarios)}
                            </p>
                          ) : (
                            <p className="text-amber-400/80 mt-1">Horario institucional pendiente de carga en BD</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">Sin asignaciones</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
