# User Management Fixes

## Issues Fixed

### 1. User Deletion - Complete Record Removal
**Problem**: When a user was deleted in user management, their student record remained in the database, causing them to still appear in the dashboard.

**Solution**: 
- Modified `DELETE /api/admin/users/:id` endpoint to:
  - Check if the user has an associated student record
  - Delete the student record before deleting the user
  - Invalidate both users and students queries in the frontend

**Files Changed**:
- `server/routes.ts` - Updated delete endpoint
- `server/storage.ts` - Added `deleteStudent()` method to IStorage interface and MemStorage
- `server/storage/mongodb.ts` - Added `deleteStudent()` method to MongoStorage
- `client/src/pages/AdminDashboard.tsx` - Added students query invalidation

### 2. Reset Onboarding - Complete Reset
**Problem**: When admin reset a user's onboarding:
- The username was not removed
- The student record remained in the database
- User was not added to incomplete onboarding list

**Solution**:
- Modified `POST /api/admin/users/:id/reset-onboarding` endpoint to:
  - Delete the associated student record
  - Generate a temporary username based on email or googleId
  - Set `isOnboarded` to false
  - User will be prompted to choose a new username during onboarding

**Files Changed**:
- `server/routes.ts` - Updated reset-onboarding endpoint
- `client/src/pages/AdminDashboard.tsx` - Updated toast message and added students query invalidation

## Technical Details

### New Storage Methods
```typescript
deleteStudent(username: string): Promise<boolean>
```
- Deletes a student record by username
- Returns true if deletion was successful
- Implemented in both MemStorage and MongoStorage

### Updated Endpoints

#### DELETE /api/admin/users/:id
```typescript
// Now performs:
1. Get user by id
2. If user is a student, delete their student record
3. Delete the user
4. Return success message
```

#### POST /api/admin/users/:id/reset-onboarding
```typescript
// Now performs:
1. Get user by id
2. Delete associated student record
3. Generate temporary username from email/googleId
4. Update user with isOnboarded=false and new temp username
5. Return updated user
```

## Testing Checklist

- [x] Delete user removes them from user list
- [x] Delete user removes them from dashboard
- [x] Delete user removes their student record
- [x] Reset onboarding removes student record
- [x] Reset onboarding removes username
- [x] Reset onboarding adds user to incomplete list
- [x] User can complete onboarding again after reset
- [x] User can choose new username after reset

## Admin Email Configuration

Added admin email configuration to `.env`:
```
ADMIN_EMAIL=lakshanasampath916@gmail.com
```

This can be used for admin-specific features like notifications or access control.
