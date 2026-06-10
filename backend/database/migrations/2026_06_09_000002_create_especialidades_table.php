<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * CU24 — Entidad CE_Especialidad.
 * Almacena la(s) especialidad(es) declarada(s) por el aspirante a docente,
 * vinculadas al docente y, opcionalmente, al area/materia correspondiente.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('especialidades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('docente_id')->constrained('docentes')->cascadeOnDelete();
            $table->string('nombre', 150);
            $table->foreignId('area_id')->nullable()->constrained('materias')->nullOnDelete();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('especialidades');
    }
};
