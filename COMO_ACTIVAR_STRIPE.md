# Cómo Activar la Pasarela Stripe Real

Actualmente, para facilitar las pruebas locales y offline, Stripe se encuentra desactivado y simula el pago exitoso de forma automática. 

Para habilitar la pasarela Stripe real, realiza los siguientes pasos en el backend:

## 1. Modificar `PagoController.php`
Abre el archivo [PagoController.php](file:///c:/Users/User/Documents/1-2026/proto/2do_Parcial_SI_intento/backend/app/Http/Controllers/PagoController.php) y localiza el método `crearSesion`.

1. **Comenta o elimina** todo el bloque de código entre:
   ```php
   // =========================================================================
   // MOCK / SIMULADOR DE STRIPE DESACTIVADO PARA PRUEBAS
   // =========================================================================
   ...
   // =========================================================================
   // FIN DEL MOCK / SIMULADOR DE STRIPE
   // =========================================================================
   ```

2. **Descomenta** el bloque original de Stripe que se encuentra justo debajo, encerrado en comentarios de bloque `/* ... */`:
   ```php
   Stripe::setApiKey(config('services.stripe.secret'));
   
   $postulante->load('gestion');
   $gestionCodigo = $postulante->gestion?->codigo ?? \App\Models\Gestion::activa()->first()?->codigo ?? '2026';
   
   $checkoutParams = [
       ...
   ];
   
   $session = StripeSession::create($checkoutParams);
   
   return response()->json([
       'checkout_url' => $session->url,
       'session_id' => $session->id,
   ]);
   ```

## 2. Configurar las variables en tu archivo `.env`
Asegúrate de tener configuradas tus llaves de prueba de Stripe en el archivo [.env](file:///c:/Users/User/Documents/1-2026/proto/2do_Parcial_SI_intento/backend/.env):
```env
STRIPE_SECRET_KEY=sk_test_tu_llave_secreta
STRIPE_WEBHOOK_SECRET=whsec_tu_firma_de_webhook
```
*(Nota: Si usas el webhook real, la confirmación de pago vendrá asíncronamente desde los servidores de Stripe al endpoint `/api/stripe/webhook`, creando el usuario y enviando el correo una vez que Stripe notifique el éxito).*
