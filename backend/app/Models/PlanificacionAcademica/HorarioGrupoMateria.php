<?php

namespace App\Models\PlanificacionAcademica;

use Illuminate\Database\Eloquent\Model;

class HorarioGrupoMateria extends Model
{
    public $timestamps = false;

    protected $table = 'horarios_grupo_materia';

    protected $fillable = [
        'grupo_id',
        'materia_id',
        'dia_semana',
        'hora_inicio',
        'hora_fin',
    ];

    public const DIAS = [
        1 => 'Lunes',
        2 => 'Martes',
        3 => 'Miercoles',
        4 => 'Jueves',
        5 => 'Viernes',
        6 => 'Sabado',
        7 => 'Domingo',
    ];

    public function grupo()
    {
        return $this->belongsTo(Grupo::class);
    }

    public function materia()
    {
        return $this->belongsTo(Materia::class);
    }

    public function getDiaNombreAttribute(): string
    {
        return self::DIAS[$this->dia_semana] ?? (string) $this->dia_semana;
    }
}
