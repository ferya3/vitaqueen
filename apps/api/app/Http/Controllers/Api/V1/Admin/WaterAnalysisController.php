<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\WaterAnalysisResource;
use App\Models\WaterAnalysis;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class WaterAnalysisController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', WaterAnalysis::class);

        return WaterAnalysisResource::collection(
            WaterAnalysis::query()->with('values')->latest('sampled_at')
                ->paginate(min($request->integer('per_page', 25), 100)),
        );
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', WaterAnalysis::class);

        $data = $this->validated($request);

        $analysis = DB::transaction(function () use ($data): WaterAnalysis {
            $analysis = WaterAnalysis::create(collect($data)->except('values')->all());
            $this->syncValues($analysis, $data['values'] ?? []);

            return $analysis;
        });

        return (new WaterAnalysisResource($analysis->load('values')))->response()->setStatusCode(201);
    }

    public function show(WaterAnalysis $waterAnalysis)
    {
        $this->authorize('view', $waterAnalysis);

        return new WaterAnalysisResource($waterAnalysis->load(['values', 'document']));
    }

    public function update(Request $request, WaterAnalysis $waterAnalysis)
    {
        $this->authorize('update', $waterAnalysis);

        $data = $this->validated($request, $waterAnalysis->id);

        DB::transaction(function () use ($waterAnalysis, $data): void {
            $waterAnalysis->update(collect($data)->except('values')->all());

            if (array_key_exists('values', $data)) {
                $this->syncValues($waterAnalysis, $data['values']);
            }
        });

        return new WaterAnalysisResource($waterAnalysis->load('values'));
    }

    public function destroy(WaterAnalysis $waterAnalysis): JsonResponse
    {
        $this->authorize('delete', $waterAnalysis);

        $waterAnalysis->delete();

        return response()->json(null, 204);
    }

    /** @return array<string, mixed> */
    private function validated(Request $request, ?int $ignoreId = null): array
    {
        $sometimes = $ignoreId ? 'sometimes' : 'required';

        return $request->validate([
            'sampling_point' => [$sometimes, 'string', 'max:120'],
            'sampled_at' => [$sometimes, 'date', 'before_or_equal:today'],
            'laboratory' => ['nullable', 'string', 'max:180'],
            'report_number' => ['nullable', 'string', 'max:120'],
            'ph' => [$sometimes, 'numeric', 'between:0,14'],
            'tds' => [$sometimes, 'integer', 'min:0', 'max:100000'],
            'hardness' => ['nullable', 'integer', 'min:0', 'max:100000'],
            'temperature_c' => ['nullable', 'numeric', 'between:-10,100'],
            'document_media_id' => ['nullable', 'integer', Rule::exists('media', 'id')],
            'is_published' => ['boolean'],

            // Keys must match the message catalogue so the frontend can label
            // them in four languages without the API sending display strings.
            'values' => ['nullable', 'array', 'max:60'],
            'values.*.key' => ['required', 'string', 'max:64', 'regex:/^[a-zA-Z0-9_]+$/'],
            'values.*.value' => ['required', 'numeric', 'min:0'],
            'values.*.unit' => ['required', 'string', 'max:24'],
            'values.*.limit_value' => ['nullable', 'numeric', 'min:0'],
            'values.*.method' => ['nullable', 'string', 'max:120'],
        ]);
    }

    /** @param array<int, array<string, mixed>> $values */
    private function syncValues(WaterAnalysis $analysis, array $values): void
    {
        $analysis->values()->delete();

        foreach (array_values($values) as $position => $value) {
            $analysis->values()->create([...$value, 'position' => $position]);
        }
    }
}
