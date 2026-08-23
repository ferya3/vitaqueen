<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\AuditLog;
use App\Models\ContactMessage;
use Illuminate\Console\Command;

/**
 * Retention, enforced rather than promised.
 *
 * Two different clocks, because the data serves two different purposes:
 *
 *  - Audit rows are the record of who changed what. They are kept for years,
 *    then deleted, because an audit log nobody prunes eventually becomes its
 *    own liability.
 *  - The IP address and user agent on a contact message exist only to
 *    investigate abuse. After the abuse window closes they are personal data
 *    with no purpose, so they are stripped while the enquiry itself is kept.
 */
class PruneRetainedData extends Command
{
    protected $signature = 'vitaqueen:prune {--dry-run : Report what would be removed without touching anything}';

    protected $description = 'Apply data retention rules to audit logs and contact messages';

    public function handle(): int
    {
        $auditCutoff = now()->subDays(config('vitaqueen.security.audit_retention_days'));
        $piiCutoff = now()->subDays(config('vitaqueen.security.contact_pii_retention_days'));

        $auditQuery = AuditLog::where('created_at', '<', $auditCutoff);
        $piiQuery = ContactMessage::where('created_at', '<', $piiCutoff)
            ->where(fn ($q) => $q->whereNotNull('ip_address')->orWhereNotNull('user_agent'));

        if ($this->option('dry-run')) {
            $this->info("Audit rows to delete: {$auditQuery->count()}");
            $this->info("Contact messages to anonymise: {$piiQuery->count()}");

            return self::SUCCESS;
        }

        $deleted = $auditQuery->delete();
        $anonymised = $piiQuery->update(['ip_address' => null, 'user_agent' => null]);

        $this->info("Deleted {$deleted} audit rows.");
        $this->info("Anonymised {$anonymised} contact messages.");

        return self::SUCCESS;
    }
}
