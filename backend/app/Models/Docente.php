<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Docente extends Model
{
    public $timestamps = false;
    protected $fillable = ['ci', 'nombres', 'apellidos', 'especialidad', 'grado_academico', 'correo', 'user_id'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function asignaciones()
    {
        return $this->hasMany(AsignacionDocente::class);
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
