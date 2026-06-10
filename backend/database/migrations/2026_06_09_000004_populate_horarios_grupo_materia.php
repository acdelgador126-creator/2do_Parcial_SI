<?php

use App\Models\PlanificacionAcademica\Grupo;
use App\Services\PlanificacionAcademica\HorarioGrupoMateriaService;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('horarios_grupo_materia') || ! Schema::hasTable('grupos')) {
            return;
        }

        $service = app(HorarioGrupoMateriaService::class);

        Grupo::query()->orderBy('id')->each(function (Grupo $grupo) use ($service) {
            $service->generarHorariosPorDefecto($grupo);
        });
    }

    public function down(): void
    {
        // Los horarios institucionales no se revierten al hacer rollback de esta migración.
    }
};
