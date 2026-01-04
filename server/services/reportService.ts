import { storage } from "../storage";
import { adminStorage } from "../storage/adminMongodb";
import { scrapeStudentData } from "../scrapers/index";
import type { Student } from "@shared/schema";
import type { WeeklySnapshot, StudentSnapshot, PlatformSnapshot } from "../models/WeeklySnapshot";

const PLATFORMS = ["LeetCode", "CodeChef", "CodeForces", "GeeksforGeeks", "HackerRank"] as const;

export interface ScrapeProgress {
  total: number;
  completed: number;
  current: string;
  status: "idle" | "running" | "completed" | "error";
  errors: string[];
}

export interface WeeklyComparison {
  platform: string;
  thisWeek: PlatformSnapshot;
  lastWeek: PlatformSnapshot | null;
  problemsChange: number;
  contestsChange: number;
  activeUsersChange: number;
}

export interface ReportData {
  currentSnapshot: WeeklySnapshot;
  previousSnapshot: WeeklySnapshot | null;
  platformComparisons: WeeklyComparison[];
  topGainers: {
    student: StudentSnapshot;
    problemsGained: number;
    contestsGained: number;
  }[];
  departmentStats: {
    dept: string;
    totalProblems: number;
    totalContests: number;
    studentCount: number;
    avgProblems: number;
  }[];
}

// Track scraping progress
let scrapeProgress: ScrapeProgress = {
  total: 0,
  completed: 0,
  current: "",
  status: "idle",
  errors: [],
};

export function getScrapeProgress(): ScrapeProgress {
  return { ...scrapeProgress };
}

function getWeekBounds(): { weekStart: Date; weekEnd: Date } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  
  // Get Monday of current week
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  weekStart.setHours(0, 0, 0, 0);
  
  // Get Sunday of current week
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  
  return { weekStart, weekEnd };
}

export async function scrapeAllStudentsForPlatform(platform: string): Promise<{
  success: boolean;
  scrapedCount: number;
  errors: string[];
}> {
  const students = await storage.getAllStudents();
  const errors: string[] = [];
  let scrapedCount = 0;

  scrapeProgress = {
    total: students.length,
    completed: 0,
    current: "",
    status: "running",
    errors: [],
  };

  for (const student of students) {
    try {
      scrapeProgress.current = student.username;
      
      // Find platform account
      const account = [...(student.mainAccounts || []), ...(student.subAccounts || [])]
        .find(acc => acc.platform === platform);
      
      if (!account) {
        scrapeProgress.completed++;
        continue;
      }

      console.log(`[BulkScrape] Scraping ${platform} for ${student.username} (${account.username})`);

      // Scrape based on platform
      let scrapedData;
      switch (platform) {
        case "LeetCode":
          scrapedData = await scrapeStudentData(account.username, undefined, undefined, undefined, undefined);
          break;
        case "CodeChef":
          scrapedData = await scrapeStudentData(undefined, account.username, undefined, undefined, undefined);
          break;
        case "CodeForces":
          scrapedData = await scrapeStudentData(undefined, undefined, account.username, undefined, undefined);
          break;
        case "GeeksforGeeks":
          scrapedData = await scrapeStudentData(undefined, undefined, undefined, account.username, undefined);
          break;
        case "HackerRank":
          scrapedData = await scrapeStudentData(undefined, undefined, undefined, undefined, account.username);
          break;
        default:
          continue;
      }

      // Update student analytics
      await storage.updateStudentAnalytics(student.username, scrapedData);
      scrapedCount++;
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error: any) {
      const errorMsg = `Failed to scrape ${student.username}: ${error.message}`;
      errors.push(errorMsg);
      scrapeProgress.errors.push(errorMsg);
      console.error(`[BulkScrape] ${errorMsg}`);
    }
    
    scrapeProgress.completed++;
  }

  scrapeProgress.status = errors.length > 0 ? "error" : "completed";
  
  return { success: true, scrapedCount, errors };
}

