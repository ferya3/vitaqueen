<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\AuditAction;
use App\Models\AuditLog;
use App\Models\Media;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Uploads, with the checks that people usually skip.
 *
 * The threat here is not "someone uploads an ugly picture", it is "someone
 * uploads `logo.php`, or `logo.php.jpg`, or a JPEG whose bytes are a PHP
 * script, and then requests it". So:
 *
 *  - the extension is derived from the *detected* MIME type, never from the
 *    name the browser sent;
 *  - the MIME type must be on the allow-list for the requested category;
 *  - the stored filename is a random ULID, so nothing user-supplied ever
 *    reaches the filesystem;
 *  - PDFs and certificates go to a private disk and are served through signed
 *    URLs, never from a web-readable directory;
 *  - nginx additionally refuses to execute anything under the upload roots
 *    (see `infra/nginx/vitaqueen.conf`) — this class is the second lock, not
 *    the only one.
 */
final class MediaService
{
    /** @var array<string, array<string, string>> MIME type => canonical extension. */
    private const ALLOWED = [
        'image' => [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
            'image/avif' => 'avif',
            'image/svg+xml' => 'svg',
        ],
        'document' => [
            'application/pdf' => 'pdf',
        ],
        'video' => [
            'video/mp4' => 'mp4',
            'video/webm' => 'webm',
        ],
    ];

    /**
     * Name fragments that must never appear in an upload, in any position.
     *
     * The stored filename is a random ULID, so none of these could reach the
     * disk anyway — but a file called `invoice.php.pdf` is not a mistake, and
     * refusing it outright is both safer and a clearer signal in the audit log
     * than quietly renaming it.
     */
    private const BLOCKED_NAME_PATTERN = '/\.(php\d*|phar|phtml|phps|pht|cgi|pl|py|rb|sh|bash|exe|bat|cmd|com|jsp|asp|aspx|htaccess|htpasswd)(\.|$)/i';

    /** Per-category size ceilings, in kilobytes. */
    private const MAX_KB = [
        'image' => 8 * 1024,
        'document' => 20 * 1024,
        'video' => 200 * 1024,
    ];

    public function store(UploadedFile $file, string $category, ?int $userId = null): Media
    {
        if (! isset(self::ALLOWED[$category])) {
            throw new RuntimeException("Unknown media category: {$category}");
        }

        if (! $file->isValid()) {
            throw new RuntimeException('Upload failed before it reached the application.');
        }

        if (preg_match(self::BLOCKED_NAME_PATTERN, $file->getClientOriginalName()) === 1) {
            throw new RuntimeException('That filename is not accepted.');
        }

        // `getMimeType()` sniffs the file contents; `getClientMimeType()` would
        // simply believe the browser.
        $mime = $file->getMimeType();
        $extension = self::ALLOWED[$category][$mime] ?? null;

        if ($extension === null) {
            throw new RuntimeException("Rejected upload of type {$mime} for category {$category}.");
        }

        if ($file->getSize() > self::MAX_KB[$category] * 1024) {
            throw new RuntimeException('File exceeds the size limit for its category.');
        }

        // An SVG is a document that can execute script. Either scrub it or
        // refuse it; refusing keeps this class small and the logo pipeline
        // predictable.
        if ($mime === 'image/svg+xml' && ! config('vitaqueen.media.allow_svg')) {
            throw new RuntimeException('SVG uploads are disabled.');
        }

        $disk = $category === 'document' ? 'documents' : 'media';
        $name = Str::ulid()->toBase32().'.'.$extension;
        $directory = $category.'/'.now()->format('Y/m');

        $path = $file->storeAs($directory, $name, ['disk' => $disk]);

        if ($path === false) {
            throw new RuntimeException('Could not persist the uploaded file.');
        }

        [$width, $height] = $this->dimensions($disk, $path, $category);

        $media = Media::create([
            'disk' => $disk,
            'path' => $path,
            // Kept for the librarian's benefit only; never used to build a path.
            'original_name' => mb_substr($file->getClientOriginalName(), 0, 255),
            'mime_type' => $mime,
            'size_bytes' => $file->getSize(),
            'width' => $width,
            'height' => $height,
            'checksum' => hash_file('sha256', Storage::disk($disk)->path($path)),
            'uploaded_by' => $userId,
        ]);

        AuditLog::record(
            action: AuditAction::MediaUploaded,
            resourceType: Media::class,
            resourceId: (string) $media->id,
            after: ['path' => $path, 'mime_type' => $mime, 'size_bytes' => $file->getSize()],
        );

        return $media;
    }

    public function delete(Media $media): void
    {
        Storage::disk($media->disk)->delete($media->path);

        AuditLog::record(
            action: AuditAction::MediaDeleted,
            resourceType: Media::class,
            resourceId: (string) $media->id,
            before: ['path' => $media->path],
        );

        $media->delete();
    }

    /** @return array{0: int|null, 1: int|null} */
    private function dimensions(string $disk, string $path, string $category): array
    {
        if ($category !== 'image') {
            return [null, null];
        }

        $absolute = Storage::disk($disk)->path($path);
        $size = @getimagesize($absolute);

        return $size === false ? [null, null] : [$size[0], $size[1]];
    }
}
