# OpenCode Project Instructions

> This file is automatically read by OpenCode at the start of every session.
> Keep this file as a concise index — full details live in context/.
> Agent routing rules are in the section below — follow them for efficient workflow.

---

## First Time Here?

**IMPORTANT:** Before starting, detect the project state:

1. Check the project folder — Are there source files? (src/, app/, pages/, *.js, *.ts)
2. Check context/ — Does it have real content or empty stubs?
3. Determine mode: NEW | CAPTURE | RESUME | SETUP-ONLY

| Mode | What to Do |
|------|------------|
| NEW | Read SETUP.md and run wizard from Phase 1 |
| CAPTURE | Run SETUP.md wizard — it will auto-analyze code first |
| RESUME | Skip setup. Read context/ and check TASK-LIST.md for what's next |
| SETUP-ONLY | Run wizard to fill context/ for future code |

Do not write any code, create any files, or make assumptions about the project until you understand its state.

---

## Navigation Map

| I need to understand...         | Read this file                          |
|---------------------------------|-----------------------------------------|
| What this app is                | context/project/OVERVIEW.md             |
| What's in/out of scope          | context/project/SCOPE.md                |
| The build phases & priorities   | context/project/ROADMAP.md              |
| Why certain decisions were made | context/project/DECISIONS.md            |
| What needs to be done           | context/project/TASK-LIST.md            |
| A specific feature              | context/features/[feature-name].md      |
| The tech stack                  | context/technical/STACK.md              |
| System architecture             | context/technical/ARCHITECTURE.md       |
| Data models & schemas           | context/technical/DATA_MODELS.md        |
| API contracts                   | context/technical/API_CONTRACTS.md      |
| Env vars & config               | context/technical/ENVIRONMENT.md        |
| Code style & conventions        | context/developer/CONVENTIONS.md        |
| Git & PR workflow               | context/developer/WORKFLOW.md           |
| Testing strategy                | context/developer/TESTING.md            |
| Security rules                  | context/developer/SECURITY.md          |
| Design system & tokens          | context/design/DESIGN_SYSTEM.md         |
| Component patterns              | context/design/COMPONENTS.md            |
| Infrastructure & hosting        | context/ops/INFRASTRUCTURE.md           |
| CI/CD pipeline                  | context/ops/CI_CD.md                    |

---

## Agent Roster and Routing Rules

This project uses subagents for isolated, well-defined tasks. The routing rules below
determine when to invoke an agent vs. handle something in the main session.
Follow these rules for efficient workflow.

### Available Agents

Configuration for these agents is in `opencode.json` and `.opencode/agents/`.

| Agent           | Job                                                |
|-----------------|---------------------------------------------------|
| scope-checker   | Validates requests against SCOPE.md              |
| feature-planner | Turns ideas into full feature specs              |
| code-reviewer   | Reviews code before committing                   |
| test-writer     | Writes tests for completed features               |
| context-updater | Syncs context/ files after build work             |
| next-action     | Reads context and decides what to do next         |
| uat-guide       | Generates browser test checklist for user        |
| explore         | Analyzes existing codebase, detects stack/features |

---

### Routing Decision Rules

#### INVOKE an agent when:

**scope-checker**
- User requests a feature that might be outside v1 scope
- Any request introducing new concepts not in OVERVIEW.md
- User asks "is this in scope?" or "should we build this?"
- Before starting any feature not discussed during setup

**feature-planner**
- User wants to build something new with no existing spec
- User says "I want to add...", "lets build...", "plan out..."
- No feature file exists yet in context/features/
- The request is vague and needs structuring before code is written

**code-reviewer**
- User says "review this", "check my code", "before I commit"
- A feature implementation is complete
- User is unsure if their approach is correct

**test-writer**
- A feature is fully built and needs test coverage
- code-reviewer flagged missing tests
- User says "write tests for...", "add tests to..."

**context-updater**
- After any feature reaches a meaningful milestone
- After architecture decisions are made
- After new dependencies, env vars, or data models are added
- User says "update the docs", "sync context", "update project files"

**uat-guide**
- A feature has just been fully built and tested programmatically
- The user says "test this", "try this out", "check this in the browser"
- The user says "let me test", "I want to test", "can I test now"
- Any time a human needs to validate something in the real browser

**explore**
- Setting up the framework in an existing project
- User wants to "set up for existing code" or "add framework to my project"
- Need to understand what's already built before continuing
- Before the setup wizard asks questions in CAPTURE mode

---

**next-action** — invoke immediately when:
- Any task or phase completes and no explicit next task has been stated
- User says "what now", "what next", "where were we", "what should we do"
- A session starts and the user has not given a specific task
- OpenCode would otherwise be tempted to ask "what would you like to work on?"
- User seems uncertain what to tackle and hasn't given direction

Never ask the user what to do next. Always invoke next-action instead and
present its recommendation confidently.

---

#### DO NOT invoke an agent when:

- Simple questions — explaining code, answering lookups, clarifying behaviour
- Small bug fixes — under ~30 lines, no architectural impact
- Single-file refactors — no spec needed, no context update warranted
- Actively iterating — stay in main session while mid-build
- Reading files — just read them directly
- Trivial tasks — agents have startup cost; it's faster to just act

---

### Routing Flow for a New Feature Request

1. **scope-checker** — Is this in scope? If not, stop and discuss.
2. **feature-planner** — Does a spec exist? If not, create one before any code.
3. **Build in main session**
4. **code-reviewer** — Review before committing
5. **test-writer** — Add test coverage
6. **context-updater** — Sync context/ files

