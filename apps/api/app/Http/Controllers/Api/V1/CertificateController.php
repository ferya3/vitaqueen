<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\CertificateResource;
use App\Models\Certificate;

class CertificateController extends Controller
{
    /**
     * Only currently valid certificates are returned — see
     * `Certificate::scopePublished()`. An expired certificate on a public page
     * is a claim the factory can no longer support.
     */
    public function index()
    {
        return CertificateResource::collection(
            Certificate::published()->with(['logo', 'document'])->get(),
        );
    }
}
