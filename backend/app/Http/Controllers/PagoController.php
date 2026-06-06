<?php

namespace App\Http\Controllers;

use App\Models\Pago;
use App\Models\Postulante;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Stripe\Checkout\Session as StripeSession;
use Stripe\Stripe;
use Stripe\Webhook;

class PagoController extends Controller
{
    /**
     * CU07: Crear sesion de pago Stripe
     *
     * Seq_CU07: Postulante → IU_Inscripcion → CTR_Inscripcion.crearSesionPago()
     *   → verificar requisitos completos → PasarelaStripe.crearSesion()
     *   → retornar URL de checkout
     * 
     * @param \App\Models\Postulante|int|string $postulante
     * @return \Illuminate\Http\JsonResponse
     */
    public function crearSesion($postulante): JsonResponse
    {
        // Resolver postulante manualmente si no se vinculó como Modelo (ej. se recibió como string/int ID)
        if (! $postulante instanceof Postulante) {
            $postulante = Postulante::findOrFail($postulante);
        }

        // CU07 - Paso 2: UI -> Ctrl : IniciarProcesoPago(postulanteId)
        if ($postulante->estado !== 'Verificado') {
            return response()->json([
                'message' => 'El postulante debe estar verificado antes de pagar. Estado actual: ' . $postulante->estado,
            ], 422);
        }

        $requisitos = $postulante->requisitos;
        if (! $requisitos || ! $requisitos->todosVerificados()) {
            return response()->json([
                'message' => 'Requisitos documentales incompletos.',
            ], 422);
        }

        // Verificar si ya tiene un pago exitoso
        $pagoExistente = $postulante->pagos()->where('estado_pago', 'Succeeded')->exists();
        if ($pagoExistente) {
            return response()->json([
                'message' => 'El postulante ya realizo el pago exitosamente.',
            ], 422);
        }

        // =========================================================================
        // MOCK / SIMULADOR DE STRIPE DESACTIVADO PARA PRUEBAS
        // =========================================================================
        // Para usar el Stripe real, por favor consulta el archivo COMO_ACTIVAR_STRIPE.md
        // en la raíz del proyecto. El siguiente código simula el pago exitoso de inmediato.

        $mockSessionId = 'cs_test_' . uniqid();
        $mockCheckoutUrl = config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173'))
            . '/inscripcion/exitosa?session_id=' . $mockSessionId;

        // 1. Crear el registro de Pago de forma inmediata como Succeeded
        Pago::create([
            'postulante_id' => $postulante->id,
            'stripe_checkout_id' => $mockSessionId,
            'monto' => config('services.stripe.monto_matricula', 350),
            'estado_pago' => 'Succeeded',
        ]);

        // 2. Cambiar el estado del postulante a Inscrito
        $postulante->update(['estado' => 'Inscrito']);

        // 3. Generar la cuenta del postulante con la contraseña estructurada
        $user = \App\Models\User::where('email', $postulante->email)->first();
        if (!$user) {
            // Obtener primera letra del primer nombre en mayúscula
            $nombresArr = explode(' ', trim($postulante->nombres));
            $primerNombre = reset($nombresArr);
            $letraNombre = mb_strtoupper(mb_substr($primerNombre, 0, 1, 'UTF-8'));

            // Obtener primera letra del primer apellido en minúscula
            $apellidosArr = explode(' ', trim($postulante->apellidos));
            $primerApellido = reset($apellidosArr);
            $letraApellido = mb_strtolower(mb_substr($primerApellido, 0, 1, 'UTF-8'));

            // Contraseña: CI + letraNombre + letraApellido
            $contrasenaGenerada = trim($postulante->ci) . $letraNombre . $letraApellido;

            \App\Models\User::create([
                'name' => $postulante->nombres . ' ' . $postulante->apellidos,
                'email' => $postulante->email,
                'password' => \Illuminate\Support\Facades\Hash::make($contrasenaGenerada),
                'role' => 'Postulante',
                'active' => true,
            ]);

            // Enviar correo real a Gmail
            try {
                \Illuminate\Support\Facades\Mail::raw(
                    "¡Felicidades " . $postulante->nombres . " " . $postulante->apellidos . "! Tu pago ha sido procesado con éxito.\n\n" .
                    "Se ha creado tu cuenta de acceso para el portal CUP-FICCT:\n" .
                    "- Usuario (Correo): " . $postulante->email . "\n" .
                    "- Contraseña: " . $contrasenaGenerada . "\n\n" .
                    "Puedes ingresar al sistema en el siguiente enlace: " . config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173')) . "\n\n" .
                    "¡Mucho éxito en tu proceso de admisión!",
                    function ($message) use ($postulante) {
                        $message->to($postulante->email)
                            ->subject('Tus credenciales de acceso - CUP FICCT');
                    }
                );
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error("Error al enviar correo de credenciales: " . $e->getMessage());
            }
        }

        return response()->json([
            'checkout_url' => $mockCheckoutUrl,
            'session_id' => $mockSessionId,
        ]);
        // =========================================================================
        // FIN DEL MOCK / SIMULADOR DE STRIPE
        // =========================================================================

        /* -- CÓDIGO STRIPE ORIGINAL DESACTIVADO (Ver COMO_ACTIVAR_STRIPE.md) --
        Stripe::setApiKey(config('services.stripe.secret'));

        $postulante->load('gestion');
        $gestionCodigo = $postulante->gestion?->codigo ?? \App\Models\Gestion::activa()->first()?->codigo ?? '2026';

        $checkoutParams = [
            'payment_method_types' => ['card'],
            'line_items' => [[
                'price_data' => [
                    'currency' => 'bob',
                    'product_data' => [
                        'name' => 'Matricula CUP FICCT - Gestion ' . $gestionCodigo,
                    ],
                    'unit_amount' => (int) (config('services.stripe.monto_matricula', 350) * 100),
                ],
                'quantity' => 1,
            ]],
            'mode' => 'payment',
            'success_url' => config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173'))
                . '/inscripcion/exitosa?session_id={CHECKOUT_SESSION_ID}',
            'cancel_url' => config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173'))
                . '/inscripcion/cancelada',
            'metadata' => [
                'postulante_id' => $postulante->id,
                'ci' => $postulante->ci,
            ],
        ];

        $session = StripeSession::create($checkoutParams);

        return response()->json([
            'checkout_url' => $session->url,
            'session_id' => $session->id,
        ]);
        ------------------------------------------------------------- */
    }

