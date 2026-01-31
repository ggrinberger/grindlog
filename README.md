# 💪 GrindLog

A comprehensive fitness tracking web application for training, diet, and progress monitoring with social features.

## Features

- 🏋️ **Workout Tracking** - Log gym sessions, create workout plans, track sets/reps/weight
- 🏃 **Cardio Tracking** - Log running, rowing, cycling with distance and duration
- 🍎 **Diet Tracking** - Track meals, calories, macros (protein, carbs, fat), supplements
- 📈 **Progress Monitoring** - Body measurements, weight tracking, goal setting
- 👥 **Social Groups** - Create/join circles to share progress with friends
- ⚙️ **Admin Dashboard** - User management, app statistics, system health

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite + TailwindCSS
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL 16
- **Auth:** JWT-based authentication
- **Containerization:** Docker Compose

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 16 (or use Docker)

### Development

```bash
# Install dependencies
npm install

# Start database
docker compose up postgres -d

# Run development servers
npm run dev
```

Frontend: http://localhost:5173
Backend API: http://localhost:3000

### Production (Docker)

```bash
# Copy environment file
cp .env.example .env
# Edit .env with your settings

# Build and run
docker compose up -d

# Check logs
docker compose logs -f
```

Frontend: http://localhost:8080
Backend API: http://localhost:3000

## Environment Variables

```env
# Database
POSTGRES_USER=grindlog
POSTGRES_PASSWORD=your-secure-password
POSTGRES_DB=grindlog

# Backend
DATABASE_URL=postgres://grindlog:password@localhost:5432/grindlog
JWT_SECRET=your-super-secret-jwt-key
PORT=3000

# Frontend
VITE_API_URL=http://localhost:3000
```

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login

### Workouts
- `GET /api/workouts/exercises` - List exercises
- `POST /api/workouts/exercises` - Create exercise
- `GET /api/workouts/plans` - List workout plans
- `POST /api/workouts/plans` - Create workout plan
- `GET /api/workouts/sessions` - List workout sessions
- `POST /api/workouts/sessions` - Start workout session
- `POST /api/workouts/sessions/:id/log` - Log exercise
- `PATCH /api/workouts/sessions/:id/end` - End session

### Diet
- `GET /api/diet/foods` - Search foods
- `POST /api/diet/foods` - Create food item
- `POST /api/diet/log` - Log meal
- `GET /api/diet/log` - Get diet logs
- `GET /api/diet/summary` - Get daily summary

### Progress
- `POST /api/progress/measurements` - Log measurements
- `GET /api/progress/measurements` - Get measurement history
- `GET /api/progress/goals` - Get goals
- `POST /api/progress/goals` - Create goal
- `GET /api/progress/stats` - Get progress stats

### Groups
- `GET /api/groups` - Get user's groups
- `POST /api/groups` - Create group
- `POST /api/groups/:id/join` - Join group
- `POST /api/groups/:id/leave` - Leave group
- `GET /api/groups/:id/feed` - Get group activity feed

### Admin
- `GET /api/admin/stats` - Dashboard stats
- `GET /api/admin/users` - List users
- `PATCH /api/admin/users/:id/role` - Update user role

## Testing

```bash
# Run all tests
npm test

# Run backend tests
npm run test --workspace=backend

# Run frontend tests
npm run test --workspace=frontend
```

## Project Structure

```
grindlog/
├── backend/
│   ├── src/
│   │   ├── config/        # Database, environment
│   │   ├── controllers/   # Route handlers
│   │   ├── middleware/    # Auth, error handling
│   │   ├── routes/        # API routes
│   │   └── index.ts       # Entry point
│   └── tests/
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API client
│   │   ├── store/         # State management
│   │   └── App.tsx        # Main app
│   └── public/
├── docker-compose.yml
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests for your changes
4. Ensure tests pass (`npm test`)
5. Create a Pull Request

## License

MIT
