<?php

namespace App\Models\Evaluacion;

use Illuminate\Database\Eloquent\Model;
use App\Models\Autenticacion\User;

class AuditoriaNota extends Model
{
    protected $table = 'auditoria_notas';

    public $timestamps = false;

    protected $fillable = [
        'examen_id',
        'usuario_modificador_id',
        'nota_anterior',
        'nota_nueva',
        'motivo',
        'fecha_modificacion',
    ];

    protected $casts = [
        'nota_anterior' => 'decimal:2',
        'nota_nueva' => 'decimal:2',
        'fecha_modificacion' => 'datetime',
    ];

    public function examen()
    {
        return $this->belongsTo(Examen::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'usuario_modificador_id');
    }
}
