# Onboarding Flow Test Checklist

## Pre-Testing Setup
- [ ] Ensure MongoDB or in-memory storage is running
- [ ] Clear browser localStorage to test fresh user flow
- [ ] Have Google OAuth configured properly

## Test Cases

### 1. New User Sign-In Flow
- [ ] Sign in with Google OAuth
- [ ] Verify redirect to `/onboarding` page
- [ ] Confirm "Step 1 of 3" is displayed

### 2. Step 1: Username Selection
- [ ] Enter username less than 3 characters → Should show validation error
- [ ] Enter username more than 20 characters → Should show validation error
- [ ] Enter valid username and click "Check" → Should verify availability
- [ ] Try an existing username → Should show "Username is already taken"
- [ ] Try a unique username → Should show "Username is available!"
- [ ] Click "Next" without checking → Should show error
- [ ] Click "Next" with available username → Should proceed to Step 2

### 3. Step 2: Department Selection
- [ ] Verify dropdown shows all departments (CSE, AI&DS, CSE(AI&ML), CSBS, IT, ECE, EEE, MECH, CIVIL)
- [ ] Try clicking "Next" without selection → Should show validation error
- [ ] Select a department → Should enable "Next" button
- [ ] Click "Back" → Should return to Step 1 with username preserved
- [ ] Click "Next" → Should proceed to Step 3

### 4. Step 3: Coding Platform Accounts
- [ ] Verify all three input fields are visible (LeetCode, CodeForces, CodeChef)
- [ ] Try submitting without any platform → Should show validation error
- [ ] Enter only LeetCode username → Should allow submission
- [ ] Enter only CodeForces username → Should allow submission
- [ ] Enter only CodeChef username → Should allow submission
- [ ] Enter all three usernames → Should allow submission
- [ ] Click "Back" → Should return to Step 2 with department preserved
- [ ] Click "Complete Setup" → Should submit form

### 5. Onboarding Completion
- [ ] After submission, verify redirect to `/dashboard`
- [ ] Confirm user profile appears in student list
- [ ] Verify user's `isOnboarded` status is `true`
- [ ] Check that student record was created with correct data
- [ ] Verify coding platform accounts are saved correctly

### 6. Already Onboarded User
- [ ] Sign out and sign back in
- [ ] Verify redirect to `/dashboard` (not `/onboarding`)
- [ ] Try manually navigating to `/onboarding` → Should redirect to dashboard
- [ ] Confirm profile data is still intact

### 7. API Endpoint Testing

#### POST `/api/auth/check-username`
```bash
curl -X POST http://localhost:5000/api/auth/check-username \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser123"}'
```
Expected: `{ "available": true/false, "username": "testuser123" }`

#### POST `/api/auth/onboard`
```bash
curl -X POST http://localhost:5000/api/auth/onboard \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "username": "newuser",
    "department": "CSE",
    "leetcode": "newuser_lc",
    "codeforces": "newuser_cf",
    "codechef": "newuser_cc"
  }'
```
Expected: `{ "success": true, "student": {...}, "user": {...} }`

### 8. Edge Cases
- [ ] Network error during username check → Should show error message
- [ ] Network error during onboarding → Should show error message
- [ ] Duplicate username submission → Should be rejected by backend
- [ ] Missing required fields → Should show validation errors
- [ ] Special characters in username → Should validate properly
- [ ] Very long platform usernames → Should handle gracefully

### 9. UI/UX Verification
- [ ] Progress indicator updates correctly (Step 1/2/3 of 3)
- [ ] Back button works on all steps except Step 1
- [ ] Loading states show during API calls
- [ ] Success/error toasts appear appropriately
- [ ] Form fields retain values when navigating back
- [ ] Mobile responsive design works correctly
- [ ] Keyboard navigation works (Tab, Enter)
- [ ] Screen reader accessibility

### 10. Database Verification
- [ ] Check user record has `isOnboarded: true`
- [ ] Check student record exists with correct username
- [ ] Verify department is saved correctly
- [ ] Verify coding platform accounts are in `mainAccounts`
- [ ] Confirm no duplicate records created

## Performance Testing
- [ ] Username check responds within 500ms
- [ ] Onboarding submission completes within 2 seconds
- [ ] No memory leaks during navigation
- [ ] Form state persists correctly

## Security Testing
- [ ] Cannot access onboarding endpoint without authentication
- [ ] Cannot submit onboarding for another user
- [ ] Username validation prevents SQL injection
- [ ] XSS attempts are properly escaped
- [ ] Rate limiting on username check endpoint (if implemented)

## Browser Compatibility
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

## Notes
- Document any bugs found during testing
- Take screenshots of any UI issues
- Record API response times
- Note any console errors or warnings
