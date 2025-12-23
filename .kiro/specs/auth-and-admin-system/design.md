# Design Document: Authentication and Admin System

## Overview

This design document outlines the architecture and implementation strategy for adding comprehensive authentication, authorization, and admin management capabilities to the Student Coding Performance Analytics platform. The system will implement JWT-based authentication, role-based access control (RBAC), and an admin dashboard for user and role management.

### Key Goals

1. Replace all mock data with database-backed authentication
2. Implement secure JWT token-based authentication
3. Provide role-based access control for three user types: admin, faculty, and student
4. Create an admin dashboard for user and role management
5. Protect all routes and API endpoints with appropriate authorization checks
6. Ensure password security with proper hashing and validation

### Technology Stack

- **Backend**: Express.js with TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken library)
- **Password Hashing**: bcrypt
- **Frontend**: React with TypeScript, Wouter for routing
- **State Management**: React Context API for auth state
- **API Client**: TanStack Query (React Query)
- **UI Components**: shadcn/ui component library

## Architecture

### System Architecture

The system follows a three-tier architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer (React)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Auth Context │  │ Protected    │  │ Admin        │      │
│  │              │  │ Routes       │  │ Dashboard    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                    JWT Token in Headers
                            │
┌─────────────────────────────────────────────────────────────┐
│                   API Layer (Express)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Auth         │  │ Auth         │  │ Admin        │      │
│  │ Routes       │  │ Middleware   │  │ Routes       │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                    Database Queries
                            │
┌─────────────────────────────────────────────────────────────┐
│                  Data Layer (MongoDB)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ User         │  │ Student      │  │ Admin        │      │
│  │ Collection   │  │ Collection   │  │ Logs         │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Authentication Flow

```
User Login Request
      │
      ▼
Validate Credentials
      │
      ├─── Invalid ──► Return 401 Error
      │
      ▼ Valid
Generate JWT Token
      │
      ▼
Return Token + User Info
      │
      ▼
Client Stores Token
      │
      ▼
Subsequent Requests Include Token
      │
      ▼
Middleware Validates Token
      │
      ├─── Invalid/Expired ──► Return 401 Error
      │
      ▼ Valid
Extract User Info
      │
      ▼
Check Role Permissions
      │
      ├─── Insufficient ──► Return 403 Error
      │
      ▼ Authorized
Process Request
```

### Role-Based Access Control Matrix

| Resource                    | Admin | Faculty | Student |
|-----------------------------|-------|---------|---------|
| View All Students           | ✓     | ✓       | ✗       |
| View Own Profile            | ✓     | ✓       | ✓       |
| Edit Own Profile            | ✓     | ✓       | ✓       |
| Edit Other Profiles         | ✓     | ✗       | ✗       |
| User Management Dashboard   | ✓     | ✗       | ✗       |
| Create Users                | ✓     | ✗       | ✗       |
| Delete Users                | ✓     | ✗       | ✗       |
| Change User Roles           | ✓     | ✗       | ✗       |
| View Admin Logs             | ✓     | ✗       | ✗       |

## Components and Interfaces

### Backend Components

#### 1. Authentication Service

**Purpose**: Handle user authentication and JWT token management

**Key Functions**:
- `authenticateUser(username: string, password: string): Promise<AuthResponse>`
- `generateToken(user: User): string`
- `verifyToken(token: string): JWTPayload | null`
- `refreshToken(token: string): string`

#### 2. Authorization Middleware

**Purpose**: Protect routes and verify user permissions

**Key Functions**:
- `authMiddleware(allowedRoles?: UserRole[]): RequestHandler`
- `requireAuth(): RequestHandler`
- `requireRole(roles: UserRole[]): RequestHandler`

#### 3. User Management Service

**Purpose**: Handle CRUD operations for users

**Key Functions**:
- `createUser(data: InsertUser): Promise<User>`
- `updateUser(id: string, data: Partial<User>): Promise<User>`
- `deleteUser(id: string): Promise<void>`
- `getUserById(id: string): Promise<User | undefined>`
- `getAllUsers(filters?: UserFilters): Promise<User[]>`
- `changeUserRole(id: string, newRole: UserRole): Promise<User>`

#### 4. Admin Service

