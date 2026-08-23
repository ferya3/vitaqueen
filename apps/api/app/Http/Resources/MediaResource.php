<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** Matches `MediaAsset` in `apps/web/src/types/content.ts`. */
class MediaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'src' => $this->url(),
            'alt' => $this->alt ?? '',
            'width' => $this->width,
            'height' => $this->height,
        ];
    }
}
