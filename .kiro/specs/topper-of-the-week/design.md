# Design Document: Topper of the Week

## Overview

The Topper of the Week feature calculates and displays the most impactful student performer over a rolling 7-day period. The system uses a comprehensive scoring algorithm that considers problems solved, rating improvements, contest participation, and daily consistency, with platform-specific weights to ensure fairness.

## Architecture

### High-Level Flow
1. **Daily Snapshot Creation**: Automated job stores student statistics daily
2. **Weekly Calculation**: Service computes weekly deltas and impact scores
3. **Topper Selection**: Identifies the student with highest weekly impact score
4. **Display**: Dashboard shows Topper of the Week with detailed metrics

### Components
- **WeeklySnapshot Model**: Stores daily snapshots of student data
- **TopperService**: Calculates weekly metrics and impact scores
- **TopperController**: API endpoints for topper data
- **TopperCard Component**: UI display for Topper of the Week

## Data Models

### WeeklySnapshot Schema
```typescript
interface WeeklySnapshot {
  id: string;
  studentId: string;
  username: string;
  timestamp: Date;
  
  // Problem stats per platform
  problemStats: {
    leetcode: number;
    codechef: number;
    codeforces: number;
    total: number;
  };
  
  // Ratings per platform
  ratings: {
    leetcode: number;
    codechef: number;
    codeforces: number;
  };
  
  // Contest counts per platform
  contests: {
    leetcode: number;
    codechef: number;
    codeforces: number;
  };
}
```

