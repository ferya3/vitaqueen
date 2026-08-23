<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductionStageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'key' => $this->key,
            'order' => $this->position,
            // When a stage carries no CMS copy, the frontend falls back to its
            // translated default under `factory.stages.*`.
            'titleKey' => blank($this->title) ? $this->key : null,
            'title' => $this->title,
            'body' => $this->body,
            'media' => $this->whenLoaded('media', fn () => $this->media ? new MediaResource($this->media) : null),
            'video' => $this->video(),
            'metrics' => $this->metrics ?? [],
        ];
    }

    /** @return array{sources: array<int, array{src: string, type: string}>, poster: string}|null */
    private function video(): ?array
    {
        $sources = [];

        if (filled($this->video_webm_url)) {
            $sources[] = ['src' => $this->video_webm_url, 'type' => 'video/webm'];
        }
        if (filled($this->video_mp4_url)) {
            $sources[] = ['src' => $this->video_mp4_url, 'type' => 'video/mp4'];
        }

        if ($sources === []) {
            return null;
        }

        return [
            'sources' => $sources,
            'poster' => $this->relationLoaded('media') && $this->media ? $this->media->url() : '',
        ];
    }
}
