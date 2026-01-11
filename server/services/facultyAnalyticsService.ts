import { storage } from "../storage";
import type { Student } from "@shared/schema";

export interface StudentImprovementStatus {
  userId: string;
  username: string;
  name: string;
  dept: string;
  hasImproved: boolean;
  platforms: {
    platform: string;
    previousRating: number;
    currentRating: number;
    ratingChange: number;
  }[];
}

export interface StudentContestStatus {
  userId: string;
  username: string;
  name: string;
  dept: string;
  attendedLastContest: boolean;
  platforms: {
    platform: string;
    totalContests: number;
    lastContestDate?: string;
    daysSinceLastContest?: number;
  }[];
}

export interface FacultyAnalytics {
  department: string;
  totalStudents: number;
  
  // Improvement Analytics
  improvement: {
    improved: StudentImprovementStatus[];
    notImproved: StudentImprovementStatus[];
    improvedCount: number;
    notImprovedCount: number;
    improvementPercentage: number;
  };
  
  // Contest Participation Analytics
  contestParticipation: {
    attendedLast: StudentContestStatus[];
    didNotAttendLast: StudentContestStatus[];
    attendedCount: number;
    didNotAttendCount: number;
    participationPercentage: number;
  };
}

/**
 * Checks if a user has improved their rating on a specific platform
 */
function checkPlatformImprovement(
  ratingHistory: { date: string; rating: number }[] | undefined
): { hasImproved: boolean; previous: number; current: number; change: number } {
  if (!ratingHistory || ratingHistory.length < 2) {
    return { hasImproved: false, previous: 0, current: 0, change: 0 };
  }

  const current = ratingHistory[ratingHistory.length - 1].rating;
  const previous = ratingHistory[ratingHistory.length - 2].rating;
  const change = current - previous;

  return {
    hasImproved: current > previous,
    previous,
    current,
    change,
  };
}

/**
 * Checks if a user attended a contest recently (within last 30 days)
 */
function checkRecentContestParticipation(
  ratingHistory: { date: string; rating: number }[] | undefined
): { attended: boolean; lastDate?: string; daysSinceLastContest?: number } {
  if (!ratingHistory || ratingHistory.length === 0) {
    return { attended: false };
  }

  const lastContest = ratingHistory[ratingHistory.length - 1];
  const lastDate = new Date(lastContest.date);
  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Calculate days since last contest
  const daysSince = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

  return {
    attended: lastDate >= thirtyDaysAgo,
    lastDate: lastContest.date,
    daysSinceLastContest: daysSince,
  };
}

/**
 * Calculates comprehensive faculty analytics for a department
 */
