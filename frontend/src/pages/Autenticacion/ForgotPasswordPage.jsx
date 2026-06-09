import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

/**
 * CU03 - Recuperar Contraseña
 * 
 * Interfaz de recuperación de contraseña siguiendo el diagrama de secuencia.
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    // CU03 - Paso 1: Act -> B_Int : + IngresarCorreo(correo)
    // El usuario ingresa el correo y envía el formulario.

    try {
      // CU03 - Paso 2: B_Int -> C_Ctrl : + forgotPassword(email)
      // La IU delega la solicitud de recuperación al controlador en el backend
      const response = await api.post('/forgot-password', { email });

      // CU03 - Paso 7: B_Int --> Act : + MostrarMensajeExito()
      setMessage(response.data.message || 'Si el correo existe, recibirá un enlace de recuperación.');
    } catch (err) {
      setError(err.response?.data?.message || 'Ocurrió un error al procesar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-950/35 rounded-full blur-[120px]"></div>

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <div className="inline-block bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-black text-3xl px-5 py-2.5 rounded-2xl shadow-xl shadow-blue-500/10 mb-4 tracking-wider animate-pulse">
            FICCT
          </div>
          <h2 className="text-sm font-semibold tracking-widest text-blue-400 uppercase">U.A.G.R.M.</h2>
        </div>

        {/* CU03 - IU_Recuperacion (Formulario frontera) */}
        <form onSubmit={handleSubmit} className="glass-panel p-8 rounded-2xl shadow-2xl shadow-black/40 border border-slate-700/30">
          <h1 className="text-xl font-semibold text-slate-100 mb-1">Recuperar Acceso</h1>
          <p className="text-sm text-slate-400 mb-6">Restablece tu contraseña de forma segura</p>

          {error && (
            <div className="bg-red-950/50 border border-red-500/30 text-red-300 p-3 rounded-lg mb-5 text-sm text-center">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 p-3 rounded-lg mb-5 text-sm text-center">
              {message}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Correo Registrado</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre@ficct.uagrm.edu.bo"
              className="w-full bg-slate-900/80 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200" 
              required 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-3 rounded-xl font-semibold transition-all duration-300 btn-premium shadow-lg shadow-blue-600/15 disabled:opacity-50 cursor-pointer mb-4"
          >
            {loading ? 'Generando token...' : 'Enviar enlace de recuperación'}
          </button>

          <div className="text-center">
            <Link to="/login" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
              Volver al inicio de sesión
            </Link>
          </div>
        </form>

        <p className="text-center text-xs text-slate-500 mt-6">
          © {new Date().getFullYear()} Facultad de Ingeniería en Ciencias de la Computación y Telecomunicaciones
        </p>
      </div>
    </div>
  );
}
