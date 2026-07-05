<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
           $table->id();
$table->foreignId('ticket_id')->constrained()->onDelete('cascade');
$table->text('description');

$table->enum('priority', ['low', 'medium', 'high'])->default('medium');

$table->enum('status', ['open', 'pending', 'in_progress', 'closed', 'refused'])->default('open');

$table->foreignId('technician_id')->constrained('users')->onDelete('cascade');

$table->timestamps();
$table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
