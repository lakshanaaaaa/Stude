# Authentication System

## Quick Start

### For New Users
1. Go to the login page
2. Click "Sign in with Google"
3. Authorize with your Google account
4. Complete onboarding (add your coding platform usernames)
5. Start using the platform!

### For Existing Users
1. Go to the login page
2. Enter your username and password
3. Click "Sign in"
4. Access your dashboard

## Authentication Methods

### Google OAuth (Primary Method)
- **Who**: All new users
- **How**: Click "Sign in with Google" button
- **Benefits**: 
  - No password to remember
  - Automatic profile picture
  - Quick and secure
  - Email pre-filled

### Username/Password (Legacy Method)
- **Who**: Existing users only
- **How**: Traditional login form
- **Note**: New signups with username/password are disabled

## Setup for Developers

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Google OAuth

Create a Google Cloud project and OAuth credentials:
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials
3. Add callback URL: `http://localhost:5000/api/auth/google/callback`
4. Copy Client ID and Secret

### 3. Update Environment Variables

Edit `.env` file:
```env
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

### 4. Start Development Server
```bash
npm run dev
```

### 5. Test Authentication
- Visit `http://localhost:5000/login`
- Try Google OAuth login
- Try traditional login with seeded accounts

## Seeded Test Accounts

### Admin
- Username: `admin`
- Password: `admin123`
- Access: Full system access

### Faculty
- Username: `mahalakshmi`, `sachin`, or `lakshanaad`
- Password: `faculty123`
- Access: View student data

### Students
- Username: Any seeded student (e.g., `aadhisankara`)
- Password: `student123`
- Access: Own profile and dashboard

## API Endpoints

### Authentication
```
GET  /api/auth/google              - Initiate Google OAuth
GET  /api/auth/google/callback     - Google OAuth callback
POST /api/auth/login               - Traditional login
POST /api/auth/signup              - Create user (programmatic only)
GET  /api/auth/me                  - Get current user
POST /api/auth/onboard             - Student onboarding
```

### Protected Routes
All routes require authentication via JWT token in Authorization header:
```
Authorization: Bearer <token>
```

## User Roles

### Student (Default for OAuth)
- View own profile
- Edit own profile
- Add coding platform accounts
- View analytics and badges
- Scrape platform data

### Faculty
- View all student profiles
- View student analytics
- Access student list

### Admin
- All faculty permissions
- Manage users (create, update, delete)
- Change user roles
- Access admin dashboard

## Security Features

- JWT tokens with 7-day expiration
- Password hashing with bcrypt (10 rounds)
- Google OAuth 2.0 standard
- Role-based access control
- Protected API endpoints
- Unique email and Google ID constraints

## Troubleshooting

### "Invalid credentials" error
- Check username and password are correct
- Verify user exists in database
- For OAuth users, use Google sign-in

### "Please sign in with Google" error
- Your account was created via Google OAuth
- You must use "Sign in with Google" button
- Cannot use password login for OAuth accounts

### OAuth redirect issues
- Verify Google Client ID and Secret
- Check callback URL matches Google Console
- Ensure environment variables are loaded
- Clear browser cookies and try again

### Token expired
- Tokens expire after 7 days
- Log out and log back in
- Check system clock is correct

## Documentation

- `GOOGLE_OAUTH_SETUP.md` - Detailed OAuth setup guide
- `MIGRATION_GUIDE.md` - Migration from old auth system
- `OAUTH_IMPLEMENTATION_SUMMARY.md` - Technical implementation details

## Support

For issues or questions:
1. Check documentation files
2. Review error messages in browser console
3. Check server logs for backend errors
4. Verify environment variables are set
5. Contact development team

## Future Enhancements

Planned improvements:
- [ ] Link Google account to existing username/password accounts
- [ ] Add more OAuth providers (GitHub, Microsoft)
- [ ] Implement refresh tokens
- [ ] Add 2FA for admin accounts
- [ ] Password reset flow for legacy users
- [ ] Profile picture upload for non-OAuth users
- [ ] Email verification
- [ ] Account recovery options