**Purpose**: Handle admin-specific operations and logging

**Key Functions**:
- `logAdminAction(adminId: string, action: string, targetId: string): Promise<void>`
- `getAdminLogs(filters?: LogFilters): Promise<AdminLog[]>`
- `getUserStatistics(): Promise<UserStats>`

### Frontend Components

#### 1. AuthContext

**Purpose**: Manage authentication state across the application

**State**:
```typescript
interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  hasRole: (role: UserRole) => boolean;
}
```

#### 2. ProtectedRoute Component

**Purpose**: Wrap routes that require authentication

**Props**:
```typescript
interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  redirectTo?: string;
}
```

#### 3. SignUp Component

**Purpose**: User registration form for admins

**Features**:
- Form validation
- Role selection
- Password strength indicator
- Error handling

#### 4. AdminDashboard Component

**Purpose**: Main admin interface for user management

**Sub-components**:
- UserList: Display all users with filtering and sorting
- UserForm: Create/edit user modal
- RoleManager: Change user roles
- UserStats: Display user statistics
- AdminLogs: View admin action history

#### 5. RoleGuard Component

**Purpose**: Conditionally render UI elements based on user role

**Props**:
```typescript
interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
}
```

### API Endpoints

#### Authentication Endpoints

```typescript
POST   /api/auth/login          // Login with credentials
POST   /api/auth/signup         // Register new user (admin only)
POST   /api/auth/logout         // Logout current user
GET    /api/auth/me             // Get current user info
POST   /api/auth/refresh        // Refresh JWT token
```

#### User Management Endpoints (Admin Only)

```typescript
GET    /api/admin/users         // Get all users with filters
POST   /api/admin/users         // Create new user
GET    /api/admin/users/:id     // Get user by ID
PATCH  /api/admin/users/:id     // Update user
DELETE /api/admin/users/:id     // Delete user
PATCH  /api/admin/users/:id/role // Change user role
GET    /api/admin/stats         // Get user statistics
GET    /api/admin/logs          // Get admin action logs
```

#### Student Endpoints (Protected)

```typescript
GET    /api/students            // Get all students (faculty/admin)
GET    /api/student/:username   // Get student profile (all authenticated)
PATCH  /api/student/:username   // Update student profile (owner/admin)
```

## Data Models

### User Model

```typescript
interface User {
  id: string;                    // UUID
  username: string;              // Unique username
  password: string;              // Bcrypt hashed password
  role: UserRole;                // 'admin' | 'faculty' | 'student'
  email?: string;                // Optional email
  createdAt: Date;               // Account creation timestamp
  updatedAt: Date;               // Last update timestamp
  lastLoginAt?: Date;            // Last login timestamp
  isActive: boolean;             // Account status
  failedLoginAttempts: number;   // Failed login counter
  lockoutUntil?: Date;           // Temporary lockout timestamp
}

type UserRole = 'admin' | 'faculty' | 'student';
```

### Student Model (Extended)

```typescript
interface Student {
  id: string;
  name: string;
  username: string;              // Links to User.username
  dept: string;
  regNo: string;
  email: string;
  linkedin?: string;
  github?: string;
  resumeLink?: string;
  mainAccounts: CodingAccount[];
  subAccounts: CodingAccount[];
  avatarColor?: string;
  problemStats?: ProblemStats;
  contestStats?: ContestStats;
  badges?: Badge[];
  lastScrapedAt?: Date;
}
```

### AdminLog Model

```typescript
interface AdminLog {
  id: string;
  adminId: string;               // User ID of admin
  adminUsername: string;         // Username of admin
  action: AdminAction;           // Type of action performed
  targetId?: string;             // ID of affected resource
  targetUsername?: string;       // Username of affected user
  details: Record<string, any>;  // Additional action details
  timestamp: Date;               // When action occurred
  ipAddress?: string;            // IP address of admin
}

type AdminAction = 
  | 'user_created'
  | 'user_updated'
  | 'user_deleted'
  | 'role_changed'
  | 'password_reset'
  | 'user_locked'
  | 'user_unlocked';
```

### JWT Payload

```typescript
interface JWTPayload {
  id: string;                    // User ID
  username: string;              // Username
  role: UserRole;                // User role
  iat: number;                   // Issued at timestamp
  exp: number;                   // Expiration timestamp
}
```

