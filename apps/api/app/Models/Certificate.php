<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\Auditable;
use App\Models\Concerns\HasTranslations;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Certificate extends Model
{
    use Auditable, HasTranslations;

    protected $fillable = [
        'slug', 'title', 'issuer', 'number', 'scope', 'issued_at', 'valid_until',
        'logo_media_id', 'document_media_id', 'is_published', 'position',
    ];

    protected array $translatable = ['title', 'issuer', 'scope'];

    protected function casts(): array
    {
        return [
            'issued_at' => 'date',
            'valid_until' => 'date',
            'is_published' => 'boolean',
            'position' => 'integer',
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function logo(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'logo_media_id');
    }

    public function document(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'document_media_id');
    }

    /**
     * Published *and* still valid.
     *
     * An expired certificate is not a design choice to make in the template —
     * it simply stops being published, because leaving it up is a claim the
     * factory can no longer support.
     */
    public function scopePublished(Builder $query): Builder
    {
        return $query
            ->where('is_published', true)
            ->where(fn (Builder $q) => $q->whereNull('valid_until')->orWhereDate('valid_until', '>=', today()))
            ->orderBy('position');
    }
}
