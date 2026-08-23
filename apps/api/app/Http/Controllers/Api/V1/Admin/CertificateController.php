<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\CertificateResource;
use App\Models\Certificate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * Certificates are the one resource where "publish" carries legal weight, so
 * `valid_until` is required whenever the record is published: an undated
 * certificate cannot expire, and a certificate that cannot expire will still be
 * on the site three years after it lapsed.
 */
class CertificateController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', Certificate::class);

        return CertificateResource::collection(
            Certificate::query()->with(['logo', 'document'])->orderBy('position')
                ->paginate(min($request->integer('per_page', 50), 100)),
        );
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Certificate::class);

        $data = $this->validated($request);

        $certificate = new Certificate;
        $this->fill($certificate, $data);
        $certificate->slug = $data['slug'] ?? Str::slug($data['title'][config('app.fallback_locale')]);
        $certificate->save();

        return (new CertificateResource($certificate))->response()->setStatusCode(201);
    }

    public function show(Certificate $certificate)
    {
        $this->authorize('view', $certificate);

        return new CertificateResource($certificate->load(['logo', 'document']));
    }

    public function update(Request $request, Certificate $certificate)
    {
        $this->authorize('update', $certificate);

        $this->fill($certificate, $this->validated($request, $certificate->id));
        $certificate->save();

        return new CertificateResource($certificate);
    }

    public function destroy(Certificate $certificate): JsonResponse
    {
        $this->authorize('delete', $certificate);

        $certificate->delete();

        return response()->json(null, 204);
    }

    /** @return array<string, mixed> */
    private function validated(Request $request, ?int $ignoreId = null): array
    {
        $locales = implode(',', config('vitaqueen.locales'));
        $sometimes = $ignoreId ? 'sometimes' : 'required';

        return $request->validate([
            'slug' => ['nullable', 'string', 'max:120', 'regex:/^[a-z0-9-]+$/', Rule::unique('certificates', 'slug')->ignore($ignoreId)],
            'title' => [$sometimes, 'array:'.$locales],
            'title.'.config('app.fallback_locale') => [$sometimes, 'string', 'max:180'],
            'title.*' => ['nullable', 'string', 'max:180'],
            'issuer' => [$sometimes, 'array:'.$locales],
            'issuer.*' => ['nullable', 'string', 'max:180'],
            'scope' => ['nullable', 'array:'.$locales],
            'scope.*' => ['nullable', 'string', 'max:400'],
            'number' => ['nullable', 'string', 'max:120'],
            'issued_at' => ['nullable', 'date'],
            'valid_until' => ['nullable', 'date', 'after:issued_at', 'required_if:is_published,true'],
            'logo_media_id' => ['nullable', 'integer', Rule::exists('media', 'id')],
            'document_media_id' => ['nullable', 'integer', Rule::exists('media', 'id')],
            'is_published' => ['boolean'],
            'position' => ['integer', 'min:0', 'max:999'],
        ]);
    }

    /** @param array<string, mixed> $data */
    private function fill(Certificate $certificate, array $data): void
    {
        foreach (['title', 'issuer', 'scope'] as $key) {
            if (isset($data[$key])) {
                $certificate->setTranslations($key, $data[$key]);
            }
        }

        $certificate->fill(array_intersect_key($data, array_flip([
            'number', 'issued_at', 'valid_until', 'logo_media_id',
            'document_media_id', 'is_published', 'position',
        ])));
    }
}
