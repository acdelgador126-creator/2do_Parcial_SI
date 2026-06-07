import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

export default function PreinscripcionPage() {
  const navigate = useNavigate();

  // Estados del Formulario
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
  // Pasos: 'form' -> 'verification' -> 'validating' -> 'payment' -> 'processing_payment'
  const [step, setStep] = useState('form');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [postulanteData, setPostulanteData] = useState(null);
  const [paymentError, setPaymentError] = useState('');

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

  // PASO 1: Validar formulario y pasar a revisión
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (primeraOpcion === segundaOpcion) {
      setError('La primera y segunda opción de carrera deben ser diferentes.');
      return;
    }
    setError('');
    setStep('verification');
  };

  // PASO 2: Proceder con verificación civil, registro y redirección a pago
  const handleVerifyAndRegister = async () => {
    setStep('validating');
    setLoading(true);
    setError('');

    try {
      // 1. Registrar postulante en BD
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

      const postulanteId = regData.postulante.id;

      // 2. Verificación civil (SEGIP/SEDUCA)
      const { data: verifData } = await api.post(
        `/postulantes/${postulanteId}/verificar`
      );

      if (verifData.verificacion && !verifData.verificacion.aprobado) {
        throw new Error(
          verifData.message || 'No se pudo verificar la identidad o el título de bachiller.'
        );
      }

      // 3. Guardamos datos del postulante y redirigimos a Stripe
      setPostulanteData({ id: postulanteId, ...regData.postulante });
      setStep('processing_payment');

      console.log('📡 Enviando solicitud de pago para postulante:', postulanteId);
      
      const { data: pagoData } = await api.post(
        `/postulantes/${postulanteId}/pago`
      );

      console.log('✅ Respuesta del servidor:', pagoData);

      if (pagoData.checkout_url) {
        console.log('🔗 Redirigiendo a Stripe URL:', pagoData.checkout_url);
        // Redirigir a Stripe - el usuario debe pagar
        window.location.href = pagoData.checkout_url;
      } else {
        console.error('❌ No hay checkout_url en la respuesta:', pagoData);
        throw new Error('No se pudo inicializar la pasarela de pagos. Respuesta: ' + JSON.stringify(pagoData));
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
        err.message ||
        'Error en el proceso de verificación/registro o inicio de pago.'
      );
      setStep('verification');
      setLoading(false);
    }
  };

  // Prevenir navegación hacia atrás cuando estamos redirigiendo
  useEffect(() => {
    if (step === 'processing_payment') {
      const handlePopState = (e) => {
        e.preventDefault();
        alert(
          'Redirigiendo a la pasarela de pagos...'
        );
        window.history.pushState(null, '', window.location.href);
      };
      window.addEventListener('popstate', handlePopState);
      window.history.pushState(null, '', window.location.href);

      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [step]);

  return (
    <div className="min-h-screen bg-slate-950 px-4 relative overflow-hidden py-12 flex flex-col items-center justify-center">
      {/* Elementos decorativos */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-950/25 rounded-full blur-[120px] pointer-events-none -z-10"></div>

      <div className="w-full max-w-2xl z-10">

        {/* ============ PASO 1: FORMULARIO ============ */}
        {step === 'form' && (
          <>
            <div className="text-center mb-8">
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-widest font-mono">
                Paso 1 de 2
              </span>
              <h1 className="text-2xl font-bold text-slate-100 tracking-tight mt-1">
                Formulario de Registro
              </h1>
              <p className="text-xs text-slate-400 mt-2">
                Completa todos los campos requeridos
              </p>
            </div>

            {error && (
              <div className="bg-red-950/50 border border-red-500/30 text-red-300 p-4 rounded-xl mb-6 text-sm text-center">
                ⚠️ {error}
              </div>
            )}

            <div className="glass-panel p-8 rounded-2xl shadow-2xl">
              <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* CI */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Carnet de Identidad (CI) *
                  </label>
                  <input
                    type="text"
                    value={ci}
                    onChange={(e) => setCi(e.target.value)}
                    placeholder="Ej. 8765432"
                    className="w-full bg-slate-900/80 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
                    required
                  />
                </div>

                {/* Nombres */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Nombres *
                  </label>
                  <input
                    type="text"
                    value={nombres}
                    onChange={(e) => setNombres(e.target.value)}
                    placeholder="Ej. Juan"
                    className="w-full bg-slate-900/80 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
                    required
                  />
                </div>

                {/* Apellidos */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Apellidos *
                  </label>
                  <input
                    type="text"
                    value={apellidos}
                    onChange={(e) => setApellidos(e.target.value)}
                    placeholder="Ej. Pérez García"
                    className="w-full bg-slate-900/80 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
                    required
                  />
                </div>

                {/* Fecha Nacimiento */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Fecha de Nacimiento *
                  </label>
                  <input
                    type="date"
                    value={fechaNacimiento}
                    onChange={(e) => setFechaNacimiento(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
                    required
                  />
                </div>

                {/* Sexo */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Sexo *
                  </label>
                  <select
                    value={sexo}
                    onChange={(e) => setSexo(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
                    required
                  >
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                  </select>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Ej. juan@gmail.com"
                    className="w-full bg-slate-900/80 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
                    required
                  />
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="Ej. 71234567"
                    className="w-full bg-slate-900/80 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* Dirección */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Dirección de Domicilio
                  </label>
                  <input
                    type="text"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    placeholder="Ej. Calle Principal 123, Apt 4B"
                    className="w-full bg-slate-900/80 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* Ciudad */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Ciudad de Residencia *
                  </label>
                  <input
                    type="text"
                    value={ciudad}
                    onChange={(e) => setCiudad(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
                    required
                  />
                </div>

                {/* Colegio */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Colegio de Procedencia *
                  </label>
                  <input
                    type="text"
                    value={colegio}
                    onChange={(e) => setColegio(e.target.value)}
                    placeholder="Ej. Colegio Nacional Florida"
                    className="w-full bg-slate-900/80 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
                    required
                  />
                </div>

                {/* Título Bachiller */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Título de Bachiller *
                  </label>
                  <input
                    type="text"
                    value={tituloBachiller}
                    onChange={(e) => setTituloBachiller(e.target.value)}
                    placeholder="Ej. Bachiller Técnico Humanístico"
                    className="w-full bg-slate-900/80 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
                    required
                  />
                </div>

                {/* Separador */}
                <div className="md:col-span-2 border-t border-slate-800/60 pt-4 mt-2">
                  <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                    📚 Preferencias Académicas
                  </h3>
                </div>

                {/* Primera Opción */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Primera Opción de Carrera *
                  </label>
                  <select
                    value={primeraOpcion}
                    onChange={(e) => setPrimeraOpcion(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="1">Ingeniería Informática</option>
                    <option value="2">Ingeniería de Sistemas</option>
                    <option value="3">Ingeniería en Redes</option>
                  </select>
                </div>

                {/* Segunda Opción */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Segunda Opción de Carrera *
                  </label>
                  <select
                    value={segundaOpcion}
                    onChange={(e) => setSegundaOpcion(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="1">Ingeniería Informática</option>
                    <option value="2">Ingeniería de Sistemas</option>
                    <option value="3">Ingeniería en Redes</option>
                  </select>
                </div>

                {/* Turno */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Turno de Preferencia *
                  </label>
                  <select
                    value={turno}
                    onChange={(e) => setTurno(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="Manana">Mañana</option>
                    <option value="Tarde">Tarde</option>
                    <option value="Noche">Noche</option>
                  </select>
                </div>

                {/* Botón Enviar */}
                <button
                  type="submit"
                  className="md:col-span-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-3.5 rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-blue-500/10 cursor-pointer mt-4"
                >
                  ➜ Continuar a Revisión
                </button>

                {/* Link Login */}
                <div className="md:col-span-2 text-center mt-4 border-t border-slate-800/60 pt-4">
                  <a
                    href="/login"
                    className="text-xs text-slate-400 hover:text-slate-200 transition-colors font-semibold"
                  >
                    ¿Ya tienes una cuenta? Ir al Login
                  </a>
                </div>
              </form>
            </div>
          </>
        )}

        {/* ============ PASO 2: VERIFICACIÓN DE DATOS ============ */}
        {step === 'verification' && (
          <>
            <div className="text-center mb-8">
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-widest font-mono">
                Paso 2 de 2
              </span>
              <h1 className="text-2xl font-bold text-slate-100 tracking-tight mt-1">
                Revisa tu Información
              </h1>
              <p className="text-xs text-slate-400 mt-2">
                Verifica que todos los datos sean correctos antes de continuar
              </p>
            </div>

            <div className="glass-panel p-8 rounded-2xl shadow-2xl">
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-6 space-y-4 mb-8 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* CI */}
                  <div className="border-b border-slate-800 pb-2 md:col-span-2">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Documento (CI)
                    </span>
                    <span className="text-slate-200 font-semibold text-base">{ci}</span>
                  </div>

                  {/* Nombres y Apellidos */}
                  <div className="border-b border-slate-800 pb-2">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Nombres
                    </span>
                    <span className="text-slate-200 font-semibold">{nombres}</span>
                  </div>

                  <div className="border-b border-slate-800 pb-2">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Apellidos
                    </span>
                    <span className="text-slate-200 font-semibold">{apellidos}</span>
                  </div>

                  {/* Datos personales */}
                  <div className="border-b border-slate-800 pb-2">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Sexo
                    </span>
                    <span className="text-slate-200 font-semibold">{getSexoName(sexo)}</span>
                  </div>

                  <div className="border-b border-slate-800 pb-2">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Fecha de Nacimiento
                    </span>
                    <span className="text-slate-200 font-semibold">{fechaNacimiento}</span>
                  </div>

                  {/* Contacto */}
                  <div className="border-b border-slate-800 pb-2 md:col-span-2">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Correo Electrónico
                    </span>
                    <span className="text-slate-200 font-semibold">{email}</span>
                  </div>

                  <div className="border-b border-slate-800 pb-2">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Teléfono
                    </span>
                    <span className="text-slate-200 font-semibold">{telefono || 'No indicado'}</span>
                  </div>

                  <div className="border-b border-slate-800 pb-2">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Ciudad
                    </span>
                    <span className="text-slate-200 font-semibold">{ciudad}</span>
                  </div>

                  {/* Académicos */}
                  <div className="border-b border-slate-800 pb-2 md:col-span-2">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Colegio de Procedencia
                    </span>
                    <span className="text-slate-200 font-semibold">{colegio}</span>
                  </div>

                  <div className="border-b border-slate-800 pb-2 md:col-span-2">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Título de Bachiller
                    </span>
                    <span className="text-slate-200 font-semibold">{tituloBachiller}</span>
                  </div>

                  {/* Preferencias */}
                  <div className="border-b border-slate-800 pb-2">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      1ª Opción de Carrera
                    </span>
                    <span className="text-slate-200 font-semibold">
                      {getCarreraName(primeraOpcion)}
                    </span>
                  </div>

                  <div className="border-b border-slate-800 pb-2">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      2ª Opción de Carrera
                    </span>
                    <span className="text-slate-200 font-semibold">
                      {getCarreraName(segundaOpcion)}
                    </span>
                  </div>

                  <div className="border-b border-slate-800 pb-2 md:col-span-2">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Turno de Preferencia
                    </span>
                    <span className="text-slate-200 font-semibold">{getTurnoName(turno)}</span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-950/50 border border-red-500/30 text-red-300 p-4 rounded-xl mb-6 text-sm text-center">
                  ⚠️ {error}
                </div>
              )}

              {/* Botones */}
              <div className="flex gap-3 flex-col md:flex-row">
                <button
                  onClick={() => setStep('form')}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3.5 rounded-xl font-semibold transition-all duration-300 cursor-pointer"
                >
                  ← Editar Información
                </button>

                <button
                  onClick={handleVerifyAndRegister}
                  disabled={loading}
                  className={`flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white py-3.5 rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-green-500/10 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 ${
                    loading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Verificando...
                    </>
                  ) : (
                    <>✓ Verificar e Ir a Pago</>
                  )}
                </button>
              </div>

              {/* Botón para eliminar registro anterior si hay error de email duplicado */}
              {error && error.includes('ya está registrado') && (
                <div className="mt-4">
                  <button
                    onClick={handleDeleteAndRetry}
                    disabled={loading}
                    className={`w-full bg-orange-600 hover:bg-orange-500 text-white py-3 rounded-xl font-semibold transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 ${
                      loading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Eliminando registro anterior...
                      </>
                    ) : (
                      <>🔄 Eliminar Registro Anterior y Reintentar</>
                    )}
                  </button>
                  <p className="text-xs text-slate-400 mt-2 text-center">
                    Esto eliminará completamente tu registro anterior y permitirá re-registrarte con el mismo correo.
                  </p>
                </div>
              )}

            </div>
          </>
        )}



      </div>
    </div>
  );
}
