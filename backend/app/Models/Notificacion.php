<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notificacion extends Model
{
    protected $table = 'notificaciones';
    
    public $timestamps = false;

    protected $fillable = [
        'usuario_id',
        'tipo_evento',
        'mensaje',
        'estado',
        'fecha_generacion',
        'fecha_lectura',
    ];

    protected $casts = [
        'fecha_generacion' => 'datetime',
        'fecha_lectura' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }
}
