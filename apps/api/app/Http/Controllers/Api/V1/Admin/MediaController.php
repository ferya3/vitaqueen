<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\MediaUploadRequest;
use App\Http\Resources\MediaResource;
use App\Models\Media;
use App\Services\MediaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

class MediaController extends Controller
{
    public function __construct(private readonly MediaService $media) {}

    public function index(Request $request)
    {
        $this->authorize('viewAny', Media::class);

        $query = Media::query()->latest();

        if ($request->filled('type')) {
            $query->where('mime_type', 'like', $request->string('type')->value().'%');
        }

        return MediaResource::collection($query->paginate(min($request->integer('per_page', 40), 100)));
    }

    public function store(MediaUploadRequest $request): JsonResponse
    {
        try {
            $media = $this->media->store(
                $request->file('file'),
                $request->string('category')->value(),
                $request->user()->id,
            );
        } catch (RuntimeException $exception) {
            // The reason is useful to the person uploading and harmless to
            // leak: it only ever describes their own file.
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        if ($request->has('alt')) {
            $media->setTranslations('alt', $request->array('alt'))->save();
        }

        return (new MediaResource($media))->response()->setStatusCode(201);
    }

    public function destroy(Media $media): JsonResponse
    {
        $this->authorize('delete', $media);

        $this->media->delete($media);

        return response()->json(null, 204);
    }
}
