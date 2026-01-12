# User Deletion Testing Guide

## Quick Test Steps

### 1. Prepare Test Data
Before testing, identify a test student account:
- Go to Admin Dashboard → User Management
- Note down a test student's:
  - Username
  - Name
  - Department
  - Current leaderboard position (if any)

### 2. Verify Student Appears Everywhere
Check that the test student is visible in:

**Admin Dashboard:**
- [ ] User Management table
- [ ] Improvement Analytics (if they have rating changes)

**Faculty Dashboard (for their department):**
- [ ] Top Coders list
- [ ] Faculty Analytics (Improvement/Contest sections)

**Leaderboards:**
- [ ] Overall Leaderboard
- [ ] Platform Leaderboards (LeetCode/CodeChef/CodeForces)
- [ ] Weekly Leaderboard (if active this week)

**Dashboard:**
- [ ] Topper of the Week (if they're the topper)

### 3. Perform Deletion
1. Go to Admin Dashboard → User Management
2. Find the test student
3. Click the "Delete" button (trash icon)
4. Confirm the deletion
5. Wait for success message

### 4. Check Console Logs
Open browser DevTools Console and verify you see:
```
[Delete] Removed weekly snapshots for student <username>
[Delete] Successfully deleted user <username> and cleared all caches
[Leaderboard] Computed and stored leaderboards
```

### 5. Verify Complete Removal
Refresh the page and check that the deleted student is NOT visible in:

**Admin Dashboard:**
- [ ] User Management table - Student should be gone
- [ ] Improvement Analytics - Should not appear in any list

**Faculty Dashboard:**
- [ ] Top Coders list - Should not appear
- [ ] Faculty Analytics - Should not appear in any section
- [ ] Total Students count should decrease by 1

**Leaderboards:**
- [ ] Overall Leaderboard - Should not appear
- [ ] Platform Leaderboards - Should not appear
- [ ] Weekly Leaderboard - Should not appear

**Dashboard:**
- [ ] Topper of the Week - Should show next eligible student if deleted user was topper

### 6. Verify Database Cleanup
If you have database access, verify:

```javascript
// Check User collection
db.users.findOne({ username: "<deleted_username>" })
// Should return: null

// Check Student collection
db.students.findOne({ username: "<deleted_username>" })
// Should return: null

// Check WeeklySnapshot collection
db.weeklysnapshots.find({ username: "<deleted_username>" }).count()
// Should return: 0
```

## Expected Behavior

### Immediate Effects:
1. User removed from User collection
2. Student removed from Student collection
3. All WeeklySnapshots deleted
4. All caches cleared
5. Leaderboards recomputed

### UI Updates:
- User Management table updates immediately
- Leaderboards show updated rankings
- Analytics sections exclude deleted user
- Faculty stats reflect new totals

### Performance:
- Deletion should complete in 1-3 seconds
- Leaderboard recomputation may take longer with many students (1000+ students = ~2 seconds)

## Common Issues

### Issue: Deleted user still appears in leaderboard
**Solution:** 
- Refresh the page (F5)
- Check if leaderboard recomputation completed
- Manually trigger leaderboard refresh: Admin Dashboard → Refresh Leaderboard button

### Issue: Deleted user still in analytics
**Solution:**
- Caches should clear automatically
- If persists, restart the server to clear all in-memory caches

### Issue: Error during deletion
**Check:**
- Console logs for specific error
- User is not an admin trying to delete themselves
- Database connection is active
- User exists before deletion

## Rollback (If Needed)

If you need to restore a deleted user:
1. **No automatic restore** - deletion is permanent
2. User must sign in with Google again
3. They will need to complete onboarding again
4. Previous stats are lost (WeeklySnapshots deleted)

**Recommendation:** Consider implementing soft delete for production use.

## Test Scenarios

### Scenario 1: Delete Student with No Activity
- Student with 0 problems solved
- Should delete cleanly
- No impact on leaderboards

### Scenario 2: Delete Active Student
- Student with problems solved and contests attended
- Should remove from all leaderboards
- Other students' rankings should adjust

### Scenario 3: Delete Topper of the Week
- Delete current topper
- Next eligible student should become topper
- Weekly leaderboard should update

### Scenario 4: Delete Student from Faculty View
- Faculty should see updated stats
- Total students count decreases
- Top Coders list updates

### Scenario 5: Delete Multiple Students
- Delete 2-3 students in sequence
- All should be removed completely
- Leaderboards should reflect all deletions

## Automation Test (Optional)

If you want to automate testing:

```bash
# Create test script: test-deletion.sh

# 1. Get initial student count
BEFORE=$(curl -H "Authorization: Bearer $TOKEN" http://localhost:5005/api/students | jq 'length')

# 2. Delete a test user
curl -X DELETE -H "Authorization: Bearer $TOKEN" http://localhost:5005/api/admin/users/$TEST_USER_ID

# 3. Wait for processing
sleep 2

# 4. Get new student count
AFTER=$(curl -H "Authorization: Bearer $TOKEN" http://localhost:5005/api/students | jq 'length')

# 5. Verify count decreased
if [ $AFTER -eq $((BEFORE - 1)) ]; then
  echo "✓ Deletion successful"
else
  echo "✗ Deletion failed"
fi
```

## Success Criteria

✅ User deleted from database
✅ Student record deleted
✅ WeeklySnapshots deleted
✅ Caches cleared
✅ Leaderboards updated
✅ Analytics updated
✅ Faculty stats updated
✅ No errors in console
✅ UI reflects changes immediately

## Notes

- Deletion is **permanent** - no undo
- Admin cannot delete themselves
- Deletion triggers full cache clear and leaderboard recomputation
- Performance impact is minimal for normal-sized datasets (<1000 students)
