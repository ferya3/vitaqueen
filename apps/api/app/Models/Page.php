<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\Auditable;
use App\Models\Concerns\HasTranslations;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/** Free-form pages: privacy policy, terms, cookie policy. */
class Page extends Model
{
    use Auditable, HasTranslations;

    protected $fillable = ['slug', 'title', 'body', 'meta_description', 'is_published'];

    protected array $translatable = ['title', 'body', 'meta_description'];

    protected function casts(): array
    {
        return ['is_published' => 'boolean'];
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('is_published', true);
    }
}
