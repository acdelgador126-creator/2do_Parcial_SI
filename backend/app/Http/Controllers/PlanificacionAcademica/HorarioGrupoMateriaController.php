<?php

namespace App\Http\Controllers\PlanificacionAcademica;

use App\Http\Controllers\Controller;
use App\Models\PlanificacionAcademica\HorarioGrupoMateria;
use App\Models\PlanificacionAcademica\Materia;
use App\Services\PlanificacionAcademica\HorarioConflictService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HorarioGrupoMateriaController extends Controller
{
    public function __construct(
        private HorarioConflictService $conflictService
    ) {}

    /**
     * Consulta de horario institucional fijo (solo lectura).
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'grupo_id' => 'required|exists:grupos,id',
            'materia_id' => 'required|exists:materias,id',
        ]);

        $horarios = $this->conflictService->obtenerHorarios(
            (int) $request->grupo_id,
            (int) $request->materia_id
        )->map(fn ($h) => $this->formatearHorario($h));

        return response()->json($horarios);
    }

    public function materias(): JsonResponse
    {
        return response()->json(Materia::orderBy('nombre')->get(['id', 'nombre', 'codigo']));
    }

    private function formatearHorario(HorarioGrupoMateria $h): array
    {
        return [
            'id' => $h->id,
            'grupo_id' => $h->grupo_id,
            'materia_id' => $h->materia_id,
            'dia_semana' => $h->dia_semana,
            'dia_nombre' => $h->dia_nombre,
            'hora_inicio' => substr((string) $h->hora_inicio, 0, 5),
            'hora_fin' => substr((string) $h->hora_fin, 0, 5),
        ];
    }
}
