# Phase 4 Docker Faceplate Tests

This Docker test installs the local faceplate package into the running Node-RED container and adds one Dashboard 2.0 flow for live write-confirmation/RBAC checks.

## Flow Safety

The deploy script does not replace the full Node-RED flows array.

- It reads `GET /flows`.
- It finds only the tab labelled `SCADA Kit — Phase 4 Faceplate`.
- It updates that tab with `PUT /flow/:id`, or creates it with `POST /flow` when missing.
- Existing user flows remain untouched.

## Install Local Package

Build and pack the local workspace package, then install the tarball into Docker `/data`.

```sh
npm run build --workspace @jsgorana/node-red-dashboard-2-scada-faceplate
npm pack --workspace @jsgorana/node-red-dashboard-2-scada-faceplate --pack-destination work/phase4-packages
docker cp work/phase4-packages/jsgorana-node-red-dashboard-2-scada-faceplate-0.1.0.tgz node-red:/data/
docker exec node-red npm install --prefix /data /data/jsgorana-node-red-dashboard-2-scada-faceplate-0.1.0.tgz
docker restart node-red
```

Wait for `http://localhost:1880/flows` to respond before deploying the flow.

## Deploy And Verify

```sh
npm run phase4:deploy
npm run phase4:verify
```

The live Dashboard page is:

```text
http://localhost:1880/scada/faceplate
```

The verifier resets the audit endpoint, opens the Dashboard page, changes the PID setpoint, clicks `Write SP`, confirms the dialog, and expects the server-side RBAC gate to deny the unauthenticated browser write.

Expected audit payload:

```json
{
  "action": "pid.setpoint",
  "result": "DENIED",
  "reason": "role-not-authorized"
}
```

The verifier also checks that no audit is emitted before the confirmation click.
