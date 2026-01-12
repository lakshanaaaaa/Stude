# Faculty and Admin Onboarding Skip Fix

## Problem
Faculty and admin users don't have platform IDs (LeetCode, CodeChef, etc.) since they don't solve problems. However, the system was treating them like students and potentially requiring onboarding, which asks for platform usernames.

## Solution
Automatically mark faculty and admin users as `isOnboarded: true` so they skip the onboarding process entirely.

## Changes Made

### 1. Role Update Endpoint (`PATCH /api/admin/users/:id`)
**File:** `server/routes.ts`

When an admin changes a user's role to "faculty" or "admin", automatically set `isOnboarded: true`:

```typescript
if (role !== undefined) {
  if (!["admin", "faculty", "student"].includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }
  updateData.role = role;
  
  // Faculty and admin don't need onboarding (no platform IDs required)
  // Automatically mark them as onboarded
  if (role === "faculty" || role === "admin") {
    updateData.isOnboarded = true;
  }
}
```

**Impact:**
- When admin promotes a student to faculty → automatically onboarded
- When admin creates a new faculty/admin → automatically onboarded
- Faculty/admin can access their dashboards immediately

### 2. Department Assignment Endpoint (`PATCH /api/admin/users/:id/department`)
**File:** `server/routes.ts`

When assigning a department to a faculty member, ensure they're marked as onboarded:

```typescript
// Faculty don't need onboarding, ensure they're marked as onboarded
const updatedUser = await storage.updateUser(id, { 
  department,
  isOnboarded: true 
});
```

**Impact:**
- Faculty assigned to departments are automatically onboarded
- No need for manual onboarding flag update

### 3. Passport OAuth Configuration
**File:** `server/passport.ts`

Added clear comments explaining that new OAuth users default to "student" role with `isOnboarded: false`:

```typescript
// Check if email belongs to faculty or admin domain (you can customize this logic)
// For now, all new OAuth users are students and need onboarding
user = await storage.createUser({
  username,
  googleId: profile.id,
  email: profile.emails?.[0]?.value,
  name: profile.displayName,
  avatar: profile.photos?.[0]?.value,
  role: "student", // Default role for OAuth users
  isOnboarded: false, // Students need to complete onboarding
});
```

**Note:** Admin must manually change role to faculty/admin after OAuth signup.

## User Flow

### Student Flow
1. Sign in with Google → Created as "student" with `isOnboarded: false`
2. Redirected to `/onboarding` page
3. Must provide: username, department, platform IDs
4. After onboarding → `isOnboarded: true` → Access dashboard

### Faculty Flow (Option 1: Admin Promotion)
1. Sign in with Google → Created as "student" with `isOnboarded: false`
2. Admin changes role to "faculty" → **Automatically** `isOnboarded: true`
3. Admin assigns department → Confirmed `isOnboarded: true`
4. Access Faculty Dashboard immediately

### Faculty Flow (Option 2: Pre-created Account)
1. Admin creates faculty account → `isOnboarded: true` (from seed data)
2. Admin assigns department → Confirmed `isOnboarded: true`
3. Faculty signs in with Google → Linked to existing account
4. Access Faculty Dashboard immediately

### Admin Flow
1. Admin account created in seed data → `isOnboarded: true`
2. Sign in with Google → Linked to existing account
3. Access Admin Dashboard immediately

## Frontend Protection

The frontend already has proper checks in place:

**File:** `client/src/App.tsx`

```typescript
// Only redirect to onboarding if user is not onboarded AND is a student
if (user.role === "student" && !user.isOnboarded && location !== "/onboarding") {
  setLocation("/onboarding");
  return;
}

// Block access to non-onboarding pages for non-onboarded students
if (user?.role === "student" && !user?.isOnboarded && location !== "/onboarding") {
  return null;
}
```

**Protection:**
- ✅ Only students with `isOnboarded: false` are redirected to onboarding
- ✅ Faculty and admin bypass onboarding completely
- ✅ Faculty and admin can access all pages immediately

## Testing

### Test Case 1: Promote Student to Faculty
1. Create a student account (sign in with Google)
2. Admin goes to User Management
3. Change role from "student" to "faculty"
4. **Expected:** User is automatically marked as onboarded
5. **Expected:** User can access Faculty Dashboard without onboarding

### Test Case 2: Assign Department to Faculty
1. Admin changes user role to "faculty"
2. Admin assigns department (e.g., "CSE")
3. **Expected:** User remains onboarded
4. **Expected:** Faculty Dashboard shows correct department

### Test Case 3: New Faculty Sign In
1. Admin creates faculty account in database
2. Faculty signs in with Google
3. **Expected:** No onboarding redirect
4. **Expected:** Direct access to Faculty Dashboard

### Test Case 4: Admin Access
1. Admin signs in with Google
2. **Expected:** No onboarding redirect
3. **Expected:** Direct access to Admin Dashboard

## Database State

### Students
```javascript
{
  role: "student",
  isOnboarded: false, // Until they complete onboarding
  mainAccounts: [...], // Platform IDs required
  subAccounts: [...]
}
```

### Faculty
```javascript
{
  role: "faculty",
  isOnboarded: true, // Always true, no platform IDs needed
  department: "CSE", // Required for faculty
  mainAccounts: undefined, // Not applicable
  subAccounts: undefined
}
```

### Admin
```javascript
{
  role: "admin",
  isOnboarded: true, // Always true, no platform IDs needed
  mainAccounts: undefined, // Not applicable
  subAccounts: undefined
}
```

## API Response Changes

### Role Update Response
Now includes `isOnboarded` field:
```json
{
  "id": "user-id",
  "username": "faculty1",
  "role": "faculty",
  "isOnboarded": true
}
```

### Department Update Response
Now includes `isOnboarded` field:
```json
{
  "id": "user-id",
  "username": "faculty1",
  "role": "faculty",
  "department": "CSE",
  "isOnboarded": true
}
```

## Benefits

1. ✅ **Automatic Onboarding Skip** - Faculty/admin don't see onboarding page
2. ✅ **No Manual Flag Update** - System automatically handles onboarding status
3. ✅ **Role-Based Logic** - Clear separation between student and faculty/admin flows
4. ✅ **Immediate Access** - Faculty/admin can use dashboards right away
5. ✅ **No Platform IDs Required** - Faculty/admin don't need to provide platform usernames

## Future Enhancements

Consider implementing:
1. **Email Domain Detection** - Auto-assign faculty role based on email domain
2. **Bulk Faculty Import** - CSV upload for multiple faculty accounts
3. **Faculty Onboarding** - Optional onboarding for faculty preferences (not platform IDs)
4. **Role Change Confirmation** - Warn admin when changing roles

## Files Modified

- `server/routes.ts` - Role and department update endpoints
- `server/passport.ts` - OAuth configuration comments

## Related Files (No Changes Needed)

- `client/src/App.tsx` - Already has proper role checks
- `client/src/pages/Onboarding.tsx` - Only accessible to students
- `server/storage.ts` - Seed data already sets `isOnboarded: true` for faculty/admin

## Summary

Faculty and admin users now automatically skip the onboarding process since they don't need platform IDs. The system intelligently handles onboarding based on user role, ensuring a smooth experience for all user types.
