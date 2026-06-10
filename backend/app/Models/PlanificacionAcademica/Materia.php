<?php

namespace App\Models\PlanificacionAcademica;

use Illuminate\Database\Eloquent\Model;

class Materia extends Model
{
    public $timestamps = false;
    protected $fillable = ['nombre', 'codigo'];

    public function horarios()
    {
        return $this->hasMany(HorarioGrupoMateria::class);
    }
}
