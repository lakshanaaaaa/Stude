# Migration Guide: Username/Password to Google OAuth

## Overview

The application has been updated to use Google OAuth as the primary authentication method. This guide explains what changed and how it affects existing users.

## What Changed

### Removed Features
- ❌ Sign up page (`/signup` route)
- ❌ New user registration with username/password
- ❌ Password-based account creation

### New Features
- ✅ Google OAuth login ("Sign in with Google" button)
- ✅ Automatic account creation from Google profile
- ✅ Profile picture from Google account
- ✅ Email-based user identification

### Preserved Features
- ✅ Existing username/password login still works
- ✅ All existing user accounts remain functional
- ✅ Admin, faculty, and student roles unchanged
- ✅ All student data and analytics preserved

## For Existing Users

### If You Have a Username/Password Account

You can continue logging in with your username and password. Nothing changes for you.

**Optional**: You can link your Google account by:
1. Contact an administrator to add your Google email to your account
2. Next time, you can use "Sign in with Google" instead

### If You're a New User

You must use "Sign in with Google" to create an account. Username/password signup is no longer available.

## For Administrators

### Seeded Accounts

All seeded accounts (admin, faculty, students) continue to work with their existing credentials:

- **Admin**: username: `admin`, password: `admin123`
- **Faculty**: username: `mahalakshmi`, `sachin`, `lakshanaad`, password: `faculty123`
- **Students**: All seeded students with password: `student123`

### Managing Users

- Existing users can still be managed through the admin dashboard
- New users will be created automatically when they sign in with Google
- OAuth users will have `googleId`, `email`, `name`, and `avatar` fields populated

## Database Schema Changes

### User Model Updates

```typescript
// New optional fields
{
  password: string | undefined,  // Now optional (was required)
  googleId: string | undefined,  // Google account ID
  email: string | undefined,     // Email from Google
  name: string | undefined,      // Display name from Google
  avatar: string | undefined,    // Profile picture URL
}
```

### MongoDB Indexes

If using MongoDB, the following indexes are automatically created:
- `googleId`: Unique, sparse index
- `email`: Unique, sparse index

## API Changes

### New Endpoints

- `GET /api/auth/google` - Initiates Google OAuth flow
- `GET /api/auth/google/callback` - Handles Google OAuth callback

### Modified Endpoints

- `POST /api/auth/login` - Now checks if user is OAuth-only and returns appropriate error
- `POST /api/auth/signup` - Still exists but only for programmatic use (not exposed in UI)

### Unchanged Endpoints

- `GET /api/auth/me` - Get current user
- `POST /api/auth/onboard` - Student onboarding
- All student and admin endpoints remain the same

## Environment Variables

### Required New Variables

```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

### Optional Variables

```env
CLIENT_URL=http://localhost:5000  # For OAuth redirects
```

## Testing Checklist

- [ ] Existing admin can log in with username/password
- [ ] Existing faculty can log in with username/password
- [ ] Existing students can log in with username/password
- [ ] New users can sign in with Google
- [ ] Google OAuth creates new user accounts
- [ ] Google OAuth redirects to onboarding for new students
- [ ] Google OAuth redirects to dashboard for onboarded users
- [ ] JWT tokens work correctly for both auth methods
- [ ] Protected routes still enforce authentication
- [ ] Role-based access control still works

## Rollback Plan

If you need to rollback to the old system:

1. Restore these files from git:
   - `client/src/pages/SignUp.tsx`
   - `client/src/App.tsx` (restore signup route)
   - `client/src/pages/Login.tsx` (remove Google button)
   - `server/routes.ts` (remove Google OAuth routes)
   - `server/index.ts` (remove Passport initialization)
   - `shared/schema.ts` (make password required)

2. Uninstall packages:
   ```bash
   npm uninstall passport-google-oauth20 @types/passport-google-oauth20
   ```

3. Remove files:
   - `server/passport.ts`
   - `client/src/pages/AuthCallback.tsx`

4. Restart the application

## Support

For issues or questions:
1. Check `GOOGLE_OAUTH_SETUP.md` for setup instructions
2. Review `TROUBLESHOOTING.md` for common issues
3. Contact the development team
