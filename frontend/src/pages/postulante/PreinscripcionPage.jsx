import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';

export default function PreinscripcionPage() {
  const navigate = useNavigate();

  // Campos del Formulario
  const [ci, setCi] = useState('');
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [sexo, setSexo] = useState('M');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [colegio, setColegio] = useState('');
  const [ciudad, setCiudad] = useState('Santa Cruz de la Sierra');
  const [tituloBachiller, setTituloBachiller] = useState('');
  const [primeraOpcion, setPrimeraOpcion] = useState('1');
  const [segundaOpcion, setSegundaOpcion] = useState('2');
  const [turno, setTurno] = useState('Manana');

  // Estados del Flujo
  // Pasos: 'form', 'verification', 'verifying', 'error'
  const [step, setStep] = useState('form');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const getCarreraName = (id) => {
    const mapping = {
      '1': 'Ingeniería Informática',
      '2': 'Ingeniería de Sistemas',
      '3': 'Ingeniería en Redes'
    };
    return mapping[id] || id;
  };

  const getTurnoName = (value) => {
    const mapping = {
      'Manana': 'Mañana',
      'Tarde': 'Tarde',
      'Noche': 'Noche'
    };
    return mapping[value] || value;
  };

  const getSexoName = (value) => {
    return value === 'M' ? 'Masculino' : 'Femenino';
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (primeraOpcion === segundaOpcion) {
      setError('La primera y segunda opción de carrera deben ser diferentes.');
      setStep('form');
      return;
    }
    setError('');
    setStep('verification');
  };

  const handleNext = async () => {
    setStep('verifying');
    setLoading(true);
    setError('');

    try {
      // 1. Registrar postulante (o actualizar si es recurrente)
      const { data: regData } = await api.post('/postulantes', {
        ci,
        nombres,
        apellidos,
        fecha_nacimiento: fechaNacimiento,
        sexo,
        direccion,
        telefono,
        email,
        colegio_procedencia: colegio,
        ciudad,
        titulo_bachiller: tituloBachiller,
        primera_opcion_id: parseInt(primeraOpcion),
        segunda_opcion_id: parseInt(segundaOpcion),
        turno_preferencia: turno,
      });

      const id = regData.postulante.id;

      // 2. Ejecutar la verificación contra SEGIP/SEDUCA
      const { data: verifData } = await api.post(`/postulantes/${id}/verificar`);
      
      // La verificación externa retorna aprobado o lanza error
      if (verifData.verificacion && !verifData.verificacion.aprobado) {
        throw new Error(verifData.message || 'No se pudo verificar la identidad o el título de bachiller.');
      }

      // 3. Crear sesión de pago en Stripe y redirigir
      const { data: pagoData } = await api.post(`/postulantes/${id}/pago`);
      
      if (pagoData.checkout_url) {
        window.location.href = pagoData.checkout_url;
      } else {
        throw new Error('No se pudo inicializar la pasarela de pagos.');
      }

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Error en el proceso de verificación/registro.');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 relative overflow-hidden py-12 flex flex-col items-center justify-center">
      {/* Elementos decorativos de fondo */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-950/25 rounded-full blur-[120px] pointer-events-none -z-10"></div>

      <div className="w-full max-w-2xl z-10">
        
        {/* PASO 1: FORMULARIO */}
        {step === 'form' && (
          <>
            <div className="text-center mb-8">
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-widest font-mono">Paso 1 de 2</span>
              <h1 className="text-2xl font-bold text-slate-100 tracking-tight mt-1">Formulario de Registro</h1>
            </div>

            {error && (
              <div className="bg-red-950/50 border border-red-500/30 text-red-300 p-4 rounded-xl mb-6 text-sm text-center">
                {error}
              </div>
            )}

            <div className="glass-panel p-8 rounded-2xl shadow-2xl">
              <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Carnet de Identidad (CI)</label>
                  <input type="text" value={ci} onChange={(e) => setCi(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500 transition-colors" required />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Nombres</label>
                  <input type="text" value={nombres} onChange={(e) => setNombres(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500 transition-colors" required />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Apellidos</label>
                  <input type="text" value={apellidos} onChange={(e) => setApellidos(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500 transition-colors" required />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Fecha de Nacimiento</label>
                  <input type="date" value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500 transition-colors" required />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Sexo</label>
                  <select value={sexo} onChange={(e) => setSexo(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500 transition-colors" required>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Correo Electrónico</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500 transition-colors" required />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Teléfono</label>
                  <input type="text" value={telefono} onChange={(e) => setTelefono(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500 transition-colors" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Dirección de Domicilio</label>
                  <input type="text" value={direccion} onChange={(e) => setDireccion(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500 transition-colors" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Ciudad de Residencia</label>
                  <input type="text" value={ciudad} onChange={(e) => setCiudad(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500 transition-colors" required />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Colegio de Procedencia</label>
                  <input type="text" value={colegio} onChange={(e) => setColegio(e.target.value)}
                    placeholder="Ej. Colegio Nacional Florida"
                    className="w-full bg-slate-900/80 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500 transition-colors" required />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Título de Bachiller</label>
                  <input type="text" value={tituloBachiller} onChange={(e) => setTituloBachiller(e.target.value)}
                    placeholder="Ej. Bachiller Técnico Humanístico"
                    className="w-full bg-slate-900/80 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500 transition-colors" required />
                </div>

                <div className="md:col-span-2 border-t border-slate-800/60 pt-4 mt-2">
                  <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-4">Preferencias Académicas</h3>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Primera Opción de Carrera</label>
                  <select value={primeraOpcion} onChange={(e) => setPrimeraOpcion(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500 transition-colors">
                    <option value="1">Ingeniería Informática</option>
                    <option value="2">Ingeniería de Sistemas</option>
                    <option value="3">Ingeniería en Redes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Segunda Opción de Carrera</label>
                  <select value={segundaOpcion} onChange={(e) => setSegundaOpcion(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500 transition-colors">
                    <option value="1">Ingeniería Informática</option>
                    <option value="2">Ingeniería de Sistemas</option>
                    <option value="3">Ingeniería en Redes</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Turno de Preferencia</label>
                  <select value={turno} onChange={(e) => setTurno(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500 transition-colors">
                    <option value="Manana">Mañana</option>
                    <option value="Tarde">Tarde</option>
                    <option value="Noche">Noche</option>
                  </select>
                </div>

                <button type="submit"
                  className="md:col-span-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-3.5 rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-blue-500/10 cursor-pointer mt-4"
                >
                  Iniciar Registro
                </button>

                <div className="md:col-span-2 text-center mt-4 border-t border-slate-800/60 pt-4">
                  <Link to="/login" className="text-xs text-slate-400 hover:text-slate-200 transition-colors font-semibold">
                    ¿Ya tienes una cuenta o realizaste tu pago? Volver al Login
                  </Link>
                </div>
              </form>
            </div>
          </>
        )}

        {/* PASO 2: VERIFICACIÓN INTERMEDIA DE DATOS */}
        {step === 'verification' && (
          <>
            <div className="text-center mb-8">
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-widest font-mono">Paso 2 de 2</span>
              <h1 className="text-2xl font-bold text-slate-100 tracking-tight mt-1">Verificar Información Ingresada</h1>
              <p className="text-xs text-slate-400 mt-2">Confirme que todos los datos sean correctos antes de proceder a la validación civil.</p>
            </div>

            <div className="glass-panel p-8 rounded-2xl shadow-2xl">
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-6 space-y-4 mb-6 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border-b border-slate-800 pb-2 md:col-span-2">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Documento de Identidad (CI)</span>
                    <span className="text-slate-200 font-semibold text-base">{ci}</span>
                  </div>

                  <div className="border-b border-slate-800 pb-2">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nombres</span>
                    <span className="text-slate-200 font-semibold">{nombres}</span>
                  </div>

                  <div className="border-b border-slate-800 pb-2">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Apellidos</span>
                    <span className="text-slate-200 font-semibold">{apellidos}</span>
                  </div>

                  <div className="border-b border-slate-800 pb-2">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Fecha de Nacimiento</span>
                    <span className="text-slate-200 font-semibold">{fechaNacimiento}</span>
                  </div>

                  <div className="border-b border-slate-800 pb-2">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Sexo</span>
                    <span className="text-slate-200 font-semibold">{getSexoName(sexo)}</span>
                  </div>

                  <div className="border-b border-slate-800 pb-2">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Correo Electrónico</span>
                    <span className="text-slate-200 font-semibold">{email}</span>
                  </div>

                  <div className="border-b border-slate-800 pb-2">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Teléfono</span>
                    <span className="text-slate-200 font-semibold">{telefono || '(No provisto)'}</span>
                  </div>

                  <div className="border-b border-slate-800 pb-2 md:col-span-2">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Dirección de Domicilio</span>
                    <span className="text-slate-200 font-semibold">{direccion || '(No provista)'}</span>
                  </div>

                  <div className="border-b border-slate-800 pb-2">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ciudad</span>
                    <span className="text-slate-200 font-semibold">{ciudad}</span>
                  </div>

                  <div className="border-b border-slate-800 pb-2">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Colegio de Procedencia</span>
                    <span className="text-slate-200 font-semibold">{colegio || '(No provisto)'}</span>
                  </div>

                  <div className="border-b border-slate-800 pb-2 md:col-span-2">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Título de Bachiller</span>
                    <span className="text-slate-200 font-semibold">{tituloBachiller}</span>
                  </div>

                  <div className="border-b border-slate-800 pb-2">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Primera Opción de Carrera</span>
                    <span className="text-slate-200 font-semibold text-blue-400">{getCarreraName(primeraOpcion)}</span>
                  </div>

                  <div className="border-b border-slate-800 pb-2">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Segunda Opción de Carrera</span>
                    <span className="text-slate-200 font-semibold text-blue-400">{getCarreraName(segundaOpcion)}</span>
                  </div>

                  <div className="pb-2 md:col-span-2">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Turno de Preferencia</span>
                    <span className="text-slate-200 font-semibold">{getTurnoName(turno)}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleCancel}
                  className="flex-1 bg-slate-900/60 border border-slate-800 hover:bg-slate-900 hover:border-slate-700 text-slate-300 py-3.5 rounded-xl font-semibold transition-all duration-300 shadow-md cursor-pointer text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleNext}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-3.5 rounded-xl font-bold transition-all duration-300 shadow-lg shadow-blue-500/10 cursor-pointer text-sm"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </>
        )}

        {/* PANTALLA DE CARGA (VERIFICACIÓN SEGIP/SEDUCA) */}
        {step === 'verifying' && (
          <div className="glass-panel p-12 rounded-2xl shadow-2xl text-center flex flex-col items-center justify-center max-w-md mx-auto">
            {/* Spinner animado circular */}
            <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-8"></div>
            
            <h2 className="text-lg font-bold text-slate-100 mb-3 leading-relaxed">
              Verificando datos con el SEGIP o las entidades que hay que verificar
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Por favor, espere un momento. Estamos contrastando su documento y título escolar con los registros oficiales antes de habilitar la pasarela de pagos.
            </p>
          </div>
        )}

        {/* PANTALLA DE ERROR */}
        {step === 'error' && (
          <div className="glass-panel p-8 rounded-2xl shadow-2xl text-center max-w-md mx-auto">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10 text-red-400 mb-6 border border-red-500/20">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <h2 className="text-lg font-bold text-slate-100 mb-3">No se pudo completar el registro</h2>
            
            <div className="bg-red-950/20 border border-red-500/30 text-red-300 p-4 rounded-xl mb-6 text-xs text-center leading-relaxed">
              {error}
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => setStep('form')}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-semibold transition-colors cursor-pointer text-sm"
              >
                Volver al Formulario
              </button>
              <button
                onClick={handleCancel}
                className="w-full bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200 py-3 rounded-xl font-semibold transition-colors cursor-pointer text-sm"
              >
                Volver al Login
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
