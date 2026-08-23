<?php

declare(strict_types=1);

namespace App\Models\Concerns;

use App\Enums\AuditAction;
use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;

/**
 * Writes an audit record for every create, update and delete.
 *
 * Two rules make the log trustworthy:
 *
 *  1. It records the *diff*, not the whole row, so a reviewer can see what
 *     actually changed six months later without reading two JSON blobs.
 *  2. Anything named in `$auditExcluded` never reaches the log — password
 *     hashes and 2FA secrets must not be recoverable from an audit table that
 *     more people can read than the users table.
 */
trait Auditable
{
    public static function bootAuditable(): void
    {
        static::created(fn (Model $model) => $model->writeAudit(AuditAction::Created, [], $model->auditableAttributes($model->getAttributes())));

        static::updated(function (Model $model): void {
            $changes = $model->auditableAttributes($model->getChanges());
            if ($changes === []) {
                return;
            }

            $before = array_intersect_key(
                $model->auditableAttributes($model->getOriginal()),
                $changes,
            );

            $model->writeAudit(AuditAction::Updated, $before, $changes);
        });

        static::deleted(fn (Model $model) => $model->writeAudit(AuditAction::Deleted, $model->auditableAttributes($model->getOriginal()), []));
    }

    /**
     * @return array<int, string>
     *
     * A model adds to this by declaring `protected array $auditExclude`.
     * `property_exists` avoids Eloquent's `__get`, which would otherwise treat
     * the missing property as a relationship and throw.
     */
    public function auditExcluded(): array
    {
        return array_merge(
            ['password', 'remember_token', 'two_factor_secret', 'two_factor_recovery_codes', 'updated_at'],
            property_exists($this, 'auditExclude') ? $this->auditExclude : [],
        );
    }

    /**
     * @param  array<string, mixed>  $attributes
     * @return array<string, mixed>
     */
    public function auditableAttributes(array $attributes): array
    {
        return array_diff_key($attributes, array_flip($this->auditExcluded()));
    }

    /**
     * @param  array<string, mixed>  $before
     * @param  array<string, mixed>  $after
     */
    public function writeAudit(AuditAction $action, array $before, array $after): void
    {
        AuditLog::record(
            action: $action,
            resourceType: $this::class,
            resourceId: (string) $this->getKey(),
            before: $before,
            after: $after,
        );
    }
}
