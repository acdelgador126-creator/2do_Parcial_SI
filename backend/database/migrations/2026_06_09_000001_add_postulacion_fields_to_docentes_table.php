<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * CU24/CU25 — Postulacion de Docentes.
 * Amplia la tabla docentes para soportar el flujo de postulacion publica
 * (CU24) y su posterior revision/aceptacion por Administrador o Coordinador
 * (CU25): estado del expediente, area declarada, datos de contacto,
 * documentos de respaldo y motivo de rechazo.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('docentes', function (Blueprint $table) {
            // Los docentes ya existentes (registro directo CU12) quedan como 'Aceptado';
            // las postulaciones publicas (CU24) se crearan como 'Pendiente de Revision'.
            if (!Schema::hasColumn('docentes', 'estado')) {
                $table->string('estado', 30)->default('Aceptado')->after('correo');
            }
            if (!Schema::hasColumn('docentes', 'telefono')) {
                $table->string('telefono', 30)->nullable()->after('correo');
            }
            if (!Schema::hasColumn('docentes', 'fecha_nacimiento')) {
                $table->date('fecha_nacimiento')->nullable()->after('telefono');
            }
            if (!Schema::hasColumn('docentes', 'area_id')) {
                $table->foreignId('area_id')->nullable()->after('especialidad')
                    ->constrained('materias')->nullOnDelete();
            }
            if (!Schema::hasColumn('docentes', 'hoja_vida_path')) {
                $table->string('hoja_vida_path', 255)->nullable()->after('estado');
            }
            if (!Schema::hasColumn('docentes', 'respaldos_path')) {
                $table->string('respaldos_path', 255)->nullable()->after('hoja_vida_path');
            }
            if (!Schema::hasColumn('docentes', 'motivo_rechazo')) {
                $table->text('motivo_rechazo')->nullable()->after('respaldos_path');
            }
        });
    }

    public function down(): void
    {
        Schema::table('docentes', function (Blueprint $table) {
            if (Schema::hasColumn('docentes', 'area_id')) {
                $table->dropConstrainedForeignId('area_id');
            }
            foreach (['estado', 'telefono', 'fecha_nacimiento', 'hoja_vida_path', 'respaldos_path', 'motivo_rechazo'] as $col) {
                if (Schema::hasColumn('docentes', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
