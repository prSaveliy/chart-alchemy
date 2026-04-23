#!/bin/sh
set -e

# Materialize $GCP_KEY_JSON to a file so Vertex AI ADC can read it.
# The config var holds the full service-account JSON; GOOGLE_APPLICATION_CREDENTIALS
# must point at /tmp/gcp-key.json (set as a separate config var).
if [ -n "${GCP_KEY_JSON:-}" ]; then
  printf '%s\n' "$GCP_KEY_JSON" > /tmp/gcp-key.json
  chmod 600 /tmp/gcp-key.json
fi

exec "$@"
