# Setup Mode

> Tracks which mode the project is in: new, capture, resume, or setup-only.
> This file is auto-generated during Phase 0 detection.

## Current Mode

**Mode:** `new` | `capture` | `resume` | `setup-only`

**Last Updated:** [date]

## Mode Definitions

| Mode | When Used |
|------|----------|
| **NEW** | Empty folder, no source code, empty context/ stubs |
| **CAPTURE** | Has source code, but context/ is empty stubs or missing real content |
| **RESUME** | Has source code and context/ has real content — ready to continue building |
| **SETUP-ONLY** | No source code yet, but context/ has been populated for future work |

## Detection Notes

- **Confidence Score:** [1-10]
- **Detection Date:** [date]
- **What triggered this mode:** [brief description]

## History

| Date | Event | Notes |
|------|-------|-------|
| — | — | — |

## Mode Transition Log

When the mode changes, record it here:

```
[date]: new → capture (reason: user dropped framework into existing project)
[date]: capture → resume (reason: context populated, first feature started)
```