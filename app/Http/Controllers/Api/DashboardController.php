<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\Task;
use App\Models\User;
class DashboardController extends Controller
{
    public function staffDashboard()
    {
        $user = auth()->user();

        $totalTickets = Ticket::where('user_id', $user->id)->count();

        $open = Ticket::where('user_id', $user->id)
            ->where('status', 'open')
            ->count();

        $inProgress = Ticket::where('user_id', $user->id)
            ->where('status', 'in_progress')
            ->count();

        $closed = Ticket::where('user_id', $user->id)
            ->where('status', 'closed')
            ->count();

        return response()->json([
            'total_tickets' => $totalTickets,
            'open' => $open,
            'in_progress' => $inProgress,
            'closed' => $closed
        ]);
    }

public function technicianDashboard()
{
    $user = auth()->user();

    $totalTasks = Task::where('technician_id', $user->id)->count();

    $inProgress = Task::where('technician_id', $user->id)
        ->where('status', 'in_progress')
        ->count();

    $completed = Task::where('technician_id', $user->id)
        ->where('status', 'closed')
        ->count();

    $pending = Task::where('technician_id', $user->id)
        ->where('status', 'pending')
        ->count();

    return response()->json([
        'total_tasks' => $totalTasks,
        'in_progress' => $inProgress,
        'completed' => $completed,
        'pending' => $pending
    ]);
}

public function adminDashboard()
{
    // Tickets
    $totalTickets = Ticket::count();

    $pending = Ticket::where('status', 'pending')->count();

    $inProgress = Ticket::where('status', 'in_progress')->count();

    $closed = Ticket::where('status', 'closed')->count();

    // Users
    $technicians = User::where('role', 'technician')->count();

    $totalUsers = User::count();

    // Tasks
    $tasksInProgress = Task::where('status', 'in_progress')->count();

    $refusedTasks = Task::where('status', 'refused')->count();

    return response()->json([
        'total_tickets' => $totalTickets,
        'pending_tickets' => $pending,
        'in_progress_tickets' => $inProgress,
        'closed_tickets' => $closed,
        'total_technicians' => $technicians,
        'tasks_in_progress' => $tasksInProgress,
        'refused_tasks' => $refusedTasks,
        'total_users' => $totalUsers
    ]);
}
}