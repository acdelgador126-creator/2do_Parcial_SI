import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

/**
 * CU24: Registrar Postulacion de Docente.
 * Formulario publico (sin autenticacion) para que un aspirante a docente
 * registre su postulacion. El expediente queda en estado "Pendiente de Revision".
 */
export default function PostulacionDocentePage() {
  const [form, setForm] = useState({
    ci: '',
    nombres: '',
    apellidos: '',
    correo: '',
    telefono: '',
    fecha_nacimiento: '',
    grado_academico: '',
    especialidad: '',
    area_id: '',
  });
  const [hojaVida, setHojaVida] = useState(null);
  const [respaldos, setRespaldos] = useState(null);
  const [areas, setAreas] = useState([]);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('form'); // 'form' | 'success'

  useEffect(() => {
    const cargarAreas = async () => {
      try {
        const res = await api.get('/postulaciones-docentes/areas');
        setAreas(res.data || []);
      } catch {
        // Si falla la carga, el selector quedara vacio; el usuario puede reintentar.
      }
    };
    cargarAreas();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validar = () => {
    const e = {};
    if (!form.ci.trim()) e.ci = 'El CI es obligatorio.';
    if (!form.nombres.trim()) e.nombres = 'Ingrese sus nombres.';
    if (!form.apellidos.trim()) e.apellidos = 'Ingrese sus apellidos.';
    if (!form.correo.trim()) e.correo = 'Ingrese su correo.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo)) e.correo = 'Correo invalido.';
    if (!form.grado_academico.trim()) e.grado_academico = 'Indique su grado academico.';
    if (!form.especialidad.trim()) e.especialidad = 'Declare su especialidad.';
    if (!form.area_id) e.area_id = 'Seleccione el area en la que desea ensenar.';
    if (!hojaVida) e.hoja_vida = 'Adjunte su hoja de vida (PDF).';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setError('');
    if (!validar()) return;

    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v ?? ''));
      fd.append('hoja_vida', hojaVida);
      if (respaldos) fd.append('respaldos', respaldos);

      await api.post('/postulaciones-docentes', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setStep('success');
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) {
        const flat = {};
        Object.entries(data.errors).forEach(([k, v]) => { flat[k] = Array.isArray(v) ? v[0] : v; });
        setErrors(flat);
      }
      setError(data?.message || 'No se pudo registrar la postulacion. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field) =>
    `w-full bg-slate-900/80 border rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none transition-colors ${
      errors[field] ? 'border-red-500 focus:border-red-500' : 'border-slate-700/50 focus:border-blue-500'
    }`;

  return (
    <div className="min-h-screen bg-slate-950 px-4 relative overflow-hidden py-12 flex flex-col items-center justify-center">
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-950/25 rounded-full blur-[120px] pointer-events-none -z-10"></div>

      <div className="w-full max-w-2xl z-10">
        {step === 'success' ? (
          <div className="glass-panel p-10 rounded-2xl shadow-2xl text-center">
            <div className="mx-auto mb-5 w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-100 mb-2">Postulacion registrada</h1>
            <p className="text-sm text-slate-400 mb-8 max-w-md mx-auto">
              Su postulacion fue registrada exitosamente y sera revisada por la coordinacion.
              Le notificaremos por correo el resultado de la evaluacion.
            </p>
            <Link
              to="/login"
              className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 btn-premium shadow-lg shadow-blue-600/15"
            >
              Volver al inicio
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-widest font-mono">
                Convocatoria Docente CUP - FICCT
              </span>
              <h1 className="text-2xl font-bold text-slate-100 tracking-tight mt-1">
                Postular como Docente
              </h1>
              <p className="text-xs text-slate-400 mt-2">
                Complete sus datos academicos y adjunte sus respaldos
              </p>
            </div>

            {error && (
              <div className="bg-red-950/50 border border-red-500/30 text-red-300 p-4 rounded-xl mb-6 text-sm text-center">
                {error}
              </div>
            )}

            <div className="glass-panel p-8 rounded-2xl shadow-2xl">
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Carnet de Identidad (CI) *</label>
                  <input name="ci" value={form.ci} onChange={handleChange} placeholder="Ej. 8765432" className={inputClass('ci')} />
                  {errors.ci && <p className="text-xs text-red-400 mt-1 ml-1">{errors.ci}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Nombres *</label>
                  <input name="nombres" value={form.nombres} onChange={handleChange} placeholder="Ej. Juan" className={inputClass('nombres')} />
                  {errors.nombres && <p className="text-xs text-red-400 mt-1 ml-1">{errors.nombres}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Apellidos *</label>
                  <input name="apellidos" value={form.apellidos} onChange={handleChange} placeholder="Ej. Perez Garcia" className={inputClass('apellidos')} />
                  {errors.apellidos && <p className="text-xs text-red-400 mt-1 ml-1">{errors.apellidos}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Correo electronico *</label>
                  <input name="correo" type="email" value={form.correo} onChange={handleChange} placeholder="nombre@correo.com" className={inputClass('correo')} />
                  {errors.correo && <p className="text-xs text-red-400 mt-1 ml-1">{errors.correo}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Telefono</label>
                  <input name="telefono" value={form.telefono} onChange={handleChange} placeholder="Ej. 70000000" className={inputClass('telefono')} />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Fecha de nacimiento</label>
                  <input name="fecha_nacimiento" type="date" value={form.fecha_nacimiento} onChange={handleChange} className={inputClass('fecha_nacimiento')} />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Grado academico *</label>
                  <select name="grado_academico" value={form.grado_academico} onChange={handleChange} className={inputClass('grado_academico')}>
                    <option value="">Seleccione...</option>
                    <option value="Licenciatura">Licenciatura</option>
                    <option value="Diplomado">Diplomado</option>
                    <option value="Especialidad">Especialidad</option>
                    <option value="Maestria">Maestria</option>
                    <option value="Doctorado">Doctorado</option>
                  </select>
                  {errors.grado_academico && <p className="text-xs text-red-400 mt-1 ml-1">{errors.grado_academico}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Especialidad *</label>
                  <input name="especialidad" value={form.especialidad} onChange={handleChange} placeholder="Ej. Calculo y Algebra" className={inputClass('especialidad')} />
                  {errors.especialidad && <p className="text-xs text-red-400 mt-1 ml-1">{errors.especialidad}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Area en la que desea ensenar *</label>
                  <select name="area_id" value={form.area_id} onChange={handleChange} className={inputClass('area_id')}>
                    <option value="">Seleccione un area...</option>
                    {areas.map((a) => (
                      <option key={a.id} value={a.id}>{a.nombre}</option>
                    ))}
                  </select>
                  {errors.area_id && <p className="text-xs text-red-400 mt-1 ml-1">{errors.area_id}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Hoja de vida (PDF) *</label>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => { setHojaVida(e.target.files[0] || null); setErrors((p) => ({ ...p, hoja_vida: undefined })); }}
                    className="w-full text-sm text-slate-300 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600/20 file:text-blue-300 hover:file:bg-blue-600/30 cursor-pointer bg-slate-900/80 border border-slate-700/50 rounded-xl"
                  />
                  {errors.hoja_vida && <p className="text-xs text-red-400 mt-1 ml-1">{errors.hoja_vida}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Respaldos academicos (PDF o ZIP)</label>
                  <input
                    type="file"
                    accept="application/pdf,application/zip,.zip"
                    onChange={(e) => setRespaldos(e.target.files[0] || null)}
                    className="w-full text-sm text-slate-300 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-700/40 file:text-slate-200 hover:file:bg-slate-700/60 cursor-pointer bg-slate-900/80 border border-slate-700/50 rounded-xl"
                  />
                </div>

                <div className="md:col-span-2 mt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-3.5 rounded-xl font-semibold transition-all duration-300 btn-premium shadow-lg shadow-blue-600/15 disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? 'Enviando postulacion...' : 'Enviar Postulacion'}
                  </button>
                </div>
              </form>
            </div>

            <p className="text-center text-xs text-slate-500 mt-6">
              ¿Ya tiene una cuenta?{' '}
              <Link to="/login" className="text-blue-400 hover:text-blue-300">Iniciar sesion</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
