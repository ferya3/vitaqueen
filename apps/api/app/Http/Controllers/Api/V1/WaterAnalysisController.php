<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\WaterAnalysisResource;
use App\Models\WaterAnalysis;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class WaterAnalysisController extends Controller
{
    /** The most recent published analysis, which is what the site quotes. */
    public function show()
    {
        $analysis = WaterAnalysis::latestPublished()->with(['values', 'document'])->first();

        if ($analysis === null) {
            throw new NotFoundHttpException('No published water analysis.');
        }

        return new WaterAnalysisResource($analysis);
    }

    public function index()
    {
        return WaterAnalysisResource::collection(
            WaterAnalysis::where('is_published', true)
                ->with('values')
                ->latest('sampled_at')
                ->limit(24)
                ->get(),
        );
    }
}
