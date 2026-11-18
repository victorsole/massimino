// src/lib/public-api/text.ts
// Builds the two canonical text fields every public resource carries:
//   body_txt   plain text, paragraphs separated by a blank line
//   body_html  the same content as minimal, escaped HTML (p, ul, ol, li, strong)
// The HTML is generated here from plain strings, never passed through from storage, so it
// cannot carry markup or script that someone typed into a description.

export type Block =
  | { kind: 'paragraph'; text: string }
  | { kind: 'heading'; text: string }
  | { kind: 'list'; ordered?: boolean; items: string[] };

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const clean = (text: string) => text.replace(/\s+/g, ' ').trim();

/** Free text typed by users may hold contact details; those never go out through the API. */
export function redactContacts(text: string): string {
  return text
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[email removed]')
    .replace(/(?:\+|00)\d[\d\s().-]{7,}\d/g, '[phone removed]');
}

export function paragraph(text?: string | null): Block[] {
  const value = text ? clean(text) : '';
  return value ? [{ kind: 'paragraph', text: value }] : [];
}

export function heading(text: string): Block {
  return { kind: 'heading', text: clean(text) };
}

export function list(items: Array<string | null | undefined>, ordered = false): Block[] {
  const values = items.map((item) => (item ? clean(item) : '')).filter(Boolean);
  return values.length ? [{ kind: 'list', ordered, items: values }] : [];
}

/** Splits stored instructions ("Step one.\nStep two.") into an ordered list. */
export function steps(text?: string | null): Block[] {
  if (!text) return [];
  const lines = text
    .split(/\r?\n+/)
    .map((line) => clean(line.replace(/^\s*(?:\d+[.)]|[-*•])\s*/, '')))
    .filter(Boolean);
  if (lines.length <= 1) return paragraph(text);
  return [{ kind: 'list', ordered: true, items: lines }];
}

export function renderBody(blocks: Block[]): { body_txt: string; body_html: string } {
  const txt: string[] = [];
  const html: string[] = [];
  for (const block of blocks) {
    if (block.kind === 'paragraph') {
      txt.push(block.text);
      html.push(`<p>${escapeHtml(block.text)}</p>`);
    } else if (block.kind === 'heading') {
      txt.push(block.text);
      html.push(`<p><strong>${escapeHtml(block.text)}</strong></p>`);
    } else {
      txt.push(block.items.map((item, i) => (block.ordered ? `${i + 1}. ${item}` : `- ${item}`)).join('\n'));
      const tag = block.ordered ? 'ol' : 'ul';
      html.push(`<${tag}>${block.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</${tag}>`);
    }
  }
  return { body_txt: txt.join('\n\n'), body_html: html.join('') };
}

/** RFC 3339 timestamp, or null */
export function timestamp(value?: Date | string | null): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/** "INTERMEDIATE" or "Intermediate to Advanced" become "intermediate" */
export function slugValue(value?: string | null): string | null {
  if (!value) return null;
  const v = clean(value).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  return v || null;
}
