<?php

declare(strict_types=1);

namespace App\Enums;

/** Routing key for an enquiry. Decides which mailbox gets notified. */
enum ContactTopic: string
{
    case General = 'general';
    case Sales = 'sales';
    case Export = 'export';
    case Quality = 'quality';
    case Career = 'career';

    /** Config key holding the mailbox for this topic. */
    public function mailboxKey(): string
    {
        return "vitaqueen.mailboxes.{$this->value}";
    }
}
