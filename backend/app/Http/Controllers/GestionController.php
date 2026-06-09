<?php

namespace App\Http\Controllers;

use App\Models\Gestion;
use App\Models\Postulante;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GestionController extends Controller
{
    /**
     * Obtener todas las gestiones
     */
    public function index(): JsonResponse
    {
        $gestiones = Gestion::orderByDesc('fecha_inicio')->get();
        return response()->json($gestiones);
    }

    /**
     * Crear una nueva gestión
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'codigo' => 'required|string|max:10|unique:gestiones',
            'fecha_inicio' => 'required|date',
            'fecha_fin' => 'required|date|after:fecha_inicio',
        ]);

        $gestion = Gestion::create([
            'codigo' => $validated['codigo'],
            'fecha_inicio' => $validated['fecha_inicio'],
            'fecha_fin' => $validated['fecha_fin'],
            'activa' => false,
        ]);

        return response()->json([
            'message' => 'Gestión creada exitosamente.',
            'gestion' => $gestion
        ], 201);
    }

    /**
     * Activar una gestión (y desactivar las demás)
     */
    public function activar(Gestion $gestion): JsonResponse
    {
        DB::transaction(function () use ($gestion) {
            Gestion::query()->update(['activa' => false]);
            $gestion->update(['activa' => true]);
        });

        return response()->json([
            'message' => "La gestión {$gestion->codigo} ahora es la gestión activa.",
            'gestion' => $gestion
        ]);
    }

    /**
     * Desactivar/Cerrar una gestión (y desactivar los usuarios postulantes)
     */
    public function desactivar(Gestion $gestion): JsonResponse
    {
        DB::transaction(function () use ($gestion) {
            $gestion->update(['activa' => false]);
            $userIds = Postulante::where('gestion_id', $gestion->id)
                ->whereNotNull('user_id')
                ->pluck('user_id');
            if ($userIds->isNotEmpty()) {
                \App\Models\User::whereIn('id', $userIds)->update(['active' => false]);
            }
        });

        return response()->json([
            'message' => "La gestión {$gestion->codigo} ha sido desactivada/cerrada. Las cuentas de postulantes han sido desactivadas.",
            'gestion' => $gestion
        ]);
    }
}
