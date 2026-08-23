<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Services\TwoFactorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

/**
 * TOTP enrolment.
 *
 * The pending secret is parked in the cache between `store` and `confirm`
 * rather than written to the user row immediately: a secret that was generated
 * but never proven — because the user closed the tab mid-setup — must not
 * become the thing that locks them out on the next login. The API is
 * token-authenticated and stateless, so the cache, not a session, is where
 * that half-finished state belongs.
 */
class TwoFactorController extends Controller
{
    public function __construct(private readonly TwoFactorService $twoFactor) {}

    public function store(Request $request): JsonResponse
    {
        $secret = $this->twoFactor->generateSecret();
        Cache::put($this->pendingKey($request), $secret, now()->addMinutes(10));

        return response()->json([
            'secret' => $secret,
            'otpauthUrl' => $this->twoFactor->provisioningUri($request->user(), $secret),
        ]);
    }

    public function confirm(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'size:6', 'regex:/^[0-9]{6}$/'],
        ]);

        $secret = Cache::pull($this->pendingKey($request));

        if (blank($secret) || ! $this->twoFactor->verify($secret, $validated['code'])) {
            throw ValidationException::withMessages([
                'code' => __('The provided code is not valid.'),
            ]);
        }

        $this->twoFactor->confirm($request->user(), $secret);

        return response()->json([
            'status' => 'enabled',
            // Displayed once. There is no endpoint that shows them again.
            'recoveryCodes' => $this->twoFactor->generateRecoveryCodes($request->user()),
        ]);
    }

    public function destroy(Request $request): JsonResponse
    {
        $request->validate(['password' => ['required', 'string']]);

        if (! Hash::check($request->string('password')->value(), $request->user()->password)) {
            throw ValidationException::withMessages([
                'password' => __('The provided password is incorrect.'),
            ]);
        }

        $this->twoFactor->disable($request->user());

        return response()->json(['status' => 'disabled']);
    }

    private function pendingKey(Request $request): string
    {
        return "2fa:pending:{$request->user()->id}";
    }
}
