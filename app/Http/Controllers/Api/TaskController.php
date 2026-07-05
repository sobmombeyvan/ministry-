<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        $query = Task::with(['ticket.user', 'technician'])->latest();

        if ($user->role === 'technician') {
            $query->where('technician_id', $user->id);
        } elseif ($user->role === 'staff') {
            $query->whereHas('ticket', fn ($q) => $q->where('user_id', $user->id));
        }

        return response()->json(['tasks' => $query->get()]);
    }

    public function show($id)
    {
        $task = Task::with(['ticket.user', 'technician'])->find($id);

        if (!$task) {
            return response()->json(['message' => 'Task not found'], 404);
        }

        $user = auth()->user();

        if ($user->role === 'technician' && $task->technician_id !== $user->id) {
            return response()->json(['message' => 'Access denied'], 403);
        }

        if ($user->role === 'staff' && $task->ticket->user_id !== $user->id) {
            return response()->json(['message' => 'Access denied'], 403);
        }

        return response()->json(['task' => $task]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'ticket_id' => 'required|exists:tickets,id',
            'technician_id' => 'required|exists:users,id',
            'description' => 'required|string',
            'priority' => 'required|in:low,medium,high',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $technician = User::find($request->technician_id);

        if ($technician->role !== 'technician') {
            return response()->json(['message' => 'Selected user is not a technician'], 403);
        }

        $task = Task::create([
            'ticket_id' => $request->ticket_id,
            'technician_id' => $request->technician_id,
            'description' => $request->description,
            'priority' => $request->priority,
            'status' => 'open',
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
        ]);

        $ticket = Ticket::find($request->ticket_id);
        $ticket->status = 'in_progress';
        $ticket->save();

        return response()->json([
            'message' => 'Task created and technician assigned successfully',
            'task' => $task->load(['ticket', 'technician']),
        ], 201);
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:open,in_progress,pending,closed',
        ]);

        $task = Task::find($id);

        if (!$task) {
            return response()->json(['message' => 'Task not found'], 404);
        }

        if ($task->technician_id !== auth()->id()) {
            return response()->json(['message' => 'You are not assigned to this task'], 403);
        }

        $task->status = $request->status;
        $task->save();

        if ($request->status === 'closed') {
            $ticket = $task->ticket;
            $ticket->status = 'closed';
            $ticket->save();
        }

        return response()->json([
            'message' => 'Task status updated successfully',
            'task' => $task,
        ]);
    }

    public function refuseTask($id)
    {
        $task = Task::find($id);

        if (!$task) {
            return response()->json(['message' => 'Task not found'], 404);
        }

        if ($task->technician_id !== auth()->id()) {
            return response()->json(['message' => 'You are not assigned to this task'], 403);
        }

        $task->status = 'refused';
        $task->save();

        $ticket = $task->ticket;
        $ticket->status = 'pending';
        $ticket->save();

        return response()->json([
            'message' => 'Task refused successfully',
            'task' => $task,
        ]);
    }
}
