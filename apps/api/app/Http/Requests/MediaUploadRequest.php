<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Models\Media;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class MediaUploadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Media::class) ?? false;
    }

    public function rules(): array
    {
        return [
            'category' => ['required', Rule::in(['image', 'document', 'video'])],
            // `mimetypes` checks the sniffed type, not the filename. The real
            // enforcement is in `MediaService`; this is the early, cheap check
            // so an oversized upload is rejected before it is moved anywhere.
            'file' => [
                'required',
                'file',
                'max:204800',
                'mimetypes:image/jpeg,image/png,image/webp,image/avif,image/svg+xml,application/pdf,video/mp4,video/webm',
            ],
            'alt' => ['nullable', 'array:'.implode(',', config('vitaqueen.locales'))],
            'alt.*' => ['nullable', 'string', 'max:255'],
        ];
    }
}
