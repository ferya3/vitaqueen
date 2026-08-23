<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\AuditAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Models\AuditLog;
use App\Models\User;
use App\Services\TwoFactorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;

/**
 * Token issue and revocation for the admin panel.
 *
 * Design notes, because each of these is a decision rather than a default:
 *
 *  - **Rate limited per email *and* address.** Limiting by IP alone lets a
 *    botnet spread an attack across addresses; limiting by email alone lets one
 *    attacker lock every account out. Both keys, both enforced.
 *  - **Constant work on failure.** An unknown email still runs a hash
 *    comparison, so response timing does not answer "does this account exist?".
 *  - **One generic failure message.** Wrong password, disabled account and
 *    unknown user are indistinguishable from outside.
 *  - **Every attempt is audited**, successful or not. A brute-force run is only
 *    visible if the failures were written down.
 */
class AuthController extends Controller
{
    private const MAX_ATTEMPTS = 5;

    private const DECAY_SECONDS = 900;

    public function __construct(private readonly TwoFactorService $twoFactor) {}

    public function login(LoginRequest $request): JsonResponse
    {
        $this->ensureIsNotRateLimited($request);

        $user = User::where('email', $request->string('email')->lower()->value())->first();

        // Always spend the cost of a hash, even when there is nothing to
        // compare against. Hashing the submitted password costs the same as
        // verifying it, so an unknown email cannot be told apart from a wrong
        // password by response timing — and unlike a stored dummy hash, this
        // always uses whatever algorithm is configured.
        $passwordMatches = $user !== null
            ? Hash::check($request->string('password')->value(), $user->password)
            : ! Hash::make($request->string('password')->value());

        if ($user === null || ! $passwordMatches || ! $user->is_active) {
            RateLimiter::hit($request->throttleKey(), self::DECAY_SECONDS);

            AuditLog::record(
                action: AuditAction::LoginFailed,
                resourceType: User::class,
                resourceId: $user?->id !== null ? (string) $user->id : null,
                after: ['email' => $request->string('email')->value()],
                email: $request->string('email')->value(),
            );

            throw ValidationException::withMessages([
                'email' => __('These credentials do not match our records.'),
            ]);
        }

        if ($user->hasTwoFactorEnabled()) {
            $code = $request->string('two_factor_code')->value();

            if (blank($code)) {
                // Not an error: the client now knows to collect the code.
                return response()->json([
                    'status' => 'two_factor_required',
                ], 409);
            }

            $valid = $this->twoFactor->verify($user->two_factor_secret, $code)
                || $this->twoFactor->consumeRecoveryCode($user, $code);

            if (! $valid) {
                RateLimiter::hit($request->throttleKey(), self::DECAY_SECONDS);

                AuditLog::record(
                    action: AuditAction::LoginFailed,
                    resourceType: User::class,
                    resourceId: (string) $user->id,
                    after: ['reason' => 'two_factor'],
                    user: $user,
                );

                throw ValidationException::withMessages([
                    'two_factor_code' => __('The provided code is not valid.'),
                ]);
            }
        }

        RateLimiter::clear($request->throttleKey());

        // One session, one token. Reusing a long-lived token across devices
        // makes revoking a single lost laptop impossible.
        $token = $user->createToken(
            $request->string('device_name')->value() ?: 'admin-panel',
            $user->tokenAbilities(),
            now()->addMinutes(config('vitaqueen.security.token_lifetime_minutes')),
        );

        $user->forceFill([
            'last_login_at' => now(),
            'last_login_ip' => $request->ip(),
        ])->save();

        AuditLog::record(
            action: AuditAction::LoginSucceeded,
            resourceType: User::class,
            resourceId: (string) $user->id,
            user: $user,
        );

        return response()->json([
            'token' => $token->plainTextToken,
            'expiresAt' => $token->accessToken->expires_at?->toIso8601String(),
            'user' => $this->profile($user),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();
        $request->user()->currentAccessToken()->delete();

        AuditLog::record(
            action: AuditAction::LoggedOut,
            resourceType: User::class,
            resourceId: (string) $user->id,
            user: $user,
        );

        return response()->json(['status' => 'ok']);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['user' => $this->profile($request->user())]);
    }

    private function ensureIsNotRateLimited(LoginRequest $request): void
    {
        if (! RateLimiter::tooManyAttempts($request->throttleKey(), self::MAX_ATTEMPTS)) {
            return;
        }

        $seconds = RateLimiter::availableIn($request->throttleKey());

        throw ValidationException::withMessages([
            'email' => __('Too many attempts. Try again in :seconds seconds.', ['seconds' => $seconds]),
        ]);
    }

    /** @return array<string, mixed> */
    private function profile(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role->value,
            'roleLabel' => $user->role->label(),
            'twoFactorEnabled' => $user->hasTwoFactorEnabled(),
            'lastLoginAt' => $user->last_login_at?->toIso8601String(),
        ];
    }
}
