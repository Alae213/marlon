# Development Workflow

> Truthful to the current repo state on 2026-04-15. This file describes how work actually moves here, not an aspirational enterprise process.

## Current vs Planned

- Current: the default branch is `main`.
- Current: there are no repo-local GitHub Actions workflows in `.github/workflows/`.
- Current: there is no Husky or other pre-commit automation in the repo.
- Planned: quality gates may become stricter later, but today contributors are responsible for running the relevant checks themselves and reporting what they did.

## Branching

- Use `main` as the integration baseline.
- For multi-file features, risky fixes, or collaborative work, prefer a short-lived branch over committing unrelated work directly together.
- For very small local doc or cleanup changes, keep the diff narrow and self-contained.
- Do not mix feature work, drive-by refactors, and context rewrites in one branch unless they are tightly coupled.

## Before You Change Code

- Read the relevant context docs first, especially `context/project/TASK-LIST.md`, the matching feature doc in `context/features/`, and any technical contract you are touching.
- Check whether the behavior is already constrained by `context/project/DECISIONS.md` or `context/developer/SECURITY.md`.
- Confirm whether the work is Current implementation, Planned work, or a gap between the two. Make that distinction explicit in code comments, PR notes, and context updates.

## Implementation Loop

1. Understand the current behavior from code and context.
2. Make the smallest change that moves the task forward safely.
3. Validate the touched surface locally.
4. Update context if behavior, contracts, or decisions changed.
5. Record any known gaps truthfully instead of implying completion.

## Local Commands That Matter

- `npm run dev` - Next.js dev server plus the React Grab/OpenCode helper.
- `npm run dev:all` - Convex dev plus the same frontend flow.
- `npm run build` - production build check.
- `npm run lint` - ESLint.
- `npm test` - Bun tests.
- `npm run convex:dev`, `npm run convex:deploy`, `npm run convex:codegen` - Convex lifecycle scripts.

## Validation Expectations

- Run the checks that match your change, not a cargo-cult checklist.
- Frontend-only UI change: at minimum exercise the affected route manually and run lint on the touched code path if possible.
- Backend or route-handler change: run the relevant tests and verify the affected flow end to end when local setup allows.
- Schema or generated API change: regenerate Convex code when needed and verify consumers still compile/build.
- If pre-existing failures block a clean run, say so explicitly and separate them from regressions introduced by your change.

## Commits

- Commit messages do not need to follow strict Conventional Commits, but they should be short, imperative, and specific.
- Good examples for this repo: `Document current onboarding flow`, `Harden delivery credential checks`, `Fix order list dispatch action`.
- If a commit updates context to match shipped behavior, say that directly in the subject or body.
- Avoid bundling unrelated formatting churn into functional commits.

## Pull Requests and Review

- There is no documented automated PR gate in the repo today, so reviewers depend on your notes.
- Describe what changed, what you validated, and what remains unverified.
- Call out any Current vs Planned distinction when docs or code intentionally do not match the target-state vision yet.
- Keep PRs reviewable: one feature, one fix, or one context-alignment pass whenever possible.

## Context Maintenance

- `context/` is part of the workflow, not post-hoc decoration.
- Update `context/project/TASK-LIST.md` when meaningful tasks complete or new ones are discovered.
- Update feature docs when implementation details, acceptance state, or rollout reality changes.
- Update technical docs when env vars, APIs, dependencies, or data models change.
- Never overstate automation, test coverage, or rollout status.

## Release and Operations Reality

- Do not assume CI, release bots, or deployment guards will catch mistakes for you.
- There is no repo-local evidence of automated release workflow in this repository.
- Treat production-affecting changes, especially auth, payments, delivery, and data handling, as manual-risk changes that need explicit verification and careful notes.
