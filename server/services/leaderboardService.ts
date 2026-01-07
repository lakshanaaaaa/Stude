import { storage } from "../storage";
import type { Student, User } from "@shared/schema";
import { LeaderboardModel, type LeaderboardDocument } from "../models/Leaderboard";

type PlatformKey = "LeetCode" | "CodeChef" | "CodeForces";

const PLATFORM_PRIORITY: PlatformKey[] = ["CodeForces", "CodeChef", "LeetCode"];

interface OverallEntry {
  userId: string;
  username: string;
  name: string;
  dept: string;
  totalSolved: number;
  highestRatingValue: number;
  highestRatingPlatform: PlatformKey | null;
}

interface PlatformEntry {
  userId: string;
  username: string;
  name: string;
  dept: string;
  platform: PlatformKey;
  problemsSolved: number;
  highestRating: number;
  latestContestTime: number; // Unix ms timestamp for final tie-breaker
}

function getPlatformSolved(student: Student, platform: PlatformKey): number {
  const stats = student.problemStats?.platformStats;
  if (!stats) return 0;
  // Handle Map type from MongoDB
  if (stats instanceof Map) {
    return stats.get(platform) || 0;
  }
  // Handle plain object
  return (stats as Record<string, number>)[platform] || 0;
}

function getPlatformHighestRating(student: Student, platform: PlatformKey): number {
  const cs = student.contestStats;
  if (!cs) return 0;
  if (platform === "LeetCode") return cs.leetcode?.highestRating || 0;
  if (platform === "CodeChef") return cs.codechef?.highestRating || 0;
  if (platform === "CodeForces") return cs.codeforces?.highestRating || 0;
  return 0;
}

function getTotalSolved(student: Student): number {
  // Use the stored total from problemStats.total as the source of truth
  // This is more reliable than calculating from platformStats which may be corrupted
  const storedTotal = student.problemStats?.total || 0;
  
  if (storedTotal > 0) {
    return storedTotal;
  }
  
  // Fallback: calculate from platformStats only if stored total is 0
  const stats = student.problemStats?.platformStats;
  if (!stats) return 0;

  let total = 0;
  
  // Check if it's a Map
  if (stats instanceof Map) {
    stats.forEach((value) => {
      total += value || 0;
    });
  } else if (typeof stats === 'object' && stats !== null) {
    // Handle plain object
    for (const key of Object.keys(stats)) {
      const value = (stats as any)[key];
      if (typeof value === 'number') {
        total += value;
      }
    }
  }

  return total;
}

function buildOverallEntries(students: Student[]): OverallEntry[] {
  const entries: OverallEntry[] = [];

  for (const s of students) {
    // Calculate total from platformStats to ensure accuracy
    const totalSolved = getTotalSolved(s);

    // Highest rating across platforms
    let bestPlatform: PlatformKey | null = null;
    let bestRating = 0;

    for (const platform of PLATFORM_PRIORITY) {
      const rating = getPlatformHighestRating(s, platform);
      if (rating > bestRating) {
        bestRating = rating;
        bestPlatform = platform;
      } else if (rating === bestRating && rating > 0 && bestPlatform) {
        // Tie: respect platform priority (array order already encodes priority)
        const currentIdx = PLATFORM_PRIORITY.indexOf(platform);
        const bestIdx = PLATFORM_PRIORITY.indexOf(bestPlatform);
        if (currentIdx < bestIdx) {
          bestPlatform = platform;
        }
      }
    }

    entries.push({
      userId: s.id,
      username: s.username,
      name: s.name,
      dept: s.dept,
      totalSolved,
      highestRatingValue: bestRating,
      highestRatingPlatform: bestPlatform,
    });
  }

  // Sort:
  // 1) totalSolved DESC
  // 2) highestRatingValue DESC
  // 3) platform priority (CodeForces > CodeChef > LeetCode)
  entries.sort((a, b) => {
    if (b.totalSolved !== a.totalSolved) return b.totalSolved - a.totalSolved;
    if (b.highestRatingValue !== a.highestRatingValue) {
      return b.highestRatingValue - a.highestRatingValue;
    }

    const aIdx =
      a.highestRatingPlatform != null
        ? PLATFORM_PRIORITY.indexOf(a.highestRatingPlatform)
        : PLATFORM_PRIORITY.length;
    const bIdx =
      b.highestRatingPlatform != null
        ? PLATFORM_PRIORITY.indexOf(b.highestRatingPlatform)
        : PLATFORM_PRIORITY.length;
    return aIdx - bIdx;
  });

  return entries;
}

