<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Services\HtmlSanitizer;
use Tests\TestCase;

class HtmlSanitizerTest extends TestCase
{
    private HtmlSanitizer $sanitizer;

    protected function setUp(): void
    {
        parent::setUp();
        $this->sanitizer = new HtmlSanitizer;
    }

    public function test_it_removes_script_tags(): void
    {
        $clean = $this->sanitizer->clean('<p>Hello</p><script>alert(1)</script>');

        $this->assertStringNotContainsString('script', $clean);
        $this->assertStringContainsString('Hello', $clean);
    }

    public function test_it_removes_event_handlers(): void
    {
        $clean = $this->sanitizer->clean('<p onclick="steal()">Text</p>');

        $this->assertStringNotContainsString('onclick', $clean);
    }

    public function test_it_removes_javascript_urls(): void
    {
        $clean = $this->sanitizer->clean('<a href="javascript:alert(1)">Click</a>');

        $this->assertStringNotContainsString('javascript:', $clean);
    }

    public function test_it_removes_iframes(): void
    {
        $clean = $this->sanitizer->clean('<iframe src="https://evil.test"></iframe><p>Body</p>');

        $this->assertStringNotContainsString('iframe', $clean);
    }

    public function test_it_keeps_the_markup_an_editor_actually_needs(): void
    {
        $clean = $this->sanitizer->clean(
            '<h2>Heading</h2><p><strong>Bold</strong> and <em>italic</em></p>'
            .'<ul><li>One</li></ul><a href="https://vitaqueen.com">Link</a>'
        );

        $this->assertStringContainsString('<h2>', $clean);
        $this->assertStringContainsString('<strong>', $clean);
        $this->assertStringContainsString('<li>', $clean);
        $this->assertStringContainsString('href="https://vitaqueen.com"', $clean);
    }

    public function test_it_preserves_persian_text(): void
    {
        $clean = $this->sanitizer->clean('<p>آب معدنی طبیعی ویتاکوئین</p>');

        $this->assertStringContainsString('آب معدنی طبیعی ویتاکوئین', $clean);
    }

    public function test_it_cleans_every_locale_of_a_translatable_field(): void
    {
        $clean = $this->sanitizer->cleanTranslations([
            'en' => '<p>Safe</p><script>bad()</script>',
            'fa' => '<p>سالم</p><img src=x onerror=alert(1)>',
        ]);

        $this->assertStringNotContainsString('script', $clean['en']);
        $this->assertStringNotContainsString('onerror', $clean['fa']);
    }
}
