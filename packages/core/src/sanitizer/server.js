const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');

// Create window once at module load — not per call
const { window } = new JSDOM('');
const DOMPurify = createDOMPurify(window);

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

// Matches href or xlink:href with javascript: or data: URIs (single or double quotes)
const DANGEROUS_HREF_RE = /(href|xlink:href)\s*=\s*["']\s*(javascript:|data:)[^"']*/gi;

/**
 * Sanitize an SVG string on the server before storing or forwarding to clients.
 * Strips <script>, <foreignObject>, all on* event handlers, and javascript:/data: URIs.
 * Returns an empty string for falsy input.
 */
function sanitizeSVG(svgString) {
  if (!svgString) return '';
  const sanitized = DOMPurify.sanitize(String(svgString), DOMPURIFY_CONFIG);
  return sanitized.replace(DANGEROUS_HREF_RE, '$1=""');
}

module.exports = { sanitizeSVG };
