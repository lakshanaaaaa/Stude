# Topper of the Week Feature

## Overview

The **Topper of the Week** feature identifies and celebrates the most impactful student performer over a rolling 7-day period. Unlike lifetime leaderboards, this feature focuses on recent effort, consistency, and improvement to motivate continuous engagement.

## How It Works

### Scoring Algorithm

The Weekly Impact Score is calculated using the formula:

```
Weekly Impact Score = (Weighted Problems × 10) + Rating Improvement + Contest Points + Consistency Bonus
```

### Components

#### 1. Weighted Problems Solved (Last 7 Days)
Problems are weighted by platform difficulty to ensure fairness:
- **CodeForces**: 1.5x weight (highest difficulty)
- **LeetCode**: 1.2x weight (medium difficulty)
- **CodeChef**: 1.0x weight (baseline)

**Example**: Solving 5 CodeForces problems = 7.5 weighted problems

#### 2. Rating Improvement
Only positive rating changes are counted (negative changes are ignored):
- Sum of rating improvements across all platforms
- Encourages participation without penalizing bad days

#### 3. Contest Participation Points
Platform-specific points for each contest participated:
- **CodeForces**: 20 points per contest
- **CodeChef**: 15 points per contest
- **LeetCode**: 10 points per contest

#### 4. Consistency Bonus
Rewards daily activity and streaks:
- **5 points** per active day (day with at least 1 problem solved)
- **20 bonus points** for 7-day streak (active all 7 days)

### Eligibility Criteria

To be eligible for Topper of the Week, students must meet:
- **Minimum 5 weighted problems** solved in the last 7 days
- **Minimum 3 active days** in the last 7 days

### Tie-Breaking

If multiple students have the same Weekly Impact Score:
1. Higher total rating improvement
2. Higher weighted problems solved
3. Earlier registration date (alphabetically by username)

## Features

### 1. Topper of the Week Card
Displayed prominently on the Dashboard, showing:
- Student name, department, and avatar
- Weekly Impact Score
- Problems solved breakdown by platform
- Rating improvements
- Contest participation
- Active days and streak status

### 2. Weekly Leaderboard
A dedicated tab showing top 10 students by Weekly Impact Score with:
- Rank badges (gold, silver, bronze for top 3)
- Detailed metrics for each student
- Platform-specific problem counts
- Streak indicators

### 3. Admin Controls
Admins can:
- Manually refresh topper calculations
- Create snapshots on-demand
- View snapshot history

## API Endpoints

### Public Endpoints (Authenticated Users)

#### Get Topper of the Week
```
GET /api/topper-of-the-week
```

**Response:**
```json
{
  "topper": {
    "studentId": "uuid",
    "username": "john_doe",
    "name": "John Doe",
    "dept": "CSE",
    "weeklyProblems": {
      "leetcode": 5,
      "codechef": 3,
      "codeforces": 2,
      "weightedTotal": 9.6
    },
    "ratingDelta": {
      "leetcode": 50,
      "codechef": 0,
      "codeforces": 100,
      "total": 150
    },
    "contestsThisWeek": {
      "leetcode": 1,
      "codechef": 0,
      "codeforces": 1,
      "points": 30
    },
    "activeDays": 6,
    "consistencyBonus": 30,
    "hasStreakBonus": false,
    "weeklyImpactScore": 276,
    "meetsThreshold": true
  }
}
```

#### Get Weekly Leaderboard
```
GET /api/weekly-leaderboard?limit=10
```

**Response:**
```json
{
  "leaderboard": [...],
  "count": 10
}
```

### Admin Endpoints

#### Refresh Topper Calculations
```
POST /api/admin/topper/refresh
```

Clears cache and recalculates topper and leaderboard.

#### Create Daily Snapshot
```
POST /api/admin/snapshot/create
```

Manually creates a snapshot of all student statistics.

## Setup & Deployment

### 1. Initial Setup

After deploying the feature, initialize snapshots for existing students:

```bash
npx tsx server/scripts/initializeSnapshots.ts
```

This creates the first snapshot. Students will need to wait 7 days for weekly metrics to be calculated.

### 2. Daily Snapshot Creation

Set up a cron job to create daily snapshots automatically. Add to your server startup or use a task scheduler:

**Example using node-cron:**
```typescript
import cron from 'node-cron';
import { createDailySnapshot } from './services/snapshotService';

// Run daily at midnight UTC
cron.schedule('0 0 * * *', async () => {
  console.log('[Cron] Creating daily snapshot...');
  await createDailySnapshot();
});
```

