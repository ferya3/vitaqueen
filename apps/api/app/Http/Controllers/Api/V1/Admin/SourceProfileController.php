<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Resources\SourceProfileResource;
use App\Models\SourceProfile;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * The spring's own record. There is exactly one, so this is a show/update pair
 * rather than a resource controller.
 */
class SourceProfileController extends Controller
{
    public function show(Request $request)
    {
        abort_unless($request->user()->atLeast(UserRole::ContentManager), 403);

        return new SourceProfileResource(SourceProfile::current() ?? new SourceProfile);
    }

    public function update(Request $request)
    {
        abort_unless(
            $request->user()->atLeast(UserRole::Editor),
            403,
            'Editing the source profile requires an editor account.',
        );

        $data = $request->validate([
            'altitude_meters' => ['required', 'integer', 'min:0', 'max:9000'],
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'source_type' => ['required', 'array:'.implode(',', config('vitaqueen.locales'))],
            'source_type.*' => ['nullable', 'string', 'max:120'],
            'aquifer_age' => ['required', 'array:'.implode(',', config('vitaqueen.locales'))],
            'aquifer_age.*' => ['nullable', 'string', 'max:120'],
            'temperature_c' => ['required', 'numeric', 'between:-10,100'],
            'ph' => ['required', 'numeric', 'between:0,14'],
            'tds' => ['required', 'integer', 'min:0', 'max:100000'],
            'hardness' => ['required', 'integer', 'min:0', 'max:100000'],
            'water_analysis_id' => ['nullable', 'integer', Rule::exists('water_analyses', 'id')],
        ]);

        $profile = SourceProfile::first() ?? new SourceProfile;
        $profile->setTranslations('source_type', $data['source_type']);
        $profile->setTranslations('aquifer_age', $data['aquifer_age']);
        $profile->fill(collect($data)->except(['source_type', 'aquifer_age'])->all());
        $profile->save();

        return new SourceProfileResource($profile->load('analysis.values'));
    }
}