### WeeklyMetrics (Calculated)
```typescript
interface WeeklyMetrics {
  studentId: string;
  username: string;
  name: string;
  dept: string;
  
  // Problems solved this week (weighted)
  weeklyProblems: {
    leetcode: number;
    codechef: number;
    codeforces: number;
    weightedTotal: number;
  };
  
  // Rating improvements (positive only)
  ratingDelta: {
    leetcode: number;
    codechef: number;
    codeforces: number;
    total: number;
  };
  
  // Contest participation
  contestsThisWeek: {
    leetcode: number;
    codechef: number;
    codeforces: number;
    points: number;
  };
  
  // Consistency metrics
  activeDays: number;
  consistencyBonus: number;
  hasStreakBonus: boolean;
  
  // Final score
  weeklyImpactScore: number;
  
  // Eligibility
  meetsThreshold: boolean;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Weekly Impact Score Calculation
*For any* student with weekly activity, the Weekly Impact Score should equal: (Weighted Problems × 10) + (Positive Rating Delta) + (Contest Points) + (Consistency Bonus)
**Validates: Requirements 6.1**

### Property 2: Platform Weight Application
*For any* problem solved on a platform, the weighted value should be: CodeForces problems × 1.5, LeetCode problems × 1.2, CodeChef problems × 1.0
**Validates: Requirements 1.3**

### Property 3: Rating Delta Positivity
*For any* rating change, if the delta is negative, it should be treated as zero (no penalty)
**Validates: Requirements 2.3**

### Property 4: Contest Points Assignment
*For any* contest participation, points should be: CodeForces = 20, CodeChef = 15, LeetCode = 10
**Validates: Requirements 3.2**

### Property 5: Consistency Bonus Calculation
*For any* student with N active days (1 ≤ N ≤ 7), the consistency bonus should be: (N × 5) + (20 if N = 7 else 0)
**Validates: Requirements 4.2, 4.3**

### Property 6: Eligibility Threshold
*For any* student to be eligible, they must have: weighted problems ≥ 5 AND active days ≥ 3
**Validates: Requirements 5.1, 5.2**

### Property 7: Snapshot Baseline Selection
*For any* weekly calculation, the baseline snapshot should be from exactly 7 days ago, or the closest snapshot within 8 days if unavailable
**Validates: Requirements 8.4, 8.5**

### Property 8: Tie-Breaking Order
*For any* two students with equal Weekly Impact Score, the winner should be determined by: (1) total rating improvement, (2) weighted problems solved, (3) earliest registration
**Validates: Requirements 6.2, 6.3, 6.4**

## Algorithm: Calculate Weekly Impact Score

```typescript
function calculateWeeklyImpactScore(
  currentSnapshot: WeeklySnapshot,
  baselineSnapshot: WeeklySnapshot,
  activeDaysCount: number
): WeeklyMetrics {
  
  // 1. Calculate weighted problems solved
  const problemsDelta = {
    leetcode: Math.max(0, currentSnapshot.problemStats.leetcode - baselineSnapshot.problemStats.leetcode),
    codechef: Math.max(0, currentSnapshot.problemStats.codechef - baselineSnapshot.problemStats.codechef),
    codeforces: Math.max(0, currentSnapshot.problemStats.codeforces - baselineSnapshot.problemStats.codeforces)
  };
  
  const weightedTotal = 
    (problemsDelta.codeforces * 1.5) +
    (problemsDelta.leetcode * 1.2) +
    (problemsDelta.codechef * 1.0);
  
  // 2. Calculate positive rating improvements
  const ratingDelta = {
    leetcode: Math.max(0, currentSnapshot.ratings.leetcode - baselineSnapshot.ratings.leetcode),
    codechef: Math.max(0, currentSnapshot.ratings.codechef - baselineSnapshot.ratings.codechef),
    codeforces: Math.max(0, currentSnapshot.ratings.codeforces - baselineSnapshot.ratings.codeforces)
  };
  
  const totalRatingDelta = ratingDelta.leetcode + ratingDelta.codechef + ratingDelta.codeforces;
  
  // 3. Calculate contest participation points
  const contestsDelta = {
    leetcode: Math.max(0, currentSnapshot.contests.leetcode - baselineSnapshot.contests.leetcode),
    codechef: Math.max(0, currentSnapshot.contests.codechef - baselineSnapshot.contests.codechef),
    codeforces: Math.max(0, currentSnapshot.contests.codeforces - baselineSnapshot.contests.codeforces)
  };
  
  const contestPoints = 
    (contestsDelta.leetcode * 10) +
    (contestsDelta.codechef * 15) +
    (contestsDelta.codeforces * 20);
  
  // 4. Calculate consistency bonus
  const consistencyBonus = (activeDaysCount * 5) + (activeDaysCount === 7 ? 20 : 0);
  
  // 5. Calculate final Weekly Impact Score
  const weeklyImpactScore = 
    (weightedTotal * 10) +
    totalRatingDelta +
    contestPoints +
    consistencyBonus;
  
  // 6. Check eligibility
  const meetsThreshold = weightedTotal >= 5 && activeDaysCount >= 3;
  
  return {
    weeklyProblems: { ...problemsDelta, weightedTotal },
    ratingDelta: { ...ratingDelta, total: totalRatingDelta },
    contestsThisWeek: { ...contestsDelta, points: contestPoints },
    activeDays: activeDaysCount,
    consistencyBonus,
    hasStreakBonus: activeDaysCount === 7,
    weeklyImpactScore,
    meetsThreshold
  };
}
```

## Implementation Plan

### Phase 1: Database Schema
1. Create WeeklySnapshot model in MongoDB
2. Add indexes for efficient querying (studentId, timestamp)
3. Create migration to set up collections

### Phase 2: Snapshot Service
1. Implement daily snapshot creation job
2. Store current state of all students
3. Schedule job to run at midnight UTC
4. Implement snapshot cleanup (retain 30 days)

### Phase 3: Topper Calculation Service
1. Implement `calculateWeeklyMetrics()` function
2. Implement `getTopperOfTheWeek()` function
3. Implement tie-breaking logic
4. Add caching (1 hour TTL)

### Phase 4: API Endpoints
1. `GET /api/topper-of-the-week` - Returns current topper
2. `GET /api/weekly-leaderboard` - Returns top 10 by weekly score
3. `POST /api/admin/topper/refresh` - Manual recalculation (admin only)

### Phase 5: Frontend Components
1. Create TopperOfTheWeekCard component
2. Replace current TopCoderCard with new component
3. Display weekly metrics breakdown
4. Add weekly leaderboard tab

## Error Handling

1. **No Baseline Snapshot**: Use oldest available snapshot within 8 days
2. **No Current Snapshot**: Create snapshot on-demand
3. **No Eligible Students**: Display encouragement message
4. **Calculation Errors**: Log error, return cached result if available

## Testing Strategy

### Unit Tests
- Test weekly impact score calculation with various inputs
- Test platform weight application
- Test rating delta handling (positive/negative)
- Test consistency bonus calculation
- Test eligibility threshold checks
- Test tie-breaking logic

### Property Tests
- Property 1: Verify score formula for random student data
- Property 2: Verify platform weights are correctly applied
- Property 3: Verify negative rating deltas are ignored
- Property 4: Verify contest points match specification
- Property 5: Verify consistency bonus formula
- Property 6: Verify eligibility threshold enforcement
- Property 7: Verify snapshot selection logic
- Property 8: Verify tie-breaking order

### Integration Tests
- Test snapshot creation and retrieval
- Test weekly calculation with real student data
- Test API endpoints return correct data
- Test caching behavior

## Performance Considerations

1. **Snapshot Storage**: ~1KB per student per day = ~30KB per student per month
2. **Calculation Frequency**: Once per hour (cached)
3. **Query Optimization**: Index on (studentId, timestamp) for fast lookups
4. **Batch Processing**: Calculate all students in single pass

## Configuration

```typescript
interface TopperConfig {
  platformWeights: {
    codeforces: number; // default: 1.5
    leetcode: number;   // default: 1.2
    codechef: number;   // default: 1.0
  };
  
  contestPoints: {
    codeforces: number; // default: 20
    codechef: number;   // default: 15
    leetcode: number;   // default: 10
  };
  
  consistencyBonus: {
    pointsPerDay: number;  // default: 5
    streakBonus: number;   // default: 20
  };
  
  eligibilityThreshold: {
    minWeightedProblems: number; // default: 5
    minActiveDays: number;       // default: 3
  };
  
  cacheConfig: {
    ttlMinutes: number; // default: 60
  };
}
```
