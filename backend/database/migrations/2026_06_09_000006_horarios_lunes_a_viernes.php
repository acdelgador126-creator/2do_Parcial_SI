<?php

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

        app(HorarioGrupoMateriaService::class)->regenerarTodosLosGrupos();
    }

    public function down(): void
    {
        //
    }
};
