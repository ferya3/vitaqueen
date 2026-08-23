<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Services\ProductService;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class ProductController extends Controller
{
    public function __construct(private readonly ProductService $products) {}

    public function index()
    {
        return ProductResource::collection($this->products->publishedList());
    }

    public function show(string $slug)
    {
        $product = $this->products->findPublished($slug);

        if ($product === null) {
            throw new NotFoundHttpException('Product not found.');
        }

        return new ProductResource($product);
    }
}
