import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';

/**
 * CU25: Aceptar Postulacion de Docente.
 * Vista de administracion para que el Administrador o Coordinador revise las
 * postulaciones docentes, valide la coincidencia especialidad <-> area y
 * acepte (crea cuenta de usuario) o rechace cada postulacion.
 */
const ESTADOS = [
  { value: 'Pendiente de Revision', label: 'Pendientes' },
  { value: 'Aceptado', label: 'Aceptadas' },
  { value: 'Rechazado', label: 'Rechazadas' },
  { value: 'todas', label: 'Todas' },
];

function EstadoBadge({ estado }) {
  const map = {
    'Pendiente de Revision': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    Aceptado: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Rechazado: 'bg-red-500/10 text-red-400 border-red-500/20',
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${map[estado] || 'bg-slate-700/30 text-slate-300 border-slate-600/30'}`}>
      {estado}
    </span>
  );
}

export default function PostulacionesDocentesPage() {
  const [estado, setEstado] = useState('Pendiente de Revision');
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type, text }

  const [detalle, setDetalle] = useState(null); // respuesta del endpoint show
  const [detalleLoading, setDetalleLoading] = useState(false);
  const [procesando, setProcesando] = useState(false);

  const [rechazoOpen, setRechazoOpen] = useState(false);
  const [motivo, setMotivo] = useState('');

  const [documentos, setDocumentos] = useState({}); // { hoja_vida|respaldos: { url, mime, nombre } }
  const [docActivo, setDocActivo] = useState(null);
  const [docLoading, setDocLoading] = useState(null); // tipo en carga

  const limpiarDocumentos = () => {
    Object.values(documentos).forEach((doc) => {
      if (doc?.url) URL.revokeObjectURL(doc.url);
    });
    setDocumentos({});
    setDocActivo(null);
    setDocLoading(null);
  };

  const verDocumento = async (docenteId, tipo) => {
    if (documentos[tipo]?.url) {
      setDocActivo(tipo);
      return;
    }

    setDocLoading(tipo);
    try {
      const path = tipo === 'hoja_vida'
        ? `/postulaciones-docentes/${docenteId}/hoja-vida`
        : `/postulaciones-docentes/${docenteId}/respaldos`;
      const res = await api.get(path, { responseType: 'blob' });
      const mime = res.headers['content-type'] || res.data.type || 'application/octet-stream';
      const extension = mime.includes('pdf') ? 'pdf' : mime.includes('zip') ? 'zip' : 'bin';
      const url = URL.createObjectURL(res.data);
      const nombre = tipo === 'hoja_vida' ? `hoja_vida.${extension}` : `respaldos.${extension}`;

      setDocumentos((prev) => {
        if (prev[tipo]?.url) URL.revokeObjectURL(prev[tipo].url);
        return { ...prev, [tipo]: { url, mime, nombre } };
      });
      setDocActivo(tipo);
    } catch {
      setFeedback({ type: 'error', text: 'No se pudo cargar el documento adjunto.' });
    } finally {
      setDocLoading(null);
    }
  };

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/postulaciones-docentes', { params: { estado, search } });
      setRows(res.data?.data || []);
    } catch {
      setFeedback({ type: 'error', text: 'No se pudieron cargar las postulaciones.' });
    } finally {
      setLoading(false);
    }
  }, [estado, search]);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  const abrirDetalle = async (docenteId) => {
    // CU25 - Paso 1: Act -> B_Int : + SeleccionarPostulacion(docenteId)
    setDetalleLoading(true);
    limpiarDocumentos();
    setDetalle({ docente: { id: docenteId } });
    try {
      // CU25 - Paso 2: B_Int -> C_Ctrl : + revisar(docenteId)
      const res = await api.get(`/postulaciones-docentes/${docenteId}`);
      setDetalle(res.data);
      if (res.data.tiene_hoja_vida) {
        await verDocumento(docenteId, 'hoja_vida');
      }
    } catch {
      setFeedback({ type: 'error', text: 'No se pudo cargar el detalle.' });
      setDetalle(null);
    } finally {
      setDetalleLoading(false);
    }
  };

  const cerrarDetalle = () => {
    limpiarDocumentos();
    setDetalle(null);
    setRechazoOpen(false);
    setMotivo('');
  };

  const aceptar = async (confirmarEspecialidad = false) => {
    if (!detalle?.docente?.id) return;
    setProcesando(true);
    try {
      const res = await api.post(`/postulaciones-docentes/${detalle.docente.id}/aceptar`, {
        confirmar_especialidad: confirmarEspecialidad,
      });
      // CU25 - Paso 11: C_Ctrl --> B_Int : + ConfirmarAceptacion()
      // CU25 - Paso 12: B_Int --> Act : + MostrarDocenteAceptado()
      setFeedback({ type: 'success', text: res.data?.message || 'Docente aceptado.' });
      cerrarDetalle();
      fetchRows();
    } catch (err) {
      const data = err.response?.data;
      if (err.response?.status === 428 && data?.requires_confirmation) {
        if (window.confirm(`${data.message}\n\n¿Desea aceptar de todas formas?`)) {
          await aceptar(true);
          return;
        }
      } else {
        setFeedback({ type: 'error', text: data?.message || 'No se pudo aceptar la postulacion.' });
      }
    } finally {
      setProcesando(false);
    }
  };

  const rechazar = async () => {
    if (!detalle?.docente?.id) return;
    if (!motivo.trim()) return;
    setProcesando(true);
    try {
      const res = await api.post(`/postulaciones-docentes/${detalle.docente.id}/rechazar`, { motivo });
      setFeedback({ type: 'success', text: res.data?.message || 'Postulacion rechazada.' });
      cerrarDetalle();
      fetchRows();
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'No se pudo rechazar la postulacion.' });
    } finally {
      setProcesando(false);
    }
  };

  const d = detalle?.docente;
  const docActual = docActivo ? documentos[docActivo] : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-semibold text-blue-400 uppercase tracking-widest">Gestion de Docentes</span>
          <h1 className="text-2xl font-bold text-slate-100 mt-1">Revision de Postulaciones Docentes</h1>
          <p className="text-xs text-slate-400 mt-1">CU25: Validar especialidad vs area, aceptar y crear cuenta o rechazar.</p>
        </div>
      </div>

      {feedback && (
        <div className={`mb-5 p-3 rounded-xl text-sm border ${
          feedback.type === 'success'
            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
            : 'bg-red-500/10 text-red-300 border-red-500/20'
        }`}>
          {feedback.text}
        </div>
      )}

      <div className="glass-panel p-5 rounded-2xl mb-6 flex flex-col md:flex-row gap-4 md:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {ESTADOS.map((e) => (
            <button
              key={e.value}
              onClick={() => setEstado(e.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                estado === e.value
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 border border-transparent'
              }`}
            >
              {e.label}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, CI o correo..."
          className="bg-slate-900/80 border border-slate-700/50 rounded-xl px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 md:w-72"
        />
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 font-semibold">Nombre</th>
                <th className="px-4 py-3 font-semibold">CI</th>
                <th className="px-4 py-3 font-semibold">Especialidad</th>
                <th className="px-4 py-3 font-semibold">Area postulada</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold text-right">Accion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Cargando...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">No hay postulaciones en este estado.</td></tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="px-4 py-3 text-slate-200 font-medium">{r.nombres} {r.apellidos}</td>
                    <td className="px-4 py-3 text-slate-400 font-mono">{r.ci}</td>
                    <td className="px-4 py-3 text-slate-300">{r.especialidad}</td>
                    <td className="px-4 py-3 text-slate-300">{r.area?.nombre || '—'}</td>
                    <td className="px-4 py-3"><EstadoBadge estado={r.estado} /></td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => abrirDetalle(r.id)}
                        className="text-xs font-semibold text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                      >
                        Revisar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de detalle / revision */}
      {detalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-3xl rounded-2xl shadow-2xl p-6 border border-slate-700/40 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={cerrarDetalle}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {detalleLoading ? (
              <div className="py-12 text-center text-slate-500">Cargando detalle...</div>
            ) : (
              <>
                <h2 className="text-lg font-bold text-slate-100 mb-1">{d?.nombres} {d?.apellidos}</h2>
                <div className="mb-4"><EstadoBadge estado={d?.estado} /></div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-5">
                  <Field label="CI" value={d?.ci} />
                  <Field label="Correo" value={d?.correo} />
                  <Field label="Telefono" value={d?.telefono || '—'} />
                  <Field label="Grado academico" value={d?.grado_academico} />
                  <Field label="Especialidad" value={d?.especialidad} />
                  <Field label="Area postulada" value={d?.area?.nombre || '—'} />
                </div>

                {/* Indicador informativo de validacion Especialidad <-> Area (CU25) */}
                <div className="mb-5 flex items-start gap-2 text-xs text-slate-500">
                  <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                    detalle?.especialidad_coincide ? 'bg-emerald-500/70' : 'bg-amber-500/60'
                  }`} />
                  <span>
                    {detalle?.especialidad_coincide
                      ? 'Coincidencia automatica entre especialidad y area.'
                      : 'Sin coincidencia automatica. Revise la hoja de vida; puede aceptar igual si considera que corresponde.'}
                  </span>
                </div>

                <div className="mb-5">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {detalle?.tiene_hoja_vida ? (
                      <button
                        type="button"
                        onClick={() => verDocumento(d.id, 'hoja_vida')}
                        disabled={docLoading === 'hoja_vida'}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          docActivo === 'hoja_vida'
                            ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/50'
                        }`}
                      >
                        {docLoading === 'hoja_vida' ? 'Cargando...' : 'Ver hoja de vida'}
                      </button>
                    ) : (
                      <span className="text-xs text-slate-500">Sin hoja de vida</span>
                    )}
                    {detalle?.tiene_respaldos && (
                      <button
                        type="button"
                        onClick={() => verDocumento(d.id, 'respaldos')}
                        disabled={docLoading === 'respaldos'}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          docActivo === 'respaldos'
                            ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/50'
                        }`}
                      >
                        {docLoading === 'respaldos' ? 'Cargando...' : 'Ver respaldos'}
                      </button>
                    )}
                    {docActual?.url && (
                      <a
                        href={docActual.url}
                        download={docActual.nombre}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/50"
                      >
                        Descargar
                      </a>
                    )}
                  </div>

                  {docActual?.url && docActual.mime.includes('pdf') && (
                    <iframe
                      src={docActual.url}
                      title="Vista previa del documento"
                      className="w-full h-[420px] rounded-xl border border-slate-700/60 bg-slate-900"
                    />
                  )}

                  {docActual?.url && !docActual.mime.includes('pdf') && (
                    <div className="p-4 rounded-xl border border-slate-700/60 bg-slate-900/50 text-sm text-slate-400">
                      Archivo listo. Use <strong className="text-slate-300">Descargar</strong> para abrir los respaldos (ZIP u otro formato).
                    </div>
                  )}
                </div>

                {d?.motivo_rechazo && (
                  <div className="mb-5 p-3 rounded-xl bg-red-950/40 border border-red-500/20 text-red-300 text-xs">
                    <span className="font-bold">Motivo de rechazo:</span> {d.motivo_rechazo}
                  </div>
                )}

                {d?.estado === 'Pendiente de Revision' && !rechazoOpen && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => aceptar(false)}
                      disabled={procesando}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-semibold transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {procesando ? 'Procesando...' : 'Aceptar Postulacion'}
                    </button>
                    <button
                      onClick={() => setRechazoOpen(true)}
                      disabled={procesando}
                      className="flex-1 bg-red-600 hover:bg-red-500 text-white py-3 rounded-xl font-semibold transition-all disabled:opacity-50 cursor-pointer"
                    >
                      Rechazar
                    </button>
                  </div>
                )}

                {rechazoOpen && (
                  <div className="mt-2">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Motivo del rechazo *</label>
                    <textarea
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      rows={3}
                      placeholder="Describa el motivo del rechazo..."
                      className="w-full bg-slate-900/80 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-500 mb-3"
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={rechazar}
                        disabled={procesando || !motivo.trim()}
                        className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-xl font-semibold transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {procesando ? 'Procesando...' : 'Confirmar rechazo'}
                      </button>
                      <button
                        onClick={() => { setRechazoOpen(false); setMotivo(''); }}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 py-2.5 rounded-xl font-semibold transition-all cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <span className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
      <span className="text-slate-200">{value}</span>
    </div>
  );
}
