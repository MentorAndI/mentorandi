# MentorAndI Engineering Guide

## 1. Purpose

This document is the engineering constitution for the MentorAndI project. It defines how the team designs, builds, reviews, tests, and maintains the codebase for a production SaaS product.

The guide exists to keep engineering decisions consistent as the project grows. It should help contributors move quickly without sacrificing reliability, security, accessibility, or long-term maintainability.

This document does not define product strategy or business logic. Product behavior should be captured in product specifications, tickets, acceptance criteria, and user-facing documentation.

## 2. Core Philosophy

MentorAndI should be built as a dependable production system, not as a prototype that happens to run in production.

Engineering decisions must favor clarity, correctness, and maintainability over cleverness. Code should be easy to read, easy to change, and difficult to misuse.

The project should remain boring in the best possible way: predictable structure, explicit data flow, small components, typed boundaries, accessible interfaces, and disciplined operational habits.

Every change should have a reason. Avoid speculative abstractions, unused configuration, premature scaling work, and business rules that are not grounded in a real requirement.

## 3. Project Architecture

MentorAndI is a Next.js application using the App Router, React, TypeScript, ESLint, and Tailwind CSS. Contributors must read the relevant local Next.js documentation in `node_modules/next/dist/docs/` before changing framework-specific behavior, because this project may use a Next.js version with breaking changes from earlier conventions.

The architecture should keep routing, UI, data access, domain logic, and infrastructure concerns separated. Route files should coordinate request or page behavior, while reusable logic should live outside route entry points when it grows beyond local presentation needs.

Prefer server-side execution for data access, secrets, authorization checks, and operations that should not run in the browser. Client components should be used intentionally for interactivity, browser APIs, local UI state, and animation.

Application boundaries should be explicit:

- Pages and layouts define route structure and composition.
- Components render UI and manage local interaction.
- API routes expose server-side endpoints when required.
- Shared utilities contain framework-agnostic helpers.
- Types describe contracts at module, API, and data boundaries.

## 4. Folder Structure

The current repository is intentionally small. Keep the structure simple until the codebase requires more organization.

Current top-level responsibilities:

- `app/`: Application routes, layouts, route handlers, and app-scoped components.
- `app/api/`: Server route handlers.
- `app/components/`: Components currently scoped to the app.
- `public/`: Static assets served directly.
- `docs/`: Project documentation and engineering process documents.
- Configuration files: Next.js, TypeScript, ESLint, PostCSS, package management, and related tooling.

As the project grows, prefer creating folders around stable responsibilities rather than temporary feature experiments. Reasonable future folders may include:

- `lib/` for shared utilities and integration helpers.
- `components/` for reusable cross-route UI.
- `types/` for shared TypeScript contracts.
- `hooks/` for reusable client-side React hooks.
- `tests/` for test utilities and cross-cutting test suites.

Do not move files into new folders only for aesthetic symmetry. Restructure when it reduces confusion, clarifies ownership, or removes meaningful duplication.

## 5. Component Rules

Components should be small, focused, and named by what they represent. Avoid components that mix unrelated responsibilities such as data fetching, authorization, layout, animation, and form behavior in one file.

Use server components by default. Add `"use client"` only when the component needs client-side state, effects, browser APIs, event handlers, animation libraries, or other client-only behavior.

Keep props explicit and typed. Avoid passing large unstructured objects through many layers unless the object is the actual domain contract being rendered.

Components should not invent business decisions. They should display state and trigger actions according to defined product behavior.

Prefer composition over configuration-heavy components. If a component needs many boolean props to support unrelated variants, split it into clearer pieces.

Reusable components must account for loading, empty, error, disabled, and responsive states where those states are relevant.

## 6. TypeScript Rules

TypeScript is a correctness tool and should be treated as part of the design process.

Use precise types at module boundaries, route handlers, component props, and shared utilities. Avoid `any` unless there is a documented reason and no safer alternative is practical.

Prefer inferred types for obvious local values and explicit types for public contracts. Keep exported types stable and intentional.

Use union types for known states instead of loose strings or multiple booleans. Model impossible states as impossible where practical.

