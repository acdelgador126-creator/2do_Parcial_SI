<?php

namespace App\Models\PlanificacionAcademica;

use Illuminate\Database\Eloquent\Model;

class Aula extends Model
{
    public $timestamps = false;
    protected $fillable = ['nombre', 'capacidad', 'ubicacion'];
}
