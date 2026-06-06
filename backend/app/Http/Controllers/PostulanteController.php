<?php

namespace App\Http\Controllers;

use App\Models\Gestion;
use App\Models\Postulante;
use App\Models\RequisitoDocumental;
use App\Services\VerificacionExternaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PostulanteController extends Controller
{
    /**
     * CU05 + CU08: Registrar postulante (con deteccion automatica de recurrente)
     *
     * Seq_CU08: Sistema busca CI en BD → si existe, carga datos previos → marca recurrente
     * Seq_CU05: Si no existe, registra nuevo → estado "Preinscrito"
     */
    public function store(Request $request): JsonResponse
    {
        // CU05 - Paso 2: UI -> Ctrl : ProcesarRegistro(datos)
        // CU08 - Paso 2: UI -> Ctrl : VerificarPostulanteExistente(ci)
        $validated = $request->validate([
            'ci' => 'required|string|min:7|max:20',
            'nombres' => 'required|string|max:150',
            'apellidos' => 'required|string|max:150',
            'fecha_nacimiento' => 'required|date|before:today',
            'sexo' => 'required|in:M,F',
            'direccion' => 'nullable|string|max:255',
            'telefono' => 'nullable|string|max:20',
            'email' => 'required|email|max:150',
            'colegio_procedencia' => 'nullable|string|max:150',
            'ciudad' => 'nullable|string|max:100',
            'titulo_bachiller' => 'nullable|string|max:255',
            'primera_opcion_id' => 'required|exists:carreras,id',
            'segunda_opcion_id' => 'required|exists:carreras,id|different:primera_opcion_id',
            'turno_preferencia' => 'required|in:Manana,Tarde,Noche',
        ], [
            'ci.required' => 'El Carnet de Identidad (CI) es obligatorio.',
            'ci.min' => 'El Carnet de Identidad (CI) debe tener al menos 7 caracteres.',
            'ci.max' => 'El Carnet de Identidad (CI) no debe exceder los 20 caracteres.',
            'nombres.required' => 'El nombre es obligatorio.',
            'apellidos.required' => 'El apellido es obligatorio.',
            'fecha_nacimiento.required' => 'La fecha de nacimiento es obligatoria.',
            'fecha_nacimiento.before' => 'La fecha de nacimiento debe ser anterior a hoy.',
            'sexo.required' => 'El sexo es obligatorio.',
            'sexo.in' => 'El sexo seleccionado no es válido.',
            'email.required' => 'El correo electrónico es obligatorio.',
            'email.email' => 'El correo electrónico debe tener un formato válido.',
            'primera_opcion_id.required' => 'La primera opción de carrera es obligatoria.',
            'primera_opcion_id.exists' => 'La primera opción seleccionada no existe.',
            'segunda_opcion_id.required' => 'La segunda opción de carrera es obligatoria.',
            'segunda_opcion_id.different' => 'La segunda opción de carrera debe ser diferente a la primera opción.',
            'segunda_opcion_id.exists' => 'La segunda opción seleccionada no existe.',
            'turno_preferencia.required' => 'El turno de preferencia es obligatorio.',
            'turno_preferencia.in' => 'El turno seleccionado no es válido.',
        ]);

        $gestion = Gestion::activa()->first();
        if (! $gestion) {
            return response()->json([
                'message' => 'No hay periodo de inscripcion activo.',
            ], 422);
        }

        // CU08 - Paso 3: Ctrl -> E_Post : BuscarRegistroAnterior(ci)
        // CU08 - Paso 4: E_Post --> Ctrl : ResultadoBusqueda
        $existente = Postulante::where('ci', $validated['ci'])->first();

        if ($existente) {
            // CU08 - Paso 5 [alt recurrente]: Ctrl --> UI : RetornarDatosRecurrente(datosAnteriores)
            // Ya participó antes -> actualizar datos y marcar recurrente
            $existente->update(array_merge($validated, [
                'gestion_id' => $gestion->id,
                'estado' => 'Preinscrito',
                'recurrente' => true,
            ]));

            return response()->json([
                'message' => 'Postulante recurrente detectado. Datos actualizados para la gestion actual.',
                'postulante' => $existente->fresh()->load('primeraOpcion', 'segundaOpcion'),
                'recurrente' => true,
            ]);
        }

        // CU08 - Paso 5 [alt nuevo]: Ctrl --> UI : ConfirmarNuevoPostulante()
        // CU05 - Paso 3: Ctrl -> E_Post : CrearPerfilPostulante()
        $postulante = Postulante::create(array_merge($validated, [
            'gestion_id' => $gestion->id,
            'estado' => 'Preinscrito',
            'recurrente' => false,
        ]));

        // CU05 - Paso 4: Ctrl -> E_Post : GuardarPreferenciasCarrera()
        RequisitoDocumental::create(['postulante_id' => $postulante->id]);

        // CU05 - Paso 5: Ctrl --> UI : RetornarPostulanteCreado()
        return response()->json([
            'message' => 'Preinscripcion exitosa. Proceda a la verificacion de requisitos.',
            'postulante' => $postulante->load('primeraOpcion', 'segundaOpcion'),
            'recurrente' => false,
        ], 201);
    }

    /**
     * CU06: Verificar requisitos con bases externas (SEGIP/SEDUCA)
     *
     * Seq_CU06: CTR_Preinscripcion → consulta API_SEGIP → consulta API_SEDUCA
     *   → actualiza CE_RequisitoDocumental → actualiza estado postulante
     */
    public function verificarRequisitos(Postulante $postulante): JsonResponse
    {
        // CU06 - Paso 2: UI -> Ctrl : VerificarIdentidad(ci, fecha_nac)
        if ($postulante->estado !== 'Preinscrito') {
            return response()->json([
                'message' => 'El postulante ya fue verificado previamente.',
            ], 422);
        }

        $service = new VerificacionExternaService();
        
        // CU06 - Pasos 3-6 ocurren dentro del servicio de verificación externa (consultar SEGIP y SEDUCA)
        $resultado = $service->verificarCompleto(
            $postulante->ci,
            \Carbon\Carbon::parse($postulante->fecha_nacimiento)->format('Y-m-d')
        );

        if ($resultado['aprobado']) {
            // CU06 - Paso 7 (alt aprobado): Ctrl -> E_Post : ActualizarEstado(Verificado)
            $postulante->requisitos()->update([
                'ci_digitalizado' => true,
                'certificado_nacimiento' => true,
                'titulo_bachiller_legalizado' => true,
                'formulario_preinscripcion' => true,
                'verificado_bd_externa' => true,
            ]);
            $postulante->update(['estado' => 'Verificado']);

            // CU06 - Paso 8 (alt aprobado): Ctrl --> UI : ConfirmarVerificacion()
        } else {
            // CU06 - Paso 7 (alt no encontrado/verificado): Ctrl --> UI : NotificarErrorVerificacion(...)
        }

        return response()->json([
            'message' => $resultado['mensaje'],
            'verificacion' => $resultado,
            'estado_postulante' => $postulante->fresh()->estado,
        ], $resultado['aprobado'] ? 200 : 422);
    }

    /**
     * CU09: Buscar postulantes con filtros multiples
     *
     * Seq_CU09: Admin → IU_Busqueda → CTR_Busqueda.buscar(filtros)
     *   → CE_Postulante.filtrar() → retornar listado paginado
     */
    public function index(Request $request): JsonResponse
    {
        // CU09 - Paso 2: UI -> Ctrl : BuscarPostulantes(criterio)
        
        // CU09 - Paso 3: Ctrl -> E_Post : EjecutarConsulta(criterio)
        $query = Postulante::with(['primeraOpcion', 'segundaOpcion', 'gestion']);

        if ($request->filled('ci')) {
            $query->where('ci', $request->ci);
        }
        if ($request->filled('estado')) {
            $query->where('estado', $request->estado);
        }
        if ($request->filled('gestion_id')) {
            $query->where('gestion_id', $request->gestion_id);
        }
        if ($request->filled('carrera_id')) {
            $id = $request->carrera_id;
            $query->where(function ($q) use ($id) {
                $q->where('primera_opcion_id', $id)
                  ->orWhere('segunda_opcion_id', $id);
            });
        }
        if ($request->filled('turno')) {
            $query->where('turno_preferencia', $request->turno);
        }
        if ($request->filled('recurrente')) {
            $query->where('recurrente', $request->boolean('recurrente'));
        }
        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('nombres', 'ilike', "%{$s}%")
                  ->orWhere('apellidos', 'ilike', "%{$s}%")
                  ->orWhere('ci', 'ilike', "%{$s}%")
                  ->orWhere('email', 'ilike', "%{$s}%");
            });
        }

        // CU09 - Paso 4: E_Post --> Ctrl : ListaResultados
        $postulantes = $query->orderBy('apellidos')->paginate(20);

        // CU09 - Paso 5: Ctrl --> UI : RetornarResultados(lista)
        return response()->json($postulantes);
    }

    /**
     * Ver detalle completo de un postulante
     */
    public function show(Postulante $postulante): JsonResponse
    {
        return response()->json(
            $postulante->load([
                'primeraOpcion', 'segundaOpcion', 'gestion',
                'requisitos', 'pagos', 'asignacionGrupo.grupo',
            ])
        );
    }

    /**
     * Buscar postulante por CI de forma publica para pre-inscripcion y pago
     */
    public function buscarPorCi(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ci' => 'required|string',
        ]);

        $postulante = Postulante::where('ci', $validated['ci'])
            ->with(['primeraOpcion', 'segundaOpcion'])
            ->first();

        if (!$postulante) {
            return response()->json([
                'message' => 'Postulante no encontrado.',
            ], 404);
        }

        return response()->json($postulante);
    }
}
