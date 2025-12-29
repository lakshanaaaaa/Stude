# Admin Management Guide

## Making a User an Admin

To promote a user to admin role, use the `make-admin` script:

### Usage

```bash
npm run make-admin <email>
```

### Example

```bash
npm run make-admin dineshsenathipathi@gmail.com
```

### What it does

1. Connects to the database (MongoDB or in-memory storage)
2. Finds the user by email address
3. Updates their role to "admin"
4. Confirms the change

### Output

```
✅ MongoDB connected successfully
✅ Using MongoDB storage
Found user: dineshsenathipathi (dineshsenathipathi@gmail.com)
Current role: student
✅ Successfully updated dineshsenathipathi to admin role
New role: admin
```

## Admin Dashboard Features

Once a user is an admin, they can access the admin dashboard at `/admin` with the following capabilities:

### User Management
- View all users with their roles and onboarding status
- Change user roles (admin/faculty/student)
- Delete users (with confirmation)
- Reset student onboarding status

### Incomplete Onboarding Tracking
- View students who haven't completed onboarding
- Badge notification showing count of incomplete users
- Quick delete option for incomplete accounts

### Analytics
- Department distribution
- Platform usage statistics
- Problem difficulty breakdown
- Engagement metrics

### Top Performers
- Leaderboard of top 5 students by problem count
- Direct links to student profiles

## Admin Permissions

Admins have access to:
- `/admin` - Admin dashboard
- All user management endpoints
- Analytics and reporting
- System-wide statistics

## Security Notes

- Admins cannot delete their own account
- All admin actions are logged
- Role changes require admin authentication
- Onboarding resets only affect student accounts

## Current Admin

✅ **dineshsenathipathi@gmail.com** - Admin role assigned
