# Google OAuth Setup Guide

This application now uses Google OAuth for authentication instead of the old username/password system.

## Setup Instructions

### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Select "Web application"
   - Add authorized redirect URIs:
     - For development: `http://localhost:5000/api/auth/google/callback`
     - For production: `https://yourdomain.com/api/auth/google/callback`
   - Click "Create"

5. Copy your Client ID and Client Secret

### 2. Configure Environment Variables

Update your `.env` file with the Google OAuth credentials:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Optional: Set client URL for redirects (defaults to http://localhost:5000)
CLIENT_URL=http://localhost:5000
```

### 3. Start the Application

```bash
npm run dev
```

## How It Works

### Authentication Flow

1. User clicks "Sign in with Google" on the login page
2. User is redirected to Google's OAuth consent screen
3. After approval, Google redirects back to `/api/auth/google/callback`
4. Server creates or updates user account with Google profile data
5. Server generates JWT token and redirects to `/auth/callback` with token
6. Frontend stores token and redirects to dashboard or onboarding

### User Data

When a user signs in with Google, the following data is stored:

- `googleId`: Unique Google account identifier
- `email`: User's email from Google
- `name`: User's display name from Google
- `avatar`: User's profile picture URL from Google
- `username`: Generated from email (part before @)
- `role`: Defaults to "student"
- `isOnboarded`: Defaults to false (requires onboarding)

### Existing Users

If a user with the same email already exists (from old system), their account will be updated with Google OAuth data instead of creating a duplicate.

## Changes Made

### Backend Changes

1. **New Dependencies**:
   - `passport-google-oauth20`: Google OAuth strategy
   - `@types/passport-google-oauth20`: TypeScript types

2. **New Files**:
   - `server/passport.ts`: Passport configuration for Google OAuth

3. **Updated Files**:
   - `server/routes.ts`: Added Google OAuth routes
   - `server/index.ts`: Initialize Passport
   - `server/storage.ts`: Added methods for Google ID and email lookup
   - `server/storage/mongodb.ts`: Added methods for Google ID and email lookup
   - `server/models/User.ts`: Added Google OAuth fields to schema
   - `shared/schema.ts`: Updated User schema with optional password and Google fields

### Frontend Changes

1. **New Files**:
   - `client/src/pages/AuthCallback.tsx`: Handles OAuth redirect

2. **Updated Files**:
   - `client/src/pages/Login.tsx`: Added "Sign in with Google" button
   - `client/src/App.tsx`: Removed signup route, added auth callback route

3. **Removed Files**:
   - `client/src/pages/SignUp.tsx`: Old signup page removed

## Testing

### Test Google OAuth Login

1. Make sure your `.env` file has valid Google OAuth credentials
2. Start the development server: `npm run dev`
3. Navigate to `http://localhost:5000/login`
4. Click "Sign in with Google"
5. Sign in with your Google account
6. You should be redirected to the onboarding page (for new users) or dashboard

### Test Existing Username/Password Login

Old users with username/password can still log in using the traditional login form. However, new signups are disabled - users must use Google OAuth.

## Security Notes

- JWT tokens expire after 7 days
- Google OAuth tokens are not stored (only user profile data)
- Passwords are optional now (only for legacy users)
- OAuth users cannot use password login
- All OAuth users default to "student" role

## Troubleshooting

### "Invalid credentials" error
- Check that your Google Client ID and Secret are correct
- Verify the callback URL matches exactly in Google Console

### Redirect loop
- Clear browser cookies and localStorage
- Check that CLIENT_URL environment variable is set correctly

### "Please sign in with Google" error
- This means the user account was created via Google OAuth
- They must use Google sign-in, not username/password

## Production Deployment

Before deploying to production:

1. Update authorized redirect URIs in Google Console with production URL
2. Update `GOOGLE_CALLBACK_URL` in production environment variables
3. Update `CLIENT_URL` to production domain
4. Ensure HTTPS is enabled (required by Google OAuth)
