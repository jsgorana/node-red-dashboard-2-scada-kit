import assert from 'node:assert'
import { describe, it } from 'vitest'
import { sanitizeSVG } from '../lib/sanitizer/server.js'

// XSS corpus — every one of these must produce no script execution surface
const XSS_CORPUS = [
  // 1. Classic inline script tag
  { name: 'inline script tag',            input: '<svg><script>alert(1)</script><rect/></svg>',                            mustNotContain: ['<script', 'alert'] },
  // 2. Script with type attribute
  { name: 'script with type',             input: '<svg><script type="text/javascript">alert(1)</script></svg>',            mustNotContain: ['<script'] },
  // 3. onload on svg element
  { name: 'onload on svg',                input: '<svg onload="alert(1)"><rect/></svg>',                                    mustNotContain: ['onload'] },
  // 4. onload on child element
  { name: 'onload on rect',               input: '<svg><rect onload="alert(1)"/></svg>',                                   mustNotContain: ['onload'] },
  // 5. onclick
  { name: 'onclick attribute',            input: '<svg><circle onclick="alert(1)" r="10"/></svg>',                          mustNotContain: ['onclick'] },
  // 6. onerror
  { name: 'onerror attribute',            input: '<svg><image onerror="alert(1)" href="x"/></svg>',                        mustNotContain: ['onerror'] },
  // 7. javascript: href
  { name: 'javascript: href',             input: '<svg><a href="javascript:alert(1)"><text>click</text></a></svg>',        mustNotContain: ['javascript:'] },
  // 8. javascript: xlink:href
  { name: 'javascript: xlink:href',       input: '<svg><a xlink:href="javascript:alert(1)"><text>x</text></a></svg>',     mustNotContain: ['javascript:'] },
  // 9. data: URI script
  { name: 'data: URI in href',            input: '<svg><a href="data:text/html,<script>alert(1)</script>">x</a></svg>',   mustNotContain: ['data:text'] },
  // 10. foreignObject embedding HTML
  { name: 'foreignObject',                input: '<svg><foreignObject><div onmouseover="alert(1)">x</div></foreignObject></svg>', mustNotContain: ['foreignObject', 'onmouseover'] },
  // 11. CDATA script bypass
  { name: 'CDATA script',                 input: '<svg><script><![CDATA[alert(1)]]></script></svg>',                       mustNotContain: ['<script', 'alert'] },
  // 12. Obfuscated: capital letters
  { name: 'capital SCRIPT tag',           input: '<svg><SCRIPT>alert(1)</SCRIPT></svg>',                                   mustNotContain: ['<script', 'SCRIPT', 'alert'] },
  // 13. Event handler with spaces
  { name: 'onload with spaces',           input: '<svg><rect on load="alert(1)"/></svg>',                                  mustNotContain: ['alert'] },
  // 14. SVG use element with javascript href
  { name: 'use element javascript href',  input: '<svg><use href="javascript:alert(1)"/></svg>',                           mustNotContain: ['javascript:'] },
  // 15. animate element with values
  { name: 'animate with onbegin',         input: '<svg><animate onbegin="alert(1)" attributeName="x"/></svg>',             mustNotContain: ['onbegin', 'alert'] },
  // 16. set element
  { name: 'set element onend',            input: '<svg><set onend="alert(1)" attributeName="x" to="1"/></svg>',            mustNotContain: ['onend', 'alert'] },
  // 17. img element inside SVG
  { name: 'embedded img with onerror',    input: '<svg><image onerror="alert(1)"/></svg>',                                 mustNotContain: ['onerror'] },
  // 18. Multiple on* attributes
  { name: 'multiple on* attrs',           input: '<svg><rect onclick="a()" onmouseover="b()" onerror="c()"/></svg>',      mustNotContain: ['onclick', 'onmouseover', 'onerror'] },
  // 19. Uppercase javascript: URI
  { name: 'JAVASCRIPT: uppercase',        input: '<svg><a href="JAVASCRIPT:alert(1)">x</a></svg>',                        mustNotContain: ['JAVASCRIPT:', 'javascript:'] },
  // 20. vbscript: URI
  { name: 'vbscript: URI',               input: '<svg><a href="vbscript:msgbox(1)">x</a></svg>',                          mustNotContain: ['vbscript:'] },
  // 21. Embedded null bytes — DOMPurify strips the malformed tag; text content may remain but is inert
  { name: 'null byte in script tag',      input: '<svg><scr\0ipt>alert(1)</scr\0ipt></svg>',                              mustNotContain: ['<script', '<scr'] },
  // 22. HTML entity encoded event handler
  { name: 'entity encoded onclick',       input: '<svg><rect o&#110;click="alert(1)"/></svg>',                             mustNotContain: ['alert'] },
];

describe('SVG Sanitizer — server (XSS corpus)', () => {
  it('returns empty string for falsy input', () => {
    assert.strictEqual(sanitizeSVG(''), '');
    assert.strictEqual(sanitizeSVG(null), '');
    assert.strictEqual(sanitizeSVG(undefined), '');
  });

  it('passes through a clean SVG unchanged (modulo whitespace)', () => {
    const clean = '<svg xmlns="http://www.w3.org/2000/svg"><rect id="r1" width="100" height="100" fill="#9e9e9e"/></svg>';
    const result = sanitizeSVG(clean);
    assert.ok(result.includes('<rect'), 'clean rect should survive');
    assert.ok(result.includes('fill'), 'fill attribute should survive');
  });

  for (const { name, input, mustNotContain } of XSS_CORPUS) {
    it(`strips: ${name}`, () => {
      const result = sanitizeSVG(input);
      for (const forbidden of mustNotContain) {
        assert.ok(
          !result.toLowerCase().includes(forbidden.toLowerCase()),
          `Expected "${forbidden}" to be stripped from: ${result.slice(0, 200)}`
        );
      }
    });
  }
});
