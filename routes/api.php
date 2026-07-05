<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\TicketController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/tickets', [TicketController::class, 'index']);
    Route::get('/tickets/{id}', [TicketController::class, 'show']);
    Route::post('/tickets', [TicketController::class, 'store'])->middleware('role:staff');

    Route::get('/tasks', [TaskController::class, 'index']);
    Route::get('/tasks/{id}', [TaskController::class, 'show']);
    Route::post('/tasks', [TaskController::class, 'store'])->middleware('role:admin');
    Route::put('/tasks/{id}/status', [TaskController::class, 'updateStatus'])->middleware('role:technician');
    Route::put('/tasks/{id}/refuse', [TaskController::class, 'refuseTask'])->middleware('role:technician');

    Route::post('/messages', [MessageController::class, 'send']);
    Route::get('/tickets/{id}/messages', [MessageController::class, 'getMessages']);

    Route::get('/dashboard/staff', [DashboardController::class, 'staffDashboard'])->middleware('role:staff');
    Route::get('/dashboard/technician', [DashboardController::class, 'technicianDashboard'])->middleware('role:technician');
    Route::get('/dashboard/admin', [DashboardController::class, 'adminDashboard'])->middleware('role:admin');

    Route::get('/users', [UserController::class, 'index'])->middleware('role:admin');
    Route::put('/users/{id}', [UserController::class, 'update'])->middleware('role:admin');
    Route::put('/users/{id}/deactivate', [UserController::class, 'deactivate'])->middleware('role:admin');
    Route::put('/users/{id}/activate', [UserController::class, 'activate'])->middleware('role:admin');
});