export async function calculateFacultyAnalytics(department: string): Promise<FacultyAnalytics> {
  try {
    const allStudents = await storage.getAllStudents();
    const deptStudents = allStudents.filter(s => s.dept === department);

    if (deptStudents.length === 0) {
      return {
        department,
        totalStudents: 0,
        improvement: {
          improved: [],
          notImproved: [],
          improvedCount: 0,
          notImprovedCount: 0,
          improvementPercentage: 0,
        },
        contestParticipation: {
          attendedLast: [],
          didNotAttendLast: [],
          attendedCount: 0,
          didNotAttendCount: 0,
          participationPercentage: 0,
        },
      };
    }

    // Calculate improvement analytics
    const improvedStudents: StudentImprovementStatus[] = [];
    const notImprovedStudents: StudentImprovementStatus[] = [];
    const studentsWithImprovement = new Set<string>();

    for (const student of deptStudents) {
      const platforms: { platform: string; previousRating: number; currentRating: number; ratingChange: number }[] = [];
      let hasAnyImprovement = false;

      // Check LeetCode
      if (student.contestStats?.leetcode?.ratingHistory && student.contestStats.leetcode.ratingHistory.length >= 2) {
        const lcImprovement = checkPlatformImprovement(student.contestStats.leetcode.ratingHistory);
        platforms.push({
          platform: "LeetCode",
          previousRating: lcImprovement.previous,
          currentRating: lcImprovement.current,
          ratingChange: lcImprovement.change,
        });
        if (lcImprovement.hasImproved) hasAnyImprovement = true;
      }

      // Check CodeChef
      if (student.contestStats?.codechef?.ratingHistory && student.contestStats.codechef.ratingHistory.length >= 2) {
        const ccImprovement = checkPlatformImprovement(student.contestStats.codechef.ratingHistory);
        platforms.push({
          platform: "CodeChef",
          previousRating: ccImprovement.previous,
          currentRating: ccImprovement.current,
          ratingChange: ccImprovement.change,
        });
        if (ccImprovement.hasImproved) hasAnyImprovement = true;
      }

      // Check CodeForces
      if (student.contestStats?.codeforces?.ratingHistory && student.contestStats.codeforces.ratingHistory.length >= 2) {
        const cfImprovement = checkPlatformImprovement(student.contestStats.codeforces.ratingHistory);
        platforms.push({
          platform: "CodeForces",
          previousRating: cfImprovement.previous,
          currentRating: cfImprovement.current,
          ratingChange: cfImprovement.change,
        });
        if (cfImprovement.hasImproved) hasAnyImprovement = true;
      }

      if (platforms.length > 0) {
        const studentStatus: StudentImprovementStatus = {
          userId: student.id,
          username: student.username,
          name: student.name,
          dept: student.dept,
          hasImproved: hasAnyImprovement,
          platforms,
        };

        if (hasAnyImprovement) {
          improvedStudents.push(studentStatus);
          studentsWithImprovement.add(student.id);
        } else {
          notImprovedStudents.push(studentStatus);
        }
      }
    }

    const studentsWithRatings = improvedStudents.length + notImprovedStudents.length;
    const improvementPercentage = studentsWithRatings > 0 
      ? Math.round((improvedStudents.length / studentsWithRatings) * 100) 
      : 0;

    // Calculate contest participation analytics
    const attendedLastContest: StudentContestStatus[] = [];
    const didNotAttendLastContest: StudentContestStatus[] = [];

    for (const student of deptStudents) {
      const platforms: { platform: string; totalContests: number; lastContestDate?: string }[] = [];
      let attendedAnyRecent = false;

      // Check LeetCode
      if (student.contestStats?.leetcode) {
        const lcParticipation = checkRecentContestParticipation(student.contestStats.leetcode.ratingHistory);
        platforms.push({
          platform: "LeetCode",
          totalContests: student.contestStats.leetcode.totalContests || 0,
          lastContestDate: lcParticipation.lastDate,
          daysSinceLastContest: lcParticipation.daysSinceLastContest,
        });
        if (lcParticipation.attended) attendedAnyRecent = true;
      }

      // Check CodeChef
      if (student.contestStats?.codechef) {
        const ccParticipation = checkRecentContestParticipation(student.contestStats.codechef.ratingHistory);
        platforms.push({
          platform: "CodeChef",
          totalContests: student.contestStats.codechef.totalContests || 0,
          lastContestDate: ccParticipation.lastDate,
          daysSinceLastContest: ccParticipation.daysSinceLastContest,
        });
        if (ccParticipation.attended) attendedAnyRecent = true;
      }

      // Check CodeForces
      if (student.contestStats?.codeforces) {
        const cfParticipation = checkRecentContestParticipation(student.contestStats.codeforces.ratingHistory);
        platforms.push({
          platform: "CodeForces",
          totalContests: student.contestStats.codeforces.totalContests || 0,
          lastContestDate: cfParticipation.lastDate,
          daysSinceLastContest: cfParticipation.daysSinceLastContest,
        });
        if (cfParticipation.attended) attendedAnyRecent = true;
      }

      if (platforms.length > 0) {
        const studentStatus: StudentContestStatus = {
          userId: student.id,
          username: student.username,
          name: student.name,
          dept: student.dept,
          attendedLastContest: attendedAnyRecent,
          platforms,
        };

        if (attendedAnyRecent) {
          attendedLastContest.push(studentStatus);
        } else {
          didNotAttendLastContest.push(studentStatus);
        }
      }
    }

    const studentsWithContestData = attendedLastContest.length + didNotAttendLastContest.length;
    const participationPercentage = studentsWithContestData > 0
      ? Math.round((attendedLastContest.length / studentsWithContestData) * 100)
      : 0;

    return {
      department,
      totalStudents: deptStudents.length,
      improvement: {
        improved: improvedStudents,
        notImproved: notImprovedStudents,
        improvedCount: improvedStudents.length,
        notImprovedCount: notImprovedStudents.length,
        improvementPercentage,
      },
      contestParticipation: {
        attendedLast: attendedLastContest,
        didNotAttendLast: didNotAttendLastContest,
        attendedCount: attendedLastContest.length,
        didNotAttendCount: didNotAttendLastContest.length,
        participationPercentage,
      },
    };
  } catch (error) {
    console.error("[FacultyAnalytics] Failed to calculate analytics:", error);
    throw error;
  }
}

// Cache for faculty analytics (30 minutes TTL)
const facultyAnalyticsCache = new Map<string, { data: FacultyAnalytics; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Gets cached faculty analytics or calculates if cache is stale
 */
export async function getCachedFacultyAnalytics(department: string): Promise<FacultyAnalytics> {
  const now = Date.now();
  const cached = facultyAnalyticsCache.get(department);
  
  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const analytics = await calculateFacultyAnalytics(department);
  facultyAnalyticsCache.set(department, { data: analytics, timestamp: now });
  
  return analytics;
}

/**
 * Clears the faculty analytics cache for a specific department or all
 */
export function clearFacultyAnalyticsCache(department?: string): void {
  if (department) {
    facultyAnalyticsCache.delete(department);
    console.log(`[FacultyAnalytics] Cache cleared for ${department}`);
  } else {
    facultyAnalyticsCache.clear();
    console.log("[FacultyAnalytics] All cache cleared");
  }
}
