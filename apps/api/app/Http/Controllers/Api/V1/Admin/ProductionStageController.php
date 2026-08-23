<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductionStageResource;
use App\Models\ProductionStage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProductionStageController extends Controller
{
    public function index()
    {
        $this->authorize('viewAny', ProductionStage::class);

        return ProductionStageResource::collection(
            ProductionStage::with('media')->orderBy('position')->get(),
        );
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', ProductionStage::class);

        $stage = new ProductionStage;
        $this->fill($stage, $this->validated($request));
        $stage->save();

        return (new ProductionStageResource($stage))->response()->setStatusCode(201);
    }

    public function show(ProductionStage $productionStage)
    {
        $this->authorize('view', $productionStage);

        return new ProductionStageResource($productionStage->load('media'));
    }

    public function update(Request $request, ProductionStage $productionStage)
    {
        $this->authorize('update', $productionStage);

        $this->fill($productionStage, $this->validated($request, $productionStage->id));
        $productionStage->save();

        return new ProductionStageResource($productionStage);
    }

    public function destroy(ProductionStage $productionStage): JsonResponse
    {
        $this->authorize('delete', $productionStage);

        $productionStage->delete();

        return response()->json(null, 204);
    }

    /** @return array<string, mixed> */
    private function validated(Request $request, ?int $ignoreId = null): array
    {
        $locales = implode(',', config('vitaqueen.locales'));

        return $request->validate([
            // The eight standard keys have translated defaults in the frontend
            // catalogue; a custom key must supply its own copy.
            'key' => [$ignoreId ? 'sometimes' : 'required', 'string', 'max:64', 'regex:/^[a-zA-Z][a-zA-Z0-9_]*$/', Rule::unique('production_stages', 'key')->ignore($ignoreId)],
            'title' => ['nullable', 'array:'.$locales],
            'title.*' => ['nullable', 'string', 'max:180'],
            'body' => ['nullable', 'array:'.$locales],
            'body.*' => ['nullable', 'string', 'max:2000'],
            'metrics' => ['nullable', 'array', 'max:8'],
            'metrics.*.labelKey' => ['required', 'string', 'max:40'],
            'metrics.*.value' => ['required', 'string', 'max:120'],
            'media_id' => ['nullable', 'integer', Rule::exists('media', 'id')],
            'video_webm_url' => ['nullable', 'url', 'max:255'],
            'video_mp4_url' => ['nullable', 'url', 'max:255'],
            'is_published' => ['boolean'],
            'position' => ['integer', 'min:0', 'max:99'],
        ]);
    }

    /** @param array<string, mixed> $data */
    private function fill(ProductionStage $stage, array $data): void
    {
        foreach (['title', 'body'] as $key) {
            if (isset($data[$key])) {
                $stage->setTranslations($key, $data[$key]);
            }
        }

        $stage->fill(array_intersect_key($data, array_flip([
            'key', 'metrics', 'media_id', 'video_webm_url', 'video_mp4_url', 'is_published', 'position',
        ])));
    }
}
