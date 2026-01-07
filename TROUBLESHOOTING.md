# Scraping Troubleshooting Guide

## Quick Diagnostics

### Step 1: Test Scrapers Directly
```bash
npm run test:quick
```

This will test LeetCode and Codeforces scrapers with known usernames. If this fails, the issue is with the scrapers themselves.

### Step 2: Check Server Logs
When you click "Refresh Stats", check the terminal where your server is running. You should see:
```
=== Scraping request for: username ===
Student found. Main accounts: [...]
Platform usernames:
  LeetCode: username
  CodeChef: username
  CodeForces: username
Starting scraping process...
```

### Step 3: Verify Platform Usernames
Make sure you've added your platform usernames in Edit Profile:
- Go to Edit Profile
- Add your LeetCode username
- Add your CodeChef username  
- Add your CodeForces username
- Click Save

## Common Issues & Solutions

### Issue 1: "No platform accounts configured"
**Cause:** You haven't added any platform usernames.

**Solution:**
1. Go to Edit Profile
2. Add at least one platform username (LeetCode, CodeChef, or CodeForces)
3. Save changes
4. Try refreshing stats again

### Issue 2: "Student not found"
**Cause:** Student record doesn't exist in database.

**Solution:**
1. Make sure you completed onboarding
2. Check if you're logged in as a student
3. Verify you're on your own profile page

### Issue 3: Scraping returns 0 problems
**Cause:** Invalid username or private profile.

**Solution:**
1. Verify your username is correct on the platform
2. Check if your profile is public
3. Test manually:
   - LeetCode: Visit `https://leetcode.com/USERNAME`
   - CodeChef: Visit `https://www.codechef.com/users/USERNAME`
   - Codeforces: Visit `https://codeforces.com/profile/USERNAME`

### Issue 4: LeetCode not scraping
**Cause:** LeetCode API issues or rate limiting.

**Solution:**
1. Check server logs for detailed error
2. Wait 5 minutes and try again
3. Verify username at `https://leetcode.com/USERNAME`
4. Test with: `npm run test:quick`

### Issue 5: Button shows "Updating..." forever
**Cause:** Server error or network issue.

**Solution:**
1. Check browser console (F12) for errors
2. Check server terminal for error logs
3. Refresh the page
4. Try again

## Manual Testing

### Test LeetCode Scraper
```bash
# In server/scripts/quickTest.ts, change username to yours
npm run test:quick
```

### Test API Endpoint
```bash
# Replace TOKEN and USERNAME
curl -X POST http://localhost:5000/api/student/USERNAME/scrape \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json"
```

### Check Database
```javascript
// MongoDB shell
db.students.findOne({ username: "YOUR_USERNAME" }, {
  mainAccounts: 1,
  problemStats: 1,
  contestStats: 1,
  lastScrapedAt: 1
})
```

## Debug Checklist

- [ ] Server is running (`npm run dev`)
- [ ] Logged in as student
- [ ] On your own profile page (`/student/YOUR_USERNAME`)
- [ ] Platform usernames are added in Edit Profile
- [ ] Platform usernames are correct
- [ ] Platform profiles are public
- [ ] No errors in browser console (F12)
- [ ] No errors in server terminal
- [ ] Waited at least 2 seconds between attempts

## Expected Behavior

1. Click "Refresh Stats" button
2. Button changes to "Updating..." with spinning icon
3. Wait 6-10 seconds (2 seconds per platform)
4. Success toast appears
5. Profile data refreshes automatically
6. New stats are visible

## Server Log Example (Success)

```
=== Scraping request for: john_doe ===
Student found. Main accounts: [ { platform: 'LeetCode', username: 'john_lc' }, ... ]
Platform usernames:
  LeetCode: john_lc
  CodeChef: john_cc
  CodeForces: john_cf
Starting scraping process...

=== Starting scrapeStudentData ===
LeetCode: john_lc
CodeChef: john_cc
CodeForces: john_cf

[LeetCode] Starting scrape for: john_lc
Fetching LeetCode data for: john_lc
LeetCode response status: 200
Successfully fetched LeetCode data for john_lc
LeetCode problems - Total: 450, Easy: 200, Medium: 180, Hard: 70
LeetCode contests - Rating: 1850, Contests: 45
[LeetCode] Success - Problems: 450

[CodeChef] Starting scrape for: john_cc
[CodeChef] Success - Problems: 80

[CodeForces] Starting scrape for: john_cf
[CodeForces] Success - Problems: 70

[Merge] Merging 3 results...
[Merge] Final totals - Problems: 600, Rating: 1850
=== scrapeStudentData complete ===

Scraping completed. Results:
  Total problems: 600
  Current rating: 1850
  Badges: 3
Successfully updated student data for john_doe
=== Scraping complete ===
```

## Still Not Working?

1. **Check platform usernames are correct:**
   - Visit your profile on each platform
   - Copy the exact username from the URL
   - Update in Edit Profile

2. **Test with known working usernames:**
   - LeetCode: `leetcode`
   - Codeforces: `tourist`
   - These are public profiles that should work

3. **Check network connectivity:**
   - Can you access leetcode.com?
   - Can you access codeforces.com?
   - Can you access codechef.com?

4. **Restart the server:**
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

5. **Clear browser cache and refresh**

6. **Check MongoDB connection:**
   ```bash
   mongosh
   # Should connect successfully
   ```

## Getting Help

If none of the above works, provide:
1. Server logs (from terminal)
2. Browser console errors (F12 → Console)
3. Your platform usernames
4. Screenshot of Edit Profile page
5. Screenshot of error message


## Issue 6: Leaderboard Shows Wrong Total Problems

**Symptoms:**
- Profile page shows correct total (e.g., 1006 problems)
- Leaderboard shows incorrect total (e.g., 394 problems)
- Platform-specific problems are 0 in leaderboard

**Cause:** 
MongoDB data was corrupted by old merge logic that overwrote existing platform data with 0 when only one platform was scraped.

**Example of Corrupted Data:**
```javascript
// What should be in MongoDB:
problemStats: {
  total: 1006,
  platformStats: {
    LeetCode: 394,
    CodeChef: 595,
    CodeForces: 17
  }
}

// What's actually in MongoDB (corrupted):
problemStats: {
  total: 394,  // ❌ Wrong!
  platformStats: {
    LeetCode: 394,
    CodeChef: 0,      // ❌ Lost data!
    CodeForces: 0     // ❌ Lost data!
  }
}
```

**Solution:**
The merge logic has been fixed, but you need to re-scrape to fix corrupted data:

1. **Manual Fix (Recommended for Testing):**
   - Go to your profile page
   - Click "Refresh Stats" button
   - Wait for all platforms to be scraped
   - Verify leaderboard now shows correct total

2. **Bulk Fix (For All Students):**
   ```bash
   # Get your admin token from browser localStorage
   # Then run:
   node scripts/bulk-rescrape.js YOUR_ADMIN_TOKEN
   ```

3. **Verify Fix:**
   - Check leaderboard shows correct totals
   - Check profile page matches leaderboard
   - Verify all platform stats are non-zero

**Prevention:**
The fix ensures:
- ✅ Scraping one platform won't overwrite others with 0
- ✅ Values are merged using Math.max() to keep highest value
- ✅ Leaderboard auto-refreshes after each scrape
- ✅ Data integrity maintained across partial scrapes

**Technical Details:**
See `LEADERBOARD_FIX_SUMMARY.md` for complete technical analysis and fix details.
