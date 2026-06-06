<?php

namespace App\Services;

use App\Models\AsignacionGrupo;
use App\Models\Aula;
use App\Models\Grupo;
use App\Models\Postulante;
use Illuminate\Support\Facades\DB;

class PlanificacionService
{
    private const MAX_POR_GRUPO = 70;

    /**
     * CU10: Calculo automatico de grupos + asignacion masiva.
     */
    public function ejecutarAsignacionMasiva(int $gestionId): array
    {
        return DB::transaction(function () use ($gestionId) {
            // CU10 - Paso 3: Ctrl -> E_Post : ObtenerPostulantesInscritosSinGrupo()
            // CU10 - Paso 4: E_Post --> Ctrl : ListaPostulantes
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

            // CU10 - Paso 6: Ctrl -> E_Aula : VerificarDisponibilidadAulas()
            // CU10 - Paso 7: E_Aula --> Ctrl : AulasDisponibles
            $aulas = Aula::where('capacidad', '>=', self::MAX_POR_GRUPO)->get();
            $aulaIndex = 0;

            foreach ($porTurno as $turno => $listaPostulantes) {
                // CU10 - Paso 5: Ctrl -> Ctrl : CalcularGruposNecesarios(CEIL(Total/70))
                $cantGrupos = (int) ceil($listaPostulantes->count() / self::MAX_POR_GRUPO);
                $ultimoNumero = Grupo::where('gestion_id', $gestionId)
                    ->where('turno', $turno)
                    ->max('numero') ?? 0;

                // CU10 - Paso 8: Ctrl -> E_Grupo : CrearNuevosGrupos(cantidad, horarios)
                $gruposNuevos = [];
                for ($i = 1; $i <= $cantGrupos; $i++) {
                    $aula = $aulas[$aulaIndex % $aulas->count()];
                    $aulaIndex++;

                    $gruposNuevos[] = Grupo::create([
                        'numero' => $ultimoNumero + $i,
                        'gestion_id' => $gestionId,
                        'turno' => $turno,
                        'aula_id' => $aula->id,
                    ]);
                }
                $gruposCreados += $cantGrupos;

                // CU10 - Paso 9: Ctrl -> Ctrl : CalcularDistribucionEquitativa()
                // Distribuir equitativamente en chunks
                $chunks = $listaPostulantes->values()->chunk(self::MAX_POR_GRUPO);
                foreach ($chunks as $idx => $chunk) {
                    $grupo = $gruposNuevos[$idx];
                    
                    // CU10 - [LOOP] Para cada postulante inscrito sin grupo
                    foreach ($chunk as $postulante) {
                        // CU10 - Paso 10: Ctrl -> E_Asig : VincularPostulanteAGrupo(postulanteId, grupoId)
                        AsignacionGrupo::create([
                            'postulante_id' => $postulante->id,
                            'grupo_id' => $grupo->id,
                        ]);
                        
                        // CU10 - Paso 11: Ctrl -> E_Post : ActualizarEstado("En Evaluación")
                        $postulante->update(['estado' => 'En Evaluacion']);
                        $postulantesAsignados++;
                    }
                }
            }

            // CU10 - Paso 12: Ctrl --> UI : ConfirmarAsignacionExitosa()
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
    public function reasignarPostulante(int $postulanteId, int $nuevoGrupoId): array
    {
        // CU11 - Paso 3: Ctrl -> E_Post : ObtenerPostulante(postulanteId)
        // CU11 - Paso 4: E_Post --> Ctrl : DatosPostulante
        // CU11 - Paso 5: Ctrl -> E_Grupo : VerificarCapacidad(nuevoGrupoId)
        // CU11 - Paso 6: E_Grupo --> Ctrl : CapacidadDisponible
        $grupo = Grupo::findOrFail($nuevoGrupoId);

        if (! $grupo->tieneCapacidad()) {
            // CU11 - Paso 7 (alt lleno): Ctrl --> UI : NotificarError("Grupo lleno...")
            return [
                'success' => false,
                'message' => "Grupo #{$grupo->numero} (turno {$grupo->turno}) esta lleno. Capacidad maxima: " . self::MAX_POR_GRUPO,
            ];
        }

        // CU11 - Paso 7 (alt disponible): Ctrl -> E_Asig : ActualizarVinculoGrupo()
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
