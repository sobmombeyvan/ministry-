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
         Schema::create('tickets', function (Blueprint $table) {
        $table->id();
$table->string('title');
$table->text('description');
$table->enum('category', ['hardware', 'network', 'software'])->default('hardware');
$table->enum('status', ['open', 'pending', 'in_progress', 'closed'])->default('pending');
$table->foreignId('user_id')->constrained()->onDelete('cascade');
$table->timestamps();
$table->softDeletes();

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tickets');
    }
};
