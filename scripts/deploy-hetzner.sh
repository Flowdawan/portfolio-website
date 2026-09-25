#!/usr/bin/env bash
# Uploads the static export in out/ to Hetzner webhosting.
#
#   DEPLOY_HOST=wwwNNN.your-server.de DEPLOY_USER=... LFTP_PASSWORD=... scripts/deploy-hetzner.sh
#
# Optional: DEPLOY_PROTOCOL (ftps | sftp, default ftps), DEPLOY_PATH (default public_html).
#
# The order keeps the live site consistent while it updates: new hashed assets
# go up first, then the pages that reference them, and only at the end are the
# stale assets of older builds removed. Nothing outside _next/ is ever deleted,
# so files placed on the server by hand stay untouched.
set -euo pipefail

: "${DEPLOY_HOST:?DEPLOY_HOST is required}"
: "${DEPLOY_USER:?DEPLOY_USER is required}"
: "${LFTP_PASSWORD:?LFTP_PASSWORD is required}"
protocol="${DEPLOY_PROTOCOL:-ftps}"
remote="${DEPLOY_PATH:-public_html}"
source="${DEPLOY_SOURCE:-out}"
parallel="${DEPLOY_PARALLEL:-4}"

if [ ! -f "$source/index.html" ] || [ ! -f "$source/.htaccess" ]; then
  echo "No complete build in $source/ (index.html and .htaccess expected) — run npm run build first." >&2
  exit 1
fi

case "$protocol" in
  ftps)
    url="ftp://$DEPLOY_HOST"
    settings="set ftp:ssl-force true; set ftp:ssl-protect-data true; set ssl:verify-certificate yes"
    ;;
  sftp)
    url="sftp://$DEPLOY_HOST"
    settings="set sftp:auto-confirm yes"
    ;;
  ftp)
    # Only for local testing: the password travels unencrypted.
    url="ftp://$DEPLOY_HOST"
    settings="set ftp:ssl-allow false"
    ;;
  *)
    echo "DEPLOY_PROTOCOL must be ftps or sftp (got: $protocol)" >&2
    exit 1
    ;;
esac

lftp <<EOF
set cmd:fail-exit yes
set net:max-retries 3
set net:reconnect-interval-base 5
set net:timeout 30
$settings
open --env-password -u "$DEPLOY_USER" "$url"
mirror --reverse --parallel=$parallel --verbose=1 "$source/_next" "$remote/_next"
mirror --reverse --parallel=$parallel --verbose=1 --exclude-glob _next/ "$source" "$remote"
mirror --reverse --parallel=$parallel --verbose=1 --delete --ignore-time "$source/_next" "$remote/_next"
bye
EOF

echo "Deployed $source/ to $protocol://$DEPLOY_HOST/$remote"
