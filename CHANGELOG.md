# Changelog

All notable changes to this project will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).  
This project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-07-01

### Added
- Production `@jsgorana/node-red-dashboard-2-scada` package for Node-RED Dashboard 2.0.
- `ui-scada-mimic` node for sanitized SVG mimic/synoptic rendering with declarative tag bindings.
- `ui-scada-faceplate` node with motor, valve, and PID templates.
- Server-side RBAC, engineering limit checks, setpoint rate limits, interlock blocking, and structured audit records.
- ISA-18.2 alarm state helpers plus faceplate alarm display/actions for acknowledge, shelve/unshelve, and out-of-service intents.
- HP-HMI / ISA-101 SVG symbol catalog with pump, motor, valve, tank, conveyor, breaker, bargraph, multistate indicator, mini-trend, and pipe symbols.
- DOMPurify-based SVG sanitization on server and client.
- Example flows, documentation, CI, Dependabot, SBOM, and npm provenance release workflow.
