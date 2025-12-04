# CodeTrack - Student Coding Performance Analytics Platform

## Overview

CodeTrack is a full-stack web application designed to track and analyze coding performance for 54 students and faculty members across multiple competitive programming platforms (LeetCode, CodeChef, CodeForces, GeeksforGeeks, HackerRank, and CodeStudio). The platform provides:

- **Authentication System**: JWT-based authentication for faculty (view-only) and students (view and edit own profile)
- **Student Dashboard**: Browse all students, view top performer, filter by department
- **Individual Profiles**: Detailed analytics including problem-solving stats, contest ratings, badges, and platform accounts
- **Profile Management**: Students can edit their coding platform IDs, contact information, and portfolio links

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack Query v5 for server state management
- **Form Handling**: React Hook Form with Zod validation
- **UI Components**: Shadcn UI (Radix UI primitives) with Tailwind CSS
- **Design System**: "New York" variant from Shadcn with custom neutral color palette

**Key Design Decisions**:
- Component-based architecture with reusable UI primitives
- Protected routes using custom `ProtectedRoute` wrapper component
- Context-based authentication state (`AuthContext`) and theme management (`ThemeContext`)
- Client-side data fetching with React Query for caching and automatic refetching
- Responsive layouts using Tailwind's responsive utilities (mobile-first approach)

**Typography**:
- Primary: Inter font for UI text
- Monospace: JetBrains Mono for usernames and code-related content
- Font scale from 12px (xs) to 36px (4xl)

**Layout Patterns**:
- Dashboard: Responsive grid (1-4 columns based on breakpoint)
- Featured "Top Coder" card with gradient background treatment
- Max-width container (7xl) with consistent spacing (px-6)
- Card-based information architecture

### Backend Architecture

**Framework**: Express.js with TypeScript
- **Runtime**: Node.js with ESM module system
- **Build Tool**: esbuild for production bundling, Vite for development
- **Development**: tsx for TypeScript execution in development mode

**Authentication & Authorization**:
- JWT tokens for stateless authentication
- Bearer token authentication via Authorization header
- Role-based access control (faculty vs. student)
- Middleware-based route protection (`authMiddleware`)
- Tokens stored in localStorage on client

**API Design**:
- RESTful API endpoints under `/api` namespace
- Standard HTTP methods (GET, POST, PATCH)
- JSON request/response format
- Endpoints:
  - `POST /api/auth/login` - Authentication
  - `GET /api/students` - List all students
  - `GET /api/student/:username` - Individual student profile
  - `PATCH /api/student/:username` - Update student profile (student-only)

**Data Storage Strategy**:
- In-memory storage implementation (`MemStorage` class in `server/storage.ts`)
- Interface-based storage abstraction (`IStorage`) for future database migration
- Seeded with 54 generated students and 3 faculty accounts
- bcrypt for password hashing (10 rounds)

**Why In-Memory?**: The current implementation uses in-memory storage with a plan to migrate to PostgreSQL with Drizzle ORM (infrastructure already configured in `drizzle.config.ts`). This allows rapid prototyping while maintaining clean separation between storage interface and implementation.

### Data Schema

**User Model** (`shared/schema.ts`):
- `id`, `username`, `password` (hashed), `role` (faculty/student)
- Shared between faculty and students for authentication

**Student Model**:
- Profile: `name`, `username`, `dept`, `regNo`, `email`
- Social Links: `linkedin`, `github`, `resumeLink`
- Coding Accounts: `mainAccounts[]`, `subAccounts[]` (platform + username pairs)
- Analytics: `problemStats`, `contestStats`, `badges[]`
- UI: `avatarColor` (for visual consistency)

**Analytics Models**:
- `ProblemStats`: total, easy, medium, hard counts with history
- `ContestStats`: current rating, max rating, contests attended, rating history
- `Badge`: name, icon, description, platform, date earned

**Validation**: Zod schemas for runtime type checking and API validation

### Build & Deployment

**Development Mode**:
- Vite dev server with HMR for frontend
- Express server with tsx for backend
- Proxy setup via Vite middleware mode
- Development plugins: error overlay, cartographer (Replit-specific), dev banner

**Production Build**:
- Frontend: Vite build to `dist/public`
- Backend: esbuild bundle to `dist/index.cjs` with selective bundling (allowlist for cold start optimization)
- Static file serving from Express
- Single Node.js process serves both API and static assets

**Configuration Files**:
- `vite.config.ts`: Frontend build, path aliases, HMR setup
- `tsconfig.json`: Shared TypeScript config with path mappings (@/, @shared/)
- `tailwind.config.ts`: Design tokens, color system, border radius
- `postcss.config.js`: Tailwind processing

## External Dependencies

### UI & Styling
- **Radix UI**: 20+ primitive components for accessibility and unstyled base
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **Lucide React**: Icon library (consistent 24px icons)
- **class-variance-authority**: Type-safe component variants
- **Recharts**: Data visualization (charts for analytics)
- **date-fns**: Date formatting and manipulation

### Forms & Validation
- **React Hook Form**: Performant form state management
- **Zod**: TypeScript-first schema validation
- **@hookform/resolvers**: Integration between React Hook Form and Zod

### State & Data Fetching
- **TanStack Query**: Server state management, caching, and synchronization
- **Wouter**: Lightweight routing (2kb alternative to React Router)

### Backend
- **Express**: Web server framework
- **bcrypt**: Password hashing
- **jsonwebtoken**: JWT token generation and verification
- **cors**: CORS middleware (if needed for API)

### Database (Configured but Not Active)
- **Drizzle ORM**: Type-safe ORM for PostgreSQL
- **PostgreSQL**: Relational database (configured via `DATABASE_URL`)
- Schema defined in `shared/schema.ts` with `drizzle.config.ts` for migrations

**Migration Path**: The application is structured to easily migrate from in-memory storage to PostgreSQL by implementing the `IStorage` interface with Drizzle queries. The schema definitions are already in place using Zod, which can be converted to Drizzle schemas.

### Development Tools
- **Vite**: Build tool and dev server
- **esbuild**: Fast JavaScript bundler for production
- **tsx**: TypeScript execution for Node.js
- **TypeScript**: Type safety across frontend and backend

### Replit-Specific
- **@replit/vite-plugin-runtime-error-modal**: Development error overlay
- **@replit/vite-plugin-cartographer**: Code navigation
- **@replit/vite-plugin-dev-banner**: Development banner