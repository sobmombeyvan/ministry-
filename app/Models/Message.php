<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
class Message extends Model
{
    use HasFactory;

      protected $fillable = [
        'ticket_id',
        'sender_id',
        'message'
    ];

    public function user()
{
    return $this->belongsTo(\App\Models\User::class, 'sender_id');
}

public function ticket()
{
    return $this->belongsTo(\App\Models\Ticket::class);
}
}
