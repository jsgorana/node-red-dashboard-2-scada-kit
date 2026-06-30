import DOMPurify from 'dompurify';

const DOMPURIFY_CONFIG = {
  USE_PROFILES: { svg: true, svgFilters: true },
  FORBID_TAGS: ['script', 'foreignObject', 'iframe', 'object', 'embed', 'link', 'meta', 'style'],
  FORBID_ATTR: [
    'onload', 'onclick', 'onerror', 'onmouseover', 'onmouseout', 'onmouseenter', 'onmouseleave',
    'onfocus', 'onblur', 'onchange', 'oninput', 'onsubmit', 'onkeydown', 'onkeyup', 'onkeypress',
    'oncontextmenu', 'ondblclick', 'onpointerdown', 'onpointerup', 'onanimationend', 'onanimationstart',
    'ontransitionend', 'onwheel', 'ondrag', 'ondrop', 'onpaste', 'oncopy', 'oncut',
  ],
};

const DANGEROUS_HREF_RE = /(href|xlink:href)\s*=\s*["']\s*(javascript:|data:)[^"']*/gi;

/** Sanitize an SVG string client-side before DOM insertion. */
export function sanitizeSVG(svgString) {
  if (!svgString) return '';
  const sanitized = DOMPurify.sanitize(String(svgString), DOMPURIFY_CONFIG);
  return sanitized.replace(DANGEROUS_HREF_RE, '$1=""');
}

/**
 * Attach a MutationObserver to re-sanitize containerEl on any DOM mutation.
 * Returns the observer — call .disconnect() on component unmount.
 */
export function createMutationGuard(containerEl, onViolation) {
  const observer = new MutationObserver(() => {
    const current = containerEl.innerHTML;
    const clean = sanitizeSVG(current);
    if (clean !== current) {
      containerEl.innerHTML = clean;
      if (onViolation) onViolation();
    }
  });

  observer.observe(containerEl, { childList: true, attributes: true, subtree: true });
  return observer;
}
