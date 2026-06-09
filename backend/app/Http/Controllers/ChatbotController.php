<?php

namespace App\Http\Controllers;

use App\Models\ConversacionChatbot;
use App\Models\Postulante;
use App\Models\NotaFinal;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class ChatbotController extends Controller
{
    /**
     * Interacción con el chatbot del sistema
     */
    public function pregunta(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'pregunta' => 'required|string|max:500',
            'postulante_id' => 'nullable|exists:postulantes,id',
        ]);

        $pregunta = trim($validated['pregunta']);
        $postulanteId = $validated['postulante_id'] ?? null;
        $respuesta = "";

        // Intentar detectar si el usuario ingresó un CI en la pregunta para informarle de su estado
        preg_match('/\b\d{7,10}\b/', $pregunta, $coincidencias);
        if (!empty($coincidencias)) {
            $ci = $coincidencias[0];
            $postulante = Postulante::where('ci', $ci)->first();

            if ($postulante) {
                $notas = NotaFinal::where('postulante_id', $postulante->id)
                    ->with('materia')
                    ->get()
                    ->map(function ($nf) {
                        return "{$nf->materia->nombre}: {$nf->promedio} ({$nf->estado})";
                    })
                    ->join(', ');

                $strNotas = !empty($notas) ? " Tus notas son: {$notas}." : " Aún no tienes notas registradas.";
                $respuesta = "Hola {$postulante->nombres}. He verificado tu expediente en el CUP FICCT: Tu estado actual es '{$postulante->estado}'.{$strNotas}";
            } else {
                $respuesta = "He buscado el Carnet de Identidad {$ci} en el sistema, pero no figura ningún postulante registrado con ese número. Por favor verifica los datos.";
            }
        } else {
            // Consulta general de ayuda
            $hfSpaceUrl = env('HF_SPACE_URL');

            if (!empty($hfSpaceUrl)) {
                // Hugging Face Spaces API Call
                try {
                    $systemPrompt = 'Eres un chatbot asistente del Curso Preuniversitario (CUP) de la FICCT - UAGRM. Responde de manera concisa y clara en español. Reglas del CUP: Costo de inscripción: 700 BOB (procesado vía Stripe). Requisitos: Cédula de identidad, Certificado de nacimiento, Título de bachiller legalizado, Formulario de preinscripción. Materias evaluadas: Computación, Matemáticas, Física, Inglés. Exámenes: 3 exámenes por materia (ponderaciones 30%, 30% y 40%). Criterio de aprobación: Debes obtener una nota final mayor o igual a 60 en CADA UNA de las 4 materias de manera individual (no sirve el promedio general). Capacidad máxima por grupo: 70 estudiantes. Docentes: Máximo 4 grupos por docente.';
                    
                    $fullPrompt = $systemPrompt . "\n\nPregunta: " . $pregunta;

                    $response = Http::post($hfSpaceUrl, [
                        'model' => 'gemma3:1b',
                        'prompt' => $fullPrompt,
                        'stream' => false
                    ]);

                    if ($response->successful()) {
                        $respuesta = $response->json('response');
                        // Si response no existe, intentar con otros campos comunes
                        if (empty($respuesta)) {
                            $respuesta = $response->json('output') ?? $response->json('text') ?? $response->json('generated_text') ?? 'Lo siento, no pude procesar tu respuesta.';
                        }
                    } else {
                        $respuesta = $this->obtenerRespuestaEstatica($pregunta);
                    }
                } catch (\Exception $e) {
                    $respuesta = $this->obtenerRespuestaEstatica($pregunta);
                }
            } else {
                // Fallback a FAQ local
                $respuesta = $this->obtenerRespuestaEstatica($pregunta);
            }
        }

        // Registrar la conversación
        ConversacionChatbot::create([
            'postulante_id' => $postulanteId ?? 1, // Fallback al id 1 si no está autenticado
            'pregunta' => $pregunta,
            'respuesta' => $respuesta,
            'resuelta' => true,
        ]);

        return response()->json([
            'respuesta' => $respuesta,
        ]);
    }

    /**
     * Mapeo estático de FAQs en local
     */
    private function obtenerRespuestaEstatica(string $pregunta): string
    {
        $p = strtolower($pregunta);

        if (str_contains($p, 'requisito') || str_contains($p, 'document')) {
            return "Para registrarte en el CUP necesitas subir digitalizados los siguientes requisitos: 1) Cédula de Identidad (CI), 2) Certificado de Nacimiento, 3) Título de Bachiller Legalizado y 4) Formulario de Preinscripción firmado.";
        }
        if (str_contains($p, 'costo') || str_contains($p, 'precio') || str_contains($p, 'pagar') || str_contains($p, 'pago')) {
            return "El costo único de matrícula para el CUP de la FICCT es de 700 BOB. Se puede realizar el pago en línea de forma segura con tarjeta de débito/crédito mediante nuestra pasarela Stripe.";
        }
        if (str_contains($p, 'materia') || str_contains($p, 'estudiar') || str_contains($p, 'curso')) {
            return "Las 4 materias evaluadas en el Curso Preuniversitario (CUP) son: Computación, Matemáticas, Física e Inglés.";
        }
        if (str_contains($p, 'aprobar') || str_contains($p, 'nota') || str_contains($p, 'minimo') || str_contains($p, 'mínimo')) {
            return "Para aprobar el CUP de la FICCT debes obtener una nota final ponderada de al menos 60 puntos en CADA UNA de las 4 materias por separado. No se promedian las materias entre sí.";
        }
        if (str_contains($p, 'examen') || str_contains($p, 'evalua') || str_contains($p, 'pondera')) {
            return "Se rinden 3 exámenes parciales por materia. Las ponderaciones de los exámenes son de 30% para el primer parcial, 30% para el segundo parcial y 40% para el examen final.";
        }
        if (str_contains($p, 'grupo') || str_contains($p, 'aula') || str_contains($p, 'capacidad')) {
            return "Los grupos de estudio se configuran automáticamente respetando un límite máximo estricto de 70 estudiantes por grupo y aula para optimizar la enseñanza.";
        }
        if (str_contains($p, 'docente') || str_contains($p, 'profesor') || str_contains($p, 'carga')) {
            return "Los docentes del CUP deben cumplir requisitos de posgrado (Maestría y Diplomado en Educación Superior) y pueden tener una carga de cátedra de máximo 4 grupos de estudio por gestión.";
        }

        return "Hola, soy el asistente virtual del CUP. Puedo informarte sobre los requisitos de inscripción, materias evaluadas, reglas de aprobación o costos. Por favor escribe tu consulta con más detalle o ingresa tu CI para ver tu estado.";
    }
}
