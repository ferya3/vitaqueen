<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\PageResource;
use App\Models\Page;
use App\Services\HtmlSanitizer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PageController extends Controller
{
    public function __construct(private readonly HtmlSanitizer $sanitizer) {}

    public function index()
    {
        $this->authorize('viewAny', Page::class);

        return PageResource::collection(Page::orderBy('slug')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Page::class);

        $page = new Page;
        $this->fill($page, $this->validated($request));
        $page->save();

        return (new PageResource($page))->response()->setStatusCode(201);
    }

    public function show(Page $page)
    {
        $this->authorize('view', $page);

        return new PageResource($page);
    }

    public function update(Request $request, Page $page)
    {
        $this->authorize('update', $page);

        $this->fill($page, $this->validated($request, $page->id));
        $page->save();

        return new PageResource($page);
    }

    public function destroy(Page $page): JsonResponse
    {
        $this->authorize('delete', $page);

        $page->delete();

        return response()->json(null, 204);
    }

    /** @return array<string, mixed> */
    private function validated(Request $request, ?int $ignoreId = null): array
    {
        $locales = implode(',', config('vitaqueen.locales'));
        $sometimes = $ignoreId ? 'sometimes' : 'required';

        return $request->validate([
            'slug' => [$sometimes, 'string', 'max:120', 'regex:/^[a-z0-9-]+$/', Rule::unique('pages', 'slug')->ignore($ignoreId)],
            'title' => [$sometimes, 'array:'.$locales],
            'title.*' => ['nullable', 'string', 'max:200'],
            'body' => ['nullable', 'array:'.$locales],
            'body.*' => ['nullable', 'string', 'max:200000'],
            'meta_description' => ['nullable', 'array:'.$locales],
            'meta_description.*' => ['nullable', 'string', 'max:320'],
            'is_published' => ['boolean'],
        ]);
    }

    /** @param array<string, mixed> $data */
    private function fill(Page $page, array $data): void
    {
        foreach (['title', 'meta_description'] as $key) {
            if (isset($data[$key])) {
                $page->setTranslations($key, $data[$key]);
            }
        }

        if (isset($data['body'])) {
            $page->setTranslations('body', $this->sanitizer->cleanTranslations($data['body']));
        }

        if (isset($data['slug'])) {
            $page->slug = $data['slug'];
        }

        $page->fill(array_intersect_key($data, array_flip(['is_published'])));
    }
}
