# Project Setup Wizard

> **Claude — read this entire file before asking the user anything.**
> Then follow each phase in order without skipping or combining.
> Use plain, friendly, non-technical language throughout.

---

## The Scratchpad Rule — Read This First

As you learn things about the project, write them immediately to a temp file:

  .opencode/setup-scratchpad.md

Create this file at the start of Phase 1 and update it after every answer.
Before asking any question in any phase, read the scratchpad first.
Use what you already know to make questions specific, not generic.

The scratchpad format:

```
# Setup Scratchpad

## Mode Detection
- mode: [new | capture | resume | setup-only]
- detection confidence: [1-10]
- exploration report: [yes/no - read]

## What I found in the code (CAPTURE/RESUME)
- detected stack: [list from explore agent]
- detected features: [list from explore agent]
- code status: [working | partial | broken | unknown]
- missing pieces: [what the explore agent identified]

## What they told me in Phase 1
- platform: [web app / mobile / internal tool / etc]
- stack preference: [what they said]
- hosting: [what they said]
- needs data storage: [yes/no + detail]
- auth: [yes/no + detail]
- team size: [solo / small team / etc]
- tools already chosen: [list]
- budget: [free tiers / has budget / etc]

## What I know about the idea (Phase 2+)
- core idea: [one line as soon as they say it]
- problem: [who has it, how painful]
- current solution: [what they do today]
- primary user: [description]
- user type count: [single / multiple]
- key differentiator: [what makes it different]
- most important feature: [the one thing]

## Features (Phase 3)
- [feature name]: [one line description, scope, status]
- [from code]: [feature detected from explore agent]

## Design (Phase 4)
- tone: [words they used]
- references: [apps they admire]
- hard nos: [things they dont want]
```

**The rule:** Never ask something you already know from the scratchpad.
If Phase 2 asks "what are you building?" but they already told you in Phase 1
that it's a web app for freelancers — skip that part, acknowledge it,
and ask for the detail you don't have yet.

---

## Phase 0 — Project Detection

**IMPORTANT:** Before asking any questions, you MUST detect the project state.

### Step 0.1 — Check What Exists

Look at the project folder and determine what you're working with:

