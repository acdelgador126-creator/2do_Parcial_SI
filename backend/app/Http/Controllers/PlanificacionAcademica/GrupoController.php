<?php

namespace App\Http\Controllers\PlanificacionAcademica;

use App\Http\Controllers\Controller;

use App\Models\AdmisionCarreras\Gestion;
use App\Models\PlanificacionAcademica\Grupo;
use App\Services\PlanificacionAcademica\PlanificacionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Events\ReportesIA\DashboardUpdated;


class GrupoController extends Controller
{
    private PlanificacionService $planificacion;

    public function __construct(PlanificacionService $planificacion)
    {
        $this->planificacion = $planificacion;
    }

    /**
     * CU10: Ejecutar calculo automatico y asignacion masiva
     */
    public function asignacionMasiva(): JsonResponse
    {
        // CU10 - Paso 2: B_Grup -> C_Plan : + asignacionMasiva()
        $gestion = Gestion::activa()->firstOrFail();
        
        // Las cotas y el balanceo físico de aulas se ejecutan dentro del orquestador PlanificacionService
        $resultado = $this->planificacion->ejecutarAsignacionMasiva($gestion->id);

        event(new DashboardUpdated());

        return response()->json($resultado);

    }

    /**
     * CU11: Reasignar un postulante a otro grupo
     */
    public function reasignar(Request $request): JsonResponse
    {
        // CU11 - Paso 2: B_Int -> C_Ctrl : + reasignar(request)
        $request->validate([
            'postulante_id' => 'required', // Se valida y busca por ID o CI en el servicio
            'grupo_id' => 'required|exists:grupos,id',
        ]);

        $resultado = $this->planificacion->reasignarPostulante(
            $request->postulante_id,
            $request->grupo_id
        );

        if (isset($resultado['success']) && $resultado['success']) {
            event(new DashboardUpdated());
        }

        return response()->json($resultado, $resultado['success'] ? 200 : 422);

    }

    /**
     * Listar grupos de la gestion activa
     */
    public function index(): JsonResponse
    {
        $gestion = Gestion::activa()->first();
        if (! $gestion) {
            return response()->json([]);
        }

        $grupos = Grupo::where('gestion_id', $gestion->id)
            ->with([
                'aula',
                'docentes.docente',
                'docentes.materia',
                'horarios.materia',
            ])
            ->withCount('asignaciones as total_estudiantes')
            ->orderBy('turno')
            ->orderBy('numero')
            ->get()
            ->map(function ($grupo) {
                $grupo->horarios_por_materia = $grupo->horarios
                    ->groupBy('materia_id')
                    ->map(function ($items, $materiaId) {
                        $materia = $items->first()->materia;

                        return [
                            'materia_id' => (int) $materiaId,
                            'materia' => $materia?->nombre,
                            'franjas' => $items->map(fn ($h) => [
                                'dia_nombre' => $h->dia_nombre,
                                'hora_inicio' => substr((string) $h->hora_inicio, 0, 5),
                                'hora_fin' => substr((string) $h->hora_fin, 0, 5),
                            ])->values(),
                        ];
                    })
                    ->values();

                unset($grupo->horarios);

                return $grupo;
            });

        return response()->json($grupos);
    }

    /**
     * Ver detalle de un grupo con sus postulantes y docentes
     */
    public function show(Grupo $grupo): JsonResponse
    {
        return response()->json(
            $grupo->load([
                'aula',
                'asignaciones.postulante',
                'docentes.docente',
                'docentes.materia',
            ])
        );
    }
}
