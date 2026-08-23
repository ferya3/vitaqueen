<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\DistributorResource;
use App\Models\Distributor;

class DistributorController extends Controller
{
    public function index()
    {
        return DistributorResource::collection(Distributor::published()->get());
    }
}