1. **Check the root folder** — Are there source files? (src/, app/, pages/, *.js, *.ts, etc.)
2. **Check context/** — Do any files have real content, or are they just empty stubs?
3. **Check for package.json** — Is there a Node.js project with dependencies?
4. **Check existing docs** — Is there a README.md with project info?

### Step 0.2 — Determine Mode

Based on what you find, select the appropriate mode:

| What You Find | Mode | Description |
|---------------|------|-------------|
| Empty folder, no code, empty context | **NEW** | Fresh project, no code yet |
| Has code, but context/ is empty stubs | **CAPTURE** | Existing code, need to analyze and fill context |
| Has code, context/ is partially filled | **RESUME** | Partial setup, should analyze what's there |
| No code, but context/ has real content | **SETUP-ONLY** | Just setting up context for future code |
| Has code, context/ has real content | **RESUME** | Existing project with working context |

Write the detected mode to: `.opencode/setup-mode.txt`

### Capture Mode — Auto-Analyze

If you detect CAPTURE or RESUME mode:

1. **Invoke the explore agent** to analyze the codebase:
   ```
   Use the explore agent to generate a comprehensive code analysis.
   Ask it to detect: tech stack, features, structure, code quality.
   ```

2. **Before asking ANY questions**, read the exploration report
3. **Use hybrid questions** — verify what you found, ask what you couldn't determine

Example hybrid questions (instead of "what stack do you want?"):
- "I see you're using Next.js + Supabase. Is that correct?"
- "I detected user authentication — is that fully working or does it need work?"
- "The dashboard feature looks complete. What's not working about it?"

---

## Phase 1 — Orientation (or skip for CAPTURE/RESUME)

**If NEW mode:**
Tell the user about the setup process:

```
Hey! I'm going to help you set up your project context — this is the foundation
I'll use throughout the entire build to make sure I always understand what we're
creating and why.

We'll go through this in a few stages. First I'll ask about the technical setup,
then we'll dig into your idea in detail. There are no wrong answers — the more
specific you are, the better I can help.

Ready? Let's start.
```

**If CAPTURE or RESUME mode:**
Skip the orientation. Start by showing the user what you found:

```
I can see this project already has code. Let me analyze what's here first,
then I'll verify what I found and ask about the missing pieces.

Working on it now — this will take a moment.
```

After analysis, show the user:
- What tech stack you detected
- What features you found
- What's working vs what's broken
- What's missing that needs to be documented

Create the scratchpad file now: .opencode/setup-scratchpad.md

---

## Phase 1 — Technical Preferences

**Goal:** Populate context/technical/STACK.md and context/technical/ENVIRONMENT.md

**IMPORTANT:** The questions you ask depend on the mode:

### If NEW mode:
Ask all questions as written below. Explain technical terms in plain English.

### If CAPTURE or RESUME mode:
Before asking, read the exploration report from the explore agent.
Then use HYBRID questions — verify what you found, ask what you couldn't determine.

Example hybrid questions:
- "I see you're using Next.js + Supabase. Is that correct?" (instead of "what stack?")
- "The database schema has users and posts tables — is that complete or missing something?"
- "I didn't find any hosting config. Where do you plan to deploy?"

---

### 1.1 — Platform (NEW) / Verification (CAPTURE/RESUME)

**For NEW mode:**
1. What kind of thing are we building?
   (For example: a website people visit in their browser, a mobile app on their phone,
   an internal tool for a team, a browser extension, something else?)

2. Do you have a preferred way to build it, or are you open to suggestions?
   (Some people love React, others want something simpler, some want a full
   "batteries included" framework like Next.js — if these words mean nothing,
   just say so and I'll recommend something)

3. Where do you want this to live when it's live?
   (For example: Vercel, Netlify, your own server, AWS, not sure yet)

**For CAPTURE/RESUME mode:**
Skip asking if exploration report has this info.
Ask only: "What did I miss about the platform or hosting?"

Update scratchpad: platform, stack preference, hosting.

### 1.2 — Data and Backend (NEW) / Verification (CAPTURE/RESUME)

**For NEW mode:**
4. Will this app need to store information?
   (User accounts, saved data, content that changes — or is it purely something
   people use without anything being saved?)

5. If yes — do you have a preference for how that data is stored?
   (A database like Postgres, a simpler option like Supabase or Firebase, not sure?)

6. Will there be user accounts and logins?
   (And if so — email, Google, magic links, something else?)

**For CAPTURE/RESUME mode:**
Verification questions:
- "The database has X tables. Are they complete?"
- "Auth is implemented with Y. Is it working or do you need help?"
- "What data should I know about that isn't in the database?"

Update scratchpad: storage needs, auth.

### 1.3 — Developer Setup (NEW) / Verification (CAPTURE/RESUME)

**For NEW mode:**
7. Will you be building this alone or with a team?

8. Are there any tools you already know you want to use?
   (Stripe for payments, Resend for emails, Cloudinary for images — or things
   you've already signed up for?)

9. Is there a rough budget for third-party services, or should we stick to
   free tiers where possible?

**For CAPTURE/RESUME mode:**
- "What's the team situation? Anyone else working on this?"
- "Any third-party services you're already paying for?"

Update scratchpad: team size, tools, budget.

---

**After Phase 1:**
Generate:
- context/technical/STACK.md — document the agreed stack with rationale in plain English
- context/technical/ENVIRONMENT.md — list env vars that will be needed

Show the user a brief summary and ask: "Does this look right before we move on?"
Make corrections, update the scratchpad, then move to Phase 2.

---

## Phase 2 — The Idea

**Goal:** Populate context/project/OVERVIEW.md and context/project/SCOPE.md

**Before asking anything in this phase — read the scratchpad.**

Then do this: look at what you already know and figure out what you're still missing.

The scratchpad already has the platform type from Phase 1.
Do NOT ask "what are you building?" if they already told you it's a web app,
a mobile app, or whatever they said. That would feel like you forgot.

### For CAPTURE/RESUME mode:

If the explore agent found features or functionality, you can often INFER the project purpose:

- If there's a "billing/invoice" feature → this is likely a business/finance app
- If there's "user-dashboard" → this is a user-facing SaaS
- If there's "admin" → this has admin privileges

Use what you found to make better questions:

Example bridge for CAPTURE mode:
"I see this has invoice and billing features — so this is for businesses to get paid?
Let me make sure I understand the problem you're solving."

---

### For NEW mode:

OPEN Phase 2 by acknowledging what you know and bridging to what you need:

Example bridge if they said "a web app for freelancers":
  "So we're building a web app for freelancers — great foundation.
   Now I want to understand the actual problem you're solving.
   Tell me about it like you'd explain it to a friend."

Example bridge if they gave a vague answer like "something for my business":
  "You mentioned it's for your business — before we go further,
   help me understand what it actually does. Two or three sentences,
   completely informal."

Adapt the bridge to what they actually said. Never use a generic opener
if you have specific information to reference.

### 2.1 — The Core Idea

After the bridge, ask only what you don't already know:

- What problem does it solve? Who specifically has this problem right now?
  (Push for specificity — "busy people" is too vague.
  "Freelance designers who forget to invoice clients" is the kind of
  answer that's actually useful.)

- What does someone do today instead of using your app?
  (Spreadsheet? A competitor? Doing it manually? Nothing at all?)

Update scratchpad: core idea, problem, current solution.

### 2.2 — The User

Ask only what the scratchpad doesn't already have:

- Who is the main person using this? Paint a picture of them.
  (Job, how tech-savvy they are, what device they'll mostly use it on)

- Is there more than one type of user?
  (A marketplace has buyers AND sellers. A SaaS might have end users AND admins.)

- What does success look like for that person after using your app?
  (What have they accomplished? How do they feel?)

Update scratchpad: user description, user types.

### 2.3 — The Solution

- Walk me through how someone would actually use this — from the moment they
  land on it to the moment they're done.
  (A rough step-by-step is fine)

- What's the single most important thing your app does?
  (If you could only build one thing, what would it be?)

- What makes this different or better than what already exists?

Update scratchpad: journey, most important feature, differentiator.

---

**After Phase 2:**
Generate:
- context/project/OVERVIEW.md — vision, problem, solution, users, differentiator
- context/project/SCOPE.md — be opinionated: what's in v1, what's deferred, what's never in scope

Show the scope to the user and invite corrections before continuing.

---

## Phase 3 — Features

**Goal:** Populate context/features/[feature].md for each feature and context/project/ROADMAP.md

**Read the scratchpad before this phase.**
You now know the platform, the user, and the core problem.
Use that to make feature questions specific.

For example, if it's a mobile app for solo traders:
  DON'T ask: "List every feature you imagine this app having."
  DO say: "Given this is a mobile-first tool for solo traders, what do you need
           it to do day-to-day? What would make you actually open it every morning?"

### 3.1 — Feature Inventory

Open with a prompt shaped by what you know, then ask:

- List everything you imagine this app doing.
  (Don't filter — just brain dump. We'll prioritise after.)

Once you have the list, update the scratchpad with each feature name.

### 3.2 — Per-Feature Deep Dive

For EACH feature, ask (adapt to what you already know from context):

A. What does it do exactly?
   (Inputs, outputs, what the user sees and does)

B. Who uses this feature and when in their journey?

C. What's the simplest version that would still be useful?
   (Help me understand MVP vs the full vision)

D. Are there any rules or edge cases?
   (For example: "a user can only have one active booking at a time")

E. Does this connect to any other features?
   (Does creating X trigger an email? Does Y need Z to exist first?)

Update scratchpad after each feature.

---

**After Phase 3:**
Generate:
- One context/features/[feature-name].md per feature (use context/features/_template.md)
- context/project/ROADMAP.md — organise into phases: v1 core, v1.1 polish, v2 expansion

Show the roadmap and ask if the prioritisation feels right.

---

## Phase 4 — Design Direction

**Goal:** Populate context/design/DESIGN_SYSTEM.md and context/design/UX_PATTERNS.md

**Read the scratchpad.** You know the platform, the user, and the tone of the product.
Use that to frame design questions — don't ask about mobile design if it's a web app,
don't ask about a "professional" feel if they described a fun consumer app.

Ask:

1. How should this feel to use? Pick some words.
   (Fast and no-nonsense, calm and trustworthy, fun and playful, premium and polished)

2. Are there any apps or websites whose design you love?
   (Even if unrelated to your idea — just aesthetics you admire)

3. Any hard nos on colour, style, or fonts?
   (Must be dark mode, no rounded corners, nothing that feels corporate)

4. Who will be building the UI — you, a designer, or should I make the design decisions?

Update scratchpad: tone, references, hard nos.

---

**After Phase 4:**
Generate:
- context/design/DESIGN_SYSTEM.md — design direction, palette, typography, tone
- context/design/UX_PATTERNS.md — key interaction patterns based on the features

---

## Phase 5 — Wrap Up

**Goal:** Generate final files and confirm readiness

Say:
  "We're almost done. Just a couple of final questions:"

1. Is there anything about this project I haven't asked about that feels important?
   (Constraints, deadlines, integrations, things that have been tried before)

2. What do you want to tackle first?

---

**After Phase 5:**
Generate:
- context/project/DECISIONS.md — log significant choices made during setup with reasoning
- context/developer/CONVENTIONS.md — sensible defaults based on the stack
- context/developer/WORKFLOW.md — solo or team workflow based on what was shared

Delete the scratchpad: .opencode/setup-scratchpad.md
(It was a working document — the real outputs are the context/ files.)

Then present the Setup Complete summary:

---

## Setup Complete — Summary

  "Here's what I now know about your project:

  The App:      [one line]
  The Problem:  [one line]
  The User:     [one line]
  The Stack:    [tech choices]
  V1 Features:  [bullet list]
  First Task:   [what we're starting with]

  All context files have been generated in the context/ folder.
  I'll refer to these automatically throughout the build.

  Ready to start building?"

---

## Context Files Checklist

By the end of setup, all of these should exist and be populated:

Technical:
- context/technical/STACK.md
- context/technical/ENVIRONMENT.md
- context/technical/ARCHITECTURE.md  (stub)
- context/technical/DATA_MODELS.md   (stub)
- context/technical/API_CONTRACTS.md (stub)

Project:
- context/project/OVERVIEW.md
- context/project/SCOPE.md
- context/project/ROADMAP.md
- context/project/DECISIONS.md

Features:
- context/features/_template.md
- context/features/[one file per feature].md

Design:
- context/design/DESIGN_SYSTEM.md
- context/design/UX_PATTERNS.md
- context/design/COMPONENTS.md (stub)

Developer:
- context/developer/CONVENTIONS.md
- context/developer/WORKFLOW.md
- context/developer/SECURITY.md
- context/developer/TESTING.md (stub)

Ops:
- context/ops/INFRASTRUCTURE.md (stub)
- context/ops/CI_CD.md (stub)

Stubs are placeholder files with headings only — they grow during the build.
