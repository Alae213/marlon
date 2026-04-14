# Onboarding Guide

> New developer setup — follow these steps to get running.

## Prerequisites

### Required Tools
- **Node.js** 20.x (LTS) — check with `node --version`
- **npm** 10.x — comes with Node.js
- **Git** 2.x — for version control
- **GitHub account** — for repo access

### Recommended Tools
- **VS Code** — project includes recommended extensions
- **Chrome** or **Firefox** — for testing
- **Convex CLI** — `npx convex dev` (installed automatically)

## Setup Steps

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/marlon.git
cd marlon
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
```bash
cp .env.example .env.local
```

Fill in these required variables:

| Variable | Description | How to Get |
|----------|-------------|------------|
| `NEXT_PUBLIC_CONVEX_URL` | Convex deployment URL | Run `npx convex deploy` after setup |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk frontend key | Clerk dashboard → API Keys |
| `CLERK_SECRET_KEY` | Clerk backend key | Clerk dashboard → API Keys |
| `CONVEX_DEPLOYMENT` | Convex deployment name | From Convex dashboard |
| `CHARGILY_API_KEY` | Chargily API key | Chargily dashboard (test mode) |
| `CHARGILY_WEBHOOK_SECRET` | Chargily webhook secret | Chargily dashboard |
| `DELIVERY_ZR_API_KEY` | ZR Express API key | ZR Express partner portal |
| `DELIVERY_YALIDINE_API_KEY` | Yalidine API key | Yalidine partner portal |

### 4. Start Development Server
```bash
npm run dev
```

- Frontend: http://localhost:3000
- Convex Dashboard: http://localhost:3000/_convex (dev only)

### 5. Verify Setup
- Open http://localhost:3000
- Sign in with Google (Clerk)
- Create a test store
- Add a test product

## Project Structure

### Key Directories
```
src/
├── app/                 # Next.js pages (App Router)
├── components/          # React components
├── lib/convex/          # Convex client + typed functions
├── hooks/               # Custom React hooks
└── types/               # TypeScript definitions

convex/                  # Convex backend functions
├── functions/           # Query/mutation functions
└── schema.ts            # Database schema
```

### Finding Your Way Around
- **Orders**: `src/app/(dashboard)/orders/`
- **Products**: `src/app/(dashboard)/products/`
- **Delivery**: `src/app/(dashboard)/delivery/`
- **Store settings**: `src/app/(dashboard)/settings/`

### Convex Functions
- Queries: `convex/functions/queries/`
- Mutations: `convex/functions/mutations/`

## First Tasks

### Recommended Starter Tasks
1. **Add a UI component** — Try adding a badge or button variant
2. **Fix a small bug** — Check GitHub issues labeled "good first issue"
3. **Add a test** — Look for missing test coverage in components

### Before Writing Code
1. Read `context/project/OVERVIEW.md` — understand the product
2. Read `context/developer/CONVENTIONS.md` — follow coding standards
3. Read `context/design/UX_PATTERNS.md` — maintain UX consistency

### Running Tests
```bash
npm run test          # Run all tests
npm run test:watch   # Watch mode
npm run lint         # Check code style
npm run typecheck   # TypeScript validation
```

## Troubleshooting

### Common Issues

**"Module not found" after pulling changes**
```bash
npm install
```

**Convex connection errors**
```bash
npx convex dev
```

**Clerk sign-in not working**
- Verify `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` in `.env.local`
- Check Clerk dashboard for allowed origins (add http://localhost:3000)

**Delivery API errors**
- Verify API keys in `.env.local`
- Check provider status in their dashboards

### Getting Help
- Check existing context docs in `context/`
- Search codebase with `grep` tool
- Ask in team chat with specific error messages