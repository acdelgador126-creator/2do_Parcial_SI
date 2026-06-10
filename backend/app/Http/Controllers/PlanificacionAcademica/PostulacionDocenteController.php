<?php

namespace App\Http\Controllers\PlanificacionAcademica;

use App\Http\Controllers\Controller;

use App\Models\Autenticacion\User;
use App\Models\PlanificacionAcademica\Docente;
use App\Models\PlanificacionAcademica\Especialidad;
use App\Models\PlanificacionAcademica\Materia;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

/**
 * CTR_Docentes — Postulaciones de Docentes.
 *
 * CU24: Registrar Postulacion de Docente (formulario publico).
 * CU25: Aceptar / Rechazar Postulacion de Docente (Administrador o Coordinador).
 */
class PostulacionDocenteController extends Controller
{
    private const ESTADO_PENDIENTE = 'Pendiente de Revision';
    private const ESTADO_ACEPTADO = 'Aceptado';
    private const ESTADO_RECHAZADO = 'Rechazado';

    /**
     * Catalogo publico de areas/materias para el selector del formulario CU24.
     */
    public function areas(): JsonResponse
    {
        return response()->json(Materia::orderBy('nombre')->get(['id', 'nombre', 'codigo']));
    }

    /**
     * CU24 — Registrar Postulacion de Docente (acceso publico).
     *
     * Seq_CU24:
     *   3: B_Int -> C_Ctrl : store(request)
     *   4: C_Ctrl -> E_Doc : where('ci', ci)->orWhere('correo', correo)  (validacion no duplicados)
     *   6: C_Ctrl -> E_Mat : findOrFail(area_id)
     *   8: C_Ctrl -> E_Doc : create(['estado' => 'Pendiente de Revision'])
     *   9: C_Ctrl -> E_Esp : create(['docente_id' => id, 'nombre' => especialidad])
     *  10: C_Ctrl --> B_Int : RetornarExito()
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ci' => 'required|string|max:20',
            'nombres' => 'required|string|max:150',
            'apellidos' => 'required|string|max:150',
            'correo' => 'required|email|max:150',
            'telefono' => 'nullable|string|max:30',
            'fecha_nacimiento' => 'nullable|date',
            'grado_academico' => 'required|string|max:100',
            'especialidad' => 'required|string|max:150',
            'area_id' => 'required|exists:materias,id',
            'hoja_vida' => 'required|file|mimes:pdf|max:10240',
            'respaldos' => 'nullable|file|mimes:pdf,zip|max:20480',
        ], [
            'especialidad.required' => 'Debe declarar su especialidad.',
            'area_id.required' => 'Debe seleccionar el area en la que desea ensenar.',
            'area_id.exists' => 'El area seleccionada no es valida.',
            'hoja_vida.required' => 'Debe adjuntar su hoja de vida (PDF).',
        ]);

        // CU24 - Paso 4/5: Validar que el CI y el correo no esten duplicados (E2/E3)
        $duplicadoCi = Docente::where('ci', $validated['ci'])->first();
        if ($duplicadoCi) {
            return response()->json([
                'message' => 'Ya existe una postulacion o un docente registrado con este CI.',
            ], 422);
        }
        $duplicadoCorreo = Docente::where('correo', $validated['correo'])->first();
        if ($duplicadoCorreo) {
            return response()->json([
                'message' => 'Este correo electronico ya esta asociado a otra postulacion docente.',
            ], 422);
        }

        // CU24 - Paso 6/7: Obtener el area/materia seleccionada
        $area = Materia::findOrFail($validated['area_id']);

        // Almacenar documentos adjuntos en el directorio publico
        $hojaVidaPath = $this->guardarDocumento($request->file('hoja_vida'), 'hoja_vida_' . $validated['ci']);
        $respaldosPath = $request->hasFile('respaldos')
            ? $this->guardarDocumento($request->file('respaldos'), 'respaldos_' . $validated['ci'])
            : null;

        $docente = DB::transaction(function () use ($validated, $area, $hojaVidaPath, $respaldosPath) {
            // CU24 - Paso 8: Registrar la postulacion en estado "Pendiente de Revision"
            $docente = Docente::create([
                'ci' => $validated['ci'],
                'nombres' => $validated['nombres'],
                'apellidos' => $validated['apellidos'],
                'correo' => $validated['correo'],
                'telefono' => $validated['telefono'] ?? null,
                'fecha_nacimiento' => $validated['fecha_nacimiento'] ?? null,
                'grado_academico' => $validated['grado_academico'],
                'especialidad' => $validated['especialidad'],
                'area_id' => $area->id,
                'estado' => self::ESTADO_PENDIENTE,
                'hoja_vida_path' => $hojaVidaPath,
                'respaldos_path' => $respaldosPath,
            ]);

            // CU24 - Paso 9: Persistir la especialidad declarada
            Especialidad::create([
                'docente_id' => $docente->id,
                'nombre' => $validated['especialidad'],
                'area_id' => $area->id,
            ]);

            return $docente;
        });

        // CU24 - Paso 10/11: Confirmar el registro de la postulacion
        return response()->json([
            'message' => 'Su postulacion fue registrada exitosamente y sera revisada por la coordinacion.',
            'docente' => $docente->load('area', 'especialidades'),
        ], 201);
    }

    /**
     * CU25 — Listar postulaciones docentes (Administrador / Coordinador).
     * Por defecto muestra las que estan en estado "Pendiente de Revision".
     */
    public function index(Request $request): JsonResponse
    {
        $query = Docente::with('area')
            ->whereNotNull('estado');

        $estado = $request->query('estado', self::ESTADO_PENDIENTE);
        if ($estado !== 'todas') {
            $query->where('estado', $estado);
        }

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('nombres', 'ilike', "%{$s}%")
                  ->orWhere('apellidos', 'ilike', "%{$s}%")
                  ->orWhere('ci', 'ilike', "%{$s}%")
                  ->orWhere('correo', 'ilike', "%{$s}%");
            });
        }

        return response()->json($query->orderByDesc('id')->paginate(15));
    }

    /**
     * CU25 — Revisar una postulacion (detalle con validacion especialidad vs area).
     *
     * Seq_CU25:
     *   3: C_Ctrl -> E_Doc : findOrFail(docente_id)
     *   5: C_Ctrl -> E_Esp : where('docente_id', docente_id)
     *   7: C_Ctrl -> E_Mat : findOrFail(area_id)
     *  8.1: C_Ctrl -> C_Ctrl : ValidarEspecialidadVsArea(especialidad, area.nombre)
     */
    public function show(Docente $docente): JsonResponse
    {
        $docente->load('area', 'especialidades', 'user');

        return response()->json([
            'docente' => $docente,
            'tiene_hoja_vida' => ! empty($docente->hoja_vida_path),
            'tiene_respaldos' => ! empty($docente->respaldos_path),
            'especialidad_coincide' => $docente->area
                ? $this->validarEspecialidadVsArea($docente->especialidad, $docente->area->nombre)
                : false,
        ]);
    }

    /**
     * CU25 — Servir hoja de vida del aspirante (solo Admin / Coordinador autenticado).
     */
    public function hojaVida(Docente $docente)
    {
        return $this->servirDocumento($docente, 'hoja_vida_path', true);
    }

    /**
     * CU25 — Servir respaldos academicos del aspirante (solo Admin / Coordinador autenticado).
     */
    public function respaldos(Docente $docente)
    {
        return $this->servirDocumento($docente, 'respaldos_path', false);
    }

    /**
     * CU25 — Aceptar Postulacion de Docente.
     *
     * Seq_CU25:
     *  8.1: ValidarEspecialidadVsArea(...)   (regla critica, include)
     *   9: C_Ctrl -> E_Doc : update(['estado' => 'Aceptado'])
     *  10: C_Ctrl -> E_Usu : create(['rol' => 'Docente', 'activo' => true])  (include)
     *  11/12: confirmar y notificar
     */
    public function aceptar(Request $request, Docente $docente): JsonResponse
    {
        // E4: Postulacion ya procesada
        if ($docente->estado === self::ESTADO_ACEPTADO) {
            return response()->json([
                'message' => 'Esta postulacion ya fue procesada anteriormente.',
            ], 422);
        }

        // E2: Respaldos incompletos (hoja de vida obligatoria)
        if (empty($docente->hoja_vida_path)) {
            return response()->json([
                'message' => 'La postulacion no cuenta con los respaldos academicos requeridos.',
            ], 422);
        }

        $docente->loadMissing('area');
        $areaNombre = $docente->area?->nombre ?? '';

        // CU25 - Paso 8.1: Validar coincidencia especialidad vs area (E1)
        $coincide = $this->validarEspecialidadVsArea($docente->especialidad, $areaNombre);
        if (!$coincide && !$request->boolean('confirmar_especialidad')) {
            return response()->json([
                'requires_confirmation' => true,
                'message' => "La especialidad del docente ({$docente->especialidad}) no corresponde al area ({$areaNombre}). No es posible aceptar la postulacion en esta area sin confirmacion.",
            ], 428);
        }

        // Generar credenciales para la cuenta de usuario con rol Docente
        $tempPassword = Str::random(10);

        DB::transaction(function () use ($docente, $tempPassword) {
            $user = User::where('email', $docente->correo)->first();
            if (!$user) {
                // CU25 - Paso 10: Crear cuenta de usuario rol "Docente"
                $user = User::create([
                    'name' => $docente->nombres . ' ' . $docente->apellidos,
                    'email' => $docente->correo,
                    'password' => Hash::make($tempPassword),
                    'role' => 'Docente',
                    'active' => true,
                ]);
            } else {
                $user->update(['role' => 'Docente', 'active' => true]);
            }

            // CU25 - Paso 9: Cambiar estado del docente a "Aceptado" y vincular usuario
            $docente->update([
                'estado' => self::ESTADO_ACEPTADO,
                'user_id' => $user->id,
                'motivo_rechazo' => null,
            ]);
        });

        // CU25 - Paso 11: Notificar al docente con sus credenciales de acceso
        $this->notificarAceptacion($docente, $tempPassword);

        return response()->json([
            'message' => 'Docente aceptado y notificado correctamente.',
            'docente' => $docente->fresh()->load('area', 'user'),
        ]);
    }

    /**
     * CU25 — Rechazar Postulacion de Docente (<<extend>>).
     * Solicita el motivo, cambia el estado a "Rechazado" y notifica al aspirante.
     */
    public function rechazar(Request $request, Docente $docente): JsonResponse
    {
        $validated = $request->validate([
            'motivo' => 'required|string|max:500',
        ], [
            'motivo.required' => 'Debe indicar el motivo del rechazo.',
        ]);

        if ($docente->estado === self::ESTADO_ACEPTADO) {
            return response()->json([
                'message' => 'Esta postulacion ya fue procesada anteriormente.',
            ], 422);
        }

        $docente->update([
            'estado' => self::ESTADO_RECHAZADO,
            'motivo_rechazo' => $validated['motivo'],
        ]);

        $this->notificarRechazo($docente, $validated['motivo']);

        return response()->json([
            'message' => 'Postulacion rechazada y notificada al aspirante.',
            'docente' => $docente->fresh()->load('area'),
        ]);
    }

    /**
     * Regla de negocio critica (CU25): la especialidad debe corresponder al area.
     * Coincidencia flexible: nombre del area, contencion de cadenas o terminos afines
     * (p. ej. "Calculo" / "Algebra" -> Matematicas), mismo criterio ampliado que CU12.
     */
    private function validarEspecialidadVsArea(?string $especialidad, ?string $area): bool
    {
        if (empty($especialidad) || empty($area)) {
            return false;
        }

        $especialidadNorm = $this->normalizarTexto($especialidad);
        $areaNorm = $this->normalizarTexto($area);

        if (str_contains($especialidadNorm, $areaNorm) || str_contains($areaNorm, $especialidadNorm)) {
            return true;
        }

        $terminosPorArea = [
            'matematicas' => ['calculo', 'algebra', 'aritmetica', 'geometria', 'estadistica', 'matematica'],
            'computacion' => ['computacion', 'informatica', 'programacion', 'software', 'sistemas', 'computadora'],
            'fisica' => ['fisica', 'mecanica', 'termodinamica', 'optica'],
            'ingles' => ['ingles', 'english', 'linguistica', 'idiomas'],
        ];

        $terminos = $terminosPorArea[$areaNorm] ?? [];
        foreach ($terminos as $termino) {
            if (str_contains($especialidadNorm, $termino)) {
                return true;
            }
        }

        return false;
    }

    private function normalizarTexto(string $texto): string
    {
        $texto = mb_strtolower(trim($texto));
        $texto = str_replace(['á', 'é', 'í', 'ó', 'ú', 'ñ'], ['a', 'e', 'i', 'o', 'u', 'n'], $texto);

        return $texto;
    }

    /**
     * Entrega un documento adjunto de la postulacion con autenticacion.
     */
    private function servirDocumento(Docente $docente, string $campo, bool $inlineSiPdf)
    {
        $rutaRelativa = $docente->{$campo};
        if (empty($rutaRelativa)) {
            return response()->json(['message' => 'Documento no disponible.'], 404);
        }

        $rutaAbsoluta = public_path($rutaRelativa);
        if (! is_file($rutaAbsoluta)) {
            return response()->json(['message' => 'Archivo no encontrado en el servidor.'], 404);
        }

        $mime = mime_content_type($rutaAbsoluta) ?: 'application/octet-stream';
        $nombre = basename($rutaAbsoluta);
        $disposicion = ($inlineSiPdf && str_contains($mime, 'pdf')) ? 'inline' : 'attachment';

        return response()->file($rutaAbsoluta, [
            'Content-Type' => $mime,
            'Content-Disposition' => "{$disposicion}; filename=\"{$nombre}\"",
        ]);
    }

    /**
     * Almacena un documento adjunto en el directorio publico y retorna su ruta relativa.
     */
    private function guardarDocumento($archivo, string $prefijo): string
    {
        $directorio = public_path('postulaciones_docentes');
        if (!is_dir($directorio)) {
            mkdir($directorio, 0775, true);
        }
        $nombre = $prefijo . '_' . time() . '_' . Str::random(6) . '.' . $archivo->getClientOriginalExtension();
        $archivo->move($directorio, $nombre);

        return 'postulaciones_docentes/' . $nombre;
    }

    private function notificarAceptacion(Docente $docente, string $password): void
    {
        try {
            Mail::raw(
                "Estimado/a " . $docente->nombres . " " . $docente->apellidos . ",\n\n" .
                "Su postulacion como docente del CUP - FICCT ha sido ACEPTADA.\n\n" .
                "Se ha creado su cuenta de acceso al portal:\n" .
                "- Usuario (Correo): " . $docente->correo . "\n" .
                "- Contrasena temporal: " . $password . "\n\n" .
                "Ingrese al sistema en: " . config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173')) . "\n\n" .
                "Bienvenido/a al equipo docente.",
                function ($message) use ($docente) {
                    $message->to($docente->correo)
                        ->subject('Postulacion aceptada - Credenciales de acceso CUP FICCT');
                }
            );
        } catch (\Exception $e) {
            Log::error('Error al enviar correo de aceptacion docente: ' . $e->getMessage());
        }
    }

    private function notificarRechazo(Docente $docente, string $motivo): void
    {
        try {
            Mail::raw(
                "Estimado/a " . $docente->nombres . " " . $docente->apellidos . ",\n\n" .
                "Lamentamos informarle que su postulacion como docente del CUP - FICCT no ha sido aceptada.\n\n" .
                "Motivo: " . $motivo . "\n\n" .
                "Agradecemos su interes y le invitamos a postular en futuras convocatorias.",
                function ($message) use ($docente) {
                    $message->to($docente->correo)
                        ->subject('Resultado de su postulacion docente - CUP FICCT');
                }
            );
        } catch (\Exception $e) {
            Log::error('Error al enviar correo de rechazo docente: ' . $e->getMessage());
        }
    }
}
