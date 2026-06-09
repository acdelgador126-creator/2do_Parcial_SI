import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function PagoExitoso() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [pago, setPago] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      setError('No se encontró ID de sesión');
      setLoading(false);
      return;
    }

    // Verificar estado del pago con el backend
    axios
      .post('/api/pagos/verificar', { session_id: sessionId })
      .then(res => {
        setPago(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.response?.data?.message || 'Error al verificar el pago');
        setLoading(false);
      });
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando pago...</p>
        </div>
      </div>
    );
  }

  if (error || !pago?.pagado) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Pago No Procesado</h1>
          <p className="text-gray-600 mb-6">
            {error || 'El pago no se ha procesado correctamente. Por favor intenta nuevamente.'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition-all"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {/* Icono de éxito */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <span className="text-4xl">✅</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            ¡Pago Exitoso!
          </h1>
          <p className="text-gray-600">
            Tu inscripción al CUP FICCT ha sido confirmada
          </p>
        </div>

        {/* Información del pago */}
        {pago?.pago && (
          <div className="bg-green-50 rounded-lg p-4 mb-6 border-l-4 border-green-600">
            <h2 className="font-semibold text-gray-800 mb-3">Detalles del Pago</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Monto:</span>
                <span className="font-medium text-gray-800">
                  {pago.pago.monto} BS
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Estado:</span>
                <span className="font-medium text-green-600">
                  {pago.pago.estado_pago}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">ID Transacción:</span>
                <span className="font-mono text-xs text-gray-700 truncate">
                  {pago.pago.stripe_checkout_id}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Fecha:</span>
                <span className="font-medium text-gray-800">
                  {new Date(pago.pago.fecha_pago).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Información del postulante */}
        {pago?.postulante && (
          <div className="bg-blue-50 rounded-lg p-4 mb-6 border-l-4 border-blue-600">
            <h2 className="font-semibold text-gray-800 mb-3">Datos Confirmados</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Nombre:</span>
                <span className="font-medium text-gray-800">
                  {pago.postulante.nombres} {pago.postulante.apellidos}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium text-gray-800 text-xs">
                  {pago.postulante.email}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Estado:</span>
                <span className="inline-block bg-green-200 text-green-800 text-xs px-2 py-1 rounded">
                  {pago.postulante.estado}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Siguiente paso */}
        <div className="bg-yellow-50 rounded-lg p-4 mb-6 border-l-4 border-yellow-600">
          <p className="text-sm font-semibold text-yellow-800 mb-2">📧 Próximos Pasos</p>
          <p className="text-xs text-yellow-700">
            Se ha enviado un correo a {pago?.postulante?.email} con:
          </p>
          <ul className="text-xs text-yellow-700 mt-2 space-y-1 ml-4">
            <li>✓ Confirmación de tu inscripción</li>
            <li>✓ Datos de acceso al portal</li>
            <li>✓ Información sobre el simulacro</li>
          </ul>
        </div>

        {/* Botones de acción */}
        <button
          onClick={() => navigate('/dashboard')}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-all mb-3"
        >
          Ir al Dashboard
        </button>

        <button
          onClick={() => navigate('/')}
          className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-lg transition-all"
        >
          Volver al Inicio
        </button>

        {/* Comprobante */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-600">
            <strong>Comprobante de Pago:</strong> Se ha guardado un registro de tu transacción.
            Puedes consultar el estado de tu inscripción en cualquier momento desde tu cuenta.
          </p>
        </div>
      </div>
    </div>
  );
}
