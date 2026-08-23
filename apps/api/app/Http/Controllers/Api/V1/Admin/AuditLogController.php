<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Read-only view of the audit trail.
 *
 * There is no store, update or destroy: the log is written by model events and
 * pruned by a scheduled command. An audit log with a delete endpoint answers
 * "who changed this?" with "someone who could also delete the answer".
 */
class AuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAuditLog', User::class);

        $query = AuditLog::query()->with('user:id,name,email')->latest();

        foreach (['action', 'resource_type', 'resource_id', 'user_id'] as $filter) {
            if ($request->filled($filter)) {
                $query->where($filter, $request->input($filter));
            }
        }

        if ($request->filled('from')) {
            $query->where('created_at', '>=', $request->date('from'));
        }

        if ($request->filled('to')) {
            $query->where('created_at', '<=', $request->date('to'));
        }

        return response()->json($query->paginate(min($request->integer('per_page', 50), 200)));
    }
}
