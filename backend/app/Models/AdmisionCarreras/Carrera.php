<?php

namespace App\Models\AdmisionCarreras;

use Illuminate\Database\Eloquent\Model;

class Carrera extends Model
{
    public $timestamps = false;
    protected $fillable = ['nombre', 'codigo'];
}