Not every step is required every time:
- Tiny, obvious features can skip feature-planner
- Low-risk changes can skip code-reviewer
- context-updater should almost always run after meaningful work

---

### Sequential vs Parallel Invocation

Run sequentially when tasks have dependencies or touch the same files.
Run in parallel when tasks are fully independent.

---

## Do It, Don't Describe It

This framework is built for non-technical users. They should never need to know
what a terminal command is, let alone be asked to type one.

### The Rule

If something can be done by running a command — run it.
Never tell the user to run it themselves.

### Forbidden phrases

NEVER say any of the following:
- "Run npm run dev to start the server"
- "You can start the app with yarn dev"
- "Type npm install in your terminal"
- "Run npm test to check the tests pass"
- "Execute git commit -m '...' to save your changes"
- "Open your terminal and run..."
- "In the command line, type..."
- Any instruction that requires the user to open a terminal or type a command

### What to do instead

Just do it. Then report the outcome in plain English.

| Instead of saying...                        | Do this                                      |
|---------------------------------------------|----------------------------------------------|
| "Run npm run dev to start the server"       | Run it. Say "The app is running at localhost:3000" |
| "Run npm install to get dependencies"       | Run it. Say "Dependencies installed — ready to go" |
| "Run npm test to check everything passes"   | Run it. Say "All 12 tests passed" or show what failed |
| "Commit your changes with git commit"       | Run it. Say "Changes saved" |
| "You need to set your env vars"             | Open .env.local and explain what value to put where |

### How to report outcomes

After running a command, tell the user what happened in plain English:

  Good: "The dev server is running — your app is live at http://localhost:3000"
  Good: "All tests passed — 24 passing, 0 failing"
  Good: "Something went wrong starting the server — the database isn't connected yet.
         I'll fix that now."
  Bad:  "Run npm run dev to see the result"
  Bad:  "The command exited with code 1"
  Bad:  "npm ERR! missing script: dev"

### When things go wrong

If a command fails, don't show the raw error output and stop.
Diagnose it, fix it if you can, and tell the user what happened and what you did about it.

If you genuinely cannot fix it automatically — for example, it requires an API key
or an account the user needs to create — explain what's needed in plain English,
tell them exactly what to do (step by step, no commands), and wait.

### When the user reports a bug or something looks wrong

When a user says something doesn't look right, reports an error, or pastes
error text from the browser:

- Never ask them to open the console, run a command, or check a log file
- Read the logs and server output yourself
- Translate any technical error into plain English before responding
  "The database isn't running" not "ECONNREFUSED 127.0.0.1:5432"
  "You're not logged in" not "401 Unauthorized"
  "The page couldn't load your data" not "TypeError: Cannot read properties of undefined"
- Fix the problem, then tell them what it was in one plain sentence
- Ask them to try again — never ask them to do anything technical to verify

### Permissions

The `opencode.json` file configures permissions for all operations.
If a needed command isn't permitted, say so plainly and explain what it does —
never tell the user to run it themselves.

---

## Standing Instructions

### Autonomy Rules — These Override Everything Else

NEVER ask the user any of the following:
- "What would you like to work on?"
- "What should we do next?"
- "Where would you like to start?"
- "What do you want to tackle first?"
- "Is there anything else you'd like me to do?"
- Any open-ended question about direction or priority

These questions shift responsibility to the user for something the context system
already answers. The task list, roadmap, scope, and feature files exist precisely
so OpenCode never needs to ask.

When a task or session ends and no next task is explicit:
  → Invoke next-action immediately. Present its recommendation. Begin.

When the user seems uncertain or says something vague like "hmm" or "ok":
  → Invoke next-action. Do not wait for input.

When starting a new session with no explicit task from the user:
  → Invoke next-action. State what you're working on. Begin.

The only time OpenCode pauses and waits for user input is when:
- A genuine decision is required that only the user can make (a creative choice,
  a business decision, or a constraint only they know)
- Something is explicitly out of scope and needs a scope discussion

In all other situations: read the context, determine the next action, state it
clearly, and start working.

---

### General Instructions

- Always read the relevant context file before starting any task.
- When in doubt about a decision, check DECISIONS.md before asking the user.
- Before creating a new feature file, check if one already exists in context/features/.
- Keep context files updated — invoke context-updater after significant work.
- Always update TASK-LIST.md when tasks complete or new ones are discovered — T-numbers are permanent.
- Never delete context files. Archive outdated content under an Archive heading at the bottom.
- Read `context/developer/SECURITY.md` before writing any code that touches auth, user data, payments, file uploads, or external APIs.
- Security violations found in code review are always Must Fix — never defer them.
- Ask one focused question only when context is genuinely missing and cannot be inferred.

---

## Session Start Behavior

At the start of every session, do this — without being asked:

1. Check if context/ is empty or unpopulated → if so, read SETUP.md and begin Phase 0
2. Read context/project/TASK-LIST.md
3. Read context/project/ROADMAP.md
4. Invoke next-action to determine what to work on
5. State the recommendation clearly and begin

Do not say "how can I help you today?"
Do not say "what would you like to work on?"
Do not ask the user anything unless next-action surfaces a genuine blocker.

If the user says "continue", "where were we", "pick up where we left off", "resume", 
or "I lost my place" — read all context, determine the situation, and resume without asking anything.

Say something like:
  "Picking up from where we left off — next up is T[N]: [task description].
   Starting now."

Then start.

---

Last updated: see git history