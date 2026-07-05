<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['username' => 'admin'],
            [
                'name' => 'System',
                'surname' => 'Administrator',
                'email' => 'admin@ministry.local',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'account_status' => 'active',
            ]
        );

        User::updateOrCreate(
            ['username' => 'staff1'],
            [
                'name' => 'Jean',
                'surname' => 'Mbeki',
                'email' => 'staff@ministry.local',
                'password' => Hash::make('password'),
                'role' => 'staff',
                'account_status' => 'active',
            ]
        );

        User::updateOrCreate(
            ['username' => 'tech1'],
            [
                'name' => 'Paul',
                'surname' => 'Nkomo',
                'email' => 'tech@ministry.local',
                'password' => Hash::make('password'),
                'role' => 'technician',
                'account_status' => 'active',
            ]
        );
    }
}