export async function createWeeklySnapshot(): Promise<WeeklySnapshot> {
  const students = await storage.getAllStudents();
  const { weekStart, weekEnd } = getWeekBounds();

  // Build student snapshots
  const studentSnapshots: StudentSnapshot[] = students.map(student => {
    const platforms = PLATFORMS.map(platform => {
      const account = [...(student.mainAccounts || []), ...(student.subAccounts || [])]
        .find(acc => acc.platform === platform);
      
      let problemsSolved = 0;
      let easy = 0;
      let medium = 0;
      let hard = 0;
      let contestsAttended = 0;
      let currentRating = 0;
      let highestRating = 0;

      if (platform === "LeetCode") {
        problemsSolved = student.problemStats?.platformStats?.LeetCode || 0;
        easy = student.problemStats?.easy || 0;
        medium = student.problemStats?.medium || 0;
        hard = student.problemStats?.hard || 0;
        contestsAttended = student.contestStats?.leetcode?.totalContests || 0;
        currentRating = student.contestStats?.leetcode?.currentRating || 0;
        highestRating = student.contestStats?.leetcode?.highestRating || 0;
      } else if (platform === "CodeChef") {
        problemsSolved = student.problemStats?.platformStats?.CodeChef || 0;
        contestsAttended = student.contestStats?.codechef?.totalContests || 0;
        currentRating = student.contestStats?.codechef?.currentRating || 0;
        highestRating = student.contestStats?.codechef?.highestRating || 0;
      } else if (platform === "CodeForces") {
        problemsSolved = student.problemStats?.platformStats?.CodeForces || 0;
        contestsAttended = student.contestStats?.codeforces?.totalContests || 0;
        currentRating = student.contestStats?.codeforces?.currentRating || 0;
        highestRating = student.contestStats?.codeforces?.highestRating || 0;
      } else if (platform === "GeeksforGeeks") {
        problemsSolved = student.problemStats?.platformStats?.GeeksforGeeks || 0;
      } else if (platform === "HackerRank") {
        problemsSolved = student.problemStats?.platformStats?.HackerRank || 0;
      }

      return {
        platform,
        username: account?.username || "",
        problemsSolved,
        easy,
        medium,
        hard,
        contestsAttended,
        currentRating,
        highestRating,
      };
    });

    return {
      studentId: student.id,
      username: student.username,
      name: student.name,
      dept: student.dept,
      platforms,
      totalProblems: student.problemStats?.total || 0,
      totalContests: platforms.reduce((sum, p) => sum + p.contestsAttended, 0),
    };
  });

  // Build platform stats
  const platformStats: PlatformSnapshot[] = PLATFORMS.map(platform => {
    const platformData = studentSnapshots.map(s => 
      s.platforms.find(p => p.platform === platform)
    ).filter(Boolean);

    const totalProblems = platformData.reduce((sum, p) => sum + (p?.problemsSolved || 0), 0);
    const totalContests = platformData.reduce((sum, p) => sum + (p?.contestsAttended || 0), 0);
    const ratings = platformData.filter(p => (p?.currentRating || 0) > 0).map(p => p!.currentRating);
    const avgRating = ratings.length > 0 ? Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length) : 0;
    const activeUsers = platformData.filter(p => (p?.problemsSolved || 0) > 0).length;

    return {
      platform,
      totalProblems,
      easy: platformData.reduce((sum, p) => sum + (p?.easy || 0), 0),
      medium: platformData.reduce((sum, p) => sum + (p?.medium || 0), 0),
      hard: platformData.reduce((sum, p) => sum + (p?.hard || 0), 0),
      totalContests,
      avgRating,
      activeUsers,
    };
  });

  const snapshot = await adminStorage.createWeeklySnapshot({
    weekStart,
    weekEnd,
    platformStats,
    studentSnapshots,
    totalStudents: students.length,
    totalProblemsAllPlatforms: platformStats.reduce((sum, p) => sum + p.totalProblems, 0),
    totalContestsAllPlatforms: platformStats.reduce((sum, p) => sum + p.totalContests, 0),
  });

  return snapshot;
}

