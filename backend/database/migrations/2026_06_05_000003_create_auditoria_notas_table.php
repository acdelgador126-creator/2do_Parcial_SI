<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('auditoria_notas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('examen_id')->constrained('examenes')->onDelete('cascade');
            $table->foreignId('usuario_modificador_id')->constrained('users')->onDelete('cascade');
            $table->decimal('nota_anterior', 5, 2)->nullable();
            $table->decimal('nota_nueva', 5, 2);
            $table->text('motivo')->nullable();
            $table->timestamp('fecha_modificacion')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('auditoria_notas');
    }
};
