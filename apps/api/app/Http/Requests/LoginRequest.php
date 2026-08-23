<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'email', 'max:180'],
            'password' => ['required', 'string', 'max:255'],
            // TOTP code or a recovery code, supplied on the second step.
            'two_factor_code' => ['nullable', 'string', 'max:32'],
            'device_name' => ['nullable', 'string', 'max:120'],
        ];
    }

    /** Rate-limit key: this account from this address, not just this address. */
    public function throttleKey(): string
    {
        return mb_strtolower((string) $this->input('email')).'|'.$this->ip();
    }
}
