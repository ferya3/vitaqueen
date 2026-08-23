<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\ContactMessage;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Internal notification for a new enquiry.
 *
 * Queued: a visitor should not wait on SMTP to see a confirmation, and an SMTP
 * outage should not turn into a 502 on the contact form.
 *
 * `replyTo` is the sender; `from` stays the application address, because
 * spoofing the visitor's domain in the From header is the fastest way to get
 * the factory's mail marked as spam.
 */
class ContactMessageReceived extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly ContactMessage $message) {}

    /** @return array<int, string> */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("[{$this->message->topic->value}] {$this->message->subject}")
            ->replyTo($this->message->email, $this->message->name)
            ->greeting('New enquiry from the website')
            ->line("From: {$this->message->name} <{$this->message->email}>")
            ->when($this->message->company, fn (MailMessage $mail) => $mail->line("Company: {$this->message->company}"))
            ->when($this->message->phone, fn (MailMessage $mail) => $mail->line("Phone: {$this->message->phone}"))
            ->line("Language: {$this->message->locale}")
            ->line('---')
            ->line($this->message->message)
            ->salutation('VitaQueen website');
    }
}
