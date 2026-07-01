# Release and Publishing Notes

This project publishes one public npm package: `@jsgorana/node-red-dashboard-2-scada`.

## Release Checklist

Run these checks before tagging a release:

```bash
npm ci
npm run lint
npm test
npm run build
npm audit --omit=dev
npm pack --workspace packages/scada --dry-run
```

Also verify the package in a local Node-RED Dashboard 2.0 instance before publishing. Test flows must be additive and must not replace existing user flows.

## Package Contents

The npm package should contain only the runtime, editor definitions, built Dashboard resources, symbols, examples, and public docs needed by users:

- `lib`
- `nodes`
- `resources`
- `symbols`
- `examples`
- `docs/assets`
- `README.md`
- `CHANGELOG.md`
- `LICENSE`
- `NOTICE`

Do not publish local planning notes, raw SRS or gap-analysis files, flow backups, coverage output, or screenshots that are not used by the README.

## Publishing

Releases are intended to run through GitHub Actions on a protected tag:

1. Update `packages/scada/package.json` version.
2. Update root and package changelogs.
3. Commit, tag `vX.Y.Z`, and push the tag.
4. The release workflow builds, tests, generates a CycloneDX SBOM, and runs `npm publish --provenance --access public`.

After publishing, verify:

- npm shows the expected version and provenance.
- The GitHub release has the SBOM attached.
- `npm pack --dry-run` for the published version contains no local-only material.
- Node-RED Palette Manager can install the package.
