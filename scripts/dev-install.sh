#!/bin/bash
# Install a package into the running Docker Node-RED container for local testing.
# Usage: ./scripts/dev-install.sh <package-dir>
# Example: ./scripts/dev-install.sh ui-mimic
#
# Prerequisites:
#   - Docker container named "node-red" running on port 1880
#   - Package already built: npm run build (from package dir or root)

set -e

PKG=${1:?Usage: $0 <package-dir>  e.g. ui-mimic}
CONTAINER="node-red"
PKG_DIR="packages/$PKG"

if [ ! -d "$PKG_DIR" ]; then
  echo "Error: $PKG_DIR does not exist"
  exit 1
fi

echo "==> Building $PKG..."
(cd "$PKG_DIR" && npm run build)

echo "==> Packing $PKG..."
TGZ=$(cd "$PKG_DIR" && npm pack --quiet | tail -1)
TGZ_PATH="$PKG_DIR/$TGZ"

echo "==> Copying $TGZ to container..."
docker cp "$TGZ_PATH" "$CONTAINER:/data/$TGZ"

echo "==> Installing in container..."
docker exec "$CONTAINER" npm install --prefix /data "/data/$TGZ"

echo "==> Restarting Node-RED..."
docker restart "$CONTAINER"

echo ""
echo "Done. Open http://localhost:1880 to verify."
echo "Check Node-RED logs: docker logs -f $CONTAINER"
