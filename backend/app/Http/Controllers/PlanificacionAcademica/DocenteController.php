<?php

namespace App\Http\Controllers\PlanificacionAcademica;

use App\Http\Controllers\Controller;

use App\Models\PlanificacionAcademica\AsignacionDocente;
use App\Models\PlanificacionAcademica\Docente;
use App\Models\PlanificacionAcademica\Grupo;
use App\Models\PlanificacionAcademica\HorarioGrupoMateria;
use App\Models\PlanificacionAcademica\Materia;
use App\Services\PlanificacionAcademica\HorarioConflictService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DocenteController extends Controller
{
    public function __construct(
        private HorarioConflictService $horarioConflictService
    ) {}
    /**
     * CU12: Listar docentes aceptados con carga actual.
     * Solo docentes con estado "Aceptado" pueden ser asignados a grupos.
     * Las postulaciones pendientes (CU24) se gestionan en PostulacionDocenteController.
     */
    public function index(): JsonResponse
    {
        $docentes = Docente::withCount('asignaciones as carga_actual')
            ->with(['asignaciones.grupo', 'asignaciones.materia'])
            ->where('estado', 'Aceptado')
            ->orderBy('apellidos')
            ->get()
            ->map(function ($docente) {
                $docente->asignaciones->each(function ($asig) {
                    $asig->horarios = $this->horarioConflictService
                        ->obtenerHorarios($asig->grupo_id, $asig->materia_id)
                        ->map(fn ($h) => [
                            'dia_semana' => $h->dia_semana,
                            'dia_nombre' => $h->dia_nombre,
                            'hora_inicio' => substr((string) $h->hora_inicio, 0, 5),
                            'hora_fin' => substr((string) $h->hora_fin, 0, 5),
                        ]);
                });

                return $docente;
            });

        return response()->json($docentes);
    }

    /**
     * Registrar nuevo docente
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ci' => 'required|string|unique:docentes,ci',
            'nombres' => 'required|string|max:150',
            'apellidos' => 'required|string|max:150',
            'especialidad' => 'required|string|max:100',
            'grado_academico' => 'required|string|max:100',
            'correo' => 'required|email|max:150',
        ]);

        $docente = Docente::create([
            ...$validated,
            'estado' => 'Aceptado',
        ]);
        return response()->json(['message' => 'Docente registrado.', 'docente' => $docente], 201);
    }

    /**
     * CU12: Asignar docente a grupo + materia
     *
     * Seq_CU12: Admin → selecciona docente, grupo, materia
     *   → CTR_Planificacion.asignarDocente()
     *   → ALT [carga < 4]: asignar | [carga >= 4]: rechazar
     *   → Validar especialidad vs materia
     *   → Validar unicidad (grupo, materia)
     */
    public function asignar(Request $request): JsonResponse
    {
        // CU12 - Paso 2: B_Int -> C_Ctrl : + asignar(request)
        $request->validate([
            'docente_id' => 'required|exists:docentes,id',
            'grupo_id' => 'required|exists:grupos,id',
            'materia_id' => 'required|exists:materias,id',
        ]);

        // CU12 - Paso 3: C_Ctrl -> E_Doc : + findOrFail(docente_id)
        $docente = Docente::findOrFail($request->docente_id);

        // Solo docentes aceptados por Administrador/Coordinador (CU25) pueden ser asignados
        if ($docente->estado !== 'Aceptado') {
            return response()->json([
                'message' => 'Este docente aun no ha sido aceptado. Revise la postulacion en Postulaciones Docentes.',
            ], 422);
        }

        // CU12 - Paso 4: E_Doc --> C_Ctrl : + CargaHorariaValida
        // Validar carga maxima (4 grupos por docente)
        if (! $docente->tieneCargaDisponible()) {
            return response()->json([
                'message' => "El docente {$docente->nombres} {$docente->apellidos} ya tiene 4 grupos asignados (carga maxima).",
            ], 422);
        }

        // CU12 - Paso 5: C_Ctrl -> E_Grupo : + findOrFail(grupo_id)
        // CU12 - Paso 6: E_Grupo --> C_Ctrl : + DatosGrupo
        // CU12 - Paso 7: C_Ctrl -> E_Mat : + findOrFail(materia_id)
        // CU12 - Paso 8: E_Mat --> C_Ctrl : + DatosMateria
        $materia = Materia::findOrFail($request->materia_id);

        // CU12 - Paso 8.1: C_Ctrl -> C_Ctrl : + ValidarCoincidenciaEspecialidad(docente.especialidad, materia.nombre)
        // Validar especialidad docente vs materia (string matching flexible)
        $especialidadNorm = mb_strtolower($docente->especialidad);
        $materiaNorm = mb_strtolower($materia->nombre);
        if (strpos($especialidadNorm, $materiaNorm) === false && strpos($materiaNorm, $especialidadNorm) === false) {
            // E3: Especialidad no coincide
            if (!$request->boolean('confirmar_especialidad')) {
                return response()->json([
                    'requires_confirmation' => true,
                    'message' => "El docente {$docente->nombres} tiene especialidad en {$docente->especialidad} pero se le está asignando {$materia->nombre}. ¿Confirmar?",
                ], 428); // Precondition Required
            }
        }

        // Validar que no exista ya un docente asignado a esa materia en ese grupo
        $duplicado = AsignacionDocente::where('grupo_id', $request->grupo_id)
            ->where('materia_id', $request->materia_id)
            ->exists();

        if ($duplicado) {
            return response()->json([
                'message' => 'Ya existe un docente asignado a esta materia en este grupo.',
            ], 422);
        }

        // Validar choque de horarios con otras asignaciones del docente
        $conflicto = $this->horarioConflictService->detectarChoque(
            (int) $request->docente_id,
            (int) $request->grupo_id,
            (int) $request->materia_id
        );

        if ($conflicto) {
            return response()->json($conflicto, 422);
        }

        // CU12 - Paso 9: C_Ctrl -> E_AsigDoc : + create(datos)
        $asignacion = AsignacionDocente::create([
            'docente_id' => $request->docente_id,
            'grupo_id' => $request->grupo_id,
            'materia_id' => $request->materia_id,
        ]);

        // CU12 - Paso 10: C_Ctrl --> B_Int : + RetornarExito()
        return response()->json([
            'message' => 'Docente asignado exitosamente.',
            'asignacion' => $asignacion->load(['docente', 'grupo', 'materia']),
        ], 201);
    }

    /**
     * Ver docente con sus asignaciones
     */
    public function show(Docente $docente): JsonResponse
    {
        $docente->load('asignaciones.grupo', 'asignaciones.materia');
        $docente->asignaciones->each(function ($asig) {
            $asig->horarios = $this->horarioConflictService
                ->obtenerHorarios($asig->grupo_id, $asig->materia_id)
                ->map(fn ($h) => [
                    'dia_semana' => $h->dia_semana,
                    'dia_nombre' => $h->dia_nombre,
                    'hora_inicio' => substr((string) $h->hora_inicio, 0, 5),
                    'hora_fin' => substr((string) $h->hora_fin, 0, 5),
                ]);
        });

        return response()->json($docente);
    }
}