export async function generatePlatformReport(platform: string): Promise<ReportData | null> {
  const currentSnapshot = await adminStorage.getLatestSnapshot();
  if (!currentSnapshot) {
    return null;
  }

  const allSnapshots = await adminStorage.getAllSnapshots();
  const previousSnapshot = allSnapshots.length > 1 ? allSnapshots[1] : null;

  const currentPlatformStats = currentSnapshot.platformStats.find(p => p.platform === platform);
  const previousPlatformStats = previousSnapshot?.platformStats.find(p => p.platform === platform);

  if (!currentPlatformStats) {
    return null;
  }

  const platformComparisons: WeeklyComparison[] = [{
    platform,
    thisWeek: currentPlatformStats,
    lastWeek: previousPlatformStats || null,
    problemsChange: previousPlatformStats 
      ? currentPlatformStats.totalProblems - previousPlatformStats.totalProblems 
      : 0,
    contestsChange: previousPlatformStats 
      ? currentPlatformStats.totalContests - previousPlatformStats.totalContests 
      : 0,
    activeUsersChange: previousPlatformStats 
      ? currentPlatformStats.activeUsers - previousPlatformStats.activeUsers 
      : 0,
  }];

  // Calculate top gainers for this platform
  const topGainers = currentSnapshot.studentSnapshots
    .map(current => {
      const previous = previousSnapshot?.studentSnapshots.find(s => s.studentId === current.studentId);
      const currentPlatform = current.platforms.find(p => p.platform === platform);
      const previousPlatform = previous?.platforms.find(p => p.platform === platform);
      
      return {
        student: current,
        problemsGained: (currentPlatform?.problemsSolved || 0) - (previousPlatform?.problemsSolved || 0),
        contestsGained: (currentPlatform?.contestsAttended || 0) - (previousPlatform?.contestsAttended || 0),
      };
    })
    .filter(g => g.problemsGained > 0 || g.contestsGained > 0)
    .sort((a, b) => b.problemsGained - a.problemsGained)
    .slice(0, 10);

  // Department stats for this platform
  const deptMap = new Map<string, { problems: number; contests: number; count: number }>();
  
  currentSnapshot.studentSnapshots.forEach(student => {
    const platformData = student.platforms.find(p => p.platform === platform);
    if (!deptMap.has(student.dept)) {
      deptMap.set(student.dept, { problems: 0, contests: 0, count: 0 });
    }
    const dept = deptMap.get(student.dept)!;
    dept.problems += platformData?.problemsSolved || 0;
    dept.contests += platformData?.contestsAttended || 0;
    dept.count++;
  });

  const departmentStats = Array.from(deptMap.entries()).map(([dept, data]) => ({
    dept,
    totalProblems: data.problems,
    totalContests: data.contests,
    studentCount: data.count,
    avgProblems: data.count > 0 ? Math.round(data.problems / data.count) : 0,
  })).sort((a, b) => b.totalProblems - a.totalProblems);

  return {
    currentSnapshot,
    previousSnapshot,
    platformComparisons,
    topGainers,
    departmentStats,
  };
}

export async function generateFullReport(): Promise<ReportData | null> {
  const currentSnapshot = await adminStorage.getLatestSnapshot();
  if (!currentSnapshot) {
    return null;
  }

  const allSnapshots = await adminStorage.getAllSnapshots();
  const previousSnapshot = allSnapshots.length > 1 ? allSnapshots[1] : null;

  const platformComparisons: WeeklyComparison[] = currentSnapshot.platformStats.map(current => {
    const previous = previousSnapshot?.platformStats.find(p => p.platform === current.platform);
    return {
      platform: current.platform,
      thisWeek: current,
      lastWeek: previous || null,
      problemsChange: previous ? current.totalProblems - previous.totalProblems : 0,
      contestsChange: previous ? current.totalContests - previous.totalContests : 0,
      activeUsersChange: previous ? current.activeUsers - previous.activeUsers : 0,
    };
  });

  // Top gainers overall
  const topGainers = currentSnapshot.studentSnapshots
    .map(current => {
      const previous = previousSnapshot?.studentSnapshots.find(s => s.studentId === current.studentId);
      return {
        student: current,
        problemsGained: current.totalProblems - (previous?.totalProblems || 0),
        contestsGained: current.totalContests - (previous?.totalContests || 0),
      };
    })
    .filter(g => g.problemsGained > 0)
    .sort((a, b) => b.problemsGained - a.problemsGained)
    .slice(0, 10);

  // Department stats
  const deptMap = new Map<string, { problems: number; contests: number; count: number }>();
  
  currentSnapshot.studentSnapshots.forEach(student => {
    if (!deptMap.has(student.dept)) {
      deptMap.set(student.dept, { problems: 0, contests: 0, count: 0 });
    }
    const dept = deptMap.get(student.dept)!;
    dept.problems += student.totalProblems;
    dept.contests += student.totalContests;
    dept.count++;
  });

  const departmentStats = Array.from(deptMap.entries()).map(([dept, data]) => ({
    dept,
    totalProblems: data.problems,
    totalContests: data.contests,
    studentCount: data.count,
    avgProblems: data.count > 0 ? Math.round(data.problems / data.count) : 0,
  })).sort((a, b) => b.totalProblems - a.totalProblems);

  return {
    currentSnapshot,
    previousSnapshot,
    platformComparisons,
    topGainers,
    departmentStats,
  };
}
