# Topper of the Week - Quick Start Guide

## ✅ Implementation Complete!

The Topper of the Week feature is now fully implemented and running on your application.

## What You'll See

### 1. Dashboard Changes
- **New Card**: "Topper of the Week" card replaces the old "Top Coder" card
- **New Tab**: "Weekly" tab added to the leaderboard section
- Shows students based on last 7 days of activity

### 2. Topper of the Week Card
Displays:
- Current week's top performer
- Weekly Impact Score
- Problems solved (with platform breakdown)
- Rating improvements
- Contest participation
- Active days and streak status

### 3. Weekly Leaderboard
Shows:
- Top 10 students by weekly performance
- Rank badges (🥇 🥈 🥉 for top 3)
- Detailed metrics for each student
- Streak indicators

## 🚀 Next Steps to Activate

### Step 1: Initialize Snapshots (Required)

Run this command once to create the first snapshot:

```bash
npx tsx server/scripts/initializeSnapshots.ts
```

This creates a baseline snapshot of all current student data.

**Important**: Students will need to wait 7 days after this initial snapshot for weekly metrics to appear. This is because the system needs 7 days of historical data to calculate weekly changes.

### Step 2: Set Up Daily Snapshots (Recommended)

You need to create snapshots daily to track weekly progress. Choose one method:

#### Option A: Manual (For Testing)
Use the admin endpoint to create snapshots manually:
```bash
POST http://localhost:5005/api/admin/snapshot/create
Authorization: Bearer <admin-token>
```

#### Option B: Automated Cron Job (Recommended for Production)

**Using node-cron (in your server code):**

1. Install node-cron:
```bash
npm install node-cron
npm install --save-dev @types/node-cron
```

2. Add to your `server/index.ts`:
```typescript
import cron from 'node-cron';
import { createDailySnapshot } from './services/snapshotService';

// Run daily at midnight UTC
cron.schedule('0 0 * * *', async () => {
  console.log('[Cron] Creating daily snapshot...');
  try {
    await createDailySnapshot();
    console.log('[Cron] Daily snapshot created successfully');
  } catch (error) {
    console.error('[Cron] Failed to create daily snapshot:', error);
  }
});
```

**Using system cron (Linux/Mac):**

1. Open crontab:
```bash
crontab -e
```

2. Add this line (runs at midnight daily):
```bash
0 0 * * * cd /path/to/your/project && npx tsx server/scripts/initializeSnapshots.ts >> /var/log/topper-snapshots.log 2>&1
```

**Using Windows Task Scheduler:**

1. Open Task Scheduler
2. Create Basic Task
3. Set trigger: Daily at midnight
4. Set action: Start a program
5. Program: `cmd.exe`
6. Arguments: `/c cd /d "C:\path\to\project" && npx tsx server/scripts/initializeSnapshots.ts`

## 📊 How It Works

### Scoring Formula
```
Weekly Impact Score = (Weighted Problems × 10) + Rating Δ + Contest Points + Consistency Bonus
```

### Platform Weights
- CodeForces: 1.5x (hardest)
- LeetCode: 1.2x (medium)
- CodeChef: 1.0x (baseline)

### Contest Points
- CodeForces: 20 points per contest
- CodeChef: 15 points per contest
- LeetCode: 10 points per contest

### Consistency Bonus
- 5 points per active day
- 20 bonus points for 7-day streak

### Eligibility
To appear on the leaderboard:
- Minimum 5 weighted problems in last 7 days
- Minimum 3 active days in last 7 days

## 🎯 Testing the Feature

### 1. Check if Topper API is Working
```bash
curl http://localhost:5005/api/topper-of-the-week \
  -H "Authorization: Bearer <your-token>"
```

Expected response:
```json
{
  "topper": null,
  "message": "No eligible students for Topper of the Week yet..."
}
```

This is normal if:
- No snapshots exist yet
- Snapshots are less than 7 days old
- No students meet eligibility criteria

### 2. Check Weekly Leaderboard
```bash
curl http://localhost:5005/api/weekly-leaderboard \
  -H "Authorization: Bearer <your-token>"
```

### 3. Create a Snapshot (Admin Only)
```bash
curl -X POST http://localhost:5005/api/admin/snapshot/create \
  -H "Authorization: Bearer <admin-token>"
```

### 4. Refresh Topper Cache (Admin Only)
```bash
curl -X POST http://localhost:5005/api/admin/topper/refresh \
  -H "Authorization: Bearer <admin-token>"
```

## 🔧 Admin Controls

As an admin, you can:

1. **Create Snapshots Manually**
   - Endpoint: `POST /api/admin/snapshot/create`
   - Use when you want to capture current state immediately

2. **Refresh Topper Calculations**
   - Endpoint: `POST /api/admin/topper/refresh`
   - Clears cache and recalculates immediately
   - Use after creating snapshots or when data seems stale

## 📅 Timeline

### Day 0 (Today)
- ✅ Feature is implemented and running
- Run initialization script to create first snapshot
- Students see empty state: "No eligible students yet"

### Days 1-6
- Create daily snapshots (manual or automated)
- Students still see empty state
- System is collecting historical data

### Day 7+
- Weekly metrics start appearing!
- Topper of the Week is displayed
- Weekly leaderboard shows top 10 students
- Students can see their weekly progress

## 🎨 What Students See

### Before Day 7
- Empty state with message: "No eligible students yet"
- Eligibility requirements displayed
- Encouragement to start solving problems

### After Day 7
- Topper of the Week card with full metrics
- Weekly leaderboard with rankings
- Their own weekly progress (if eligible)

## 🐛 Troubleshooting

### "No eligible students" message persists after 7 days

**Check:**
1. Are snapshots being created daily?
   ```bash
   GET /api/admin/snapshots
   ```

2. Do students have activity in last 7 days?
   - Check if students are solving problems
   - Verify scraping is working

3. Try manual refresh:
   ```bash
   POST /api/admin/topper/refresh
   ```

### Topper data seems incorrect

**Solutions:**
1. Create a new snapshot: `POST /api/admin/snapshot/create`
2. Refresh calculations: `POST /api/admin/topper/refresh`
3. Check student data is being scraped correctly

### Performance issues

**Solutions:**
1. Cache is set to 1 hour - increase if needed
2. Check database indexes are created
3. Monitor MongoDB performance

## 📚 Additional Resources

- **Full Documentation**: `TOPPER_OF_THE_WEEK.md`
- **Implementation Details**: `TOPPER_IMPLEMENTATION_SUMMARY.md`
- **Spec Files**: `.kiro/specs/topper-of-the-week/`

## 🎉 You're All Set!

The feature is ready to use. Just remember:
1. ✅ Run initialization script once
2. ✅ Set up daily snapshots
3. ✅ Wait 7 days for metrics to appear
4. ✅ Enjoy the new feature!

---

**Questions?** Check the full documentation in `TOPPER_OF_THE_WEEK.md`
