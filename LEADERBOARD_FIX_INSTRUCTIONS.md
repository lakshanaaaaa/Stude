# How to Fix Leaderboard and Profile Data - Quick Guide

## The Problem

Both your leaderboard AND profile page are showing incorrect data because the MongoDB database contains corrupted data from previous scrapes.

**What you're seeing:**
- **Profile "Platform-wise Stats" section**: Shows LeetCode: 394, CodeChef: 0, CodeForces: 0
- **Leaderboard "Overall" tab**: Shows 394 total problems
- **Expected**: Should show LeetCode: 394, CodeChef: 595, CodeForces: 17 (Total: 1006)

**Why this happened:**
The old merge logic had a bug that overwrote existing platform data with 0 when only one platform was scraped. This corrupted the data in MongoDB.

## The Fix (3 Steps)

### Step 1: Verify the Server is Running ✅

The server is already running with all fixes applied. You should see:
```
✅ MongoDB connected
✅ Using MongoDB storage
[Leaderboard] Updated at [timestamp]
🚀 Frontend is available at: http://0.0.0.0:5005
```

### Step 2: Re-scrape Your Data

You need to click "Refresh Stats" to re-scrape all your platforms with the new fixed logic.

**Option A: Test with One Student (Recommended)**
1. Open your browser and go to: `http://localhost:5005`
2. Login as a student (e.g., Lakshana)
3. Go to your profile page
4. Click the **"Refresh Stats"** button
5. Wait 10-15 seconds for all platforms to be scraped
6. Check the leaderboard - it should now show the correct total!

**Option B: Bulk Re-scrape All Students**
```bash
# Get your admin token from browser (F12 → Application → Local Storage → token)
node scripts/bulk-rescrape.js YOUR_ADMIN_TOKEN
```

### Step 3: Verify the Fix

1. **Check Profile Page:**
   - Total problems should be correct (e.g., 1006)
   - **Platform-wise Stats section** should show all platforms with correct values:
     - LeetCode: 394 ✅
     - CodeChef: 595 ✅ (not 0!)
     - CodeForces: 17 ✅ (not 0!)

2. **Check Leaderboard:**
   - Go to Dashboard
   - Check "Overall" tab - should show correct total (1006)
   - Check platform tabs - should show correct platform-specific data

3. **Check Other Students:**
   - Repeat for other students if needed
   - Or use bulk re-scrape to fix all at once

## What Was Fixed

### 1. Merge Logic (✅ Fixed)
**File:** `server/storage/mongodb.ts`

The bug was in `updateStudentAnalytics()`:
- **Old behavior:** Scraping one platform would overwrite ALL platforms with 0
- **New behavior:** Only updates platforms that were actually scraped, keeps existing data

### 2. Leaderboard Calculation (✅ Fixed)
**File:** `server/services/leaderboardService.ts`

The `getTotalSolved()` function now:
- Uses `problemStats.total` as the primary source
- More reliable even with corrupted data

### 3. Auto-refresh (✅ Already Working)
**File:** `server/routes.ts`

Leaderboard automatically refreshes after each scrape.

## Testing Checklist

- [ ] Server is running (check terminal)
- [ ] Login as a student
- [ ] Go to profile page
- [ ] Click "Refresh Stats"
- [ ] Wait for completion (10-15 seconds)
- [ ] Check profile shows correct total
- [ ] Go to Dashboard
- [ ] Check leaderboard shows correct total
- [ ] Verify platform-specific tabs show correct data

## Expected Results

**Before Re-scrape:**
```
Leaderboard Overall Tab:
1. Dinesh S - 993 problems ✅ (already correct)
2. Lakshana - 394 problems ❌ (should be 1006)
3. Hazeena - 165 problems ❌ (should be 605)
```

**After Re-scrape:**
```
Leaderboard Overall Tab:
1. Lakshana - 1006 problems ✅ (now correct!)
2. Dinesh S - 993 problems ✅
3. Hazeena - 605 problems ✅ (now correct!)
```

## Troubleshooting

### "Refresh Stats" button not working?
- Check browser console (F12) for errors
- Check server terminal for error logs
- Make sure you have platform usernames configured in Edit Profile

### Still showing wrong data after re-scrape?
- Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
- Clear browser cache
- Check MongoDB data directly (see LEADERBOARD_FIX_SUMMARY.md)

### Need to fix all students at once?
- Use the bulk re-scrape script (see Option B above)
- Or manually click "Refresh Stats" on each profile

## Files Changed

All fixes are already applied in these files:
1. ✅ `server/storage/mongodb.ts` - Fixed merge logic
2. ✅ `server/services/leaderboardService.ts` - Fixed calculation
3. ✅ `server/routes.ts` - Auto-refresh already working

## Documentation

- **Technical Details:** See `LEADERBOARD_FIX_SUMMARY.md`
- **Troubleshooting:** See `TROUBLESHOOTING.md` (Issue 6)
- **Bulk Re-scrape:** See `scripts/bulk-rescrape.js`

## Questions?

If you have any issues:
1. Check the server logs in your terminal
2. Check browser console (F12)
3. Review TROUBLESHOOTING.md
4. Verify your platform usernames are correct in Edit Profile

---

**Summary:** The code is fixed ✅, but the database needs to be re-scraped to correct the corrupted data. Just click "Refresh Stats" on each profile!
