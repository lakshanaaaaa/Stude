import { storage } from "../storage";
import type { Student } from "@shared/schema";

export interface UserImprovementStatus {
  userId: string;
  username: string;
  name: string;
  hasImproved: boolean;
  platform: string;
  previousRating: number;
  currentRating: number;
  ratingChange: number;
}

export interface ImprovementAnalytics {
  totalUsers: number;
  improvedUsers: number;
  notImprovedUsers: number;
  improvementPercentage: number;
  userDetails: UserImprovementStatus[];
  platformBreakdown: {
    leetcode: { improved: number; notImproved: number; total: number };
    codechef: { improved: number; notImproved: number; total: number };
    codeforces: { improved: number; notImproved: number; total: number };
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

  // Get the last two ratings
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
 * Calculates improvement analytics for all users
 */
export async function calculateImprovementAnalytics(): Promise<ImprovementAnalytics> {
  try {
    const students = await storage.getAllStudents();

    if (!students || students.length === 0) {
      return {
        totalUsers: 0,
        improvedUsers: 0,
        notImprovedUsers: 0,
        improvementPercentage: 0,
        userDetails: [],
        platformBreakdown: {
          leetcode: { improved: 0, notImproved: 0, total: 0 },
          codechef: { improved: 0, notImproved: 0, total: 0 },
          codeforces: { improved: 0, notImproved: 0, total: 0 },
        },
      };
    }

    const userDetails: UserImprovementStatus[] = [];
    const usersWithImprovement = new Set<string>();
    
    const platformBreakdown = {
      leetcode: { improved: 0, notImproved: 0, total: 0 },
      codechef: { improved: 0, notImproved: 0, total: 0 },
      codeforces: { improved: 0, notImproved: 0, total: 0 },
    };

    for (const student of students) {
      let studentHasAnyImprovement = false;

      // Check LeetCode improvement
      if (student.contestStats?.leetcode?.ratingHistory) {
        const lcImprovement = checkPlatformImprovement(
          student.contestStats.leetcode.ratingHistory
        );
        
        if (lcImprovement.previous > 0 || lcImprovement.current > 0) {
          platformBreakdown.leetcode.total++;
          
          if (lcImprovement.hasImproved) {
            platformBreakdown.leetcode.improved++;
            studentHasAnyImprovement = true;
            
            userDetails.push({
              userId: student.id,
              username: student.username,
              name: student.name,
              hasImproved: true,
              platform: "LeetCode",
              previousRating: lcImprovement.previous,
              currentRating: lcImprovement.current,
              ratingChange: lcImprovement.change,
            });
          } else {
            platformBreakdown.leetcode.notImproved++;
            
            userDetails.push({
              userId: student.id,
              username: student.username,
              name: student.name,
              hasImproved: false,
              platform: "LeetCode",
              previousRating: lcImprovement.previous,
              currentRating: lcImprovement.current,
              ratingChange: lcImprovement.change,
            });
          }
        }
      }

      // Check CodeChef improvement
      if (student.contestStats?.codechef?.ratingHistory) {
        const ccImprovement = checkPlatformImprovement(
          student.contestStats.codechef.ratingHistory
        );
        
        if (ccImprovement.previous > 0 || ccImprovement.current > 0) {
          platformBreakdown.codechef.total++;
          
          if (ccImprovement.hasImproved) {
            platformBreakdown.codechef.improved++;
            studentHasAnyImprovement = true;
            
            userDetails.push({
              userId: student.id,
              username: student.username,
              name: student.name,
              hasImproved: true,
              platform: "CodeChef",
              previousRating: ccImprovement.previous,
              currentRating: ccImprovement.current,
              ratingChange: ccImprovement.change,
            });
          } else {
            platformBreakdown.codechef.notImproved++;
            
            userDetails.push({
              userId: student.id,
              username: student.username,
              name: student.name,
              hasImproved: false,
              platform: "CodeChef",
              previousRating: ccImprovement.previous,
              currentRating: ccImprovement.current,
              ratingChange: ccImprovement.change,
            });
          }
        }
      }

      // Check CodeForces improvement
      if (student.contestStats?.codeforces?.ratingHistory) {
        const cfImprovement = checkPlatformImprovement(
          student.contestStats.codeforces.ratingHistory
        );
        
        if (cfImprovement.previous > 0 || cfImprovement.current > 0) {
          platformBreakdown.codeforces.total++;
          
          if (cfImprovement.hasImproved) {
            platformBreakdown.codeforces.improved++;
            studentHasAnyImprovement = true;
            
            userDetails.push({
              userId: student.id,
              username: student.username,
              name: student.name,
              hasImproved: true,
              platform: "CodeForces",
              previousRating: cfImprovement.previous,
              currentRating: cfImprovement.current,
              ratingChange: cfImprovement.change,
            });
          } else {
            platformBreakdown.codeforces.notImproved++;
            
            userDetails.push({
              userId: student.id,
              username: student.username,
              name: student.name,
              hasImproved: false,
              platform: "CodeForces",
              previousRating: cfImprovement.previous,
              currentRating: cfImprovement.current,
              ratingChange: cfImprovement.change,
            });
          }
        }
      }

      if (studentHasAnyImprovement) {
        usersWithImprovement.add(student.id);
      }
    }

    const improvedUsers = usersWithImprovement.size;
    const totalUsersWithRatings = students.filter(s => 
      (s.contestStats?.leetcode?.ratingHistory && s.contestStats.leetcode.ratingHistory.length >= 2) ||
      (s.contestStats?.codechef?.ratingHistory && s.contestStats.codechef.ratingHistory.length >= 2) ||
      (s.contestStats?.codeforces?.ratingHistory && s.contestStats.codeforces.ratingHistory.length >= 2)
    ).length;
    
    const notImprovedUsers = totalUsersWithRatings - improvedUsers;
    const improvementPercentage = totalUsersWithRatings > 0 
      ? Math.round((improvedUsers / totalUsersWithRatings) * 100) 
      : 0;

    return {
      totalUsers: totalUsersWithRatings,
      improvedUsers,
      notImprovedUsers,
      improvementPercentage,
      userDetails,
      platformBreakdown,
    };
  } catch (error) {
    console.error("[ImprovementAnalytics] Failed to calculate improvement analytics:", error);
    throw error;
  }
}

// Cache for improvement analytics (30 minutes TTL)
let improvementCache: { data: ImprovementAnalytics; timestamp: number } | null = null;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes in milliseconds

/**
 * Gets cached improvement analytics or calculates if cache is stale
 */
export async function getCachedImprovementAnalytics(): Promise<ImprovementAnalytics> {
  const now = Date.now();
  
  if (improvementCache && now - improvementCache.timestamp < CACHE_TTL) {
    return improvementCache.data;
  }

  const analytics = await calculateImprovementAnalytics();
  improvementCache = { data: analytics, timestamp: now };
  
  return analytics;
}

/**
 * Clears the improvement analytics cache
 */
export function clearImprovementCache(): void {
  improvementCache = null;
  console.log("[ImprovementAnalytics] Cache cleared");
}
