#!/usr/bin/env bash

set -Eeuo pipefail

readonly STAGING_ENV_FILE=".env.staging"
readonly STAGING_COMPOSE_FILE="docker-compose.staging.yml"
readonly STAGING_HEALTH_URL="https://staging.mentorandi.com/api/health"

on_error() {
  local exit_code=$?
  echo "Staging deploy failed near line ${BASH_LINENO[0]}." >&2
  exit "$exit_code"
}

trap on_error ERR

fail() {
  echo "Staging deploy failed: $*" >&2
  exit 1
}

command -v git >/dev/null 2>&1 || fail "git is required."

repo_root="$(git rev-parse --show-toplevel 2>/dev/null)" ||
  fail "run this command from the MentorAndI repository root."

if [[ "$PWD" != "$repo_root" ]]; then
  fail "run this command from the repository root: $repo_root"
fi

command -v docker >/dev/null 2>&1 || fail "Docker is required."
command -v curl >/dev/null 2>&1 || fail "curl is required."
command -v node >/dev/null 2>&1 || fail "Node.js is required."

[[ -f "$STAGING_COMPOSE_FILE" ]] ||
  fail "$STAGING_COMPOSE_FILE was not found in the repository root."

echo "Updating the staging checkout from origin/main..."
git fetch origin main
git pull --ff-only origin main

echo "Latest commit:"
git log -1 --oneline

[[ -f "$STAGING_ENV_FILE" ]] ||
  fail "$STAGING_ENV_FILE is required. Create it on the staging server; do not commit it."

echo "Applying pending staging database migrations..."
docker compose \
  --env-file "$STAGING_ENV_FILE" \
  -f "$STAGING_COMPOSE_FILE" \
  --profile tools \
  build mentorandi-staging-migrate
docker compose \
  --env-file "$STAGING_ENV_FILE" \
  -f "$STAGING_COMPOSE_FILE" \
  --profile tools \
  run --rm mentorandi-staging-migrate

echo "Building and starting MentorAndI staging..."
docker compose \
  --env-file "$STAGING_ENV_FILE" \
  -f "$STAGING_COMPOSE_FILE" \
  up -d --build

echo "Waiting briefly for the staging service to start..."
sleep 10

echo "Checking $STAGING_HEALTH_URL ..."
if ! health_response="$(curl \
  --connect-timeout 10 \
  --fail \
  --max-time 20 \
  --retry 6 \
  --retry-all-errors \
  --retry-delay 5 \
  --show-error \
  --silent \
  "$STAGING_HEALTH_URL")"; then
  fail "the health endpoint did not return an HTTP success response."
fi

echo "$health_response"

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
  } catch {
    console.error("Staging deploy failed: health response was not valid JSON.");
    process.exit(1);
  }
'; then
  exit 1
fi

echo "Staging deploy succeeded: $STAGING_HEALTH_URL reported status ok."
