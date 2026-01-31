# Contributing to GrindLog

## Git Workflow

We use a feature branch workflow with pull requests.

### Branch Naming Convention

```
feature/   - New features (feature/workout-planner)
fix/       - Bug fixes (fix/login-redirect)
refactor/  - Code refactoring (refactor/api-cleanup)
docs/      - Documentation (docs/api-readme)
chore/     - Maintenance tasks (chore/update-deps)
```

### Workflow

1. **Create a feature branch from main**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes with clear commits**
   ```bash
   git add .
   git commit -m "feat: add workout tracking"
   ```

3. **Push and create a PR**
   ```bash
   git push -u origin feature/your-feature-name
   gh pr create --fill
   ```

4. **After PR is merged, clean up**
   ```bash
   git checkout main
   git pull origin main
   git branch -d feature/your-feature-name
   ```

### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `style` - Formatting, no code change
- `refactor` - Code change that neither fixes a bug nor adds a feature
- `test` - Adding or updating tests
- `chore` - Maintenance tasks

**Examples:**
```
feat(workouts): add weekly schedule planner
fix(auth): resolve token refresh issue
docs(readme): update setup instructions
refactor(api): simplify error handling
```

### Pull Request Guidelines

1. **Keep PRs focused** - One feature/fix per PR
2. **Write clear descriptions** - Explain what and why
3. **Update documentation** - If behavior changes
4. **Add tests** - For new features
5. **Include migrations** - For database changes

### Code Review

- All changes to `main` require a PR
- PRs should be reviewed before merging
- Use "Squash and merge" for clean history

## Development Setup

```bash
# Clone the repo
git clone https://github.com/ggrinberger/grindlog.git
cd grindlog

# Install dependencies
npm install

# Start development environment
docker compose up -d

# Run frontend in dev mode
cd frontend && npm run dev
```

## Database Migrations

Place new migrations in `backend/src/config/migrations/` with format:
```
XXX_description.sql
```

Run migrations:
```bash
cat backend/src/config/migrations/XXX_*.sql | docker exec -i grindlog-db psql -U grindlog -d grindlog
```
