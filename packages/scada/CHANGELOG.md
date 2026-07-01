# Changelog

All notable changes to this project will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).  
This project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-07-01

### Added
- Production Node-RED Dashboard 2.0 SCADA package with `ui-scada-mimic` and `ui-scada-faceplate`.
- Sanitized SVG mimic rendering with declarative tag bindings, comm-loss fallback, and keyboard-accessible SVG events.
- Faceplate templates for motor, valve, and PID equipment.
- Client write confirmation plus server-side RBAC, min/max validation, rate-of-change validation, interlock blocking, and structured audit records.
- ISA-18.2 alarm helpers and faceplate alarm controls for acknowledge, shelve/unshelve, and out-of-service intents.
- HP-HMI / ISA-101 SVG symbol catalog and importable `symbols` API.
- Example flows, documentation, CI, SBOM, and npm provenance release workflow.
