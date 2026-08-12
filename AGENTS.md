# MentorAndI Agent Guardrails

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Repository Identity and Isolation

- Project: **MentorAndI consumer AI mentoring application**.
- Expected GitHub remote: `MentorAndI/mentorandi`.
- Expected local repository: `~/mentorandi` unless the user explicitly provides another worktree for this same repository.
- Work only inside this repository and its worktrees.
- Never access, edit, copy from, or modify `ai-3d-platform`, `revault-portfolio-manager`, Mentor AI corporate-site repositories, or any unrelated repository.
- Do not import assumptions, task lists, architecture, credentials, data, terminology, or product rules from another project.
- Before beginning a new task, verify `pwd`, `git remote -v`, and `git status -sb`.
- Stop if the remote is not `MentorAndI/mentorandi` or if the prompt appears to belong to Revault, AI 3D, or another project.
- Start a fresh agent session whenever changing repositories. Do not continue one agent thread across multiple projects.

## Project Name

MentorAndI

## Product Definition

MentorAndI is a long-term AI mentor product.

It is not a generic chatbot. It is built around memory, goals, reflections and an ongoing mentor relationship.

## Development Rules

- For backlog-driven prompts, read `docs/CODEX_TASKS.md` after `AGENTS.md`, `docs/PROJECT_STATUS.md` and `docs/ARCHITECTURE.md`.
- Short prompts like `Implement Feature 086 from docs/CODEX_TASKS.md` are valid; implement only the named feature and obey its rules.
- Do not change the Prisma schema unless explicitly asked.
- Do not add packages unless explicitly asked.
- Do not expose raw database IDs in user-facing UI.
- Keep API routes thin.
- Keep repositories Prisma-only.
- Put business logic in services.
- Keep Mentor Core separate from UI.
- Do not remove dev routes.
- Do not break `/start`, `/mentor` or `/dev/mentor-test`.
- Current user message has priority over stale context.
- User ownership must be enforced for conversations, messages, memories, goals and reflections.
- Development fallback user is allowed only outside production.

## Core Architecture

- User resolution.
- Conversation service.
- Message service.
- Memory service.
- Goal service.
- Reflection service.
- Context Builder.
- Prompt Composer.
- Response Pipeline.
- LLM providers.
- Mock provider for deterministic development testing.
- OpenAI provider mode.
- Anthropic/Claude provider mode.

## Required Verification After Code Changes

- `npm run check:env`
- `npm run lint`
- `npm run build`
- Manual check `/start`
- Manual check `/mentor`
- Manual check `/dev/mentor-test`

Before committing, confirm that only MentorAndI files are changed and no cross-project content was introduced.

## Staging Deployment From Codex

- After runtime changes are committed and pushed to `main`, and only after all
  required checks pass, Codex may run `scripts/deploy-staging-remote.sh` when
  the user has explicitly approved a staging deployment.
- Staging deployment approval does not authorize a production deployment.
- Never add SSH keys, passwords, `.env`, `.env.staging`, or other deployment
  secrets to the repository or command output.
- See `docs/STAGING_DEPLOY.md` for defaults, overrides, and prerequisites.