function buildPlatformEntries(
  students: Student[],
  platform: PlatformKey
): PlatformEntry[] {
  const entries: PlatformEntry[] = [];

  for (const s of students) {
    const problemsSolved = getPlatformSolved(s, platform);
    const highestRating = getPlatformHighestRating(s, platform);

    // Latest contest time for this platform from rating history
    let latestContestTime = 0;
    const cs = s.contestStats;
    const history =
      platform === "LeetCode"
        ? cs?.leetcode?.ratingHistory
        : platform === "CodeChef"
        ? cs?.codechef?.ratingHistory
        : cs?.codeforces?.ratingHistory;

    if (history && history.length > 0) {
      const last = history[history.length - 1];
      if (last.date) {
        latestContestTime = new Date(last.date).getTime();
      }
    }

    // Include even if zero; frontend can filter if desired
    entries.push({
      userId: s.id,
      username: s.username,
      name: s.name,
      dept: s.dept,
      platform,
      problemsSolved,
      highestRating,
      latestContestTime,
    });
  }

  // Sort:
  // 1) highestRating DESC
  // 2) problemsSolved DESC
  // 3) latestContestTime DESC
  entries.sort((a, b) => {
    if (b.highestRating !== a.highestRating) {
      return b.highestRating - a.highestRating;
    }
    if (b.problemsSolved !== a.problemsSolved) {
      return b.problemsSolved - a.problemsSolved;
    }
    return b.latestContestTime - a.latestContestTime;
  });

  return entries;
}

export async function computeAndStoreLeaderboards(): Promise<void> {
  try {
    const [students, users] = await Promise.all([
      storage.getAllStudents(),
      storage.getAllUsers(),
    ]);

    if (!students || students.length === 0) {
      return;
    }

    // Keep only students that still have a corresponding user account
    const validUsernames = new Set(users.map((u) => u.username));
    const filteredStudents = students.filter((s) => validUsernames.has(s.username));

    if (filteredStudents.length === 0) {
      console.warn("[Leaderboard] No valid students with matching users found");
      return;
    }

    const generatedAt = new Date();

    // Overall leaderboard
    const overallEntries = buildOverallEntries(filteredStudents);
    const overallDoc: LeaderboardDocument = {
      scope: "overall",
      platform: null,
      generatedAt,
      entries: overallEntries.map((entry, idx) => ({
        rank: idx + 1,
        ...entry,
      })),
    };

    await LeaderboardModel.findOneAndUpdate(
      { scope: "overall", platform: null },
      overallDoc,
      { upsert: true, new: true }
    );

    // Platform-wise leaderboards
    for (const platform of PLATFORM_PRIORITY) {
      const platformEntries = buildPlatformEntries(filteredStudents, platform);
      const platformDoc: LeaderboardDocument = {
        scope: "platform",
        platform,
        generatedAt,
        entries: platformEntries.map((entry, idx) => ({
          rank: idx + 1,
          ...entry,
        })),
      };

      await LeaderboardModel.findOneAndUpdate(
        { scope: "platform", platform },
        platformDoc,
        { upsert: true, new: true }
      );
    }

    console.log(
      `[Leaderboard] Updated at ${generatedAt.toISOString()} for ${
        students.length
      } students`
    );
  } catch (err) {
    console.error("[Leaderboard] Failed to compute leaderboard:", err);
  }
}

export async function getOverallLeaderboard(limit?: number) {
  const doc = await LeaderboardModel.findOne({
    scope: "overall",
    platform: null,
  })
    .lean()
    .exec();

  if (!doc) return null;

  const entries = limit ? doc.entries.slice(0, limit) : doc.entries;
  return { generatedAt: doc.generatedAt, entries };
}

export async function getPlatformLeaderboard(
  platform: PlatformKey,
  limit?: number
) {
  const doc = await LeaderboardModel.findOne({
    scope: "platform",
    platform,
  })
    .lean()
    .exec();

  if (!doc) return null;

  const entries = limit ? doc.entries.slice(0, limit) : doc.entries;
  return { generatedAt: doc.generatedAt, entries };
}


