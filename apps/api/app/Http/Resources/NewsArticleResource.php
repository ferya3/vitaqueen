<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NewsArticleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'title' => $this->title,
            'excerpt' => $this->excerpt,
            // Already sanitised on write by `HtmlSanitizer`; the frontend
            // renders it directly and relies on that.
            'body' => $this->when($request->routeIs('*.show'), fn () => $this->body),
            'cover' => $this->whenLoaded('cover', fn () => $this->cover?->url()),
            'publishedAt' => $this->published_at?->toIso8601String(),
            'updatedAt' => $this->updated_at?->toIso8601String(),
            'tags' => $this->tags ?? [],
        ];
    }
}
