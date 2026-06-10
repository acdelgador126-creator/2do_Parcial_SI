<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('horarios_grupo_materia', function (Blueprint $table) {
            $table->id();
            $table->foreignId('grupo_id')->constrained('grupos')->cascadeOnDelete();
            $table->foreignId('materia_id')->constrained('materias')->cascadeOnDelete();
            $table->unsignedTinyInteger('dia_semana'); // 1=Lunes ... 7=Domingo
            $table->time('hora_inicio');
            $table->time('hora_fin');
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['grupo_id', 'materia_id', 'dia_semana'], 'horario_grupo_materia_dia_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('horarios_grupo_materia');
    }
};
