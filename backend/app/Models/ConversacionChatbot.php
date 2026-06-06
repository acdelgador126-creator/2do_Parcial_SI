<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ConversacionChatbot extends Model
{
    protected $table = 'conversaciones_chatbot';

    public $timestamps = false;

    protected $fillable = [
        'postulante_id',
        'pregunta',
        'respuesta',
        'resuelta',
        'fecha',
    ];

    protected $casts = [
        'resuelta' => 'boolean',
        'fecha' => 'datetime',
    ];

    public function postulante()
    {
        return $this->belongsTo(Postulante::class);
    }
}
