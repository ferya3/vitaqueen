<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Content schema.
 *
 * Translatable columns are JSON (`{"fa": "…", "en": "…"}`) — see the
 * `HasTranslations` trait for why. Everything that a buyer or an auditor might
 * quote back at the company (analysis values, certificate numbers, batch
 * references) is a real column with a real type, never free text inside a blob.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('media', function (Blueprint $table): void {
            $table->id();
            $table->string('disk', 32)->default('media');
            $table->string('path');
            $table->string('original_name');
            $table->string('mime_type', 128);
            $table->unsignedBigInteger('size_bytes');
            $table->unsignedInteger('width')->nullable();
            $table->unsignedInteger('height')->nullable();
            $table->string('checksum', 64)->nullable();
            $table->json('alt')->nullable();
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('mime_type');
            $table->index('checksum');
        });

        Schema::create('products', function (Blueprint $table): void {
            $table->id();
            $table->string('slug', 120)->unique();
            $table->string('sku', 64)->unique();
            $table->json('name');
            $table->json('tagline')->nullable();
            $table->json('description')->nullable();

            $table->unsignedInteger('volume_ml');
            $table->string('bottle_type', 120)->nullable();
            $table->string('cap_type', 120)->nullable();
            $table->json('packaging')->nullable();

            $table->decimal('ph', 4, 2)->nullable();
            $table->unsignedInteger('tds')->nullable();
            $table->unsignedSmallInteger('shelf_life_months')->nullable();
            $table->unsignedSmallInteger('units_per_case')->nullable();
            $table->unsignedSmallInteger('cases_per_pallet')->nullable();
            $table->string('barcode', 32)->nullable();

            $table->foreignId('datasheet_media_id')->nullable()->constrained('media')->nullOnDelete();
            $table->string('model_3d_url')->nullable();

            $table->boolean('featured')->default(false);
            $table->boolean('is_published')->default(false);
            $table->unsignedSmallInteger('position')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['is_published', 'position']);
        });

        Schema::create('product_media', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('media_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('position')->default(0);

            $table->unique(['product_id', 'media_id']);
        });

        Schema::create('certificates', function (Blueprint $table): void {
            $table->id();
            $table->string('slug', 120)->unique();
            $table->json('title');
            $table->json('issuer');
            $table->string('number', 120)->nullable();
            $table->json('scope')->nullable();
            $table->date('issued_at')->nullable();
            $table->date('valid_until')->nullable();
            $table->foreignId('logo_media_id')->nullable()->constrained('media')->nullOnDelete();
            $table->foreignId('document_media_id')->nullable()->constrained('media')->nullOnDelete();
            $table->boolean('is_published')->default(false);
            $table->unsignedSmallInteger('position')->default(0);
            $table->timestamps();

            $table->index(['is_published', 'position']);
        });

        // Laravel derives the pivot name alphabetically; matching that keeps the
        // relation definitions free of a `table` argument nobody would expect.
        Schema::create('certificate_product', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('certificate_id')->constrained()->cascadeOnDelete();

            $table->unique(['product_id', 'certificate_id']);
        });

        Schema::create('water_analyses', function (Blueprint $table): void {
            $table->id();
            $table->string('sampling_point', 120);
            $table->date('sampled_at');
            $table->string('laboratory', 180)->nullable();
            $table->string('report_number', 120)->nullable();

            $table->decimal('ph', 4, 2);
            $table->unsignedInteger('tds');
            $table->unsignedInteger('hardness')->nullable();
            $table->decimal('temperature_c', 4, 1)->nullable();

            $table->foreignId('document_media_id')->nullable()->constrained('media')->nullOnDelete();
            $table->boolean('is_published')->default(false);
            $table->timestamps();

            $table->index(['is_published', 'sampled_at']);
        });

        Schema::create('water_analysis_values', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('water_analysis_id')->constrained()->cascadeOnDelete();
            // Matches the message keys under `source.minerals.*` in the frontend,
            // which is what lets the label be translated without a join.
            $table->string('key', 64);
            $table->decimal('value', 10, 3);
            $table->string('unit', 24)->default('mg/L');
            $table->decimal('limit_value', 10, 3)->nullable();
            $table->string('method', 120)->nullable();
            $table->unsignedSmallInteger('position')->default(0);

            $table->unique(['water_analysis_id', 'key']);
        });

        Schema::create('source_profiles', function (Blueprint $table): void {
            $table->id();
            $table->unsignedInteger('altitude_meters');
            $table->decimal('latitude', 9, 6);
            $table->decimal('longitude', 9, 6);
            $table->json('source_type');
            $table->json('aquifer_age');
            $table->decimal('temperature_c', 4, 1);
            $table->decimal('ph', 4, 2);
            $table->unsignedInteger('tds');
            $table->unsignedInteger('hardness');
            $table->foreignId('water_analysis_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('production_stages', function (Blueprint $table): void {
            $table->id();
            $table->string('key', 64)->unique();
            $table->json('title')->nullable();
            $table->json('body')->nullable();
            $table->json('metrics')->nullable();
            $table->foreignId('media_id')->nullable()->constrained('media')->nullOnDelete();
            $table->string('video_webm_url')->nullable();
            $table->string('video_mp4_url')->nullable();
            $table->boolean('is_published')->default(true);
            $table->unsignedSmallInteger('position')->default(0);
            $table->timestamps();

            $table->index(['is_published', 'position']);
        });

        Schema::create('news_articles', function (Blueprint $table): void {
            $table->id();
            $table->string('slug', 160)->unique();
            $table->json('title');
            $table->json('excerpt')->nullable();
            $table->json('body')->nullable();
            $table->json('tags')->nullable();
            $table->foreignId('cover_media_id')->nullable()->constrained('media')->nullOnDelete();
            $table->foreignId('author_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('published_at')->nullable();
            $table->boolean('is_published')->default(false);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['is_published', 'published_at']);
        });

        Schema::create('pages', function (Blueprint $table): void {
            $table->id();
            $table->string('slug', 120)->unique();
            $table->json('title');
            $table->json('body')->nullable();
            $table->json('meta_description')->nullable();
            $table->boolean('is_published')->default(false);
            $table->timestamps();
        });

        Schema::create('distributors', function (Blueprint $table): void {
            $table->id();
            $table->string('company', 180);
            $table->json('region');
            $table->string('country', 2);
            $table->string('city', 120)->nullable();
            $table->string('phone', 40)->nullable();
            $table->string('email', 180)->nullable();
            $table->string('website', 255)->nullable();
            $table->boolean('is_published')->default(false);
            $table->unsignedSmallInteger('position')->default(0);
            $table->timestamps();

            $table->index(['is_published', 'country']);
        });

        Schema::create('contact_messages', function (Blueprint $table): void {
            $table->id();
            $table->string('name', 120);
            $table->string('email', 180);
            $table->string('phone', 40)->nullable();
            $table->string('company', 160)->nullable();
            $table->string('topic', 32);
            $table->string('subject', 200);
            $table->text('message');
            $table->string('locale', 5);
            // Kept for abuse investigation only, and pruned by a scheduled job.
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent', 255)->nullable();
            $table->timestamp('handled_at')->nullable();
            $table->foreignId('handled_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['topic', 'created_at']);
            $table->index('handled_at');
        });

        Schema::create('audit_logs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('user_email', 180)->nullable();
            $table->string('action', 64);
            $table->string('resource_type', 160)->nullable();
            $table->string('resource_id', 64)->nullable();
            $table->json('before')->nullable();
            $table->json('after')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent', 255)->nullable();
            $table->timestamp('created_at')->nullable();

            $table->index(['resource_type', 'resource_id']);
            $table->index(['user_id', 'created_at']);
            $table->index('action');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('contact_messages');
        Schema::dropIfExists('distributors');
        Schema::dropIfExists('pages');
        Schema::dropIfExists('news_articles');
        Schema::dropIfExists('production_stages');
        Schema::dropIfExists('source_profiles');
        Schema::dropIfExists('water_analysis_values');
        Schema::dropIfExists('water_analyses');
        Schema::dropIfExists('certificate_product');
        Schema::dropIfExists('certificates');
        Schema::dropIfExists('product_media');
        Schema::dropIfExists('products');
        Schema::dropIfExists('media');
    }
};
