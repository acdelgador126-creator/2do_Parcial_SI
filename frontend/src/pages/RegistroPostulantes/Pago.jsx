import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

export default function Pago() {
  const { postulanteId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [postulante, setPostulante] = useState(null);

  useEffect(() => {
    // Obtener datos del postulante
    axios
      .get(`/api/postulantes/${postulanteId}`)
      .then(res => setPostulante(res.data))
      .catch(err => {
        console.error(err);
        setError('No se pudieron cargar los datos del postulante');
      });
  }, [postulanteId]);

  const handlePago = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `/api/postulantes/${postulanteId}/pago`
      );

      // Redirigir a la URL de checkout de Stripe
      if (response.data.checkout_url) {
        window.location.href = response.data.checkout_url;
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
        'Error al procesar el pago. Intenta nuevamente.'
      );
      setLoading(false);
    }
  };

  if (!postulante) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {/* Encabezado */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Completar Pago
          </h1>
          <p className="text-gray-600">
            Finaliza tu inscripción al CUP FICCT
          </p>
        </div>

        {/* Información del postulante */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6 border-l-4 border-blue-600">
          <h2 className="font-semibold text-gray-800 mb-3">Tu Información</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Nombre:</span>
              <span className="font-medium text-gray-800">
                {postulante.nombres} {postulante.apellidos}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">CI:</span>
              <span className="font-medium text-gray-800">{postulante.ci}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Email:</span>
              <span className="font-medium text-gray-800 truncate">
                {postulante.email}
              </span>
            </div>
          </div>
        </div>

        {/* Monto a pagar */}
        <div className="bg-green-50 rounded-lg p-4 mb-6 border-l-4 border-green-600">
          <p className="text-gray-600 text-sm mb-1">Monto a Pagar</p>
          <p className="text-4xl font-bold text-green-600">
            700 <span className="text-lg">BS</span>
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Inscripción al proceso de admisión FICCT 2026
          </p>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-600 rounded-lg p-4 mb-6">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Información de seguridad */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-xs text-gray-600 flex items-center gap-2 mb-2">
            🔒 Pago seguro a través de Stripe
          </p>
          <p className="text-xs text-gray-600">
            Se abrirá una ventana segura donde podrás ingresar los datos de tu
            tarjeta. Usamos encriptación SSL de 256 bits.
          </p>
        </div>

        {/* Información sobre tarjetas de prueba */}
        <div className="bg-yellow-50 border-l-4 border-yellow-600 rounded-lg p-4 mb-6">
          <p className="text-sm font-semibold text-yellow-800 mb-2">
            💳 Tarjetas de Prueba
          </p>
          <p className="text-xs text-yellow-700 mb-2">
            <strong>Visa exitosa:</strong> 4242 4242 4242 4242
          </p>
          <p className="text-xs text-yellow-700 mb-2">
            <strong>Visa rechazada:</strong> 4000 0000 0000 0002
          </p>
          <p className="text-xs text-yellow-700">
            Usa cualquier fecha futura y cualquier CVC
          </p>
        </div>

        {/* Botón de pago */}
        <button
          onClick={handlePago}
          disabled={loading}
          className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
          }`}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Procesando...
            </>
          ) : (
            <>
              💳 Ir a Pagar 700 BS
            </>
          )}
        </button>

        {/* Enlace para cancelar */}
        <button
          onClick={() => navigate(-1)}
          className="w-full mt-3 py-2 px-4 text-gray-600 hover:text-gray-800 font-medium transition-colors"
        >
          ← Volver
        </button>

        {/* Aviso legal */}
        <p className="text-xs text-gray-500 text-center mt-6">
          Al hacer clic en "Ir a Pagar", aceptas los términos y condiciones
          de la inscripción.
        </p>
      </div>
    </div>
  );
}
