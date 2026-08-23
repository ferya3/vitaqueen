<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\AuditAction;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Support\Str;
use PragmaRX\Google2FA\Google2FA;

/**
 * TOTP second factor for the admin panel.
 *
 * A password alone is one leaked laptop away from someone editing the water
 * analysis published on a public website, so 2FA is required for every role
 * above content manager (see `config/vitaqueen.php`).
 *
 * Recovery codes are stored hashed. If the table leaks, the codes in it are not
 * usable — which is the entire point of having them.
 */
final class TwoFactorService
{
    public function __construct(private readonly Google2FA $google2fa) {}

    public function generateSecret(): string
    {
        return $this->google2fa->generateSecretKey(32);
    }

    /** otpauth:// URI for the authenticator app's QR code. */
    public function provisioningUri(User $user, string $secret): string
    {
        return $this->google2fa->getQRCodeUrl(
            config('app.name'),
            $user->email,
            $secret,
        );
    }

    public function verify(string $secret, string $code): bool
    {
        // One step of drift either way covers clock skew without widening the
        // window enough to matter.
        return $this->google2fa->verifyKey($secret, $code, 1);
    }

    /** @return array<int, string> The plaintext codes — shown once, never again. */
    public function generateRecoveryCodes(User $user): array
    {
        $plain = collect(range(1, 8))
            ->map(fn () => Str::lower(Str::random(5).'-'.Str::random(5)))
            ->all();

        $user->forceFill([
            'two_factor_recovery_codes' => array_map(
                fn (string $code) => hash('sha256', $code),
                $plain,
            ),
        ])->save();

        return $plain;
    }

    public function consumeRecoveryCode(User $user, string $code): bool
    {
        $hashes = $user->two_factor_recovery_codes ?? [];
        $needle = hash('sha256', mb_strtolower(trim($code)));

        $index = array_search($needle, $hashes, true);
        if ($index === false) {
            return false;
        }

        unset($hashes[$index]);
        $user->forceFill(['two_factor_recovery_codes' => array_values($hashes)])->save();

        return true;
    }

    public function confirm(User $user, string $secret): void
    {
        $user->forceFill([
            'two_factor_secret' => $secret,
            'two_factor_confirmed_at' => now(),
        ])->save();

        AuditLog::record(
            action: AuditAction::TwoFactorEnabled,
            resourceType: User::class,
            resourceId: (string) $user->id,
            user: $user,
        );
    }

    public function disable(User $user): void
    {
        $user->forceFill([
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
        ])->save();

        AuditLog::record(
            action: AuditAction::TwoFactorDisabled,
            resourceType: User::class,
            resourceId: (string) $user->id,
            user: $user,
        );
    }
}
