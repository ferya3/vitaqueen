<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Enums\ContactTopic;
use App\Http\Controllers\Controller;
use App\Http\Requests\ContactRequest;
use App\Models\ContactMessage;
use App\Notifications\ContactMessageReceived;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Notification;

class ContactController extends Controller
{
    /**
     * Accepts an enquiry.
     *
     * The response says nothing about what was stored or who was notified. A
     * contact endpoint is the most-probed route on any corporate site, and an
     * error that distinguishes "no such mailbox" from "mail server down" is
     * reconnaissance handed over for free.
     */
    public function store(ContactRequest $request): JsonResponse
    {
        $message = ContactMessage::create([
            ...$request->safe()->only([
                'name', 'email', 'phone', 'company', 'topic', 'subject', 'message', 'locale',
            ]),
            'ip_address' => $request->ip(),
            'user_agent' => mb_substr((string) $request->userAgent(), 0, 255),
        ]);

        $topic = ContactTopic::from($request->string('topic')->value());
        $mailbox = config($topic->mailboxKey()) ?: config('vitaqueen.mailboxes.general');

        if (filled($mailbox)) {
            Notification::route('mail', $mailbox)
                ->notify(new ContactMessageReceived($message));
        }

        return response()->json(['status' => 'accepted'], 202);
    }
}
