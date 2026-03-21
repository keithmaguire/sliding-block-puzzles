#!/usr/bin/env bash
set -euo pipefail

IP_ADDRESS="${1:-}"

if [[ -z "$IP_ADDRESS" ]]; then
  echo "usage: $0 <lan-ip-address>" >&2
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CERT_DIR="$ROOT_DIR/.local-https"
KEY_PATH="$CERT_DIR/local.key"
CERT_PATH="$CERT_DIR/local.crt"
CONFIG_PATH="$CERT_DIR/openssl.cnf"

mkdir -p "$CERT_DIR"

cat >"$CONFIG_PATH" <<EOF
[req]
default_bits = 2048
prompt = no
default_md = sha256
x509_extensions = v3_req
distinguished_name = dn

[dn]
CN = $IP_ADDRESS

[v3_req]
subjectAltName = @alt_names
extendedKeyUsage = serverAuth

[alt_names]
IP.1 = $IP_ADDRESS
DNS.1 = localhost
EOF

openssl req \
  -x509 \
  -nodes \
  -days 365 \
  -newkey rsa:2048 \
  -keyout "$KEY_PATH" \
  -out "$CERT_PATH" \
  -config "$CONFIG_PATH"

echo "generated:"
echo "  $KEY_PATH"
echo "  $CERT_PATH"
