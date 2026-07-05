<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
class Task extends Model
{
    use HasFactory,SoftDeletes;

     protected $fillable = [
        'ticket_id',
        'description',
        'priority',
        'status',
        'technician_id',
        'start_date',
        'end_date'
    ];

    public function ticket()
    {
        return $this->belongsTo(Ticket::class);
    }

    public function technician()
    {
        return $this->belongsTo(User::class, 'technician_id');
    }
}
