<?php

namespace App\Http\Controllers\AdmisionCarreras;

use App\Http\Controllers\Controller;

use App\Models\AdmisionCarreras\Admision;
use App\Models\Autenticacion\BitacoraAcceso;
use App\Models\AdmisionCarreras\CupoGestion;
use App\Models\RegistroPostulantes\Postulante;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AsignacionCarreraController extends Controller
{
    /**
     * CU17: Asignar Carreras por Cupo
     *
     * Seq_CU17: Coordinador → IU_Admision → CTR_AsignacionCarrera.asignacionMasiva()
     *   → CE_Postulante.getAprobados() → ListaAprobados
     *   → loop por postulante:
     *     → CE_CupoGestion.where(primera_opcion)
     *     → [Si hay cupo]: CE_Admision.create() + CE_CupoGestion.decrement()
     *     → [Si no, segunda]: CE_CupoGestion.where(segunda_opcion) + CE_Admision.create() + decrement()
     *     → [Si no, agotado]: CE_Postulante.update(Pendiente Reasignacion) + CE_BitacoraAcceso.create(log)
     *   → ConfirmarProcesamientoExito()
     */
    public function asignacionMasiva(Request $request): JsonResponse
    {
        // CU17 - Paso 2: B_Admi -> C_Asig : + asignacionMasiva()
        $user = $request->user();

        $gestionActiva = \App\Models\AdmisionCarreras\Gestion::activa()->first();
        if (!$gestionActiva) {
            return response()->json(['message' => 'No hay gestión activa configurada.'], 422);
        }

        $result = DB::transaction(function () use ($user, $gestionActiva) {

            // Limpiar admisiones previas de esta gestión para evitar errores de duplicado (1062)
            $ids = Postulante::where('gestion_id', $gestionActiva->id)->pluck('id');
            Admision::whereIn('postulante_id', $ids)->delete();
            
            // Reiniciar los cupos al máximo
            CupoGestion::where('gestion_id', $gestionActiva->id)->update([
                'cupos_disponibles' => DB::raw('cupo_maximo')
            ]);

            // CU17 - Paso 3: C_Asig -> E_Post : + getAprobados()
            // CU17 - Paso 4: E_Post --> C_Asig : + ListaAprobados
            // Obtener postulantes Aprobados, Pendientes o previamente Admitidos de la gestión activa
            $postulantes = Postulante::with(['notasFinales'])
                ->where('gestion_id', $gestionActiva->id)
                ->whereIn('estado', ['Aprobado', 'Pendiente Reasignacion', 'Admitido'])
                ->get();

            // Calcular promedio general de cada uno y ordenar descendentemente (Meritocracia)
            $postulantes = $postulantes->map(function ($postulante) {
                $promedioGeneral = $postulante->notasFinales->avg('promedio') ?? 0;
                $postulante->promedio_general = round($promedioGeneral, 2);
                return $postulante;
            })->sortByDesc('promedio_general');

            $estadisticas = [
                'procesados' => 0,
                'admitidos_1ra_opcion' => 0,
                'admitidos_2da_opcion' => 0,
                'pendientes_reasignacion' => 0,
            ];

            foreach ($postulantes as $postulante) {
                $estadisticas['procesados']++;

                // CU17 - Paso 5 [Loop]: C_Asig -> E_Cupo : + where('carrera_id', primera_opcion_id)
                // CU17 - Paso 6 [Loop]: E_Cupo --> C_Asig : + CupoDisponible1raOpcion
                // 1ra Opcion
                $cupo1ra = CupoGestion::where('gestion_id', $gestionActiva->id)
                    ->where('carrera_id', $postulante->primera_opcion_id)
                    ->lockForUpdate()
                    ->first();

                if ($cupo1ra && $cupo1ra->cupos_disponibles > 0) {
                    // CU17 - Paso 7a [Loop, Cupo1ra > 0]: C_Asig -> E_Admi : + create(postulante, carrera_1ra, via='1ra Opcion')
                    Admision::create([
                        'postulante_id' => $postulante->id,
                        'carrera_id' => $postulante->primera_opcion_id,
                        'via' => '1ra Opcion',
                        'fecha_admision' => now(),
                    ]);
                    // CU17 - Paso 8a [Loop, Cupo1ra > 0]: C_Asig -> E_Cupo : + decrement(cupos_disponibles)
                    $cupo1ra->decrement('cupos_disponibles');
                    Postulante::where('id', $postulante->id)->update(['estado' => 'Admitido']);
                    $estadisticas['admitidos_1ra_opcion']++;
                    continue;
                }

                // CU17 - Paso 7b [Loop, Cupo1ra = 0]: C_Asig -> E_Cupo : + where('carrera_id', segunda_opcion_id)
                // CU17 - Paso 8b [Loop, Cupo1ra = 0]: E_Cupo --> C_Asig : + CupoDisponible2daOpcion
                // 2da Opcion
                $cupo2da = CupoGestion::where('gestion_id', $gestionActiva->id)
                    ->where('carrera_id', $postulante->segunda_opcion_id)
                    ->lockForUpdate()
                    ->first();

                if ($cupo2da && $cupo2da->cupos_disponibles > 0) {
                    // CU17 - Paso 9b [Loop, Cupo2da > 0]: C_Asig -> E_Admi : + create(postulante, carrera_2da, via='2da Opcion')
                    Admision::create([
                        'postulante_id' => $postulante->id,
                        'carrera_id' => $postulante->segunda_opcion_id,
                        'via' => '2da Opcion',
                        'fecha_admision' => now(),
                    ]);
                    // CU17 - Paso 10b [Loop, Cupo2da > 0]: C_Asig -> E_Cupo : + decrement(cupos_disponibles)
                    $cupo2da->decrement('cupos_disponibles');
                    Postulante::where('id', $postulante->id)->update(['estado' => 'Admitido']);
                    $estadisticas['admitidos_2da_opcion']++;
                    continue;
                }

                // CU17 - Paso 9c [Loop, Cupos Agotados]: C_Asig -> E_Post : + update(['estado' => 'Pendiente Reasignacion'])
                // Sin cupo
                Postulante::where('id', $postulante->id)->update(['estado' => 'Pendiente Reasignacion']);
                $estadisticas['pendientes_reasignacion']++;

                // CU17 - Paso 10c [Loop, Cupos Agotados]: C_Asig -> E_Bit : + create(log_alerta)
                BitacoraAcceso::create([
                    'user_id' => $user ? $user->id : 1,
                    'ip_address' => request()->ip() ?? '127.0.0.1',
                    'action' => "ALERTA_CUPO_AGOTADO: Postulante ID {$postulante->id} (CI: {$postulante->ci}) sin cupo en opciones.",
                ]);

                // Notificación push al coordinador
                \App\Models\ReportesIA\Notificacion::create([
                    'usuario_id' => $user ? $user->id : 1,
                    'tipo_evento' => 'Cupo Agotado',
                    'mensaje' => "El postulante {$postulante->nombres} {$postulante->apellidos} (CI: {$postulante->ci}) aprobó con {$postulante->promedio_general} pero no tiene cupo en sus opciones.",
                    'estado' => 'NO_LEIDA',
                ]);
            }

            return $estadisticas;
        });

        // CU17 - Paso 11: C_Asig --> B_Admi : + ConfirmarProcesamientoExito()
        return response()->json([
            'message' => 'Proceso de asignación de carreras finalizado con éxito.',
            'estadisticas' => $result,
        ]);
    }
}
