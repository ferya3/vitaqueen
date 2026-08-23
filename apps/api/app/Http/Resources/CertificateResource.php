<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CertificateResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'title' => $this->title,
            'issuer' => $this->issuer,
            'number' => $this->number,
            'scope' => $this->scope,
            'issuedAt' => $this->issued_at?->toDateString(),
            'validUntil' => $this->valid_until?->toDateString(),
            'logo' => $this->whenLoaded('logo', fn () => $this->logo ? new MediaResource($this->logo) : null),
            'documentUrl' => $this->whenLoaded('document', fn () => $this->document?->url()),
        ];
    }
}
