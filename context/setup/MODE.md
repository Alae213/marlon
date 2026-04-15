# Setup Mode

> Tracks which mode the project is in: new, capture, resume, or setup-only.
> Verified against the current repo state on 2026-04-15.

## Current Mode

**Mode:** `resume`

**Last Updated:** 2026-04-15

## Mode Definitions

| Mode | When Used |
|------|----------|
| **NEW** | Empty folder, no source code, empty context stubs |
| **CAPTURE** | Has source code, but `context/` is empty stubs or missing real content |
| **RESUME** | Has source code and `context/` has real content; ready to continue building |
| **SETUP-ONLY** | No source code yet, but `context/` has been populated for future work |

## Detection Notes

- **Confidence Score:** 10/10
- **Detection Date:** 2026-04-15
- **What triggered this mode:** The repo contains a live Next.js + Convex codebase (`app/`, `components/`, `convex/`, `tests/`) and populated `context/` product, technical, design, ops, and feature docs.

## History

| Date | Event | Notes |
|------|-------|-------|
| 2026-04-15 | Verified current mode | Confirmed `resume` from live source files plus populated canonical context docs |

## Mode Transition Log

Historical setup transitions were not captured before this verification.
Record future mode changes here if the project state materially changes.
