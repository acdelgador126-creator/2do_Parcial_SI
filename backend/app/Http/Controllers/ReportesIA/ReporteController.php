<?php

namespace App\Http\Controllers\ReportesIA;

use App\Http\Controllers\Controller;

use App\Models\AdmisionCarreras\Admision;
use App\Models\Autenticacion\BitacoraAcceso;
use App\Models\AdmisionCarreras\Carrera;
use App\Models\AdmisionCarreras\CupoGestion;
use App\Models\PlanificacionAcademica\Docente;
use App\Models\Evaluacion\Examen;
use App\Models\AdmisionCarreras\Gestion;
use App\Models\PlanificacionAcademica\Grupo;
use App\Models\Evaluacion\NotaFinal;
use App\Models\RegistroPostulantes\Postulante;
use App\Models\Autenticacion\User;
use App\Exports\ReportesIA\ReporteVozExport;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class ReporteController extends Controller
{
    /**
     * CU18: Configurar Cupos por Carrera
     *
     * Seq_CU18: Administrador → IU_Configuracion → CTR_Asignacion.store(request)
     *   → CE_CupoGestion.updateOrCreate(datos)
     *   → RetornarConfirmacion()
     */
    public function configurarCupos(Request $request): JsonResponse
    {
        $rules = [
            'cupos' => 'required|array',
            'cupos.*.carrera_id' => 'required|exists:carreras,id',
            'cupos.*.cupo_maximo' => 'required|integer|min:0',
        ];

        // Validar campos opcionales de gestión si se envían conjuntamente
        if ($request->has('gestion_codigo')) {
            $rules['gestion_codigo'] = 'required|string|max:10';
            $rules['fecha_inicio'] = 'required|date';
            $rules['fecha_fin'] = 'required|date|after:fecha_inicio';
            $rules['activa'] = 'required|boolean';
        }

        $validated = $request->validate($rules);

        if ($request->has('gestion_codigo')) {
            $gestion = Gestion::firstOrNew(['codigo' => $validated['gestion_codigo']]);
            $gestion->fecha_inicio = $validated['fecha_inicio'];
            $gestion->fecha_fin = $validated['fecha_fin'];

            $newActiva = (bool) $validated['activa'];
            $gestion->activa = $newActiva;
            $gestion->save();

            if ($newActiva) {
                Gestion::where('id', '!=', $gestion->id)->update(['activa' => false]);
            } else {
                $this->desactivarPostulantesDeGestion($gestion->id);
            }
        } else {
            $gestion = Gestion::activa()->first();
            if (!$gestion) {
                return response()->json(['message' => 'No hay gestión activa configurada.'], 422);
            }
        }

        DB::transaction(function () use ($validated, $gestion) {
            foreach ($validated['cupos'] as $c) {
                $ocupados = $this->calcularCuposOcupados($gestion->id, $c['carrera_id']);
                DB::table('cupos_gestion')->updateOrInsert(
                    [
                        'gestion_id' => $gestion->id,
                        'carrera_id' => $c['carrera_id'],
                    ],
                    [
                        'cupo_maximo' => $c['cupo_maximo'],
                        'cupos_disponibles' => max(0, $c['cupo_maximo'] - $ocupados),
                    ]
                );
            }
        });

        return response()->json([
            'message' => 'Configuración de gestión y cupos guardada exitosamente.',
            'gestion' => $gestion->fresh(),
        ]);
    }

    /**
     * CU17: Asignar Carreras por Cupo (Algoritmo de Admisión)
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
        $coordinador = $request->user();

        // CU17 - Paso 2: B_Admi -> C_Asig : + asignacionMasiva()
        $gestion = Gestion::activa()->first();
        if (!$gestion) {
            return response()->json(['message' => 'No hay gestión activa configurada.'], 422);
        }

        // CU17 - Paso 3: C_Asig -> E_Post : + getAprobados()
        // CU17 - Paso 4: E_Post --> C_Asig : + ListaAprobados
        // Se ordenan por promedio general descendente para asegurar meritocracia
        $aprobados = Postulante::where('gestion_id', $gestion->id)
            ->whereIn('estado', ['Aprobado', 'Pendiente Reasignacion', 'Admitido'])
            ->get()
            ->map(function ($postulante) {
                // Calcular promedio general acumulado de las materias
                $promedio = NotaFinal::where('postulante_id', $postulante->id)->avg('promedio') ?? 0.0;
                $postulante->promedio_general = round($promedio, 2);
                return $postulante;
            })
            ->sortByDesc('promedio_general');

        $asignados = 0;
        $reasignados2da = 0;
        $pendientes = 0;

        DB::transaction(function () use ($aprobados, $gestion, $coordinador, &$asignados, &$reasignados2da, &$pendientes) {
            
            // 1. Limpiar las admisiones previas de esta gestión para recalcular desde cero de forma justa
            $ids = $aprobados->pluck('id');
            Admision::whereIn('postulante_id', $ids)->delete();
            
            // 2. Restaurar todos los cupos disponibles al máximo original
            DB::table('cupos_gestion')->where('gestion_id', $gestion->id)->update([
                'cupos_disponibles' => DB::raw('cupo_maximo')
            ]);

            foreach ($aprobados as $postulante) {
                // CU17 - Paso 5 [Loop]: C_Asig -> E_Cupo : + where('carrera_id', primera_opcion_id)
                // CU17 - Paso 6 [Loop]: E_Cupo --> C_Asig : + CupoDisponible1raOpcion
                $cupo1ra = DB::table('cupos_gestion')
                    ->where('gestion_id', $gestion->id)
                    ->where('carrera_id', $postulante->primera_opcion_id)
                    ->first();

                if ($cupo1ra && $cupo1ra->cupos_disponibles > 0) {
                    // CU17 - Paso 7a [Loop, Cupo1ra > 0]: C_Asig -> E_Admi : + create(postulante, carrera_1ra, via='1ra Opcion')
                    Admision::create([
                        'postulante_id' => $postulante->id,
                        'carrera_id' => $postulante->primera_opcion_id,
                        'via' => '1ra Opcion',
                    ]);

                    // CU17 - Paso 8a [Loop, Cupo1ra > 0]: C_Asig -> E_Cupo : + decrement(cupos_disponibles)
                    DB::table('cupos_gestion')
                        ->where('id', $cupo1ra->id)
                        ->decrement('cupos_disponibles');

                    $asignados++;
                } else {
                    // CU17 - Paso 7b [Loop, Cupo1ra = 0]: C_Asig -> E_Cupo : + where('carrera_id', segunda_opcion_id)
                    // CU17 - Paso 8b [Loop, Cupo1ra = 0]: E_Cupo --> C_Asig : + CupoDisponible2daOpcion
                    $cupo2da = DB::table('cupos_gestion')
                        ->where('gestion_id', $gestion->id)
                        ->where('carrera_id', $postulante->segunda_opcion_id)
                        ->first();

                    if ($cupo2da && $cupo2da->cupos_disponibles > 0) {
                        // CU17 - Paso 9b [Loop, Cupo2da > 0]: C_Asig -> E_Admi : + create(postulante, carrera_2da, via='2da Opcion')
                        Admision::create([
                            'postulante_id' => $postulante->id,
                            'carrera_id' => $postulante->segunda_opcion_id,
                            'via' => '2da Opcion',
                        ]);

                        // CU17 - Paso 10b [Loop, Cupo2da > 0]: C_Asig -> E_Cupo : + decrement(cupos_disponibles)
                        DB::table('cupos_gestion')
                            ->where('id', $cupo2da->id)
                            ->decrement('cupos_disponibles');

                        $reasignados2da++;
                    } else {
                        // CU17 - Paso 9c [Loop, Cupos Agotados]: C_Asig -> E_Post : + update(['estado' => 'Pendiente Reasignacion'])
                        $postulante->update(['estado' => 'Pendiente Reasignacion']);

                        // CU17 - Paso 10c [Loop, Cupos Agotados]: C_Asig -> E_Bit : + create(log_alerta)
                        BitacoraAcceso::create([
                            'user_id' => $coordinador->id,
                            'ip_address' => request()->ip(),
                            'action' => "ALERTA_CUPO_AGOTADO: Postulante ID {$postulante->id} sin cupo en opciones.",
                        ]);

                        // Crear notificación push en bd para el coordinador
                        \App\Models\ReportesIA\Notificacion::create([
                            'usuario_id' => $coordinador->id,
                            'tipo_evento' => 'Cupo Agotado',
                            'mensaje' => "El postulante {$postulante->nombres} {$postulante->apellidos} (CI: {$postulante->ci}) aprobó con {$postulante->promedio_general} pero no tiene cupo en sus opciones.",
                            'estado' => 'NO_LEIDA',
                        ]);

                        $pendientes++;
                    }
                }
            }
        });

        // CU17 - Paso 11: C_Asig --> B_Admi : + ConfirmarProcesamientoExito()
        return response()->json([
            'message' => 'Proceso de asignacion de carreras finalizado con exito.',
            'resumen' => [
                'aprobados_totales' => $aprobados->count(),
                'admitidos_1ra_opcion' => $asignados,
                'admitidos_2da_opcion' => $reasignados2da,
                'pendientes_reasignacion' => $pendientes,
            ],
        ]);
    }

    /**
     * CU22: Consultar Dashboard Estadístico en Tiempo Real
     *
     * Seq_CU22: Coordinador → IU_Dashboard → CTR_Reportes.getEstadisticas()
     *   → CE_Postulante.get() → DistribucionInscritos
     *   → CE_NotaFinal.get() → RendimientoYTasas
     *   → CE_CupoGestion.get() → LlenadoCupos
     *   → EnviarDatosEstadisticos()
     */
    public function getEstadisticas(Request $request): JsonResponse
    {
        // CU22 - Paso 2: B_Dash -> C_Rep : + getEstadisticas()
        $gestion = Gestion::activa()->first();
        if (!$gestion) {
            return response()->json(['message' => 'No hay gestión activa configurada.'], 422);
        }

        // CU22 - Paso 3: C_Rep -> E_Post : + get()
        // CU22 - Paso 4: E_Post --> C_Rep : + DistribucionInscritos
        // Contar únicamente estudiantes matriculados (excluyendo Preinscritos y Verificados sin pago)
        $estadosInscritos = ['Inscrito', 'En Evaluacion', 'Aprobado', 'Reprobado', 'Pendiente Reasignacion', 'Admitido'];
        $totalInscritos = Postulante::where('gestion_id', $gestion->id)
            ->whereIn('estado', $estadosInscritos)
            ->count();
        $inscritosPorSexo = Postulante::where('gestion_id', $gestion->id)
            ->whereIn('estado', $estadosInscritos)
            ->select('sexo', DB::raw('count(*) as total'))
            ->groupBy('sexo')
            ->get();

        // CU22 - Paso 5: C_Rep -> E_Nota : + get()
        // CU22 - Paso 6: E_Nota --> C_Rep : + RendimientoYTasas
        $aprobados = Postulante::where('gestion_id', $gestion->id)
            ->whereIn('estado', ['Aprobado', 'Admitido'])
            ->count();
        $reprobados = Postulante::where('gestion_id', $gestion->id)->where('estado', 'Reprobado')->count();
        $enEvaluacion = Postulante::where('gestion_id', $gestion->id)->where('estado', 'En Evaluacion')->count();
        $preinscritos = Postulante::where('gestion_id', $gestion->id)->where('estado', 'Preinscrito')->count();

        // CU22 - Paso 7: C_Rep -> E_Cupo : + get()
        // CU22 - Paso 8: E_Cupo --> C_Rep : + LlenadoCupos
        $cuposCarreras = DB::table('carreras')
            ->leftJoin('cupos_gestion', function ($join) use ($gestion) {
                $join->on('carreras.id', '=', 'cupos_gestion.carrera_id')
                     ->where('cupos_gestion.gestion_id', '=', $gestion->id);
            })
            ->select('carreras.id', 'carreras.nombre', 
                DB::raw('COALESCE(cupos_gestion.cupo_maximo, 0) as cupo_maximo'), 
                DB::raw('COALESCE(cupos_gestion.cupos_disponibles, 0) as cupos_disponibles')
            )
            ->get()
            ->map(function ($c) use ($gestion) {
                // Contar admitidos reales (aprobados) que ya tienen admisión en esta carrera y gestión
                $c->ocupados = DB::table('admisiones')
                    ->join('postulantes', 'admisiones.postulante_id', '=', 'postulantes.id')
                    ->where('admisiones.carrera_id', $c->id)
                    ->where('postulantes.gestion_id', $gestion->id)
                    ->count();
                $c->porcentaje_llenado = $c->cupo_maximo > 0 ? round(($c->ocupados / $c->cupo_maximo) * 100, 2) : 0;
                return $c;
            });

        // Ocupación de grupos
        $gruposOcupacion = Grupo::where('gestion_id', $gestion->id)
            ->with('aula')
            ->get()
            ->map(function ($g) {
                $cant = DB::table('asignaciones_grupo')->where('grupo_id', $g->id)->count();
                $capacidad = $g->aula?->capacidad ?: 70;
                return [
                    'id' => $g->id,
                    'numero' => $g->numero,
                    'turno' => $g->turno,
                    'estudiantes' => $cant,
                    'porcentaje' => $capacidad > 0 ? round(($cant / $capacidad) * 100, 2) : 0,
                ];
            });

        // Ranking de grupos por aprobados
        $rankingGrupos = DB::table('asignaciones_grupo')
            ->join('postulantes', 'asignaciones_grupo.postulante_id', '=', 'postulantes.id')
            ->join('grupos', 'asignaciones_grupo.grupo_id', '=', 'grupos.id')
            ->where('grupos.gestion_id', $gestion->id)
            ->select('grupos.numero', 'grupos.turno', 
                DB::raw("COUNT(CASE WHEN postulantes.estado IN ('Aprobado', 'Admitido') THEN 1 END) as aprobados"),
                DB::raw("COUNT(*) as total")
            )
            ->groupBy('grupos.id', 'grupos.numero', 'grupos.turno')
            ->get()
            ->map(function ($r) {
                $r->tasa_aprobacion = $r->total > 0 ? round(($r->aprobados / $r->total) * 100, 2) : 0;
                return $r;
            })
            ->sortByDesc('tasa_aprobacion')
            ->values();

        // Datos agregados consolidados
        $stats = [
            'total_inscritos' => $totalInscritos,
            'aprobados' => $aprobados,
            'reprobados' => $reprobados,
            'en_evaluacion' => $enEvaluacion,
            'preinscritos' => $preinscritos,
            'porcentaje_aprobacion' => $totalInscritos > 0 ? round((($aprobados) / $totalInscritos) * 100, 2) : 0,
            'sexo' => $inscritosPorSexo,
            'cupos' => $cuposCarreras,
            'grupos' => $gruposOcupacion,
            'ranking_grupos' => $rankingGrupos,
        ];

        // CU22 - Paso 9: C_Rep --> B_Dash : + EnviarDatosEstadisticos()
        return response()->json($stats);
    }

    /**
     * CU22: Consultar Dashboard Estadístico en Tiempo Real (Caso B: Postulante consulta sus Notas Individuales)
     *
     * Seq_CU22: Postulante → IU_Dashboard → CTR_Reportes.getNotasIndividuales(postulanteId)
     *   → CE_Postulante.find(postulanteId) → datosPostulante
     *   → CE_Examen.getExamenes(postulanteId) → notasExamenes
     *   → CE_NotaFinal.getNotasFinales(postulanteId) → promediosFinales
     *   → EnviarNotasIndividuales()
     */
    public function getNotasIndividuales(Request $request, $postulanteId = null): JsonResponse
    {
        // CU22 - Caso B - Paso 2: B_Dash -> C_Rep : + getNotasIndividuales(postulanteId)
        $user = $request->user();
        
        if ($user->role === 'Postulante') {
            $postulante = Postulante::where('user_id', $user->id)->first();
            if (!$postulante) {
                return response()->json(['message' => 'No se encontró el expediente del postulante.'], 404);
            }
            $postulanteId = $postulante->id;
        } else {
            if (!$postulanteId) {
                return response()->json(['message' => 'Se requiere especificar el ID del postulante.'], 400);
            }
            $postulante = Postulante::find($postulanteId);
            if (!$postulante) {
                return response()->json(['message' => 'Postulante no encontrado.'], 404);
            }
        }

        // Paso 3: C_Rep -> E_Post : + find(postulanteId)
        // Paso 5: C_Rep -> E_Exam : + getExamenes(postulanteId)
        // Paso 7: C_Rep -> E_Nota : + getNotasFinales(postulanteId)
        $postulante->load([
            'primeraOpcion',
            'segundaOpcion',
            'gestion',
            'asignacionGrupo.grupo',
            'examenes.materia',
            'notasFinales.materia',
            'admision.carrera'
        ]);

        // Paso 9: C_Rep --> B_Dash : + EnviarNotasIndividuales()
        return response()->json($postulante);
    }


    /**
     * CU19: Generar Reporte Estructurado
     *
     * Seq_CU19: Coordinador → IU_Reportes → CTR_Reportes.generarPDF()
     *   → CE_Admision.get() → DatosAdmision
     *   → CE_Postulante.get() → DatosPostulantes
     *   → FormatearPDF() → RetornarDocumento()
     */
    public function generarEstructurado(Request $request): JsonResponse
    {
        // CU19 - Paso 2: B_Int -> C_Ctrl : + generarPDF(request)
        $request->validate([
            'tipo' => 'required|in:inscritos,aprobados,reprobados,promedios,grupos_habilitados,estadisticas_materia,docentes_grupos,grupos_aprobados,admisiones',
        ]);

        // CU19 - Paso 3: C_Ctrl -> E_Admi : + get()
        // CU19 - Paso 4: E_Admi --> C_Ctrl : + DatosAdmision
        // CU19 - Paso 5: C_Ctrl -> E_Post : + get()
        // CU19 - Paso 6: E_Post --> C_Ctrl : + DatosPostulantes

        $tipo = $request->tipo;
        $gestion = Gestion::activa()->first();
        if (!$gestion) {
            return response()->json(['message' => 'No hay gestión activa configurada.'], 422);
        }

        $titulo = 'Reporte Oficial';
        $data = [];

        switch ($tipo) {
            case 'inscritos':
                $titulo = 'Lista General de Postulantes';
                $data = Postulante::where('gestion_id', $gestion->id)
                    ->with(['primeraOpcion', 'segundaOpcion'])
                    ->orderBy('apellidos')
                    ->get();
                break;

            case 'aprobados':
                $titulo = 'Postulantes Aprobados';
                $data = Postulante::where('gestion_id', $gestion->id)
                    ->where('estado', 'Aprobado')
                    ->with(['primeraOpcion', 'notasFinales.materia'])
                    ->get()
                    ->map(function ($p) {
                        $p->promedio_general = round(NotaFinal::where('postulante_id', $p->id)->avg('promedio') ?? 0.0, 2);
                        return $p;
                    })
                    ->sortByDesc('promedio_general')
                    ->values();
                break;

            case 'reprobados':
                $titulo = 'Postulantes Reprobados';
                $data = Postulante::where('gestion_id', $gestion->id)
                    ->where('estado', 'Reprobado')
                    ->with(['primeraOpcion', 'notasFinales.materia'])
                    ->get()
                    ->map(function ($p) {
                        $p->promedio_general = round(NotaFinal::where('postulante_id', $p->id)->avg('promedio') ?? 0.0, 2);
                        return $p;
                    })
                    ->sortByDesc('promedio_general')
                    ->values();
                break;

            case 'promedios':
                $titulo = 'Promedios Generales por Postulante';
                $data = Postulante::where('gestion_id', $gestion->id)
                    ->whereIn('estado', ['Aprobado', 'Reprobado', 'En Evaluacion'])
                    ->get()
                    ->map(function ($p) {
                        $promedio = NotaFinal::where('postulante_id', $p->id)->avg('promedio') ?? 0.0;
                        return [
                            'ci' => $p->ci,
                            'nombres' => $p->nombres,
                            'apellidos' => $p->apellidos,
                            'estado' => $p->estado,
                            'promedio_general' => round($promedio, 2),
                        ];
                    })
                    ->sortByDesc('promedio_general')
                    ->values();
                break;

            case 'grupos_habilitados':
                $titulo = 'Cantidad de Grupos Habilitados';
                $data = Grupo::where('gestion_id', $gestion->id)
                    ->with('aula')
                    ->get()
                    ->map(function ($g) {
                        $cant = DB::table('asignaciones_grupo')->where('grupo_id', $g->id)->count();
                        return [
                            'id' => $g->id,
                            'numero' => $g->numero,
                            'turno' => $g->turno,
                            'aula' => $g->aula->nombre,
                            'capacidad' => $g->aula->capacidad,
                            'estudiantes_inscritos' => $cant,
                        ];
                    });
                break;

            case 'estadisticas_materia':
                $titulo = 'Estadísticas Académicas por Materia';
                $data = DB::table('materias')
                    ->leftJoin('notas_finales', 'materias.id', '=', 'notas_finales.materia_id')
                    ->leftJoin('postulantes', 'notas_finales.postulante_id', '=', 'postulantes.id')
                    ->where('postulantes.gestion_id', $gestion->id)
                    ->select('materias.nombre', 
                        DB::raw('ROUND(AVG(notas_finales.promedio), 2) as promedio_nota'),
                        DB::raw('MAX(notas_finales.promedio) as nota_maxima'),
                        DB::raw('MIN(notas_finales.promedio) as nota_minima'),
                        DB::raw("COUNT(CASE WHEN notas_finales.estado = 'APROBADO' THEN 1 END) as aprobados"),
                        DB::raw('COUNT(*) as total')
                    )
                    ->groupBy('materias.id', 'materias.nombre')
                    ->get()
                    ->map(function ($m) {
                        $m->porcentaje_aprobacion = $m->total > 0 ? round(($m->aprobados / $m->total) * 100, 2) : 0;
                        return $m;
                    });
                break;

            case 'docentes_grupos':
                $titulo = 'Distribución de Docentes por Grupos';
                $data = DB::table('asignaciones_docente')
                    ->join('docentes', 'asignaciones_docente.docente_id', '=', 'docentes.id')
                    ->join('grupos', 'asignaciones_docente.grupo_id', '=', 'grupos.id')
                    ->join('materias', 'asignaciones_docente.materia_id', '=', 'materias.id')
                    ->where('grupos.gestion_id', $gestion->id)
                    ->select('docentes.nombres', 'docentes.apellidos', 'docentes.especialidad', 'grupos.numero as grupo_numero', 'grupos.turno', 'materias.nombre as materia_nombre')
                    ->orderBy('docentes.apellidos')
                    ->get();
                break;

            case 'grupos_aprobados':
                $titulo = 'Grupos Ordenados por Mayor Cantidad de Aprobados';
                $data = DB::table('asignaciones_grupo')
                    ->join('postulantes', 'asignaciones_grupo.postulante_id', '=', 'postulantes.id')
                    ->join('grupos', 'asignaciones_grupo.grupo_id', '=', 'grupos.id')
                    ->where('postulantes.gestion_id', $gestion->id)
                    ->select('grupos.numero', 'grupos.turno',
                        DB::raw("COUNT(CASE WHEN postulantes.estado = 'Aprobado' THEN 1 END) as cantidad_aprobados"),
                        DB::raw('COUNT(*) as total_estudiantes')
                    )
                    ->groupBy('grupos.id', 'grupos.numero', 'grupos.turno')
                    ->orderByDesc('cantidad_aprobados')
                    ->get();
                break;

            case 'admisiones':
                $titulo = 'Lista Definitiva de Admitidos a Carrera';
                $data = Postulante::where('gestion_id', $gestion->id)
                    ->whereHas('admision')
                    ->with(['primeraOpcion', 'admision.carrera'])
                    ->orderBy('apellidos')
                    ->get();
                break;
        }

        // CU19 - Paso 7: C_Ctrl -> C_Ctrl : + FormatearPDF()
        // CU19 - Paso 8: C_Ctrl --> B_Int : + RetornarDocumento()
        return response()->json([
            'titulo' => $titulo . ' - Gestión ' . $gestion->codigo,
            'fecha' => now()->format('Y-m-d H:i:s'),
            'tipo' => $tipo,
            'data' => $data,
        ]);
    }

    /**
     * CU20: Generar Reporte Dinámico
     *
     * Seq_CU20: Coordinador → IU_ReportesDinamicos → CTR_Reportes.generarDinamico()
     *   → CE_DataWarehouse.ConsultarBaseDeDatosBI(parametros) → DatosBI
     *   → RetornarTablaResultados()
     */
    public function generarDinamico(Request $request): JsonResponse
    {
        // CU20 - Paso 2: B_Int -> C_Ctrl : + generarDinamico(request)
        $query = Postulante::query()->with(['primeraOpcion', 'segundaOpcion', 'gestion', 'admision.carrera']);

        if ($request->filled('estado')) {
            $query->where('estado', $request->estado);
        }
        if ($request->filled('carrera_id')) {
            $cId = $request->carrera_id;
            $query->where(function ($q) use ($cId) {
                $q->where('primera_opcion_id', $cId)
                  ->orWhere('segunda_opcion_id', $cId);
            });
        }
        if ($request->filled('turno')) {
            $query->where('turno_preferencia', $request->turno);
        }
        if ($request->filled('recurrente')) {
            $query->where('recurrente', $request->boolean('recurrente'));
        }

        // CU20 - Paso 3: C_Ctrl -> E_Data : + ConsultarBaseDeDatosBI(parametros)
        // CU20 - Paso 4: E_Data --> C_Ctrl : + DatosBI
        $postulantes = $query->get()->map(function ($p) {
            $p->promedio_general = round(NotaFinal::where('postulante_id', $p->id)->avg('promedio') ?? 0.0, 2);
            return $p;
        });

        // CU20 - Paso 5: C_Ctrl --> B_Int : + RetornarTablaResultados()
        return response()->json($postulantes);
    }

    /**
     * CU21: Reporte por Comando de Voz (IA)
     *
     * Seq_CU21: Coordinador → IU_Voz → CTR_ReportesIA.procesarVoz()
     *   → API_ServicioCognitivoIA.TraducirIntencionASQL() → ConsultaEstructurada
     *   → CE_DataWarehouse.EjecutarConsultaGenerada() → ResultadosSQL
     *   → RetornarResultados()
     */
    public function procesarVoz(Request $request): JsonResponse
    {
        // CU21 - Paso 2: B_Int -> C_Ctrl : + procesarVoz(request)
        $request->validate([
            'texto' => 'required|string',
        ]);

        $texto = $this->normalizarTextoVoz($request->texto);
        $filtros = $this->extraerFiltrosVoz($texto);

        if (!$this->tieneFiltrosActivos($filtros)) {
            return response()->json([
                'filtros_extraidos' => $filtros,
                'resultados' => [],
                'mensaje' => 'No se reconoció ningún filtro válido. Ejemplos: "aprobados de sistemas", "preinscritos en la noche", "reprobados de informática en la tarde".',
                'transcripcion_normalizada' => $texto,
            ]);
        }

        // CU21 - Paso 5: C_Ctrl -> E_Data : + EjecutarConsultaGenerada()
        // CU21 - Paso 6: E_Data --> C_Ctrl : + ResultadosSQL
        $resultados = $this->buildVoiceQuery($filtros);

        // CU21 - Paso 7: C_Ctrl --> B_Int : + RetornarResultados()
        return response()->json([
            'filtros_extraidos' => $filtros,
            'resultados' => $resultados,
            'mensaje' => null,
            'transcripcion_normalizada' => $texto,
        ]);
    }

    /**
     * Analizador local cognitivo basado en expresiones regulares
     */
    private function normalizarTextoVoz(string $texto): string
    {
        $texto = mb_strtolower(trim($texto), 'UTF-8');
        $texto = str_replace(
            ['á', 'é', 'í', 'ó', 'ú', 'ü', 'ñ'],
            ['a', 'e', 'i', 'o', 'u', 'u', 'n'],
            $texto
        );

        return preg_replace('/\s+/', ' ', $texto) ?? $texto;
    }

    private function extraerFiltrosVoz(string $texto): array
    {
        $filtros = $this->parsearVozRegex($texto);
        $apiKey = env('OPENAI_API_KEY');

        if (empty($apiKey)) {
            return $this->normalizarFiltrosVoz($filtros);
        }

        try {
            $response = Http::timeout(12)->withToken($apiKey)->post('https://api.openai.com/v1/chat/completions', [
                'model' => 'gpt-3.5-turbo',
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'Eres un procesador de comandos de voz para el CUP de la FICCT. Extrae filtros del texto y responde SOLO JSON válido con claves: estado, carrera, turno. Valores permitidos — estado: Preinscrito, Verificado, Inscrito, En Evaluacion, Aprobado, Reprobado, Admitido, Pendiente Reasignacion; carrera: Informatica, Sistemas, Redes, Robotica; turno: Manana, Tarde, Noche. Usa null si no se menciona. Ejemplo: "aprobados de sistemas en la manana" -> {"estado":"Aprobado","carrera":"Sistemas","turno":"Manana"}',
                    ],
                    ['role' => 'user', 'content' => $texto],
                ],
                'temperature' => 0.0,
            ]);

            if ($response->successful()) {
                $content = $response->json('choices.0.message.content', '');
                if (preg_match('/\{.*\}/s', $content, $matches)) {
                    $json = json_decode($matches[0], true);
                    if (is_array($json)) {
                        foreach (['estado', 'carrera', 'turno'] as $clave) {
                            if (!empty($json[$clave]) && empty($filtros[$clave])) {
                                $filtros[$clave] = $json[$clave];
                            }
                        }
                    }
                }
            }
        } catch (\Exception $e) {
            // Mantener filtros locales ya detectados
        }

        return $this->normalizarFiltrosVoz($filtros);
    }

    private function normalizarFiltrosVoz(array $filtros): array
    {
        $estados = [
            'preinscrito' => 'Preinscrito',
            'verificado' => 'Verificado',
            'inscrito' => 'Inscrito',
            'en evaluacion' => 'En Evaluacion',
            'aprobado' => 'Aprobado',
            'reprobado' => 'Reprobado',
            'admitido' => 'Admitido',
            'pendiente reasignacion' => 'Pendiente Reasignacion',
        ];

        $carreras = [
            'informatica' => 'Informatica',
            'sistemas' => 'Sistemas',
            'redes' => 'Redes',
            'robotica' => 'Robotica',
        ];

        $turnos = [
            'manana' => 'Manana',
            'tarde' => 'Tarde',
            'noche' => 'Noche',
        ];

        $estado = $filtros['estado'] ?? null;
        if ($estado) {
            $key = $this->normalizarTextoVoz($estado);
            $filtros['estado'] = $estados[$key] ?? $estado;
        }

        $carrera = $filtros['carrera'] ?? null;
        if ($carrera) {
            $key = $this->normalizarTextoVoz($carrera);
            $filtros['carrera'] = $carreras[$key] ?? $carrera;
        }

        $turno = $filtros['turno'] ?? null;
        if ($turno) {
            $key = $this->normalizarTextoVoz($turno);
            $filtros['turno'] = $turnos[$key] ?? $turno;
        }

        return [
            'estado' => $filtros['estado'] ?? null,
            'carrera' => $filtros['carrera'] ?? null,
            'turno' => $filtros['turno'] ?? null,
        ];
    }

    private function tieneFiltrosActivos(array $filtros): bool
    {
        return !empty($filtros['estado']) || !empty($filtros['carrera']) || !empty($filtros['turno']);
    }

    private function parsearVozRegex(string $texto): array
    {
        $filtros = [
            'estado' => null,
            'carrera' => null,
            'turno' => null,
        ];

        // Estado (orden: términos más específicos primero)
        if (preg_match('/pre\s*inscrit/', $texto)) {
            $filtros['estado'] = 'Preinscrito';
        } elseif (preg_match('/pendiente|reasignacion/', $texto)) {
            $filtros['estado'] = 'Pendiente Reasignacion';
        } elseif (preg_match('/en\s+evaluacion|evaluacion/', $texto)) {
            $filtros['estado'] = 'En Evaluacion';
        } elseif (preg_match('/\badmitid/', $texto)) {
            $filtros['estado'] = 'Admitido';
        } elseif (preg_match('/\baprobados?|\baprobado\b/', $texto)) {
            $filtros['estado'] = 'Aprobado';
        } elseif (preg_match('/\breprobados?|\breprobado\b/', $texto)) {
            $filtros['estado'] = 'Reprobado';
        } elseif (preg_match('/\bverificados?|\bverificado\b/', $texto)) {
            $filtros['estado'] = 'Verificado';
        } elseif (preg_match('/\binscritos?|\binscrito\b/', $texto)) {
            $filtros['estado'] = 'Inscrito';
        }

        // Carrera
        if (preg_match('/sistemas?/', $texto)) {
            $filtros['carrera'] = 'Sistemas';
        } elseif (preg_match('/informatica|informatic/', $texto)) {
            $filtros['carrera'] = 'Informatica';
        } elseif (preg_match('/redes|telecom/', $texto)) {
            $filtros['carrera'] = 'Redes';
        } elseif (preg_match('/robotica|robot/', $texto)) {
            $filtros['carrera'] = 'Robotica';
        }

        // Turno
        if (preg_match('/\bmanana\b|\bmañana\b/', $texto)) {
            $filtros['turno'] = 'Manana';
        } elseif (preg_match('/\btarde\b/', $texto)) {
            $filtros['turno'] = 'Tarde';
        } elseif (preg_match('/\bnoche\b/', $texto)) {
            $filtros['turno'] = 'Noche';
        }

        return $filtros;
    }

    /**
     * CU21 — Exportar resultados de voz a PDF o Excel
     */
    public function exportarReporteVoz(Request $request)
    {
        $request->validate([
            'filtros' => 'required|array',
            'formato' => 'required|in:pdf,excel',
        ]);

        $filtros = $this->normalizarFiltrosVoz(array_merge(
            ['estado' => null, 'carrera' => null, 'turno' => null],
            $request->filtros
        ));

        if (!$this->tieneFiltrosActivos($filtros)) {
            return response()->json([
                'message' => 'Debe ejecutar primero un comando de voz con filtros reconocidos antes de exportar.',
            ], 422);
        }

        $resultados = $this->buildVoiceQuery($filtros);

        if ($request->formato === 'pdf') {
            $pdf = Pdf::loadView('reportes.reporte_voz_pdf', [
                'titulo' => 'Reporte por Comando de Voz (IA)',
                'fecha' => now()->format('Y-m-d H:i:s'),
                'filtros' => $filtros,
                'resultados' => $resultados,
            ])->setPaper('letter', 'landscape');

            return $pdf->download('reporte_voz_' . time() . '.pdf');
        }

        // Excel
        return Excel::download(new ReporteVozExport($resultados), 'reporte_voz_' . time() . '.xlsx');
    }

    /**
     * Construir la consulta de voz reutilizable desde filtros extraídos por IA
     */
    private function buildVoiceQuery(array $filtros)
    {
        $gestion = Gestion::activa()->first();
        if (!$gestion) {
            return collect();
        }

        $query = Postulante::query()
            ->where('gestion_id', $gestion->id)
            ->with(['primeraOpcion', 'segundaOpcion', 'gestion', 'admision.carrera']);

        if (!empty($filtros['estado'])) {
            $estado = $filtros['estado'];
            if ($estado === 'Aprobado') {
                $query->whereIn('estado', ['Aprobado', 'Admitido']);
            } else {
                $query->where('estado', $estado);
            }
        }
        if (!empty($filtros['turno'])) {
            $query->where('turno_preferencia', $filtros['turno']);
        }
        if (!empty($filtros['carrera'])) {
            $cName = $filtros['carrera'];
            $carrera = Carrera::where('nombre', 'ilike', "%{$cName}%")->first();
            if ($carrera) {
                $query->where(function ($q) use ($carrera) {
                    $q->where('primera_opcion_id', $carrera->id)
                      ->orWhere('segunda_opcion_id', $carrera->id);
                });
            }
        }

        return $query->get()->map(function ($p) {
            $p->promedio_general = round(NotaFinal::where('postulante_id', $p->id)->avg('promedio') ?? 0.0, 2);
            return $p;
        });
    }

    private function calcularCuposOcupados($gestionId, $carreraId): int
    {
        return Admision::where('carrera_id', $carreraId)
            ->whereHas('postulante', function ($q) use ($gestionId) {
                $q->where('gestion_id', $gestionId);
            })
            ->count();
    }

    private function desactivarPostulantesDeGestion(int $gestionId): void
    {
        $userIds = Postulante::where('gestion_id', $gestionId)
            ->whereNotNull('user_id')
            ->pluck('user_id');

        if ($userIds->isNotEmpty()) {
            User::whereIn('id', $userIds)->update(['active' => false]);
        }
    }
}
