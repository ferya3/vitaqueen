<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\NewsArticleResource;
use App\Models\NewsArticle;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class NewsController extends Controller
{
    public function index(Request $request)
    {
        $limit = min((int) $request->integer('limit', 24), 50);

        return NewsArticleResource::collection(
            NewsArticle::published()->with('cover')->limit($limit)->get(),
        );
    }

    public function show(string $slug)
    {
        $article = NewsArticle::published()->with('cover')->where('slug', $slug)->first();

        if ($article === null) {
            throw new NotFoundHttpException('Article not found.');
        }

        return new NewsArticleResource($article);
    }
}
