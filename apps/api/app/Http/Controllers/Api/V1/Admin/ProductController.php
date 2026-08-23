<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Services\ProductService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Admin CRUD for products — the reference implementation for every other
 * content resource: validate in the FormRequest, authorise in the policy, do
 * the work in the service, return a Resource. Nothing else belongs here.
 */
class ProductController extends Controller
{
    public function __construct(private readonly ProductService $products) {}

    public function index(Request $request)
    {
        $this->authorize('viewAny', Product::class);

        $query = Product::query()->with(['images', 'certificates'])->orderBy('position');

        if ($request->filled('search')) {
            $term = '%'.$request->string('search')->value().'%';
            $query->where(fn ($q) => $q->where('sku', 'like', $term)->orWhere('slug', 'like', $term));
        }

        if ($request->has('published')) {
            $query->where('is_published', $request->boolean('published'));
        }

        return ProductResource::collection($query->paginate(min($request->integer('per_page', 25), 100)));
    }

    public function store(StoreProductRequest $request): JsonResponse
    {
        $this->authorize('create', Product::class);

        $product = $this->products->create($request->validated());

        return (new ProductResource($product))->response()->setStatusCode(201);
    }

    public function show(Product $product)
    {
        $this->authorize('view', $product);

        return new ProductResource($product->load(['images', 'certificates', 'datasheet']));
    }

    public function update(UpdateProductRequest $request, Product $product)
    {
        return new ProductResource($this->products->update($product, $request->validated()));
    }

    public function destroy(Product $product): JsonResponse
    {
        $this->authorize('delete', $product);

        $this->products->delete($product);

        return response()->json(null, 204);
    }
}
