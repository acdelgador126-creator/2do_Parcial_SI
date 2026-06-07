<?php

namespace App\Http\Controllers;

use App\Models\Notificacion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificacionController extends Controller
{
    /**
     * Listar notificaciones del usuario autenticado
     */
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $notificaciones = Notificacion::where('usuario_id', $userId)
            ->orderBy('fecha_generacion', 'desc')
            ->get();

        return response()->json($notificaciones);
    }

    /**
     * Marcar notificación como leída
     */
    public function marcarLeida(Request $request, $id): JsonResponse
    {
        $userId = $request->user()->id;

        $notificacion = Notificacion::where('id', $id)
            ->where('usuario_id', $userId)
            ->first();

        if (!$notificacion) {
            return response()->json(['message' => 'Notificación no encontrada.'], 404);
        }

        $notificacion->update([
            'estado' => 'LEIDA',
            'fecha_lectura' => now(),
        ]);

        return response()->json([
            'message' => 'Notificación marcada como leída.',
            'notificacion' => $notificacion,
        ]);
    }
}
