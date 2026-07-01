# Publishing & flows.nodered.org Submission (Phase 8)

This is the runbook for releasing the SCADA Kit to npm and listing it on [flows.nodered.org](https://flows.nodered.org). The flow library indexes **published npm packages** that have the `node-red` keyword and a `node-red` section in `package.json` — so npm publish comes first.

The kit ships as a **single package**, [`@jsgorana/node-red-dashboard-2-scada`](https://www.npmjs.com/package/@jsgorana/node-red-dashboard-2-scada), which registers both `ui-scada-mimic` and `ui-scada-faceplate` and bundles the binding DSL/sanitizer library and the SVG symbol library.

> These steps require your npm and GitHub credentials and perform irreversible, public actions. Run them yourself; they are not automated by the assistant.

## Pre-flight — already done

- [x] Complete metadata: `name`, `version` (0.1.0), `description`, `license`, `author`, `repository` (+ `directory`), `bugs`, `homepage`, `keywords`, `engines`.
- [x] `publishConfig.access: "public"` (scoped packages publish privately by default otherwise).
- [x] `LICENSE` + `NOTICE` (Apache-2.0) and `README.md` (npmjs renders it) bundled in the tarball.
- [x] `node-red` section registers both nodes; `node-red-dashboard-2.widgets` declares both widget UMDs.
- [x] Built `resources/ui-scada-mimic.umd.js` + `resources/ui-scada-faceplate.umd.js` present.
- [x] `npm publish --dry-run --access public` clean.
- [x] `npm run lint` clean; `npm test` green (83 tests); both nodes verified rendering live in Docker.

## Option A — automated release (recommended)

The repo has [`.github/workflows/release.yml`](../.github/workflows/release.yml). It builds, tests, generates a CycloneDX SBOM, and runs `npm publish --workspaces --provenance --access public` on any `v*` tag. (There is one publishable workspace — `packages/scada` — so `--workspaces` publishes just it.)

1. **Create an npm automation token** (npmjs.com → Access Tokens → *Automation*). The `@jsgorana` npm scope must exist and your account must be able to publish to it.
2. **Add it as a GitHub secret** named `NPM_TOKEN` (repo → Settings → Secrets and variables → Actions → New repository secret). *(Settings changes — do these in the GitHub UI yourself.)*
3. **Commit and push** the current working tree to `main`.
4. **Tag and push**:
   ```bash
   git tag v0.1.0
   git push origin v0.1.0
   ```
5. Watch the **Actions** tab. On success the package is on npm with provenance, and an SBOM is attached to the GitHub release.

## Option B — manual publish

```bash
npm login        # authenticate to npmjs as jsgorana
npm run build    # build both widget UMDs
npm test         # gate
npm publish --workspace @jsgorana/node-red-dashboard-2-scada --access public
```

## Verify on npm

```bash
npm view @jsgorana/node-red-dashboard-2-scada
```

Confirm the version, that the `node-red` section lists both nodes, and that the README renders on the package page.

## List on flows.nodered.org

1. Go to [flows.nodered.org](https://flows.nodered.org) and **sign in with GitHub**.
2. Use **add → node** and enter the package name `@jsgorana/node-red-dashboard-2-scada`.
   - The site validates that the package exists on npm and has a `node-red` section.
   - Packages with the `node-red` keyword are also picked up by the periodic npm scan, so the listing may also appear automatically within a day.
3. A single entry lists both nodes.

## Post-release

- Write the GitHub release notes from `CHANGELOG.md`.
- Bump `version` for the next change set.
- Smoke-test install from npm into a clean Node-RED: `npm install @jsgorana/node-red-dashboard-2-scada`, confirm both nodes appear and the example flows import.