**Example using system cron (Linux/Mac):**
```bash
# Add to crontab (crontab -e)
0 0 * * * cd /path/to/project && npx tsx server/scripts/initializeSnapshots.ts
```

### 3. Database Indexes

The WeeklySnapshot model includes automatic indexes:
- Compound index on `(studentId, timestamp)` for efficient queries
- TTL index to auto-delete snapshots older than 30 days

## Configuration

Current configuration is in `server/services/topperService.ts`:

```typescript
export const TOPPER_CONFIG = {
  platformWeights: {
    codeforces: 1.5,
    leetcode: 1.2,
    codechef: 1.0,
  },
  contestPoints: {
    codeforces: 20,
    codechef: 15,
    leetcode: 10,
  },
  consistencyBonus: {
    pointsPerDay: 5,
    streakBonus: 20,
  },
  eligibilityThreshold: {
    minWeightedProblems: 5,
    minActiveDays: 3,
  },
};
```

To modify these values, edit the configuration and restart the server.

## Caching

- Topper and leaderboard data are cached for **1 hour**
- Cache is automatically invalidated on manual refresh
- Reduces database load while keeping data reasonably fresh

## Data Retention

- Snapshots are automatically deleted after **30 days** (TTL index)
- Manual cleanup available via `cleanupOldSnapshots()` function
- Only last 7 days of snapshots are used for calculations

## Troubleshooting

### No Topper Displayed

**Possible causes:**
1. No students meet eligibility criteria
2. No snapshots exist (run initialization script)
3. Snapshots are less than 7 days old

**Solution:**
- Check if snapshots exist: `GET /api/admin/snapshots`
- Verify student activity in last 7 days
- Wait for 7 days after initial snapshot creation

### Incorrect Metrics

**Possible causes:**
1. Stale cache
2. Missing snapshots
3. Student data not scraped recently

**Solution:**
- Refresh topper: `POST /api/admin/topper/refresh`
- Create new snapshot: `POST /api/admin/snapshot/create`
- Scrape student data to update current stats

### Performance Issues

**Possible causes:**
1. Too many students
2. Missing database indexes
3. Cache not working

**Solution:**
- Verify indexes are created on WeeklySnapshot collection
- Check cache TTL is set correctly (1 hour)
- Consider increasing cache duration for large datasets

## Future Enhancements

Potential improvements for future versions:

1. **Admin Configuration UI**: Allow admins to modify weights and thresholds without code changes
2. **Historical Toppers**: Track and display past Toppers of the Week
3. **Notifications**: Notify students when they become Topper of the Week
4. **Department-wise Toppers**: Separate toppers for each department
5. **Monthly/Yearly Toppers**: Extend to longer time periods
6. **Activity Tracking**: More accurate active days calculation using actual submission timestamps
7. **Badges & Achievements**: Award badges for becoming Topper of the Week multiple times

## Technical Details

### Database Schema

**WeeklySnapshot Model:**
```typescript
{
  id: string;
  studentId: string;
  username: string;
  timestamp: Date;
  problemStats: {
    leetcode: number;
    codechef: number;
    codeforces: number;
    total: number;
  };
  ratings: {
    leetcode: number;
    codechef: number;
    codeforces: number;
  };
  contests: {
    leetcode: number;
    codechef: number;
    codeforces: number;
  };
}
```

### Files Modified/Created

**Backend:**
- `server/models/WeeklySnapshot.ts` - MongoDB model
- `server/services/snapshotService.ts` - Snapshot creation and retrieval
- `server/services/topperService.ts` - Core calculation logic
- `server/routes.ts` - API endpoints
- `server/scripts/initializeSnapshots.ts` - Migration script

**Frontend:**
- `client/src/components/TopperOfTheWeekCard.tsx` - Main display card
- `client/src/components/WeeklyLeaderboard.tsx` - Leaderboard component
- `client/src/pages/Dashboard.tsx` - Updated to use new components

**Documentation:**
- `.kiro/specs/topper-of-the-week/requirements.md`
- `.kiro/specs/topper-of-the-week/design.md`
- `.kiro/specs/topper-of-the-week/tasks.md`
- `TOPPER_OF_THE_WEEK.md` (this file)

## Support

For issues or questions:
1. Check this documentation
2. Review the troubleshooting section
3. Check server logs for errors
4. Verify database connectivity and indexes