Validate untrusted external input at runtime. TypeScript types do not prove the shape of data received from users, network calls, environment variables, storage, or third-party services.

Avoid suppressing TypeScript errors. A suppression must be rare, local, and accompanied by a clear explanation.

## 7. Styling Rules

Styling should be consistent, responsive, accessible, and easy to scan.

Use the project's established styling approach, including Tailwind CSS, existing global styles, and utility composition patterns already present in the repository.

Prefer shared design tokens and repeated class patterns over one-off visual decisions. When class names become hard to read or variants become complex, extract a small component or helper instead of duplicating long class lists.

Do not create visual styles that obscure usability. Production SaaS interfaces should prioritize clarity, hierarchy, density where appropriate, and predictable interaction.

Design for mobile, tablet, and desktop from the start. Text must not overflow controls, interactive targets must remain usable, and layout should not depend on a single viewport size.

Motion should support comprehension, not distract from the workflow. Respect reduced-motion preferences for non-essential animation.

## 8. Naming Conventions

Names should describe intent clearly without requiring knowledge of implementation details.

Use `PascalCase` for React components and TypeScript types. Use `camelCase` for variables, functions, hooks, and object properties. Use `UPPER_SNAKE_CASE` for true constants that are configuration-like and not expected to vary at runtime.

Custom hooks must start with `use`. Event handlers should be named for the user or system event they handle, such as `handleSubmit` or `handleSelectionChange`.

File names should follow the conventions of their framework location. Next.js route files must use the appropriate framework names, such as `page.tsx`, `layout.tsx`, and `route.ts`.

Avoid vague names such as `data`, `item`, `helper`, `manager`, or `utils` when a more specific name is available.

## 9. Git Workflow

All work should be traceable through Git. Keep changes focused and reviewable.

Before starting meaningful work, understand the current branch, local changes, and the scope of the task. Do not overwrite or revert another contributor's changes without explicit agreement.

Each pull request should address one coherent change. Avoid mixing feature work, refactors, dependency updates, formatting churn, and unrelated cleanup in a single review.

Run the relevant checks before requesting review. At minimum, run linting for code changes, and run build or tests when the change touches behavior, configuration, routing, or shared code.

## 10. Branch Strategy

The main branch should represent deployable production-quality code.

Use short-lived branches for feature work, fixes, documentation, and maintenance. Branch names should be descriptive and scoped to the change, such as:

- `feature/add-onboarding-flow`
- `fix/auth-callback-error`
- `docs/engineering-guide`
- `chore/update-eslint-config`

Long-running branches should be avoided. If a larger initiative is required, split it into reviewable increments that can be merged safely.

## 11. Commit Message Convention

Commit messages should be clear, specific, and useful during review or incident investigation.

Use a concise imperative subject line. Prefer this format:

```text
type(scope): summary
```

Recommended types:

- `feat`: User-facing product capability.
- `fix`: Bug fix.
- `docs`: Documentation-only change.
- `refactor`: Code restructuring without behavior change.
- `test`: Test-only change.
- `chore`: Tooling, dependency, or maintenance change.
- `style`: Formatting or styling change without logic changes.

Examples:

```text
docs(engineering): add engineering guide
fix(auth): handle missing callback state
refactor(ui): split sign-in component state
```

Commit bodies should explain why the change exists when the subject alone is not enough.

## 12. Code Review Rules

Code review protects users, the business, and the future maintainers of the system.

Reviewers should prioritize correctness, security, accessibility, maintainability, performance, and test coverage. Style comments should be grounded in project conventions, not personal preference.

Authors should keep pull requests small, describe the problem being solved, call out risky areas, and include verification steps.

Every review should ask:

- Is the behavior required and correctly implemented?
- Are edge cases and failure states handled?
- Is the code understandable to a future contributor?
- Are types, tests, and documentation appropriate for the risk?
- Does the change introduce security, privacy, performance, or accessibility regressions?

Approval means the reviewer believes the change is safe to merge, not merely that the code compiles.

## 13. Performance Rules

Performance is a product quality requirement.

Prefer server rendering and static optimization where they fit the user experience. Avoid pushing unnecessary data, logic, or dependencies to the client.

