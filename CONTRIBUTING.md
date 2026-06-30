# Contributing to node-red-dashboard-2-scada-kit

Thank you for taking the time to contribute. This project is open to bug reports, feature requests, and pull requests from everyone.

## Reporting bugs

Open an issue on [GitHub Issues](https://github.com/jsgorana/node-red-dashboard-2-scada-kit/issues) using the **Bug report** template.  
Please include: Node-RED version, Dashboard 2.0 version, Node.js version, browser, and steps to reproduce.

**Security vulnerabilities** — do NOT open a public issue. See [SECURITY.md](SECURITY.md).

## Suggesting features

Open a [Feature request](https://github.com/jsgorana/node-red-dashboard-2-scada-kit/issues) issue. If it relates to a standard (ISA-101, ISA-18.2, WCAG, IEC 62443), mention it — that helps prioritise.

## Development setup

**Requirements:** Node.js ≥ 20, npm ≥ 10, Docker (for local Node-RED testing)

```bash
git clone https://github.com/jsgorana/node-red-dashboard-2-scada-kit.git
cd node-red-dashboard-2-scada-kit
npm install          # installs all workspaces
npm run build        # builds all packages
npm test             # runs all tests
```

**Testing in Docker Node-RED** (the primary integration test environment):
```bash
./scripts/dev-install.sh ui-mimic   # build → pack → install in container → restart
open http://localhost:1880
```

See `scripts/dev-install.sh` for details.

## Coding standards

- **ESLint + Prettier** — run `npm run lint` before committing.
- **No `eval`, `new Function`, or `v-html` with untrusted content** — these are hard lint errors.
- **No inline SVG event handlers** — attach listeners programmatically via `addEventListener`.
- **[Conventional Commits](https://www.conventionalcommits.org/)** — `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `security:`.
- **DCO sign-off required** — add `-s` to your commit: `git commit -s -m "feat: ..."`.  
  By signing off you certify the [Developer Certificate of Origin](https://developercertificate.org/).

## Pull request process

1. Branch from `main`: `git checkout -b feat/your-feature`
2. Write tests for any new behaviour.
3. Run `npm run lint && npm run build && npm test` — all must pass.
4. Update `CHANGELOG.md` under `[Unreleased]`.
5. Open the PR — one maintainer review is required before merge.
6. No direct pushes to `main`.

## Acknowledgements

See [NOTICE](NOTICE) for the full list of third-party projects this kit builds on or is inspired by.
