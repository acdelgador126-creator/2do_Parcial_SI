import { useNavigate } from 'react-router-dom';

export default function PagoCancelado() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {/* Icono de cancelación */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
            <span className="text-4xl">⚠️</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Pago Cancelado
          </h1>
          <p className="text-gray-600">
            Se canceló el proceso de pago
          </p>
        </div>

        {/* Mensaje informativo */}
        <div className="bg-orange-50 rounded-lg p-4 mb-6 border-l-4 border-orange-600">
          <p className="text-gray-700 text-sm">
            No se ha realizado ningún cobro en tu cuenta. Puedes intentar el pago nuevamente
            cuando lo desees.
          </p>
        </div>

        {/* Razones posibles */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="font-semibold text-gray-800 text-sm mb-3">Razones posibles:</p>
          <ul className="text-xs text-gray-600 space-y-2">
            <li>✓ Cancelaste el pago en la ventana de Stripe</li>
            <li>✓ Datos de tarjeta incorrectos</li>
            <li>✓ Fondos insuficientes</li>
            <li>✓ Sesión expirada</li>
          </ul>
        </div>

        {/* Botones de acción */}
        <button
          onClick={() => navigate(-1)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all mb-3"
        >
          🔄 Intentar Pago Nuevamente
        </button>

        <button
          onClick={() => navigate('/')}
          className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-lg transition-all"
        >
          Volver al Inicio
        </button>

        {/* Soporte */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-700">
            <strong>¿Necesitas ayuda?</strong> Si tienes problemas con el pago,
            contacta al soporte: <a href="mailto:soporte@ficct.edu" className="underline">soporte@ficct.edu</a>
          </p>
        </div>
      </div>
    </div>
  );
}
