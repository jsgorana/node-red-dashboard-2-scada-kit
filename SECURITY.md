# Security Policy

## Supported versions

Only the latest published minor version of each package receives security fixes.

| Package | Supported |
|---------|-----------|
| Latest minor (`x.Y.*`) | ✅ |
| Older minors | ❌ |

## Reporting a vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Email **jsgorana@gmail.com** with:

- A clear description of the vulnerability
- Steps to reproduce (minimal flow JSON, if applicable)
- Affected package(s) and version(s)
- Any relevant logs or screenshots

We will acknowledge your report within **72 hours** and aim to ship a fix within **90 days** for critical issues.

## Disclosure policy

We follow coordinated disclosure. We will:

1. Confirm the issue and assess severity.
2. Develop and test a fix on a private branch.
3. Release the fix with a security advisory.
4. Credit the reporter in the advisory and CHANGELOG (unless you prefer to remain anonymous).

## Known attack surface

The dominant risk in this kit is **XSS via untrusted SVG** (user- or PLC-supplied SVG content rendered inline in the browser). The mitigations are documented in the SRS and implemented in `packages/scada/lib/sanitizer/`. If you find a bypass, it is high priority — please report it.
