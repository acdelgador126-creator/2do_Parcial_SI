<?php

namespace Tests\Feature;

use App\Models\Postulante;
use App\Models\User;
use App\Models\Gestion;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class WebhookPagoTest extends TestCase
{
    use DatabaseTransactions;

    public function test_stripe_webhook_creates_user_with_formula_password_and_updates_postulante()
    {
        // 1. Setup active gestion
        $gestion = Gestion::firstOrCreate(
            ['codigo' => '2026'],
            [
                'activa' => true,
                'fecha_inicio' => '2026-01-01',
                'fecha_fin' => '2026-12-31'
            ]
        );

        // 2. Create mock Postulante
        $postulante = Postulante::create([
            'ci' => '12345678',
            'nombres' => 'Alberto Juan',
            'apellidos' => 'Perez Prado',
            'fecha_nacimiento' => '2000-01-01',
            'sexo' => 'M',
            'direccion' => 'Av. San Martin',
            'telefono' => '70000000',
            'email' => 'alberto.perez@example.com',
            'colegio_procedencia' => 'Nacional',
            'ciudad' => 'Santa Cruz',
            'titulo_bachiller' => 'Bachiller Humanistico',
            'primera_opcion_id' => 1,
            'segunda_opcion_id' => 2,
            'turno_preferencia' => 'Manana',
            'gestion_id' => $gestion->id,
            'estado' => 'Verificado',
        ]);

        // 3. Create Stripe checkout.session.completed webhook payload
        $sessionId = 'cs_test_' . uniqid();
        $payloadData = [
            'id' => 'evt_test_' . uniqid(),
            'object' => 'event',
            'type' => 'checkout.session.completed',
            'data' => [
                'object' => [
                    'id' => $sessionId,
                    'object' => 'checkout.session',
                    'amount_total' => 35000, // 350.00 BOB
                    'metadata' => [
                        'postulante_id' => $postulante->id,
                        'ci' => $postulante->ci,
                    ],
                ]
            ]
        ];

        $payload = json_encode($payloadData);
        $secret = config('services.stripe.webhook_secret') ?? 'whsec_test_secret';
        config(['services.stripe.webhook_secret' => $secret]);

        // Generate Stripe signature
        $timestamp = time();
        $signedPayload = "$timestamp.$payload";
        $signature = hash_hmac('sha256', $signedPayload, $secret);
        $stripeSignatureHeader = "t=$timestamp,v1=$signature";

        // 4. Send request to webhook endpoint
        $response = $this->withHeaders([
            'Stripe-Signature' => $stripeSignatureHeader,
        ])->postJson('/api/stripe/webhook', $payloadData);

        // 5. Assertions
        $response->assertStatus(200);
        $response->assertJson(['received' => true]);

        // Assert Postulante is now 'Inscrito'
        $postulante->refresh();
        $this->assertEquals('Inscrito', $postulante->estado);

        // Assert Pago was created
        $this->assertDatabaseHas('pagos', [
            'postulante_id' => $postulante->id,
            'stripe_checkout_id' => $sessionId,
            'monto' => 350.00,
            'estado_pago' => 'Succeeded',
        ]);

        // Assert User was created
        $this->assertDatabaseHas('users', [
            'email' => 'alberto.perez@example.com',
            'role' => 'Postulante',
            'active' => true,
        ]);

        $user = User::where('email', 'alberto.perez@example.com')->first();
        $this->assertNotNull($user);

        // Assert password matches the formula: CI + first letter 1st name (UPPER) + first letter 1st surname (lower)
        // CI: '12345678', First Name: 'Alberto', First Surname: 'Perez' -> '12345678Ap'
        $expectedPassword = '12345678Ap';
        $this->assertTrue(Hash::check($expectedPassword, $user->password));

        // Assert mail was sent/recorded in array transport
        $transport = app('mailer')->getSymfonyTransport();
        $messages = $transport->messages();
        $this->assertCount(1, $messages);
        
        $email = $messages[0]->getOriginalMessage();
        $this->assertEquals('alberto.perez@example.com', $email->getTo()[0]->getAddress());
        $this->assertStringContainsString('credenciales', $email->getSubject());
    }
}
