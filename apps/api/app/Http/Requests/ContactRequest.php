<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Enums\ContactTopic;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;

/**
 * Third and final validation of a contact submission.
 *
 * The browser validated it for the visitor's benefit, the Next.js route handler
 * validated it before forwarding, and this validates it because those two live
 * outside the trust boundary and this one does not.
 */
class ContactRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:2', 'max:120'],
            // `rfc` only, deliberately no `dns`: a DNS lookup on a public,
            // unauthenticated endpoint is a network call an attacker can make
            // the server perform, and it rejects valid addresses whenever the
            // resolver is slow. Deliverability is proven by the reply, not by
            // an MX record.
            'email' => ['required', 'email:rfc', 'max:180'],
            'phone' => ['nullable', 'string', 'max:40'],
            'company' => ['nullable', 'string', 'max:160'],
            'topic' => ['required', new Enum(ContactTopic::class)],
            'subject' => ['required', 'string', 'min:3', 'max:200'],
            'message' => ['required', 'string', 'min:20', 'max:4000'],
            'locale' => ['required', 'string', Rule::in(config('vitaqueen.locales'))],
        ];
    }

    public function messages(): array
    {
        return [
            'message.min' => 'Please describe your enquiry in a little more detail.',
        ];
    }
}
