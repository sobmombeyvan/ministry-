<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    // 1. Get all users
    public function index(Request $request)
    {
        $query = User::query();

        if ($request->has('role')) {
            $query->where('role', $request->role);
        }

        return response()->json(['users' => $query->orderBy('name')->get()]);
    }

    // 2. Update user
    public function update(Request $request, $id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'message' => 'User not found'
            ], 404);
        }

        // check username uniqueness
        if ($request->username && $request->username !== $user->username) {
            if (User::where('username', $request->username)->exists()) {
                return response()->json([
                    'message' => 'Username already exists'
                ], 400);
            }
        }

        $user->update([
            'name' => $request->name ?? $user->name,
            'surname' => $request->surname ?? $user->surname,
            'username' => $request->username ?? $user->username,
            'email' => $request->email ?? $user->email,
            'role' => $request->role ?? $user->role
        ]);

        return response()->json([
            'message' => 'User updated successfully',
            'user' => $user
        ]);
    }

    // 3. Deactivate user
    public function deactivate($id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'message' => 'User not found'
            ], 404);
        }

        $user->account_status = 'deactivated';
        $user->save();

        return response()->json([
            'message' => 'User deactivated successfully'
        ]);
    }

    // 4. Activate user
    public function activate($id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'message' => 'User not found'
            ], 404);
        }

        $user->account_status = 'active';
        $user->save();

        return response()->json([
            'message' => 'User activated successfully'
        ]);
    }
}
