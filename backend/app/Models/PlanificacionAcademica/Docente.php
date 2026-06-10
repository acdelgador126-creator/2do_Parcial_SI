<?php

namespace App\Models\PlanificacionAcademica;

use Illuminate\Database\Eloquent\Model;
use App\Models\Autenticacion\User;

class Docente extends Model
{
    public $timestamps = false;
    protected $fillable = [
        'ci', 'nombres', 'apellidos', 'especialidad', 'grado_academico', 'correo', 'user_id',
        'estado', 'telefono', 'fecha_nacimiento', 'area_id',
        'hoja_vida_path', 'respaldos_path', 'motivo_rechazo',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function asignaciones()
    {
        return $this->hasMany(AsignacionDocente::class);
    }

    // CU24/CU25: area declarada (materia) y especialidades del aspirante
    public function area()
    {
        return $this->belongsTo(Materia::class, 'area_id');
    }

    public function especialidades()
    {
        return $this->hasMany(Especialidad::class);
    }

    public function cargaActual(): int
    {
        return $this->asignaciones()->count();
    }

    public function tieneCargaDisponible(): bool
    {
        return $this->cargaActual() < 4;
    }
}
