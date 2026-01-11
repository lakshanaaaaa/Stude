import { storage } from "../storage";
import type { Student } from "@shared/schema";
import { getBaselineSnapshot, getCurrentSnapshot, createDailySnapshot } from "./snapshotService";
import type { WeeklySnapshot } from "../models/WeeklySnapshot";

// Configuration (can be moved to database later for admin control)
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

export interface WeeklyMetrics {
  studentId: string;
  username: string;
  name: string;
  dept: string;
  
  weeklyProblems: {
    leetcode: number;
    codechef: number;
    codeforces: number;
    weightedTotal: number;
  };
  
  ratingDelta: {
    leetcode: number;
    codechef: number;
    codeforces: number;
    total: number;
  };
  
  contestsThisWeek: {
    leetcode: number;
    codechef: number;
    codeforces: number;
    points: number;
  };
  
  activeDays: number;
  consistencyBonus: number;
  hasStreakBonus: boolean;
  
  weeklyImpactScore: number;
  meetsThreshold: boolean;
}

/**
 * Calculates weekly metrics for a single student
 */
export async function calculateWeeklyMetrics(student: Student): Promise<WeeklyMetrics | null> {
  try {
    // Get baseline snapshot from 7 days ago
    const baselineSnapshot = await getBaselineSnapshot(student.id, 7);
    
    if (!baselineSnapshot) {
      console.log(`[Topper] No baseline snapshot for ${student.username}, skipping`);
      return null;
    }

    // Create current snapshot from student data
    const currentSnapshot: WeeklySnapshot = {
      id: "",
      studentId: student.id,
      username: student.username,
      timestamp: new Date(),
      problemStats: {
        leetcode: student.problemStats?.platformStats?.LeetCode || 0,
        codechef: student.problemStats?.platformStats?.CodeChef || 0,
        codeforces: student.problemStats?.platformStats?.CodeForces || 0,
        total: student.problemStats?.total || 0,
      },
      ratings: {
        leetcode: student.contestStats?.leetcode?.currentRating || 0,
        codechef: student.contestStats?.codechef?.currentRating || 0,
        codeforces: student.contestStats?.codeforces?.currentRating || 0,
      },
      contests: {
        leetcode: student.contestStats?.leetcode?.totalContests || 0,
        codechef: student.contestStats?.codechef?.totalContests || 0,
        codeforces: student.contestStats?.codeforces?.totalContests || 0,
      },
    };

    // 1. Calculate weighted problems solved
    const problemsDelta = {
      leetcode: Math.max(0, currentSnapshot.problemStats.leetcode - baselineSnapshot.problemStats.leetcode),
      codechef: Math.max(0, currentSnapshot.problemStats.codechef - baselineSnapshot.problemStats.codechef),
      codeforces: Math.max(0, currentSnapshot.problemStats.codeforces - baselineSnapshot.problemStats.codeforces),
    };

    const weightedTotal =
      problemsDelta.codeforces * TOPPER_CONFIG.platformWeights.codeforces +
      problemsDelta.leetcode * TOPPER_CONFIG.platformWeights.leetcode +
      problemsDelta.codechef * TOPPER_CONFIG.platformWeights.codechef;

    // 2. Calculate positive rating improvements
    const ratingDelta = {
      leetcode: Math.max(0, currentSnapshot.ratings.leetcode - baselineSnapshot.ratings.leetcode),
      codechef: Math.max(0, currentSnapshot.ratings.codechef - baselineSnapshot.ratings.codechef),
      codeforces: Math.max(0, currentSnapshot.ratings.codeforces - baselineSnapshot.ratings.codeforces),
    };

    const totalRatingDelta = ratingDelta.leetcode + ratingDelta.codechef + ratingDelta.codeforces;

    // 3. Calculate contest participation points
    const contestsDelta = {
      leetcode: Math.max(0, currentSnapshot.contests.leetcode - baselineSnapshot.contests.leetcode),
      codechef: Math.max(0, currentSnapshot.contests.codechef - baselineSnapshot.contests.codechef),
      codeforces: Math.max(0, currentSnapshot.contests.codeforces - baselineSnapshot.contests.codeforces),
    };

    const contestPoints =
      contestsDelta.leetcode * TOPPER_CONFIG.contestPoints.leetcode +
      contestsDelta.codechef * TOPPER_CONFIG.contestPoints.codechef +
      contestsDelta.codeforces * TOPPER_CONFIG.contestPoints.codeforces;

    // 4. Calculate consistency (active days)
    // For now, estimate based on problems solved (will be improved with actual daily tracking)
    const totalProblemsThisWeek = problemsDelta.leetcode + problemsDelta.codechef + problemsDelta.codeforces;
    const activeDays = Math.min(7, Math.ceil(totalProblemsThisWeek / 2)); // Rough estimate: 2 problems per day average

    // 5. Calculate consistency bonus
    const consistencyBonus =
      activeDays * TOPPER_CONFIG.consistencyBonus.pointsPerDay +
      (activeDays === 7 ? TOPPER_CONFIG.consistencyBonus.streakBonus : 0);

    const hasStreakBonus = activeDays === 7;

    // 6. Calculate final Weekly Impact Score
    const weeklyImpactScore =
      weightedTotal * 10 +
      totalRatingDelta +
      contestPoints +
      consistencyBonus;

    // 7. Check eligibility
    const meetsThreshold =
      weightedTotal >= TOPPER_CONFIG.eligibilityThreshold.minWeightedProblems &&
      activeDays >= TOPPER_CONFIG.eligibilityThreshold.minActiveDays;

    return {
      studentId: student.id,
      username: student.username,
      name: student.name,
      dept: student.dept,
      weeklyProblems: { ...problemsDelta, weightedTotal },
      ratingDelta: { ...ratingDelta, total: totalRatingDelta },
      contestsThisWeek: { ...contestsDelta, points: contestPoints },
      activeDays,
      consistencyBonus,
      hasStreakBonus,
      weeklyImpactScore,
      meetsThreshold,
    };
  } catch (error) {
    console.error(`[Topper] Failed to calculate metrics for ${student.username}:`, error);
    return null;
  }
}

