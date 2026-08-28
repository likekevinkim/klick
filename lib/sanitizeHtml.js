// lib/sanitizeHtml.js
// Single allowlist shared by every place that renders seller-authored rich-text
// (product description, company description, the rich-text editor's live preview).
// Previously duplicated identically in three files — keep any future changes to
// the allowlist in this one place.
import DOMPurify from 'dompurify';

const ALLOWED_TAGS = ['b', 'i', 'h3', 'ul', 'li', 'img', 'br', 'p'];
const ALLOWED_ATTR = ['src', 'alt', 'class'];

export function sanitizeProductHtml(html) {
  return DOMPurify.sanitize(html || '', { ALLOWED_TAGS, ALLOWED_ATTR });
}
