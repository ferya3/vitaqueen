<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * The enquiry inbox.
 *
 * Read-mostly by design: messages are evidence of what a customer actually
 * asked, so the only mutation offered is marking one as handled.
 */
class ContactMessageController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', ContactMessage::class);

        $query = ContactMessage::query()->with('handler')->latest();

        if ($request->filled('topic')) {
            $query->where('topic', $request->string('topic')->value());
        }

        if ($request->boolean('unhandled')) {
            $query->whereNull('handled_at');
        }

        return response()->json(
            $query->paginate(min($request->integer('per_page', 25), 100)),
        );
    }

    public function show(ContactMessage $contactMessage): JsonResponse
    {
        $this->authorize('view', $contactMessage);

        return response()->json(['data' => $contactMessage->load('handler')]);
    }

    public function markHandled(Request $request, ContactMessage $contactMessage): JsonResponse
    {
        $this->authorize('update', $contactMessage);

        $contactMessage->forceFill([
            'handled_at' => now(),
            'handled_by' => $request->user()->id,
        ])->save();

        return response()->json(['data' => $contactMessage->fresh('handler')]);
    }

    public function destroy(ContactMessage $contactMessage): JsonResponse
    {
        $this->authorize('delete', $contactMessage);

        $contactMessage->delete();

        return response()->json(null, 204);
    }
}
