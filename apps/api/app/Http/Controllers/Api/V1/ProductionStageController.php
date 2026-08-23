<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductionStageResource;
use App\Models\ProductionStage;

class ProductionStageController extends Controller
{
    public function index()
    {
        return ProductionStageResource::collection(
            ProductionStage::published()->with('media')->get(),
        );
    }
}
