<?php

namespace Database\Seeders;

use App\Services\PlanificacionAcademica\HorarioGrupoMateriaService;
use Illuminate\Database\Seeder;

class HorariosGrupoMateriaSeeder extends Seeder
{
    public function run(): void
    {
        $service = app(HorarioGrupoMateriaService::class);
        $grupos = $service->regenerarTodosLosGrupos();

        $this->command?->info("Horarios institucionales regenerados para {$grupos} grupos (variantes por numero de grupo).");
    }
}
