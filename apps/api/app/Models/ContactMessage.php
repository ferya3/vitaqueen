<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\ContactTopic;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContactMessage extends Model
{
    protected $fillable = [
        'name', 'email', 'phone', 'company', 'topic', 'subject', 'message',
        'locale', 'ip_address', 'user_agent',
    ];

    protected function casts(): array
    {
        return [
            'topic' => ContactTopic::class,
            'handled_at' => 'datetime',
        ];
    }

    public function handler(): BelongsTo
    {
        return $this->belongsTo(User::class, 'handled_by');
    }
}
