import DOMPurify from 'dompurify';

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
 * Sanitize an SVG string client-side before DOM insertion.
 * Second line of defence — server sanitizes first; this catches anything that slipped through
 * or was injected after server validation (OWASP A03/XSS, IEC 62443-4-2 SAR 3.2).
 */
export function sanitizeSVG(svgString) {
  if (!svgString) return '';
  return DOMPurify.sanitize(String(svgString), DOMPURIFY_CONFIG);
}

/**
 * Attach a MutationObserver to re-sanitize containerEl on any DOM mutation.
 * Guards against post-load injection via external JS or extensions (SRS §8.1).
 * Returns the observer — call .disconnect() in the component's unmounted() hook.
 */
export function createMutationGuard(containerEl) {
  const observer = new MutationObserver(() => {
    const current = containerEl.innerHTML;
    const clean = sanitizeSVG(current);
    if (clean !== current) {
      containerEl.innerHTML = clean;
    }
  });
  observer.observe(containerEl, { childList: true, attributes: true, subtree: true });
  return observer;
}
