<?php

declare(strict_types=1);

namespace Tests\Feature\Admin;

use App\Enums\UserRole;
use App\Models\Media;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class MediaUploadTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('media');
        Storage::fake('documents');
    }

    public function test_it_accepts_an_image_and_renames_it(): void
    {
        $this->actingAsRole(UserRole::Editor);

        $response = $this->postJson('/api/v1/admin/media', [
            'category' => 'image',
            'file' => UploadedFile::fake()->image('bottle photo (final) v2.jpg', 800, 1200),
        ]);

        $response->assertStatus(201);

        $this->assertDatabaseCount('media', 1);
        $stored = Media::first();

        // Nothing the uploader typed reaches the filesystem.
        $this->assertStringNotContainsString(' ', $stored->path);
        $this->assertStringNotContainsString('(', $stored->path);
        $this->assertStringEndsWith('.jpg', $stored->path);
        Storage::disk('media')->assertExists($stored->path);
    }

    public function test_it_refuses_a_double_extension_that_hides_an_executable(): void
    {
        $this->actingAsRole(UserRole::Editor);

        $payload = UploadedFile::fake()->createWithContent(
            'avatar.php.jpg',
            "<?php system(\$_GET['c']); ?>",
        );

        $this->postJson('/api/v1/admin/media', [
            'category' => 'image',
            'file' => $payload,
        ])->assertStatus(422);

        $this->assertDatabaseCount('media', 0);
    }

    public function test_it_refuses_a_pdf_uploaded_as_an_image(): void
    {
        $this->actingAsRole(UserRole::Editor);

        $this->postJson('/api/v1/admin/media', [
            'category' => 'image',
            'file' => UploadedFile::fake()->create('report.pdf', 40, 'application/pdf'),
        ])->assertStatus(422);
    }

    public function test_documents_are_stored_off_the_public_disk(): void
    {
        $this->actingAsRole(UserRole::Editor);

        $this->postJson('/api/v1/admin/media', [
            'category' => 'document',
            'file' => UploadedFile::fake()->create('analysis.pdf', 40, 'application/pdf'),
        ])->assertStatus(201);

        $stored = Media::first();

        $this->assertSame('documents', $stored->disk);
        Storage::disk('media')->assertMissing($stored->path);
    }

    public function test_svg_is_rejected_while_the_feature_is_off(): void
    {
        config(['vitaqueen.media.allow_svg' => false]);
        $this->actingAsRole(UserRole::Editor);

        $this->postJson('/api/v1/admin/media', [
            'category' => 'image',
            'file' => UploadedFile::fake()->createWithContent(
                'logo.svg',
                '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
            ),
        ])->assertStatus(422);
    }

    public function test_a_content_manager_can_upload_but_not_delete(): void
    {
        $this->actingAsRole(UserRole::ContentManager);

        // Uploading is part of writing content.
        $this->postJson('/api/v1/admin/media', [
            'category' => 'image',
            'file' => UploadedFile::fake()->image('photo.jpg'),
        ])->assertStatus(201);

        // Removing an asset breaks pages that still reference it, so it is not.
        $media = Media::first();
        $this->deleteJson("/api/v1/admin/media/{$media->id}")->assertStatus(403);
    }
}