## Database Schema Updates

### Users Collection

```javascript
{
  id: String (unique, indexed),
  username: String (unique, indexed),
  password: String (hashed),
  role: String (enum: ['admin', 'faculty', 'student']),
  email: String (optional),
  createdAt: Date,
  updatedAt: Date,
  lastLoginAt: Date (optional),
  isActive: Boolean (default: true),
  failedLoginAttempts: Number (default: 0),
  lockoutUntil: Date (optional)
}
```

### Students Collection (Updated)

```javascript
{
  id: String (unique, indexed),
  username: String (unique, indexed),
  name: String,
  dept: String,
  regNo: String,
  email: String,
  linkedin: String (optional),
  github: String (optional),
  resumeLink: String (optional),
  mainAccounts: Array<CodingAccount>,
  subAccounts: Array<CodingAccount>,
  avatarColor: String (optional),
  problemStats: Object (optional),
  contestStats: Object (optional),
  badges: Array<Badge> (optional),
  lastScrapedAt: Date (optional)
}
```

### AdminLogs Collection (New)

```javascript
{
  id: String (unique, indexed),
  adminId: String (indexed),
  adminUsername: String,
  action: String (enum),
  targetId: String (optional, indexed),
  targetUsername: String (optional),
  details: Object,
  timestamp: Date (indexed),
  ipAddress: String (optional)
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Authentication Properties

**Property 1: Valid credentials produce JWT tokens**
*For any* valid username and password combination in the database, authentication should succeed and return a JWT token containing the user's ID, username, and role.
**Validates: Requirements 1.1, 4.1**

**Property 2: Invalid credentials are rejected**
*For any* username and password combination that does not match a valid user in the database, authentication should fail and return an appropriate error message.
**Validates: Requirements 1.2**

**Property 3: JWT tokens have correct expiration**
*For any* JWT token issued by the system, the expiration time should be exactly 7 days from the issuance time.
**Validates: Requirements 4.2**

**Property 4: Valid tokens extract user information**
*For any* valid, non-expired JWT token, the system should successfully extract and verify the user ID, username, and role.
**Validates: Requirements 4.3, 4.5**

**Property 5: Invalid tokens return 401**
*For any* invalid or expired JWT token, API requests should return a 401 Unauthorized response.
**Validates: Requirements 4.4**

### User Management Properties

**Property 6: User creation with valid data succeeds**
*For any* user data with all required fields (username, password, role), creating a user should succeed and store the password as a bcrypt hash.
**Validates: Requirements 2.1, 9.1**

**Property 7: Duplicate usernames are rejected**
*For any* username that already exists in the database, attempting to create a new user with that username should fail with an appropriate error.
**Validates: Requirements 2.2**

**Property 8: User role assignment is preserved**
*For any* user created with a specified role, the stored user record should have exactly that role.
**Validates: Requirements 2.3**

**Property 9: Student user creates student profile**
*For any* user created with role "student", a corresponding student profile should be created with the same username.
**Validates: Requirements 2.4**

**Property 10: Password validation enforces requirements**
*For any* password with fewer than 8 characters, user registration should fail with a validation error.
**Validates: Requirements 2.5, 9.5**

**Property 11: Passwords are never stored in plaintext**
*For any* user record in the database, the password field should be a bcrypt hash, not plaintext.
**Validates: Requirements 9.3**

**Property 12: User updates persist to database**
*For any* valid user update operation, the changes should be immediately reflected in the database.
**Validates: Requirements 5.4, 8.3**

**Property 13: User deletion removes all data**
*For any* user deleted by an admin, the user record should no longer exist in the database.
**Validates: Requirements 5.5**

### Authorization Properties

**Property 14: Students can access own profile**
*For any* student user, requests to read or edit their own profile should succeed.
**Validates: Requirements 3.1**

**Property 15: Students cannot edit other profiles**
*For any* two different student users, one student should not be able to edit the other student's profile.
**Validates: Requirements 3.2**

**Property 16: Faculty have read-only access to student profiles**
*For any* faculty user and any student profile, read operations should succeed but write operations should fail.
**Validates: Requirements 3.3**

**Property 17: Admins have full access to all resources**
*For any* admin user and any resource, all read and write operations should succeed.
**Validates: Requirements 3.4**

**Property 18: Unauthenticated requests to protected routes fail**
*For any* protected API endpoint, requests without a valid JWT token should return a 401 Unauthorized response.
**Validates: Requirements 3.5**

### Role Management Properties

**Property 19: Role display matches stored role**
*For any* user, the role displayed in the admin interface should match the role stored in the database.
**Validates: Requirements 6.1**

**Property 20: Role changes update database**
*For any* role change operation, the user's role in the database should be updated to the new role.
**Validates: Requirements 6.2**

**Property 21: Admin role grants full permissions**
*For any* user with role "admin", all authorization checks should pass for all resources.
**Validates: Requirements 6.3**

**Property 22: Removing admin role revokes permissions**
*For any* user whose role is changed from "admin" to another role, admin-only operations should fail.
**Validates: Requirements 6.4**

**Property 23: Role changes are logged**
*For any* role change operation, an admin log entry should be created with the admin ID, timestamp, and details.
**Validates: Requirements 6.5**

### Search and Filter Properties

**Property 24: User search filters correctly**
*For any* search query on username, role, or email, all returned users should match the search criteria.
**Validates: Requirements 5.2**

**Property 25: User list sorting is correct**
*For any* sort operation on the user list (by username, role, or creation date), the results should be in the correct order.
**Validates: Requirements 10.2**

### UI and Display Properties

**Property 26: User list displays required fields**
*For any* user in the admin user list, the display should include username, role, and status.
**Validates: Requirements 5.1**

**Property 27: User details include login history**
*For any* user viewed in the admin dashboard, the details should include their login history.
**Validates: Requirements 10.4**

## Error Handling

### Authentication Errors

1. **Invalid Credentials**: Return 401 with message "Invalid credentials"
2. **Expired Token**: Return 401 with message "Token expired"
3. **Malformed Token**: Return 401 with message "Invalid token"
4. **Account Locked**: Return 403 with message "Account temporarily locked due to failed login attempts"
5. **Missing Token**: Return 401 with message "No token provided"

### Authorization Errors

1. **Insufficient Permissions**: Return 403 with message "Insufficient permissions"
2. **Resource Not Found**: Return 404 with message "Resource not found"
3. **Forbidden Action**: Return 403 with message "You are not authorized to perform this action"

### Validation Errors

1. **Missing Required Fields**: Return 400 with specific field errors
2. **Invalid Email Format**: Return 400 with message "Invalid email format"
3. **Password Too Short**: Return 400 with message "Password must be at least 8 characters"
4. **Duplicate Username**: Return 409 with message "Username already exists"
5. **Invalid Role**: Return 400 with message "Invalid role specified"

### Database Errors

1. **Connection Failed**: Log error, attempt reconnection, return 503 with message "Service temporarily unavailable"
2. **Query Failed**: Log error, return 500 with message "Internal server error"
3. **Constraint Violation**: Return 409 with appropriate message

### Rate Limiting

1. **Too Many Failed Logins**: After 3 failed attempts, lock account for 15 minutes
2. **Too Many Requests**: Implement rate limiting on auth endpoints (10 requests per minute per IP)

## Testing Strategy

### Unit Testing

We will use **Vitest** as the testing framework for both frontend and backend unit tests.

#### Backend Unit Tests

1. **Authentication Service Tests**
   - Test password hashing and comparison
   - Test JWT token generation and verification
   - Test token expiration handling
   - Test authentication with valid/invalid credentials

2. **Authorization Middleware Tests**
   - Test middleware with valid tokens
   - Test middleware with invalid/expired tokens
   - Test role-based access control
   - Test request context attachment

3. **User Management Service Tests**
   - Test user CRUD operations
   - Test username uniqueness validation
   - Test password validation
   - Test role assignment

4. **Admin Service Tests**
   - Test admin log creation
   - Test user statistics calculation
   - Test bulk operations

#### Frontend Unit Tests

1. **AuthContext Tests**
   - Test login/logout functionality
   - Test token storage and retrieval
   - Test authentication state management
   - Test role checking

2. **Component Tests**
   - Test SignUp form validation
   - Test Login form submission
   - Test ProtectedRoute redirects
   - Test RoleGuard conditional rendering
   - Test AdminDashboard user list rendering

3. **API Client Tests**
   - Test request interceptors for JWT tokens
   - Test error handling
   - Test response parsing

### Property-Based Testing

We will use **fast-check** for property-based testing in TypeScript.

#### Configuration

- Minimum 100 iterations per property test
- Each property test must reference the design document property number
- Tag format: `**Feature: auth-and-admin-system, Property {number}: {property_text}**`

#### Property Test Coverage

1. **Authentication Properties (Properties 1-5)**
   - Generate random valid users and test authentication
   - Generate random invalid credentials and test rejection
   - Generate tokens with various expiration times
   - Generate valid/invalid tokens and test extraction/rejection

2. **User Management Properties (Properties 6-13)**
   - Generate random valid user data and test creation
   - Generate duplicate usernames and test rejection
   - Generate users with different roles and test assignment
   - Generate passwords of various lengths and test validation
   - Test password hashing for all stored passwords

3. **Authorization Properties (Properties 14-18)**
   - Generate random student/faculty/admin users and test access control
   - Generate random protected endpoints and test authentication requirements

4. **Role Management Properties (Properties 19-23)**
   - Generate random role changes and test updates
   - Generate admin actions and test logging

5. **Search and Filter Properties (Properties 24-25)**
   - Generate random search queries and test filtering
   - Generate random sort operations and test ordering

6. **UI Properties (Properties 26-27)**
   - Generate random user data and test display rendering

### Integration Testing

1. **End-to-End Authentication Flow**
   - Test complete login flow from form submission to dashboard
   - Test logout and session clearing
   - Test token refresh flow

2. **Role-Based Access Flow**
   - Test student accessing own profile
   - Test faculty viewing student profiles
   - Test admin managing users

3. **Admin Dashboard Flow**
   - Test user creation flow
   - Test user editing flow
   - Test role change flow
   - Test user deletion flow

### Test Data Generators

For property-based testing, we will create generators for:

```typescript
// User generators
const validUserGen = fc.record({
  username: fc.string({ minLength: 3, maxLength: 20 }),
  password: fc.string({ minLength: 8, maxLength: 50 }),
  role: fc.constantFrom('admin', 'faculty', 'student'),
  email: fc.emailAddress()
});

