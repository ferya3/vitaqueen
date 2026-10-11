/**
 * Turns the admin panel's lightweight text format into HTML.
 *
 * The CMS stores what an editor typed, never HTML. Rendering escapes every
 * character first and only then recognises a handful of constructs, so there
 * is no sanitiser to get wrong: nothing the editor types can become a tag or
 * an attribute that this function did not write itself.
 *
 *   ## Heading            ### Smaller heading
 *   - bullet              1. numbered
 *   **bold**  *italic*    [link text](https://example.com)
 *   A blank line starts a new paragraph.
 */
const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, (char) => ESCAPES[char]);
}

/** Only web, mail and site-relative links. `javascript:` and friends never match. */
function safeHref(raw: string) {
  const href = raw.trim();
  if (/^https?:\/\/[^\s]+$/i.test(href) || /^mailto:[^\s]+$/i.test(href) || /^\/[^\s/][^\s]*$/.test(href) || href === '/') {
    return href;
  }
  return null;
}

function inline(text: string) {
  let html = escapeHtml(text);

  html = html.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (match, label: string, rawHref: string) => {
    // The href was escaped along with everything else; undo that for the check
    // and re-escape it for the attribute.
    const href = safeHref(rawHref.replace(/&amp;/g, '&'));
    if (!href) return label;
    const external = /^https?:/i.test(href);
    return `<a href="${escapeHtml(href)}"${external ? ' rel="noopener noreferrer" target="_blank"' : ''}>${label}</a>`;
  });
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');

  return html;
}

export function renderMarkup(source: string | null | undefined): string {
  if (!source) return '';

  const blocks = source.replace(/\r\n?/g, '\n').trim().split(/\n{2,}/);
  const out: string[] = [];

  for (const block of blocks) {
    const lines = block.split('\n').map((line) => line.trimEnd());

    if (lines.every((line) => /^\s*[-*]\s+/.test(line))) {
      out.push(`<ul>${lines.map((line) => `<li>${inline(line.replace(/^\s*[-*]\s+/, ''))}</li>`).join('')}</ul>`);
      continue;
    }
    if (lines.every((line) => /^\s*\d+[.)]\s+/.test(line))) {
      out.push(`<ol>${lines.map((line) => `<li>${inline(line.replace(/^\s*\d+[.)]\s+/, ''))}</li>`).join('')}</ol>`);
      continue;
    }

    const heading = /^(#{2,3})\s+(.+)$/.exec(lines[0]);
    if (heading) {
      const level = heading[1].length;
      out.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      const rest = lines.slice(1).join(' ').trim();
      if (rest) out.push(`<p>${inline(rest)}</p>`);
      continue;
    }

    out.push(`<p>${lines.map(inline).join('<br>')}</p>`);
  }

  return out.join('\n');
}
