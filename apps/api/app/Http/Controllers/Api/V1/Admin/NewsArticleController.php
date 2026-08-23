<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\NewsArticleResource;
use App\Models\NewsArticle;
use App\Services\HtmlSanitizer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class NewsArticleController extends Controller
{
    public function __construct(private readonly HtmlSanitizer $sanitizer) {}

    public function index(Request $request)
    {
        $this->authorize('viewAny', NewsArticle::class);

        return NewsArticleResource::collection(
            NewsArticle::query()->with('cover')->latest('published_at')
                ->paginate(min($request->integer('per_page', 25), 100)),
        );
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', NewsArticle::class);

        $data = $this->validated($request);

        $article = new NewsArticle;
        $this->fill($article, $data);
        $article->slug = $data['slug'] ?? Str::slug($data['title'][config('app.fallback_locale')]);
        $article->author_id = $request->user()->id;
        $article->save();

        return (new NewsArticleResource($article))->response()->setStatusCode(201);
    }

    public function show(NewsArticle $newsArticle)
    {
        $this->authorize('view', $newsArticle);

        return new NewsArticleResource($newsArticle->load('cover'));
    }

    public function update(Request $request, NewsArticle $newsArticle)
    {
        $this->authorize('update', $newsArticle);

        $this->fill($newsArticle, $this->validated($request, $newsArticle->id));
        $newsArticle->save();

        return new NewsArticleResource($newsArticle);
    }

    public function destroy(NewsArticle $newsArticle): JsonResponse
    {
        $this->authorize('delete', $newsArticle);

        $newsArticle->delete();

        return response()->json(null, 204);
    }

    /** @return array<string, mixed> */
    private function validated(Request $request, ?int $ignoreId = null): array
    {
        $locales = implode(',', config('vitaqueen.locales'));

        return $request->validate([
            'slug' => ['nullable', 'string', 'max:160', 'regex:/^[a-z0-9-]+$/', Rule::unique('news_articles', 'slug')->ignore($ignoreId)],
            'title' => [$ignoreId ? 'sometimes' : 'required', 'array:'.$locales],
            'title.'.config('app.fallback_locale') => [$ignoreId ? 'sometimes' : 'required', 'string', 'max:200'],
            'title.*' => ['nullable', 'string', 'max:200'],
            'excerpt' => ['nullable', 'array:'.$locales],
            'excerpt.*' => ['nullable', 'string', 'max:400'],
            'body' => ['nullable', 'array:'.$locales],
            'body.*' => ['nullable', 'string', 'max:120000'],
            'tags' => ['nullable', 'array', 'max:12'],
            'tags.*' => ['string', 'max:40'],
            'cover_media_id' => ['nullable', 'integer', Rule::exists('media', 'id')],
            'published_at' => ['nullable', 'date'],
            'is_published' => ['boolean'],
        ]);
    }

    /** @param array<string, mixed> $data */
    private function fill(NewsArticle $article, array $data): void
    {
        foreach (['title', 'excerpt'] as $key) {
            if (isset($data[$key])) {
                $article->setTranslations($key, $data[$key]);
            }
        }

        // Sanitised on the way in, never on the way out — see HtmlSanitizer.
        if (isset($data['body'])) {
            $article->setTranslations('body', $this->sanitizer->cleanTranslations($data['body']));
        }

        $article->fill(array_intersect_key($data, array_flip([
            'tags', 'cover_media_id', 'published_at', 'is_published',
        ])));
    }
}
