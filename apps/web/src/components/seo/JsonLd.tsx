import { headers } from 'next/headers';

/**
 * Renders structured data inline.
 *
 * The nonce comes from the middleware; without it the strict CSP would refuse
 * the `<script>` block and the page would ship no structured data at all.
 */
export async function JsonLd({ data }: { data: object | object[] }) {
  const nonce = (await headers()).get('x-nonce') ?? undefined;

  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