const invalidPasswordGen = fc.string({ maxLength: 7 });

const duplicateUsernameGen = (existingUsers: User[]) => 
  fc.constantFrom(...existingUsers.map(u => u.username));

// Token generators
const validTokenGen = (user: User) => generateToken(user);

const expiredTokenGen = (user: User) => 
  generateToken(user, { expiresIn: '-1d' });

const malformedTokenGen = fc.string();

// Search query generators
const searchQueryGen = fc.record({
  query: fc.string(),
  field: fc.constantFrom('username', 'role', 'email')
});

// Role change generators
const roleChangeGen = fc.record({
  userId: fc.uuid(),
  oldRole: fc.constantFrom('admin', 'faculty', 'student'),
  newRole: fc.constantFrom('admin', 'faculty', 'student')
});
```

## Security Considerations

### Password Security

1. **Hashing**: Use bcrypt with salt factor 10
2. **Validation**: Minimum 8 characters, recommend complexity requirements
3. **Storage**: Never log or display passwords
4. **Transmission**: Always use HTTPS in production

### Token Security

1. **Secret Key**: Use strong, randomly generated secret (minimum 256 bits)
2. **Storage**: Store in httpOnly cookies or secure localStorage
3. **Expiration**: 7-day expiration with refresh capability
4. **Transmission**: Always include in Authorization header

### Rate Limiting

1. **Login Attempts**: Maximum 3 failed attempts before 15-minute lockout
2. **API Requests**: 10 requests per minute per IP for auth endpoints
3. **Token Refresh**: Maximum 5 refreshes per hour

### Input Validation

1. **Sanitization**: Sanitize all user inputs to prevent injection attacks
2. **Validation**: Validate all inputs against schema before processing
3. **Error Messages**: Avoid revealing sensitive information in error messages

### Audit Logging

1. **Admin Actions**: Log all admin operations with timestamp and user
2. **Authentication Events**: Log all login attempts (success and failure)
3. **Role Changes**: Log all role modifications
4. **Data Access**: Log access to sensitive data

## Performance Considerations

### Database Optimization

1. **Indexing**: Create indexes on frequently queried fields (username, id, role)
2. **Connection Pooling**: Use MongoDB connection pooling for better performance
3. **Query Optimization**: Use lean queries for read-only operations

### Caching Strategy

1. **User Data**: Cache user data in memory for 5 minutes
2. **Token Verification**: Cache decoded tokens for request duration
3. **Admin Statistics**: Cache statistics for 1 minute

### Frontend Optimization

1. **Code Splitting**: Lazy load admin dashboard components
2. **Memoization**: Use React.memo for expensive components
3. **Query Caching**: Use React Query caching for API responses

## Migration Strategy

### Phase 1: Backend Authentication (Week 1)

1. Update User model with new fields (isActive, failedLoginAttempts, etc.)
2. Implement authentication service and JWT token management
3. Create authorization middleware
4. Update existing routes with authentication middleware
5. Create admin routes for user management
6. Remove mock data from MemStorage

### Phase 2: Frontend Authentication (Week 1-2)

1. Update AuthContext with new functionality
2. Create SignUp component
3. Update Login component with error handling
4. Implement ProtectedRoute component
5. Add role-based navigation

### Phase 3: Admin Dashboard (Week 2)

1. Create AdminDashboard layout
2. Implement UserList component with filtering and sorting
3. Create UserForm for create/edit operations
4. Implement RoleManager component
5. Add AdminLogs viewer

### Phase 4: Testing and Refinement (Week 3)

1. Write unit tests for all components
2. Implement property-based tests
3. Conduct integration testing
4. Fix bugs and refine UX
5. Performance optimization

### Phase 5: Deployment (Week 3)

1. Environment configuration
2. Database migration
3. Security audit
4. Production deployment
5. Monitoring setup

## Dependencies

### New Dependencies

```json
{
  "dependencies": {
    "jsonwebtoken": "^9.0.2",
    "bcrypt": "^5.1.1",
    "@hookform/resolvers": "^3.3.4",
    "react-hook-form": "^7.49.3",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "fast-check": "^3.15.0",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/bcrypt": "^5.0.2",
    "vitest": "^1.2.0"
  }
}
```

### Existing Dependencies (Already in Project)

- express
- mongoose
- @tanstack/react-query
- wouter
- lucide-react
- shadcn/ui components

## Monitoring and Observability

### Metrics to Track

1. **Authentication Metrics**
   - Login success/failure rate
   - Average login time
   - Token expiration rate
   - Failed login attempts per user

2. **Authorization Metrics**
   - 403 error rate by endpoint
   - Role distribution
   - Access pattern analysis

3. **Admin Activity Metrics**
   - User creation rate
   - Role change frequency
   - User deletion rate
   - Admin action distribution

### Logging Strategy

1. **Authentication Events**: Log all login attempts with timestamp, username, IP, and result
2. **Authorization Failures**: Log all 403 errors with user, resource, and action
3. **Admin Actions**: Log all admin operations with full details
4. **Errors**: Log all errors with stack traces and context

### Alerting

1. **High Failed Login Rate**: Alert if failed login rate exceeds 10% over 5 minutes
2. **Database Connection Issues**: Alert immediately on connection failures
3. **Unusual Admin Activity**: Alert on bulk deletions or mass role changes
4. **Performance Degradation**: Alert if response times exceed thresholds

## Future Enhancements

1. **Multi-Factor Authentication (MFA)**: Add optional 2FA for admin accounts
2. **OAuth Integration**: Support login with Google, GitHub, etc.
3. **Password Reset Flow**: Implement email-based password reset
4. **Session Management**: Add ability to view and revoke active sessions
5. **Advanced Audit Logs**: Add filtering, export, and visualization
6. **Granular Permissions**: Move beyond roles to permission-based access control
7. **API Rate Limiting**: Implement more sophisticated rate limiting
8. **Account Recovery**: Add account recovery mechanisms
9. **User Preferences**: Allow users to customize their experience
10. **Notification System**: Add notifications for important events