Keep client components small. Large interactive trees, unnecessary effects, and avoidable client-side state should be challenged during review.

Images, fonts, scripts, and animations must be used intentionally. Optimize media assets and avoid layout shifts.

Avoid repeated network requests, inefficient rendering loops, unbounded lists, and expensive work during render. Use pagination, streaming, caching, memoization, or background work when the measured problem justifies it.

Performance work should be guided by measurement. Do not add complexity for theoretical gains.

## 14. Accessibility Rules

Accessibility is a baseline requirement, not an enhancement.

Interfaces must support keyboard navigation, visible focus states, semantic HTML, appropriate labels, sufficient color contrast, and screen reader comprehension.

Use native HTML elements when they provide the correct behavior. Custom interactive elements must reproduce expected keyboard, focus, and ARIA behavior.

Forms must expose labels, validation messages, required states, and errors accessibly. Do not rely on color alone to communicate meaning.

Motion and animation must respect reduced-motion preferences when the animation is not essential.

Accessibility should be reviewed during implementation, not postponed until after visual design is complete.

## 15. AI Development Principles

AI tools may assist development, but human engineering judgment remains responsible for the final result.

AI-generated changes must be reviewed as carefully as any human-written code. Contributors must understand the code they submit and be able to explain its behavior, tradeoffs, and risks.

Do not use AI to invent business logic, product policy, legal language, security guarantees, or user-facing promises. These must come from approved product, legal, security, or stakeholder sources.

AI assistance should preserve existing architecture and conventions. It should not introduce new dependencies, frameworks, patterns, or broad refactors without explicit technical justification.

Never provide secrets, private customer data, credentials, or sensitive internal information to AI tools unless the tool and workflow have been approved for that data class.

## 16. Documentation Rules

Documentation should make the system easier to operate, review, and change.

Document architecture decisions, setup requirements, operational procedures, integration assumptions, and non-obvious tradeoffs. Avoid documenting obvious code mechanics that are better expressed through clear names and types.

Keep documentation close to the thing it explains when possible. Project-wide process and standards belong in `docs/`.

Update documentation in the same change that alters the documented behavior. Stale documentation is worse than missing documentation because it creates false confidence.

Documentation must distinguish between current behavior, planned behavior, and open questions.

## 17. Testing Strategy

Testing should match the risk and purpose of the change.

Use focused tests for pure logic, integration tests for module boundaries, and end-to-end tests for critical user workflows when those workflows exist.

Tests should verify observable behavior rather than implementation details. Avoid brittle tests that fail because of harmless refactors.

Every bug fix should include a regression test when practical. If a regression test is not added, the pull request should explain why.

Critical paths for authentication, authorization, billing, data persistence, and user-facing workflows should receive stronger test coverage as those areas are introduced.

Do not treat manual testing as a substitute for automated coverage on repeated production-critical behavior.

## 18. Security Principles

Security must be designed into the system from the beginning.

Never commit secrets, credentials, tokens, private keys, or production environment values. Use environment variables and approved secret management.

Validate and authorize all server-side operations. Client-side checks are useful for user experience but are not security controls.

Treat all user input, route parameters, request bodies, headers, cookies, and third-party responses as untrusted until validated.

Return only the data required by the caller. Avoid exposing internal errors, implementation details, stack traces, or sensitive identifiers to users.

Dependencies should be added cautiously. Evaluate maintenance status, package size, security posture, and whether the functionality is already available in the platform or existing dependencies.

## 19. Long-Term Maintainability

The project should be built so that future contributors can make confident changes.

Prefer explicit contracts, small modules, stable naming, and narrow responsibilities. Remove dead code, unused dependencies, obsolete comments, and abandoned experiments.

Refactor when the current design makes a necessary change harder than it should be. Do not refactor unrelated areas opportunistically inside feature work unless the refactor is required for the change.

Preserve architectural consistency. New patterns should be introduced only when they solve a real problem better than the current approach and can be explained clearly in review.

Maintainability includes operational clarity. A production SaaS project should make it easy to understand how to build, test, deploy, debug, secure, and recover the system.

This guide should evolve with the project. Changes to it should be reviewed with the same care as changes to production code, because it shapes how production code is written.
