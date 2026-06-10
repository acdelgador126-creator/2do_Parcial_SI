<?php

namespace App\Services\PlanificacionAcademica;

use App\Models\PlanificacionAcademica\AsignacionGrupo;
use App\Models\PlanificacionAcademica\Aula;
use App\Models\PlanificacionAcademica\Grupo;
use App\Models\RegistroPostulantes\Postulante;
use Illuminate\Support\Facades\DB;

class PlanificacionService
{
    private const MAX_POR_GRUPO = 70;

    public function __construct(
        private HorarioGrupoMateriaService $horarioGrupoMateriaService
    ) {}

    /**
     * CU10: Calculo automatico de grupos + asignacion masiva.
     */
    public function ejecutarAsignacionMasiva(int $gestionId): array
    {
        return DB::transaction(function () use ($gestionId) {
            // CU10 - Paso 3: C_Plan -> E_Post : + where('estado', 'Inscrito')
            // CU10 - Paso 4: E_Post --> C_Plan : + ListaPostulantes
            $postulantes = Postulante::where('gestion_id', $gestionId)
                ->where('estado', 'Inscrito')
                ->whereDoesntHave('asignacionGrupo')
                ->orderBy('apellidos')
                ->get();

            if ($postulantes->isEmpty()) {
                return [
                    'success' => true,
                    'message' => 'No hay postulantes inscritos pendientes de asignacion.',
                    'grupos_creados' => 0,
                    'postulantes_asignados' => 0,
                ];
            }

            $porTurno = $postulantes->groupBy('turno_preferencia');
            $gruposCreados = 0;
            $postulantesAsignados = 0;

            // CU10 - Paso 6: C_Plan -> E_Aula : + VerificarDisponibilidadAulas()
            // CU10 - Paso 7: E_Aula --> C_Plan : + AulasDisponibles
            $aulas = Aula::where('capacidad', '>=', self::MAX_POR_GRUPO)->get();
            if ($aulas->isEmpty()) {
                $aulas = Aula::all();
            }
            if ($aulas->isEmpty()) {
                throw new \Exception("No hay aulas registradas en el sistema para realizar la asignación.");
            }
            $aulaIndex = 0;

            foreach ($porTurno as $turno => $listaPostulantes) {
                // CU10 - Paso 5: C_Plan -> C_Plan : + CalcularGruposNecesarios(CEIL(Total/70))
                $cantGrupos = (int) ceil($listaPostulantes->count() / self::MAX_POR_GRUPO);
                $ultimoNumero = Grupo::where('gestion_id', $gestionId)
                    ->where('turno', $turno)
                    ->max('numero') ?? 0;

                // CU10 - Paso 8: C_Plan -> E_Grupo : + create(datos)
                $gruposNuevos = [];
                for ($i = 1; $i <= $cantGrupos; $i++) {
                    $aula = $aulas[$aulaIndex % $aulas->count()];
                    $aulaIndex++;

                    $gruposNuevos[] = $grupo = Grupo::create([
                        'numero' => $ultimoNumero + $i,
                        'gestion_id' => $gestionId,
                        'turno' => $turno,
                        'aula_id' => $aula->id,
                    ]);

                    $this->horarioGrupoMateriaService->generarHorariosPorDefecto($grupo);
                }
                $gruposCreados += $cantGrupos;

                // CU10 - Paso 9: C_Plan -> C_Plan : + CalcularDistribucionEquitativa()
                // Distribuir equitativamente en chunks
                $chunks = $listaPostulantes->values()->chunk(self::MAX_POR_GRUPO);
                foreach ($chunks as $idx => $chunk) {
                    $grupo = $gruposNuevos[$idx];
                    
                    // CU10 - [LOOP] Para cada postulante inscrito sin grupo
                    foreach ($chunk as $postulante) {
                        // CU10 - Paso 10: C_Plan -> E_Asig : + create(datos)
                        AsignacionGrupo::create([
                            'postulante_id' => $postulante->id,
                            'grupo_id' => $grupo->id,
                        ]);
                        
                        // CU10 - Paso 11: C_Plan -> E_Post : + update(['estado' => 'En Evaluacion'])
                        $postulante->update(['estado' => 'En Evaluacion']);
                        $postulantesAsignados++;
                    }
                }
            }

            // CU10 - Paso 12: C_Plan --> B_Grup : + ConfirmarAsignacionExitosa()
            return [
                'success' => true,
                'message' => 'Asignacion masiva completada exitosamente.',
                'grupos_creados' => $gruposCreados,
                'postulantes_asignados' => $postulantesAsignados,
                'detalle_por_turno' => $porTurno->map->count(),
            ];
        });
    }

    /**
     * CU11: Reasignar postulante a otro grupo.
     */
    public function reasignarPostulante($postulanteId, int $nuevoGrupoId): array
    {
        // CU11 - Paso 3: C_Ctrl -> E_Post : + findOrFail(postulante_id)
        $postulante = Postulante::where('id', $postulanteId)
            ->orWhere('ci', (string)$postulanteId)
            ->first();

        if (!$postulante) {
            // CU11 - Paso 4: E_Post --> Ctrl : PostulanteNoEncontrado
            return [
                'success' => false,
                'message' => "Postulante con identificador '{$postulanteId}' no encontrado.",
            ];
        }

        $postulanteId = $postulante->id;

        // CU11 - Paso 4: E_Post --> C_Ctrl : + DatosPostulante
        // CU11 - Paso 5: C_Ctrl -> E_Grupo : + findOrFail(grupo_id)
        // CU11 - Paso 6: E_Grupo --> C_Ctrl : + CapacidadDisponible
        $grupo = Grupo::findOrFail($nuevoGrupoId);

        if (! $grupo->tieneCapacidad()) {
            // CU11 - Paso 7 (alt lleno): Ctrl --> UI : NotificarError("Grupo lleno...")
            return [
                'success' => false,
                'message' => "Grupo #{$grupo->numero} (turno {$grupo->turno}) esta lleno. Capacidad maxima: " . self::MAX_POR_GRUPO,
            ];
        }

        // CU11 - Paso 7: C_Ctrl -> E_Asig : + update(grupo_id)
        AsignacionGrupo::where('postulante_id', $postulanteId)->delete();

        AsignacionGrupo::create([
            'postulante_id' => $postulanteId,
            'grupo_id' => $nuevoGrupoId,
        ]);

        return [
            'success' => true,
            'message' => "Postulante reasignado al grupo #{$grupo->numero}.",
        ];
    }
}
