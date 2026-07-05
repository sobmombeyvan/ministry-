<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\Ticket;
use Illuminate\Http\Request;

class TicketController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        $query = Ticket::with(['user', 'tasks.technician'])->latest();

        if ($user->role === 'staff') {
            $query->where('user_id', $user->id);
        } elseif ($user->role === 'technician') {
            $ticketIds = Task::where('technician_id', $user->id)->pluck('ticket_id');
            $query->whereIn('id', $ticketIds);
        }

        return response()->json(['tickets' => $query->get()]);
    }

    public function show($id)
    {
        $ticket = Ticket::with(['user', 'tasks.technician'])->find($id);

        if (!$ticket) {
            return response()->json(['message' => 'Ticket not found'], 404);
        }

        if (!$this->canAccessTicket($ticket)) {
            return response()->json(['message' => 'Access denied'], 403);
        }

        return response()->json(['ticket' => $ticket]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string',
            'description' => 'required|string',
            'category' => 'required|in:hardware,network,software',
        ]);

        $ticket = Ticket::create([
            'title' => $request->title,
            'description' => $request->description,
            'category' => $request->category,
            'user_id' => auth()->id(),
            'status' => 'open',
        ]);

        return response()->json([
            'message' => 'Ticket created successfully',
            'ticket' => $ticket,
        ], 201);
    }

    private function canAccessTicket(Ticket $ticket): bool
    {
        $user = auth()->user();

        if ($user->role === 'admin') {
            return true;
        }

        if ($ticket->user_id === $user->id) {
            return true;
        }

        return Task::where('ticket_id', $ticket->id)
            ->where('technician_id', $user->id)
            ->exists();
    }
}