    /**
     * CU07: Webhook Stripe (confirma pago asincrono)
     *
     * Seq_CU07: Stripe → CTR_Inscripcion.webhookPago()
     *   → CE_Pago.registrar() → CE_Postulante.cambiarEstado("Inscrito")
     */
    public function webhook(Request $request): JsonResponse
    {
        // CU07 - Paso 8: Stripe (Pasarela) --> Ctrl : NotificarPagoExitoso(StripeWebhook)
        $payload = $request->getContent();
        $signature = $request->header('Stripe-Signature');

        try {
            $event = Webhook::constructEvent(
                $payload,
                $signature,
                config('services.stripe.webhook_secret')
            );
        } catch (\Exception $e) {
            return response()->json(['error' => 'Webhook signature invalida.'], 400);
        }

        if ($event->type === 'checkout.session.completed') {
            $session = $event->data->object;
            $postulanteId = $session->metadata->postulante_id ?? null;

            if ($postulanteId) {
                // CU07 - Paso 9: Ctrl -> CE_Pago : CrearRegistroPago(monto, transaccionId)
                Pago::create([
                    'postulante_id' => $postulanteId,
                    'stripe_checkout_id' => $session->id,
                    'monto' => $session->amount_total / 100,
                    'estado_pago' => 'Succeeded',
                ]);

                // CU07 - Paso 10: Ctrl -> CE_Postulante : ActualizarEstado("Inscrito")
                $postulante = Postulante::find($postulanteId);
                if ($postulante) {
                    $postulante->update(['estado' => 'Inscrito']);

                    // Crear automáticamente la cuenta de usuario para el postulante con la nueva fórmula de contraseña
                    $user = \App\Models\User::where('email', $postulante->email)->first();
                    if (!$user) {
                        // Obtener primera letra del primer nombre en mayúscula
                        $nombresArr = explode(' ', trim($postulante->nombres));
                        $primerNombre = reset($nombresArr);
                        $letraNombre = mb_strtoupper(mb_substr($primerNombre, 0, 1, 'UTF-8'));

                        // Obtener primera letra del primer apellido en minúscula
                        $apellidosArr = explode(' ', trim($postulante->apellidos));
                        $primerApellido = reset($apellidosArr);
                        $letraApellido = mb_strtolower(mb_substr($primerApellido, 0, 1, 'UTF-8'));

                        // Generar contraseña: CI + letraNombre + letraApellido
                        $contrasenaGenerada = trim($postulante->ci) . $letraNombre . $letraApellido;

                        \App\Models\User::create([
                            'name' => $postulante->nombres . ' ' . $postulante->apellidos,
                            'email' => $postulante->email,
                            'password' => \Illuminate\Support\Facades\Hash::make($contrasenaGenerada),
                            'role' => 'Postulante',
                            'active' => true,
                        ]);

                        // Enviar correo con las credenciales de acceso creadas (se escribirá en log por MAIL_MAILER=log)
                        try {
                            \Illuminate\Support\Facades\Mail::raw(
                                "¡Felicidades " . $postulante->nombres . " " . $postulante->apellidos . "! Tu pago ha sido procesado con éxito.\n\n" .
                                "Se ha creado tu cuenta de acceso para el portal CUP-FICCT:\n" .
                                "- Usuario (Correo): " . $postulante->email . "\n" .
                                "- Contraseña: " . $contrasenaGenerada . "\n\n" .
                                "Puedes ingresar al sistema en el siguiente enlace: " . config('app.frontend_url', 'http://localhost:5173') . "\n\n" .
                                "¡Mucho éxito en tu proceso de admisión!",
                                function ($message) use ($postulante) {
                                    $message->to($postulante->email)
                                        ->subject('Tus credenciales de acceso - CUP FICCT');
                                }
                            );
                        } catch (\Exception $e) {
                            \Illuminate\Support\Facades\Log::error("Error al enviar correo de credenciales: " . $e->getMessage());
                        }
                    }
                }
            }
        }

        return response()->json(['received' => true]);
    }

    /**
     * Verificar estado de pago por session_id (para frontend post-redirect)
     */
    public function verificarPago(Request $request): JsonResponse
    {
        $request->validate(['session_id' => 'required|string']);

        $pago = Pago::where('stripe_checkout_id', $request->session_id)->first();

        if (! $pago) {
            return response()->json(['pagado' => false, 'message' => 'Pago no encontrado o pendiente.']);
        }

        return response()->json([
            'pagado' => $pago->estado_pago === 'Succeeded',
            'pago' => $pago,
            'postulante' => $pago->postulante,
        ]);
    }
}
