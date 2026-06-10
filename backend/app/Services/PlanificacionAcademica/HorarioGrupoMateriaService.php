<?php

namespace App\Services\PlanificacionAcademica;

use App\Models\PlanificacionAcademica\Grupo;
use App\Models\PlanificacionAcademica\HorarioGrupoMateria;
use App\Models\PlanificacionAcademica\Materia;

class HorarioGrupoMateriaService
{
    /** Lunes (1) a Viernes (5) — todas las materias, todos los dias laborales */
    private const DIAS_LABORALES = [1, 2, 3, 4, 5];

    private function lunAViernes(string $inicio, string $fin): array
    {
        return array_map(
            fn (int $dia) => [$dia, $inicio, $fin],
            self::DIAS_LABORALES
        );
    }

    /**
     * Tres variantes por turno; cada grupo usa una segun su numero (1→v0, 2→v1, 3→v2, 4→v0...).
     * Todas las materias: lunes a viernes, franjas distintas sin choque dentro del grupo.
     */
    private function variantesPorTurno(string $turno): array
    {
        return match ($turno) {
            'Manana' => [
                [
                    'MAT' => $this->lunAViernes('07:00', '09:00'),
                    'COM' => $this->lunAViernes('09:00', '11:00'),
                    'FIS' => $this->lunAViernes('11:00', '13:00'),
                    'ING' => $this->lunAViernes('13:00', '15:00'),
                ],
                [
                    'MAT' => $this->lunAViernes('08:00', '10:00'),
                    'COM' => $this->lunAViernes('10:00', '12:00'),
                    'FIS' => $this->lunAViernes('07:00', '09:00'),
                    'ING' => $this->lunAViernes('12:00', '14:00'),
                ],
                [
                    'MAT' => $this->lunAViernes('09:00', '11:00'),
                    'COM' => $this->lunAViernes('07:00', '09:00'),
                    'FIS' => $this->lunAViernes('11:00', '13:00'),
                    'ING' => $this->lunAViernes('13:00', '15:00'),
                ],
            ],
            'Noche' => [
                [
                    'MAT' => $this->lunAViernes('18:00', '19:00'),
                    'COM' => $this->lunAViernes('19:00', '20:00'),
                    'FIS' => $this->lunAViernes('20:00', '21:00'),
                    'ING' => $this->lunAViernes('21:00', '22:00'),
                ],
                [
                    'MAT' => $this->lunAViernes('19:00', '20:00'),
                    'COM' => $this->lunAViernes('20:00', '21:00'),
                    'FIS' => $this->lunAViernes('21:00', '22:00'),
                    'ING' => $this->lunAViernes('18:00', '19:00'),
                ],
                [
                    'MAT' => $this->lunAViernes('20:00', '21:00'),
                    'COM' => $this->lunAViernes('21:00', '22:00'),
                    'FIS' => $this->lunAViernes('18:00', '19:00'),
                    'ING' => $this->lunAViernes('19:00', '20:00'),
                ],
            ],
            default => [ // Tarde
                [
                    'MAT' => $this->lunAViernes('13:00', '15:00'),
                    'COM' => $this->lunAViernes('15:00', '17:00'),
                    'FIS' => $this->lunAViernes('17:00', '19:00'),
                    'ING' => $this->lunAViernes('19:00', '21:00'),
                ],
                [
                    'MAT' => $this->lunAViernes('15:00', '17:00'),
                    'COM' => $this->lunAViernes('17:00', '19:00'),
                    'FIS' => $this->lunAViernes('19:00', '21:00'),
                    'ING' => $this->lunAViernes('13:00', '15:00'),
                ],
                [
                    'MAT' => $this->lunAViernes('13:00', '15:00'),
                    'COM' => $this->lunAViernes('17:00', '19:00'),
                    'FIS' => $this->lunAViernes('15:00', '17:00'),
                    'ING' => $this->lunAViernes('19:00', '21:00'),
                ],
            ],
        };
    }

    private function indiceVariante(Grupo $grupo): int
    {
        return ($grupo->numero - 1) % 3;
    }

    private function plantillaParaGrupo(Grupo $grupo): array
    {
        $variantes = $this->variantesPorTurno($grupo->turno);

        return $variantes[$this->indiceVariante($grupo)];
    }

    public function generarHorariosPorDefecto(Grupo $grupo, bool $forzar = false): void
    {
        $plantilla = $this->plantillaParaGrupo($grupo);
        $materias = Materia::whereIn('codigo', array_keys($plantilla))->get()->keyBy('codigo');

        if ($forzar) {
            HorarioGrupoMateria::where('grupo_id', $grupo->id)->delete();
        }

        foreach ($plantilla as $codigo => $slots) {
            $materia = $materias->get($codigo);
            if (! $materia) {
                continue;
            }

            if (! $forzar) {
                $yaExiste = HorarioGrupoMateria::where('grupo_id', $grupo->id)
                    ->where('materia_id', $materia->id)
                    ->exists();
                if ($yaExiste) {
                    continue;
                }
            }

            foreach ($slots as [$dia, $inicio, $fin]) {
                HorarioGrupoMateria::create([
                    'grupo_id' => $grupo->id,
                    'materia_id' => $materia->id,
                    'dia_semana' => $dia,
                    'hora_inicio' => $inicio,
                    'hora_fin' => $fin,
                ]);
            }
        }
    }

    public function regenerarTodosLosGrupos(): int
    {
        $count = 0;
        Grupo::orderBy('turno')->orderBy('numero')->each(function (Grupo $grupo) use (&$count) {
            HorarioGrupoMateria::where('grupo_id', $grupo->id)->delete();
            $this->generarHorariosPorDefecto($grupo, true);
            $count++;
        });

        return $count;
    }
}
