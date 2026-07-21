#!/usr/bin/env bash

set -Eeuo pipefail

readonly DEFAULT_DEPLOY_HOST="mentorandi-vps"
readonly STAGING_HEALTH_URL="https://staging.mentorandi.com/api/health"

deploy_host="${DEPLOY_HOST:-$DEFAULT_DEPLOY_HOST}"

if [[ -z "$deploy_host" || "$deploy_host" == -* ]]; then
  echo "Staging deploy failed: DEPLOY_HOST must be a valid SSH destination." >&2
  exit 1
fi

echo "Deploying MentorAndI staging through ${deploy_host}..."

ssh -o ConnectTimeout=15 "$deploy_host" '
  set -eu
  cd /docker/mentorandi
  git fetch origin main
  git pull --ff-only origin main
  docker compose --env-file .env.staging -f docker-compose.staging.yml --profile tools build mentorandi-staging-migrate
  docker compose --env-file .env.staging -f docker-compose.staging.yml --profile tools run --rm mentorandi-staging-migrate
  docker compose --env-file .env.staging -f docker-compose.staging.yml up -d --build
'

echo "Deployment command completed. Waiting for staging to become healthy..."
sleep 10

health_response="$({
  curl \
    --connect-timeout 10 \
    --fail \
    --max-time 20 \
    --retry 6 \
    --retry-all-errors \
    --retry-delay 5 \
    --show-error \
    --silent \
    "$STAGING_HEALTH_URL"
} || {
  echo "Staging deploy failed: health endpoint did not return HTTP success." >&2
  exit 1
})"

if ! printf '%s' "$health_response" | node -e '
  const fs = require("node:fs");

  try {
    const health = JSON.parse(fs.readFileSync(0, "utf8"));

    if (health.status !== "ok") {
      console.error(
        `Staging deploy failed: health status is ${JSON.stringify(health.status)}, expected "ok".`,
      );
      process.exit(1);
    }
  } catch (error) {
    console.error("Staging deploy failed: health response was not valid JSON.");
    process.exit(1);
  }
'; then
  exit 1
fi

echo "Staging deploy succeeded: ${STAGING_HEALTH_URL} returned status ok."
