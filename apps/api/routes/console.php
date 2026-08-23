<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Schedule;

// Retention is a daily job, not a quarterly reminder someone eventually
// ignores. Runs off-peak so a large first prune does not compete with traffic.
Schedule::command('vitaqueen:prune')->dailyAt('03:20')->onOneServer();

// Expired Sanctum tokens are dead weight and a needless attack surface.
Schedule::command('sanctum:prune-expired --hours=24')->daily()->onOneServer();
