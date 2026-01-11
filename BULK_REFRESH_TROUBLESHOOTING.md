# Bulk Refresh Button - Troubleshooting Guide

## Issue: Button Not Working

### Quick Checks

1. **Is the server running?**
   ```bash
   # Check if server is running on port 5005
   # You should see: "serving on port 5005"
   ```

2. **Are you logged in as Faculty or Admin?**
   - The button only appears for Faculty and Admin users
   - Students cannot see this button

3. **Do you have a department assigned?**
   - Faculty must have a department assigned
   - Check in Admin Dashboard → User Management

4. **Check browser console for errors**
   - Open Developer Tools (F12)
   - Go to Console tab
   - Look for any red error messages

### Common Issues & Solutions

#### Issue 1: Button Does Nothing When Clicked

**Symptoms**: Click button, nothing happens, no dialog opens

**Possible Causes**:
1. JavaScript error in console
2. Authentication issue
3. Network error

**Solutions**:
1. **Check Console**:
   - Open browser DevTools (F12)
   - Look for errors in Console tab
   - Common errors:
     - "401 Unauthorized" → Not logged in
     - "403 Forbidden" → Wrong role
     - "Network error" → Server not running

2. **Verify Authentication**:
   - Refresh the page
   - Log out and log back in
   - Check if other features work

3. **Check Network Tab**:
   - Open DevTools → Network tab
   - Click the button
   - Look for `/api/faculty/refresh-all` request
   - Check response status and body

#### Issue 2: "Failed to Start Refresh" Error

**Symptoms**: Toast notification shows error message

**Possible Causes**:
1. No department assigned
2. No students in department
3. Server error

**Solutions**:
1. **Check Department Assignment**:
   ```
   Admin Dashboard → User Management → Find your user → Check department field
   ```

2. **Check Students Exist**:
   ```
   Faculty Dashboard → Overview tab → Check "Total Students" count
   ```

3. **Check Server Logs**:
   - Look at server console
   - Check for error messages
   - Common errors:
     - "No department assigned"
     - "No students found in this department"

#### Issue 3: Progress Dialog Opens But Shows No Progress

**Symptoms**: Dialog opens but shows 0/0 students

**Possible Causes**:
1. Refresh didn't actually start
2. Progress endpoint not responding
3. Polling not working

**Solutions**:
1. **Check Server Logs**:
   - Look for "[BulkRefresh] Starting refresh..." message
   - If not present, refresh didn't start

2. **Check Network Tab**:
   - Look for `/api/faculty/refresh-progress` requests
   - Should poll every 2 seconds
   - Check response data

3. **Manually Check Progress**:
   ```bash
   # In browser console or API client
   fetch('/api/faculty/refresh-progress', { credentials: 'include' })
     .then(r => r.json())
     .then(console.log)
   ```

#### Issue 4: Refresh Starts But Stops Immediately

**Symptoms**: Shows "Completed" but no students were actually updated

**Possible Causes**:
1. No students have platform accounts configured
2. All students failed to scrape
3. Server error during scraping

**Solutions**:
1. **Check Error List**:
   - Expand "Errors" section in dialog
   - Read error messages
   - Common: "No platform accounts configured"

2. **Verify Student Profiles**:
   - Check if students have added platform usernames
   - Go to student profiles → Edit Profile
   - Ensure LeetCode/CodeChef/CodeForces usernames are set

3. **Check Server Logs**:
   - Look for scraping errors
   - Check for API rate limits
   - Look for network timeouts

### Testing the Feature

#### Test 1: Verify Endpoint Exists
```bash
# In browser console
fetch('/api/faculty/refresh-all', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' }
})
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

**Expected Response**:
```json
{
  "message": "Started refreshing stats for CSBS department",
  "progress": {
    "isRunning": true,
    "department": "CSBS",
    "totalStudents": 25,
    ...
  }
}
```

#### Test 2: Check Progress
```bash
# In browser console
fetch('/api/faculty/refresh-progress', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log)
```

**Expected Response**:
```json
{
  "isRunning": true,
  "department": "CSBS",
  "totalStudents": 25,
  "completedStudents": 5,
  "failedStudents": 0,
  "currentStudent": "lakshana",
  ...
}
```

#### Test 3: Verify Button Renders
```bash
# In browser console
document.querySelector('button:has-text("Refresh All Stats")')
```

**Expected**: Should return the button element

### Debug Mode

To enable detailed logging:

1. **Open browser console**
2. **Before clicking button, run**:
   ```javascript
   localStorage.setItem('debug', 'true');
   ```
3. **Click the button**
4. **Watch console for detailed logs**

### Manual Refresh (Workaround)

If button doesn't work, you can manually trigger refresh:

```javascript
// In browser console
async function manualRefresh() {
  try {
    const response = await fetch('/api/faculty/refresh-all', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    console.log('Refresh started:', data);
    
    // Poll progress
    const interval = setInterval(async () => {
      const progress = await fetch('/api/faculty/refresh-progress', {
        credentials: 'include'
      }).then(r => r.json());
      
      console.log('Progress:', progress);
      
      if (!progress.isRunning) {
        clearInterval(interval);
        console.log('Refresh complete!');
      }
    }, 2000);
  } catch (error) {
    console.error('Error:', error);
  }
}

manualRefresh();
```

### Server-Side Debugging

#### Check if endpoint is registered:
```bash
# In server logs, look for route registration
# Should see: POST /api/faculty/refresh-all
```

#### Check authentication middleware:
```bash
# In server logs, look for auth errors
# Common: "No token provided", "Invalid token"
```

#### Check department assignment:
```bash
# In MongoDB or server logs
# Verify user has department field set
```

### Common Error Messages

| Error Message | Cause | Solution |
|--------------|-------|----------|
| "No token provided" | Not logged in | Log in again |
| "Insufficient permissions" | Wrong role | Must be Faculty or Admin |
| "No department assigned" | Faculty has no department | Admin must assign department |
| "No students found" | Department has no students | Add students to department |
| "A bulk refresh is already in progress" | Another refresh running | Wait for it to complete |
| "No platform accounts configured" | Student has no usernames | Student must add platform accounts |

### Still Not Working?

1. **Clear browser cache and cookies**
2. **Try in incognito/private window**
3. **Restart the server**
4. **Check server logs for errors**
5. **Verify database connection**
6. **Check if other features work**

### Contact Information

If issue persists:
1. Check server console logs
2. Check browser console errors
3. Verify user role and department
4. Test with manual fetch commands above
5. Check network tab for failed requests

### Quick Fix Checklist

- [ ] Server is running on port 5005
- [ ] Logged in as Faculty or Admin
- [ ] Department is assigned to user
- [ ] Students exist in department
- [ ] Students have platform accounts configured
- [ ] No JavaScript errors in console
- [ ] Network requests are successful
- [ ] Browser cache is cleared
- [ ] Tried in incognito mode
- [ ] Server logs show no errors

---

**Last Updated**: January 11, 2026
