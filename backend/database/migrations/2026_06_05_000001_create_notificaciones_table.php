<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notificaciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('usuario_id')->constrained('users')->onDelete('cascade');
            $table->string('tipo_evento', 50);
            $table->text('mensaje');
            $table->string('estado', 15)->default('NO_LEIDA');
            $table->timestamp('fecha_generacion')->useCurrent();
            $table->timestamp('fecha_lectura')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notificaciones');
    }
};
