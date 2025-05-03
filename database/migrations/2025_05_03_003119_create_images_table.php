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
        Schema::create('images', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('whiskey_id');
            $table->string('image_path')->comment('Path to image file');
            $table->timestamps();

            $table->foreign('whiskey_id')->references('id')->on('whiskeys')->onDelete('cascade');
            $table->index('whiskey_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('images');
    }
};