/**
 * Gets the Topper of the Week
 */
export async function getTopperOfTheWeek(): Promise<WeeklyMetrics | null> {
  try {
    const students = await storage.getAllStudents();
    
    if (!students || students.length === 0) {
      return null;
    }

    // Calculate metrics for all students
    const metricsPromises = students.map(student => calculateWeeklyMetrics(student));
    const allMetrics = await Promise.all(metricsPromises);

    // Filter out nulls and ineligible students
    const eligibleMetrics = allMetrics.filter(
      (m): m is WeeklyMetrics => m !== null && m.meetsThreshold
    );

    if (eligibleMetrics.length === 0) {
      console.log("[Topper] No eligible students for Topper of the Week");
      return null;
    }

    // Sort by weekly impact score (descending) with tie-breakers
    eligibleMetrics.sort((a, b) => {
      // Primary: Weekly Impact Score
      if (b.weeklyImpactScore !== a.weeklyImpactScore) {
        return b.weeklyImpactScore - a.weeklyImpactScore;
      }

      // Tie-breaker 1: Total rating improvement
      if (b.ratingDelta.total !== a.ratingDelta.total) {
        return b.ratingDelta.total - a.ratingDelta.total;
      }

      // Tie-breaker 2: Weighted problems solved
      if (b.weeklyProblems.weightedTotal !== a.weeklyProblems.weightedTotal) {
        return b.weeklyProblems.weightedTotal - a.weeklyProblems.weightedTotal;
      }

      // Tie-breaker 3: Username (alphabetical as proxy for registration date)
      return a.username.localeCompare(b.username);
    });

    const topper = eligibleMetrics[0];
    console.log(`[Topper] Topper of the Week: ${topper.name} (${topper.username}) with score ${topper.weeklyImpactScore}`);
    
    return topper;
  } catch (error) {
    console.error("[Topper] Failed to get Topper of the Week:", error);
    return null;
  }
}

/**
 * Gets the weekly leaderboard (top 10 students)
 */
export async function getWeeklyLeaderboard(limit: number = 10): Promise<WeeklyMetrics[]> {
  try {
    const students = await storage.getAllStudents();
    
    if (!students || students.length === 0) {
      return [];
    }

    // Calculate metrics for all students
    const metricsPromises = students.map(student => calculateWeeklyMetrics(student));
    const allMetrics = await Promise.all(metricsPromises);

    // Filter out nulls and ineligible students
    const eligibleMetrics = allMetrics.filter(
      (m): m is WeeklyMetrics => m !== null && m.meetsThreshold
    );

    // Sort by weekly impact score with tie-breakers
    eligibleMetrics.sort((a, b) => {
      if (b.weeklyImpactScore !== a.weeklyImpactScore) {
        return b.weeklyImpactScore - a.weeklyImpactScore;
      }
      if (b.ratingDelta.total !== a.ratingDelta.total) {
        return b.ratingDelta.total - a.ratingDelta.total;
      }
      if (b.weeklyProblems.weightedTotal !== a.weeklyProblems.weightedTotal) {
        return b.weeklyProblems.weightedTotal - a.weeklyProblems.weightedTotal;
      }
      return a.username.localeCompare(b.username);
    });

    return eligibleMetrics.slice(0, limit);
  } catch (error) {
    console.error("[Topper] Failed to get weekly leaderboard:", error);
    return [];
  }
}

// Cache for topper data (1 hour TTL)
let topperCache: { data: WeeklyMetrics | null; timestamp: number } | null = null;
let leaderboardCache: { data: WeeklyMetrics[]; timestamp: number } | null = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Gets cached topper or calculates if cache is stale
 */
export async function getCachedTopper(): Promise<WeeklyMetrics | null> {
  const now = Date.now();
  
  if (topperCache && now - topperCache.timestamp < CACHE_TTL) {
    return topperCache.data;
  }

  const topper = await getTopperOfTheWeek();
  topperCache = { data: topper, timestamp: now };
  
  return topper;
}

/**
 * Gets cached leaderboard or calculates if cache is stale
 */
export async function getCachedLeaderboard(limit: number = 10): Promise<WeeklyMetrics[]> {
  const now = Date.now();
  
  if (leaderboardCache && now - leaderboardCache.timestamp < CACHE_TTL) {
    return leaderboardCache.data.slice(0, limit);
  }

  const leaderboard = await getWeeklyLeaderboard(limit);
  leaderboardCache = { data: leaderboard, timestamp: now };
  
  return leaderboard;
}

/**
 * Clears the cache (used for manual refresh)
 */
export function clearTopperCache(): void {
  topperCache = null;
  leaderboardCache = null;
  console.log("[Topper] Cache cleared");
}
