<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\DistributorResource;
use App\Models\Distributor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DistributorController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', Distributor::class);

        return DistributorResource::collection(
            Distributor::query()->orderBy('position')
                ->paginate(min($request->integer('per_page', 50), 100)),
        );
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Distributor::class);

        $distributor = new Distributor;
        $this->fill($distributor, $this->validated($request));
        $distributor->save();

        return (new DistributorResource($distributor))->response()->setStatusCode(201);
    }

    public function show(Distributor $distributor)
    {
        $this->authorize('view', $distributor);

        return new DistributorResource($distributor);
    }

    public function update(Request $request, Distributor $distributor)
    {
        $this->authorize('update', $distributor);

        $this->fill($distributor, $this->validated($request, true));
        $distributor->save();

        return new DistributorResource($distributor);
    }

    public function destroy(Distributor $distributor): JsonResponse
    {
        $this->authorize('delete', $distributor);

        $distributor->delete();

        return response()->json(null, 204);
    }

    /** @return array<string, mixed> */
    private function validated(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'company' => [$required, 'string', 'max:180'],
            'region' => [$required, 'array:'.implode(',', config('vitaqueen.locales'))],
            'region.*' => ['nullable', 'string', 'max:120'],
            'country' => [$required, 'string', 'size:2', 'alpha'],
            'city' => ['nullable', 'string', 'max:120'],
            'phone' => ['nullable', 'string', 'max:40'],
            'email' => ['nullable', 'email', 'max:180'],
            'website' => ['nullable', 'url', 'max:255'],
            'is_published' => ['boolean'],
            'position' => ['integer', 'min:0', 'max:999'],
        ]);
    }

    /** @param array<string, mixed> $data */
    private function fill(Distributor $distributor, array $data): void
    {
        if (isset($data['region'])) {
            $distributor->setTranslations('region', $data['region']);
        }

        if (isset($data['country'])) {
            $data['country'] = mb_strtoupper($data['country']);
        }

        $distributor->fill(array_intersect_key($data, array_flip([
            'company', 'country', 'city', 'phone', 'email', 'website', 'is_published', 'position',
        ])));
    }
}
