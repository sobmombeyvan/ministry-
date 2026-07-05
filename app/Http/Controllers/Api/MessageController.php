<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Message;
use App\Models\Ticket;
use App\Models\Task;

class MessageController extends Controller
{
    // SEND MESSAGE
    public function send(Request $request)
    {
        // 1. Validate
        $request->validate([
            'ticket_id' => 'required|exists:tickets,id',
            'message' => 'required|string'
        ]);

        // 2. Get ticket
        $ticket = Ticket::find($request->ticket_id);

        if (!$ticket) {
            return response()->json([
                'message' => 'Ticket not found'
            ], 404);
        }

        // 3. SECURITY CHECK (VERY IMPORTANT)
        $user = auth()->user();

        if (
            $user->role !== 'admin' &&
            $ticket->user_id !== $user->id &&
            !Task::where('ticket_id', $request->ticket_id)
                ->where('technician_id', $user->id)
                ->exists()
        ) {
            return response()->json([
                'message' => 'Access denied'
            ], 403);
        }

        // 4. Create message
        $message = Message::create([
            'ticket_id' => $request->ticket_id,
            'sender_id' => auth()->id(),
            'message' => $request->message
        ]);

        return response()->json([
            'message' => 'Message sent successfully',
            'data' => $message
        ], 201);
    }

    // GET MESSAGES
    public function getMessages($ticket_id)
    {
        // 1. Check ticket
        $ticket = Ticket::find($ticket_id);

        if (!$ticket) {
            return response()->json([
                'message' => 'Ticket not found'
            ], 404);
        }

        // 2. SECURITY CHECK
        $user = auth()->user();

        if (
            $user->role !== 'admin' &&
            $ticket->user_id !== $user->id &&
            !Task::where('ticket_id', $ticket_id)
                ->where('technician_id', $user->id)
                ->exists()
        ) {
            return response()->json([
                'message' => 'Access denied'
            ], 403);
        }

        // 3. Get messages
        $messages = Message::where('ticket_id', $ticket_id)
            ->with('user')
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json([
            'messages' => $messages
        ]);
    }
}