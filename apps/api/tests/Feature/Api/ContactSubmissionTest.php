<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Models\ContactMessage;
use App\Notifications\ContactMessageReceived;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class ContactSubmissionTest extends TestCase
{
    use RefreshDatabase;

    /** @return array<string, mixed> */
    private function payload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Amir Rahimi',
            'email' => 'buyer@example.com',
            'topic' => 'export',
            'subject' => 'Container enquiry',
            'message' => 'We would like a quotation for a full container of the 500 ml format.',
            'locale' => 'en',
        ], $overrides);
    }

    public function test_it_stores_an_enquiry_and_notifies_the_right_mailbox(): void
    {
        Notification::fake();
        config(['vitaqueen.mailboxes.export' => 'export@vitaqueen.test']);

        $this->postJson('/api/v1/contact', $this->payload())
            ->assertStatus(202)
            ->assertJson(['status' => 'accepted']);

        $this->assertDatabaseHas('contact_messages', [
            'email' => 'buyer@example.com',
            'topic' => 'export',
        ]);

        Notification::assertSentOnDemand(ContactMessageReceived::class);
    }

    public function test_it_rejects_a_message_that_says_nothing(): void
    {
        $this->postJson('/api/v1/contact', $this->payload(['message' => 'hi']))
            ->assertStatus(422)
            ->assertJsonValidationErrors('message');

        $this->assertSame(0, ContactMessage::count());
    }

    public function test_it_rejects_an_unsupported_locale(): void
    {
        $this->postJson('/api/v1/contact', $this->payload(['locale' => 'de']))
            ->assertStatus(422)
            ->assertJsonValidationErrors('locale');
    }

    public function test_it_rejects_an_unknown_topic(): void
    {
        $this->postJson('/api/v1/contact', $this->payload(['topic' => 'anything']))
            ->assertStatus(422)
            ->assertJsonValidationErrors('topic');
    }

    public function test_it_throttles_repeated_submissions(): void
    {
        Notification::fake();

        for ($i = 0; $i < 3; $i++) {
            $this->postJson('/api/v1/contact', $this->payload())->assertStatus(202);
        }

        $this->postJson('/api/v1/contact', $this->payload())->assertStatus(429);
    }
}
