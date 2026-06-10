<?php

namespace App\Models\PlanificacionAcademica;

use Illuminate\Database\Eloquent\Model;

/**
 * CE_Especialidad (CU24/CU25).
 * Especialidad declarada por un aspirante a docente.
 */
class Especialidad extends Model
{
    protected $table = 'especialidades';
    public $timestamps = false;

    protected $fillable = ['docente_id', 'nombre', 'area_id'];

    public function docente()
    {
        return $this->belongsTo(Docente::class);
    }

    public function area()
    {
        return $this->belongsTo(Materia::class, 'area_id');
    }
}
