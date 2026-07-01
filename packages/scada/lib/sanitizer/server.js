import { JSDOM } from 'jsdom';
import createDOMPurify from 'dompurify';

// jsdom disables DTD/DOCTYPE processing by default — prevents entity-expansion (billion-laughs) DoS
// (SRS §8.1, IEC 62443-4-2 CR 7.1)
const { window } = new JSDOM('');
const DOMPurify = createDOMPurify(window);

const DOMPURIFY_CONFIG = {
  USE_PROFILES: { svg: true, svgFilters: true },
  FORCE_BODY: true,
  FORBID_TAGS: ['script', 'foreignObject', 'iframe', 'object', 'embed', 'link', 'meta', 'style'],
  // Block javascript: and data: URIs in ANY attribute (href, xlink:href, src, action, etc.)
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
};

// Strip every attribute starting with "on" — catches all DOM event handlers including
// SVG animation events (onbegin, onend, onrepeat) that a static FORBID_ATTR list would miss.
DOMPurify.addHook('uponSanitizeAttribute', (node, evt) => {
  if (evt.attrName.toLowerCase().startsWith('on')) {
    evt.forceKeepAttr = false;
    node.removeAttribute(evt.attrName);
  }
});

/**
 * Sanitize an SVG string on the server before storing or forwarding to clients.
 * Strips <script>, <foreignObject>, all on* event-handler attributes, and javascript:/data: URIs.
 * Returns an empty string for falsy input.
 *
 * Defense-in-depth: the client re-sanitizes before DOM insertion (OWASP A03/XSS, IEC 62443-4-2 SAR 3.2).
 */
export function sanitizeSVG(svgString) {
  if (!svgString) return '';
  return DOMPurify.sanitize(String(svgString), DOMPURIFY_CONFIG);
}
