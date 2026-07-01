# Changelog

All notable changes to this project will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).  
This project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial monorepo scaffold (npm workspaces)
- `packages/core` — stub for DSL parser, SVG sanitizer, alarm FSM, theme tokens
- `packages/ui-mimic` — stub for SVG synoptic display node
- `packages/ui-faceplate` — stub for equipment faceplate popup node
- `packages/symbols` — stub for HP-HMI SVG symbol library
- GitHub Actions CI workflow (lint + test + build)
- GitHub Actions release workflow (OIDC provenance + CycloneDX SBOM)
- Dependabot configuration
- Apache-2.0 license and NOTICE file with full acknowledgements
- CONTRIBUTING.md, SECURITY.md
- Docker local test script (`scripts/dev-install.sh`)
