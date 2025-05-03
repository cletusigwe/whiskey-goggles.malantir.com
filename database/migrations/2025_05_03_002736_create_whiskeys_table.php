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
        Schema::create('whiskeys', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('store_id')->unique()->comment('Unique identifier from CSV');
            $table->string('unique_name')->unique()->comment('Unique identifier for classification');
            $table->string('name');
            $table->unsignedInteger('size')->comment('Bottle size in ml');
            $table->decimal('proof', 5, 1)->nullable()->comment('Proof, e.g., 93.0 or 134.4');
            $table->decimal('abv', 5, 1)->nullable()->comment('Alcohol by volume, e.g., 46.5');
            $table->string('spirit_type')->nullable()->comment('e.g., Bourbon, Rye, Whiskey');
            $table->unsignedBigInteger('brand_id')->nullable();
            $table->unsignedBigInteger('popularity')->default(0);
            $table->string('image_url')->nullable();
            $table->decimal('avg_msrp', 8, 2)->nullable()->comment('Average MSRP in USD');
            $table->decimal('fair_price', 8, 2)->nullable()->comment('Fair price in USD');
            $table->decimal('shelf_price', 8, 2)->nullable()->comment('Shelf price in USD');
            $table->unsignedBigInteger('total_score')->default(0);
            $table->unsignedBigInteger('wishlist_count')->default(0);
            $table->unsignedBigInteger('vote_count')->default(0);
            $table->unsignedBigInteger('bar_count')->default(0);
            $table->unsignedInteger('ranking')->default(0);
            $table->timestamps();

            $table->foreign('brand_id')->references('id')->on('brands')->onDelete('set null');
            $table->index('spirit_type');
            $table->index('ranking');
            $table->index('unique_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('whiskeys');
    }
};
