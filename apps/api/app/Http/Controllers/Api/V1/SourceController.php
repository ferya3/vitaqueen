<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\SourceProfileResource;
use App\Models\SourceProfile;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class SourceController extends Controller
{
    public function show()
    {
        $profile = SourceProfile::current();

        if ($profile === null) {
            throw new NotFoundHttpException('Source profile has not been configured.');
        }

        return new SourceProfileResource($profile);
    }
}
