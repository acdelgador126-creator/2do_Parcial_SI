<?php

namespace App\Http\Controllers\PlanificacionAcademica;

use App\Http\Controllers\Controller;
use App\Models\PlanificacionAcademica\AsignacionDocente;
use App\Models\PlanificacionAcademica\HorarioGrupoMateria;
use App\Models\RegistroPostulantes\Postulante;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class MiHorarioController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->role === 'Postulante') {
            return $this->horarioPostulante($user);
        }

        if ($user->role === 'Docente') {
            return $this->horarioDocente($user);
        }

        return response()->json([
            'message' => 'Esta consulta esta disponible solo para postulantes y docentes.',
        ], 403);
    }

    private function horarioPostulante($user): JsonResponse
    {
        $postulante = Postulante::where('user_id', $user->id)
            ->with(['asignacionGrupo.grupo.aula'])
            ->first();

        if (! $postulante) {
            return response()->json([
                'message' => 'No se encontro su registro de postulante.',
            ], 404);
        }

        if (! $postulante->asignacionGrupo?->grupo) {
            return response()->json([
                'tipo' => 'postulante',
                'postulante' => $this->datosPostulante($postulante),
                'grupo' => null,
                'materias' => [],
                'mensaje' => 'Aun no tiene un grupo asignado. Su horario aparecera cuando complete la inscripcion y sea asignado a un paralelo.',
            ]);
        }

        $grupo = $postulante->asignacionGrupo->grupo;
        $materias = $this->horariosDelGrupo($grupo->id);

        return response()->json([
            'tipo' => 'postulante',
            'postulante' => $this->datosPostulante($postulante),
            'grupo' => [
                'id' => $grupo->id,
                'numero' => $grupo->numero,
                'turno' => $grupo->turno,
                'aula' => $grupo->aula ? [
                    'nombre' => $grupo->aula->nombre,
                    'ubicacion' => $grupo->aula->ubicacion,
                ] : null,
            ],
            'materias' => $materias,
        ]);
    }

    private function horarioDocente($user): JsonResponse
    {
        $docente = $user->docente;

        if (! $docente) {
            return response()->json([
                'message' => 'No se encontro su registro de docente.',
            ], 404);
        }

        if ($docente->estado !== 'Aceptado') {
            return response()->json([
                'tipo' => 'docente',
                'docente' => $this->datosDocente($docente),
                'asignaciones' => [],
                'mensaje' => 'Su postulacion docente aun no ha sido aceptada. El horario estara disponible tras la aprobacion y asignacion a grupos.',
            ]);
        }

        $asignaciones = AsignacionDocente::where('docente_id', $docente->id)
            ->with(['grupo.aula', 'materia'])
            ->get()
            ->map(function ($asig) {
                $horarios = HorarioGrupoMateria::where('grupo_id', $asig->grupo_id)
                    ->where('materia_id', $asig->materia_id)
                    ->orderBy('dia_semana')
                    ->get();

                return [
                    'grupo' => [
                        'numero' => $asig->grupo->numero,
                        'turno' => $asig->grupo->turno,
                        'aula' => $asig->grupo->aula?->nombre,
                    ],
                    'materia' => $asig->materia->nombre,
                    'horario_resumen' => $this->resumirHorario($horarios),
                    'franjas' => $this->formatearFranjas($horarios),
                ];
            });

        return response()->json([
            'tipo' => 'docente',
            'docente' => $this->datosDocente($docente),
            'carga_actual' => $asignaciones->count(),
            'asignaciones' => $asignaciones,
        ]);
    }

    private function horariosDelGrupo(int $grupoId): array
    {
        $horarios = HorarioGrupoMateria::where('grupo_id', $grupoId)
            ->with('materia')
            ->orderBy('materia_id')
            ->orderBy('dia_semana')
            ->get()
            ->groupBy('materia_id');

        $docentesPorMateria = AsignacionDocente::where('grupo_id', $grupoId)
            ->with('docente')
            ->get()
            ->keyBy('materia_id');

        return $horarios->map(function (Collection $franjas, $materiaId) use ($docentesPorMateria) {
            $materia = $franjas->first()->materia;
            $asigDoc = $docentesPorMateria->get($materiaId);

            return [
                'materia_id' => (int) $materiaId,
                'materia' => $materia->nombre,
                'horario_resumen' => $this->resumirHorario($franjas),
                'franjas' => $this->formatearFranjas($franjas),
                'docente' => $asigDoc?->docente
                    ? trim($asigDoc->docente->apellidos . ', ' . $asigDoc->docente->nombres)
                    : null,
            ];
        })->values()->all();
    }

    private function formatearFranjas(Collection $horarios): array
    {
        return $horarios->map(fn ($h) => [
            'dia_semana' => $h->dia_semana,
            'dia_nombre' => $h->dia_nombre,
            'hora_inicio' => substr((string) $h->hora_inicio, 0, 5),
            'hora_fin' => substr((string) $h->hora_fin, 0, 5),
        ])->values()->all();
    }

    private function resumirHorario(Collection $horarios): string
    {
        if ($horarios->isEmpty()) {
            return 'Sin horario registrado';
        }

        $first = $horarios->first();
        $inicio = substr((string) $first->hora_inicio, 0, 5);
        $fin = substr((string) $first->hora_fin, 0, 5);
        $mismoHorario = $horarios->every(
            fn ($h) => substr((string) $h->hora_inicio, 0, 5) === $inicio
                && substr((string) $h->hora_fin, 0, 5) === $fin
        );
        $laborales = $horarios->count() === 5
            && $horarios->pluck('dia_semana')->sort()->values()->all() === [1, 2, 3, 4, 5];

        if ($mismoHorario && $laborales) {
            return "Lunes a Viernes: {$inicio} — {$fin}";
        }

        return $horarios->map(
            fn ($h) => $h->dia_nombre . ' ' . substr((string) $h->hora_inicio, 0, 5) . '-' . substr((string) $h->hora_fin, 0, 5)
        )->join(' · ');
    }

    private function datosPostulante(Postulante $postulante): array
    {
        return [
            'nombres' => $postulante->nombres,
            'apellidos' => $postulante->apellidos,
            'ci' => $postulante->ci,
            'turno_preferencia' => $postulante->turno_preferencia,
            'estado' => $postulante->estado,
        ];
    }

    private function datosDocente($docente): array
    {
        return [
            'nombres' => $docente->nombres,
            'apellidos' => $docente->apellidos,
            'especialidad' => $docente->especialidad,
            'estado' => $docente->estado,
        ];
    }
}
