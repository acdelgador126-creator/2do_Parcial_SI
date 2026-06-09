<?php

namespace App\Models\PlanificacionAcademica;

use Illuminate\Database\Eloquent\Model;
use App\Models\RegistroPostulantes\Postulante;

class AsignacionGrupo extends Model
{
    public $timestamps = false;
    protected $table = 'asignaciones_grupo';
    protected $fillable = ['postulante_id', 'grupo_id'];

    public function postulante()
    {
        return $this->belongsTo(Postulante::class);
    }

    public function grupo()
    {
        return $this->belongsTo(Grupo::class);
    }
}
