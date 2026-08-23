<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\Auditable;
use App\Models\Concerns\HasTranslations;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class Media extends Model
{
    use Auditable, HasTranslations;

    protected $table = 'media';

    protected $fillable = [
        'disk', 'path', 'original_name', 'mime_type',
        'size_bytes', 'width', 'height', 'checksum', 'alt', 'uploaded_by',
    ];

    protected array $translatable = ['alt'];

    protected function casts(): array
    {
        return [
            'size_bytes' => 'integer',
            'width' => 'integer',
            'height' => 'integer',
        ];
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    /**
     * Public URL for this asset.
     *
     * Documents live on a private disk and are served through a signed,
     * short-lived URL rather than a path anyone can guess; images live on the
     * public disk behind the CDN.
     */
    public function url(): string
    {
        $disk = Storage::disk($this->disk);

        if ($this->disk === 'documents') {
            return $disk->temporaryUrl($this->path, now()->addMinutes(15));
        }

        return $disk->url($this->path);
    }
}
