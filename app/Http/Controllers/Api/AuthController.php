<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        //  Validation
        $request->validate([
            'name' => 'required|string',
            'surname' => 'required|string',
            'username' => 'required|string|unique:users,username',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6',
            'role' => 'required|in:staff,admin,technician'
        ]);

        // Create user
        $user = User::create([
            'name' => $request->name,
            'surname' => $request->surname,
            'username' => $request->username,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'account_status' => 'active'
        ]);

        //  Generate token
        $token = $user->createToken('auth_token')->plainTextToken;

        //  Response
        return response()->json([
            'message' => 'User registered successfully',
            'user' => $user,
            'token' => $token
        ], 201);
    }

    public function login(Request $request)
{
    // Validate input
    $request->validate([
        'username' => 'required',
        'password' => 'required'
    ]);

    //  Find user
    $user = \App\Models\User::where('username', $request->username)->first();

    //  If user not found OR password incorrect
    if (!$user || !\Illuminate\Support\Facades\Hash::check($request->password, $user->password)) {
        return response()->json([
            'message' => 'Invalid username or password'
        ], 401);
    }

    //  If account is deactivated
    if ($user->account_status === 'deactivated') {
        return response()->json([
            'message' => 'Account is deactivated'
        ], 403);
    }

    //  Generate token
    $token = $user->createToken('auth_token')->plainTextToken;

    //  Response
    return response()->json([
        'message' => 'Login successful',
        'user' => $user,
        'token' => $token
    ]);
}

public function logout(Request $request)
{
    //  Delete current token
    $request->user()->currentAccessToken()->delete();

    return response()->json([
        'message' => 'Logged out successfully'
    ]);
}
}
