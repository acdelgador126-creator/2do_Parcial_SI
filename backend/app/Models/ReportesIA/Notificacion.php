<?php

namespace App\Models\ReportesIA;

use Illuminate\Database\Eloquent\Model;
use App\Models\Autenticacion\User;

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
