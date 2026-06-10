<?php

namespace App\Services\PlanificacionAcademica;

use App\Models\PlanificacionAcademica\AsignacionDocente;
use App\Models\PlanificacionAcademica\Grupo;
use App\Models\PlanificacionAcademica\HorarioGrupoMateria;
use Illuminate\Support\Collection;

class HorarioConflictService
{
    public function obtenerHorarios(int $grupoId, int $materiaId): Collection
    {
        return HorarioGrupoMateria::where('grupo_id', $grupoId)
            ->where('materia_id', $materiaId)
            ->orderBy('dia_semana')
            ->orderBy('hora_inicio')
            ->get();
    }

    /**
     * Detecta choque de horario si el docente ya tiene otra asignación que se solapa.
     *
     * @return array<string, mixed>|null Detalle del conflicto o null si no hay choque
     */
    public function detectarChoque(int $docenteId, int $grupoId, int $materiaId): ?array
    {
        $grupoNuevo = Grupo::find($grupoId);
        $horariosNuevos = $this->obtenerHorarios($grupoId, $materiaId);

        if ($horariosNuevos->isEmpty()) {
            return [
                'tipo' => 'sin_horario',
                'message' => 'No hay horario institucional registrado para esta materia en el grupo. Ejecute las migraciones del sistema o la asignación masiva de grupos (CU10) para poblar la carga horaria.',
            ];
        }

        $asignacionesExistentes = AsignacionDocente::where('docente_id', $docenteId)
            ->with(['grupo', 'materia'])
            ->get();

        foreach ($asignacionesExistentes as $asignacion) {
            if ($asignacion->grupo_id === $grupoId && $asignacion->materia_id === $materiaId) {
                continue;
            }

            $horariosExistentes = $this->obtenerHorarios($asignacion->grupo_id, $asignacion->materia_id);

            foreach ($horariosNuevos as $nuevo) {
                foreach ($horariosExistentes as $existente) {
                    if ($nuevo->dia_semana !== $existente->dia_semana) {
                        continue;
                    }

                    if ($this->intervalosSeSolapan(
                        $nuevo->hora_inicio,
                        $nuevo->hora_fin,
                        $existente->hora_inicio,
                        $existente->hora_fin
                    )) {
                        return [
                            'tipo' => 'choque_horario',
                            'message' => sprintf(
                                'Choque de horario: el docente ya tiene %s en Grupo #%d (%s %s-%s) y choca con la nueva asignacion en Grupo #%d (%s %s-%s).',
                                $asignacion->materia->nombre,
                                $asignacion->grupo->numero,
                                HorarioGrupoMateria::DIAS[$existente->dia_semana],
                                $this->formatearHora($existente->hora_inicio),
                                $this->formatearHora($existente->hora_fin),
                                $grupoNuevo?->numero ?? $grupoId,
                                HorarioGrupoMateria::DIAS[$nuevo->dia_semana] ?? '',
                                $this->formatearHora($nuevo->hora_inicio),
                                $this->formatearHora($nuevo->hora_fin)
                            ),
                            'asignacion_existente' => [
                                'grupo_numero' => $asignacion->grupo->numero,
                                'materia' => $asignacion->materia->nombre,
                                'dia' => HorarioGrupoMateria::DIAS[$existente->dia_semana],
                                'hora_inicio' => $this->formatearHora($existente->hora_inicio),
                                'hora_fin' => $this->formatearHora($existente->hora_fin),
                            ],
                            'horario_nuevo' => [
                                'dia' => HorarioGrupoMateria::DIAS[$nuevo->dia_semana],
                                'hora_inicio' => $this->formatearHora($nuevo->hora_inicio),
                                'hora_fin' => $this->formatearHora($nuevo->hora_fin),
                            ],
                        ];
                    }
                }
            }
        }

        return null;
    }

    public function intervalosSeSolapan($inicio1, $fin1, $inicio2, $fin2): bool
    {
        $a1 = $this->aMinutos($inicio1);
        $a2 = $this->aMinutos($fin1);
        $b1 = $this->aMinutos($inicio2);
        $b2 = $this->aMinutos($fin2);

        return $a1 < $b2 && $b1 < $a2;
    }

    private function aMinutos($hora): int
    {
        if ($hora instanceof \DateTimeInterface) {
            return ((int) $hora->format('H')) * 60 + (int) $hora->format('i');
        }

        $partes = explode(':', (string) $hora);

        return ((int) ($partes[0] ?? 0)) * 60 + (int) ($partes[1] ?? 0);
    }

    private function formatearHora($hora): string
    {
        if ($hora instanceof \DateTimeInterface) {
            return $hora->format('H:i');
        }

        return substr((string) $hora, 0, 5);
    }
}
