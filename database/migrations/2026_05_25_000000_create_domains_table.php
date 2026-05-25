<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('domains', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('label');
            $table->string('summary');
            $table->json('ambient');
            $table->string('default_persona_id');
            $table->json('rules');
            $table->json('personae');
            $table->json('components')->nullable();
            $table->json('default_screen')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('domains');
    }
};
