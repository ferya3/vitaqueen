<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\AuditAction;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Append-only record of who changed what, from where, and when.
 *
 * There is no `update()` path and no `updated_at`: an audit log you can edit is
 * a log you cannot cite. Retention is handled by a scheduled prune command, not
 * by editing rows.
 */
class AuditLog extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = [
        'user_id', 'user_email', 'action', 'resource_type', 'resource_id',
        'before', 'after', 'ip_address', 'user_agent',
    ];

    protected function casts(): array
    {
        return [
            'action' => AuditAction::class,
            'before' => 'array',
            'after' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @param  array<string, mixed>  $before
     * @param  array<string, mixed>  $after
     */
    public static function record(
        AuditAction $action,
        ?string $resourceType = null,
        ?string $resourceId = null,
        array $before = [],
        array $after = [],
        ?User $user = null,
        ?string $email = null,
    ): self {
        $user ??= auth()->user();
        $request = request();

        return static::create([
            'user_id' => $user?->id,
            'user_email' => $email ?? $user?->email,
            'action' => $action,
            'resource_type' => $resourceType,
            'resource_id' => $resourceId,
            'before' => $before ?: null,
            'after' => $after ?: null,
            'ip_address' => $request?->ip(),
            'user_agent' => mb_substr((string) $request?->userAgent(), 0, 255) ?: null,
        ]);
    }
}
