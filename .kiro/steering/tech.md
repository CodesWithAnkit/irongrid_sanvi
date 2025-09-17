# Technology Stack & Build System

## Architecture
- **Pattern**: Monorepo with separate backend and frontend applications
- **Backend**: NestJS 10 with TypeScript, following modular architecture
- **Frontend**: Next.js 15 with React 19, App Router, and TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: Redis for sessions and queue management

## Backend Stack
- **Framework**: NestJS 10 with decorators and dependency injection
- **Database**: Prisma ORM with PostgreSQL
- **Authentication**: JWT with Passport.js
- **Validation**: class-validator and class-transformer
- **Queue System**: Bull queues with Redis
- **File Processing**: Puppeteer for PDF generation, Multer for uploads
- **Email**: SendGrid integration with template support
- **API Documentation**: Swagger/OpenAPI with decorators

## Frontend Stack
- **Framework**: Next.js 15 with App Router and Turbopack
- **UI Library**: React 19 with TypeScript
- **Styling**: Tailwind CSS v4
- **Forms**: React Hook Form with Zod validation
- **State Management**: TanStack React Query for server state
- **Charts**: Chart.js with react-chartjs-2
- **Icons**: Lucide React

## Development Tools
- **Code Style**: ESLint + Prettier (single quotes, trailing commas)
- **Testing**: Jest (backend), Vitest + Testing Library (frontend)
- **Type Checking**: TypeScript with strict mode enabled
- **Package Manager**: npm (not yarn or pnpm)

## Common Commands

### Root Level
```bash
npm run dev              # Start both frontend and backend
npm run dev:frontend     # Start frontend only
npm run dev:backend      # Start backend only
```

### Backend (cd backend)
```bash
npm run start:dev        # Development server with watch mode
npm run build           # Production build
npm run start:prod      # Production server
npm run test            # Unit tests
npm run test:e2e        # End-to-end tests
npm run test:cov        # Test coverage
npm run lint            # ESLint
npm run format          # Prettier
npm run prisma:generate # Generate Prisma client
npm run prisma:migrate  # Run database migrations
npm run db:seed         # Seed database
npm run docker:up       # Start Docker services
npm run docker:down     # Stop Docker services
```

### Frontend (cd frontend)
```bash
npm run dev             # Development server with Turbopack
npm run build           # Production build with Turbopack
npm run start           # Production server
npm run test            # Vitest tests
npm run test:run        # Run tests once
npm run lint            # ESLint
npm run type-check      # TypeScript checking
```

## Code Quality Standards
- **Test Coverage**: 90% minimum for backend (branches, functions, lines, statements)
- **TypeScript**: Strict mode enabled, no implicit any
- **ESLint**: TypeScript recommended rules with Prettier integration
- **API Standards**: RESTful conventions with consistent response formats
- **Error Handling**: Proper HTTP status codes and user-friendly messages

## Environment Setup
- **Node.js**: 18+ required
- **Database**: PostgreSQL for Prisma
- **Cache**: Redis for queues and sessions
- **Environment Files**: 
  - Backend: `backend/.env` (copy from `.env.example`)
  - Frontend: `frontend/.env.local` (copy from `.env.local.example`)

## Performance Requirements
- API responses: <200ms average
- Support: 500+ concurrent users
- Database: Handle 1M+ quotations efficiently
- Caching: Redis for frequently accessed data