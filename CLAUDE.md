# CLAUDE.md - Project Instructions for AI Assistants

## Project Overview

GrindLog is a full-stack fitness tracking application for managing workouts, nutrition, supplements, and progress.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL 16
- **Deployment**: Docker Compose (frontend: port 80, API: port 3000)

## Project Structure

```
grindlog/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts
│   │   │   ├── init.sql
│   │   │   └── migrations/     # Numbered migration files (001_, 002_, etc.)
│   │   ├── routes/             # Express route handlers
│   │   └── middleware/
│   └── tests/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/api.ts     # API client
│   │   ├── store/              # Zustand stores
│   │   └── utils/
│   └── test/
└── docker-compose.yml
```

## Development Commands

```bash
# Start all services
docker-compose up -d

# Rebuild after changes
docker-compose up -d --build

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Run database migrations (happens automatically on backend start)

# Run unit tests
npm run test --workspace=backend
npm run test --workspace=frontend

# Run E2E tests (requires app running)
npm run test:e2e --workspace=frontend
npm run test:e2e:headed --workspace=frontend  # With browser visible
npm run test:e2e:ui --workspace=frontend      # Interactive UI mode

# Lint
npm run lint --workspace=backend
npm run lint --workspace=frontend
```

## E2E Testing

End-to-end tests use Playwright and simulate real user interactions.

### Test Files (frontend/e2e/)
- `01-auth.spec.ts` - Registration, login, logout flows
- `02-workouts.spec.ts` - Weekly schedule, adding exercises
- `03-supplements.spec.ts` - Add, edit, log supplements
- `04-nutrition.spec.ts` - Meal logging, nutrition plans
- `05-progress.spec.ts` - Body measurements, exercise PRs
- `06-cardio-routines.spec.ts` - Cardio protocols, daily routines
- `07-profile-dashboard.spec.ts` - Profile updates, dashboard navigation

### Running E2E Tests Locally
```bash
# Ensure app is running
docker-compose up -d

# Run all E2E tests
cd frontend && npm run test:e2e

# Run specific test file
npx playwright test e2e/01-auth.spec.ts

# Debug mode
npx playwright test --debug
```

## Git Workflow

### Environment
- GitHub token available as `GITHUB_TOKEN` environment variable
- Use `gh` CLI for GitHub operations

### Creating PRs (Cost-Efficient Method)
```bash
# 1. Create feature branch
git checkout -b feature/description

# 2. Commit changes
git add -A && git commit -m "feat: description"

# 3. Push branch
git push -u origin feature/description

# 4. Create PR and enable auto-merge (single command, no polling)
gh pr create --title "feat: description" --body "..." && gh pr merge --squash --delete-branch --auto
```

The `--auto` flag enables auto-merge once CI passes, avoiding the need to poll for CI status.

### Commit Message Convention
- `feat:` - New features
- `fix:` - Bug fixes
- `refactor:` - Code refactoring
- `docs:` - Documentation
- `test:` - Tests

## Database Migrations

- Migrations are in `backend/src/config/migrations/`
- Named with numeric prefix: `001_`, `002_`, etc.
- Run automatically on backend startup via `init.sql`
- Always create new migration files, never modify existing ones

## Code Style

### TypeScript
- Avoid `any` types - ESLint will fail CI
- Use proper interfaces for all data structures
- Add `typical_section` field to Exercise interfaces when querying exercises

### Frontend Patterns
- Pages in `src/pages/`
- Reusable components in `src/components/`
- API calls through `src/services/api.ts`
- State management with Zustand stores

### Backend Patterns
- Route handlers in `src/routes/`
- Use parameterized queries for SQL (prevent injection)
- Error handling via middleware

## CI/CD

- GitHub Actions run on PR
- Pipeline stages: lint → unit tests → build → E2E tests
- Must pass: ESLint, unit tests, build, E2E tests
- Auto-merge available when CI passes
- E2E test artifacts (screenshots, videos) uploaded on failure

## Key Features

- **Workouts**: Weekly training plan with exercises, auto-section detection (warm-up/main/finisher)
- **Exercises**: 168+ exercises across 7 categories with typical_section field
- **Nutrition**: Meal plans by day type (high_intensity, moderate, recovery)
- **Supplements**: Tracking with suggested supplements, editable after adding
- **Progress**: Track PRs and measurements
- **Cardio**: VO2 Max protocols and cardio tracking
