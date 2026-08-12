#!/usr/bin/env bash

set -Eeuo pipefail

readonly DEFAULT_STAGING_SSH_TARGET="root@srv1515503.hstgr.cloud"
readonly DEFAULT_STAGING_REMOTE_APP_DIR="/docker/mentorandi"

staging_ssh_target="${STAGING_SSH_TARGET:-$DEFAULT_STAGING_SSH_TARGET}"
staging_remote_app_dir="${STAGING_REMOTE_APP_DIR:-$DEFAULT_STAGING_REMOTE_APP_DIR}"
staging_ssh_identity_file="${STAGING_SSH_IDENTITY_FILE:-}"

fail() {
  echo "Remote staging deploy failed: $*" >&2
  exit 1
}

command -v ssh >/dev/null 2>&1 || fail "ssh is required."

[[ -n "$staging_ssh_target" ]] || fail "STAGING_SSH_TARGET must not be empty."
[[ "$staging_ssh_target" != -* ]] || fail "STAGING_SSH_TARGET must not begin with a dash."
[[ ! "$staging_ssh_target" =~ [[:space:]] ]] ||
  fail "STAGING_SSH_TARGET must not contain whitespace."

[[ "$staging_remote_app_dir" =~ ^/[A-Za-z0-9._/-]+$ ]] ||
  fail "STAGING_REMOTE_APP_DIR must be an absolute path containing only letters, numbers, dot, underscore, dash, and slash."

if [[ -z "$staging_ssh_identity_file" && -n "${HOME:-}" ]]; then
  default_identity_file="${HOME}/.ssh/mentorandi_vps"

  if [[ -f "$default_identity_file" ]]; then
    staging_ssh_identity_file="$default_identity_file"
  fi
fi

ssh_options=(
  -o BatchMode=yes
  -o ConnectTimeout=15
  -o StrictHostKeyChecking=accept-new
)

if [[ -n "$staging_ssh_identity_file" ]]; then
  [[ -f "$staging_ssh_identity_file" ]] ||
    fail "STAGING_SSH_IDENTITY_FILE does not reference a file."
  ssh_options+=(-i "$staging_ssh_identity_file")
fi

echo "Deploying MentorAndI staging via ${staging_ssh_target}:${staging_remote_app_dir} ..."

ssh \
  "${ssh_options[@]}" \
  -- \
  "$staging_ssh_target" \
  "cd '$staging_remote_app_dir' && ./scripts/deploy-staging.sh"

echo "Remote staging deploy completed successfully."
