import { storage } from "../storage";
import { scrapeStudentData, scrapePlatformAccounts } from "../scrapers/index";
import { computeAndStoreLeaderboards } from "./leaderboardService";
import { clearFacultyAnalyticsCache } from "./facultyAnalyticsService";
import { clearImprovementCache } from "./improvementAnalyticsService";

export interface BulkRefreshProgress {
  isRunning: boolean;
  department?: string;
  totalStudents: number;
  completedStudents: number;
  failedStudents: number;
  currentStudent?: string;
  errors: { username: string; error: string }[];
  startTime?: Date;
}

let currentProgress: BulkRefreshProgress = {
  isRunning: false,
  totalStudents: 0,
  completedStudents: 0,
  failedStudents: 0,
  errors: [],
};

/**
 * Gets the current bulk refresh progress
 */
export function getBulkRefreshProgress(): BulkRefreshProgress {
  return { ...currentProgress };
}

/**
 * Scrapes data for a single student
 */
async function scrapeStudent(username: string): Promise<void> {
  const student = await storage.getStudentByUsername(username);
  if (!student) {
    throw new Error("Student not found");
  }

  // Collect all usernames for each platform (main + sub-accounts)
  const leetcodeUsernames = [
    ...(student.mainAccounts?.filter(acc => acc.platform === "LeetCode").map(acc => acc.username) || []),
    ...(student.subAccounts?.filter(acc => acc.platform === "LeetCode").map(acc => acc.username) || [])
  ];
  const codechefUsernames = [
    ...(student.mainAccounts?.filter(acc => acc.platform === "CodeChef").map(acc => acc.username) || []),
    ...(student.subAccounts?.filter(acc => acc.platform === "CodeChef").map(acc => acc.username) || [])
  ];
  const codeforcesUsernames = [
    ...(student.mainAccounts?.filter(acc => acc.platform === "CodeForces").map(acc => acc.username) || []),
    ...(student.subAccounts?.filter(acc => acc.platform === "CodeForces").map(acc => acc.username) || [])
  ];
  const gfgAccount = student.mainAccounts?.find(acc => acc.platform === "GeeksforGeeks") || student.subAccounts?.find(acc => acc.platform === "GeeksforGeeks");
  const hrAccount = student.mainAccounts?.find(acc => acc.platform === "HackerRank") || student.subAccounts?.find(acc => acc.platform === "HackerRank");

  if (leetcodeUsernames.length === 0 && codechefUsernames.length === 0 && codeforcesUsernames.length === 0 && !gfgAccount && !hrAccount) {
    throw new Error("No platform accounts configured");
  }

  // Aggregate contest data from all accounts for each platform
  const results: Array<{ platform: string; data: { problemStats: any; contestStats: any; badges: any[] } }> = [];
  
  // Scrape LeetCode
  if (leetcodeUsernames.length > 0) {
    const leetcodeData = await scrapePlatformAccounts("LeetCode", leetcodeUsernames);
    results.push({ platform: "LeetCode", data: leetcodeData });
  }
  
  // Scrape CodeChef
  if (codechefUsernames.length > 0) {
    const codechefData = await scrapePlatformAccounts("CodeChef", codechefUsernames);
    results.push({ platform: "CodeChef", data: codechefData });
  }
  
  // Scrape CodeForces
  if (codeforcesUsernames.length > 0) {
    const codeforcesData = await scrapePlatformAccounts("CodeForces", codeforcesUsernames);
    results.push({ platform: "CodeForces", data: codeforcesData });
  }
  
  // Scrape GeeksforGeeks
  if (gfgAccount) {
    const gfgData = await scrapeStudentData(undefined, undefined, undefined, gfgAccount.username, undefined);
    const gfgResult = {
      problemStats: gfgData.problemStats,
      contestStats: gfgData.contestStats,
      badges: gfgData.badges,
    };
    results.push({ platform: "GeeksforGeeks", data: gfgResult });
  }
  
  // Scrape HackerRank
  if (hrAccount) {
    const hrData = await scrapeStudentData(undefined, undefined, undefined, undefined, hrAccount.username);
    const hrResult = {
      problemStats: hrData.problemStats,
      contestStats: hrData.contestStats,
      badges: hrData.badges,
    };
    results.push({ platform: "HackerRank", data: hrResult });
  }
  
  // Merge all results
  const { mergeScrapeResults } = await import("../scrapers/index");
  const scrapedData = mergeScrapeResults(results);

  // Update student with scraped data
  await storage.updateStudentAnalytics(username, scrapedData);
}

/**
 * Refreshes stats for all students in a department
 */
export async function refreshDepartmentStats(department: string): Promise<BulkRefreshProgress> {
  if (currentProgress.isRunning) {
    throw new Error("A bulk refresh is already in progress");
  }

  // Get all students in the department
  const allStudents = await storage.getAllStudents();
  const deptStudents = allStudents.filter(s => s.dept === department);

  if (deptStudents.length === 0) {
    throw new Error("No students found in this department");
  }

  // Initialize progress
  currentProgress = {
    isRunning: true,
    department,
    totalStudents: deptStudents.length,
    completedStudents: 0,
    failedStudents: 0,
    errors: [],
    startTime: new Date(),
  };

  // Start scraping in background
  (async () => {
    console.log(`[BulkRefresh] Starting refresh for ${department} department (${deptStudents.length} students)`);

    for (const student of deptStudents) {
      if (!currentProgress.isRunning) {
        console.log("[BulkRefresh] Refresh cancelled");
        break;
      }

      currentProgress.currentStudent = student.username;

      try {
        console.log(`[BulkRefresh] Scraping ${student.username}...`);
        await scrapeStudent(student.username);
        currentProgress.completedStudents++;
        console.log(`[BulkRefresh] ✓ ${student.username} (${currentProgress.completedStudents}/${currentProgress.totalStudents})`);
      } catch (error: any) {
        currentProgress.failedStudents++;
        currentProgress.errors.push({
          username: student.username,
          error: error.message || "Unknown error",
        });
        console.error(`[BulkRefresh] ✗ ${student.username}: ${error.message}`);
      }

      // Small delay to avoid overwhelming the servers
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Refresh leaderboard after all students are scraped
    try {
      console.log("[BulkRefresh] Refreshing leaderboards...");
      await computeAndStoreLeaderboards();
      console.log("[BulkRefresh] ✓ Leaderboards refreshed");
    } catch (error) {
      console.error("[BulkRefresh] Failed to refresh leaderboards:", error);
    }

    // Clear analytics caches
    clearFacultyAnalyticsCache(department);
    clearImprovementCache();

    console.log(`[BulkRefresh] Completed: ${currentProgress.completedStudents} succeeded, ${currentProgress.failedStudents} failed`);
    currentProgress.isRunning = false;
    currentProgress.currentStudent = undefined;
  })();

  return getBulkRefreshProgress();
}

/**
 * Cancels the current bulk refresh operation
 */
export function cancelBulkRefresh(): void {
  if (currentProgress.isRunning) {
    currentProgress.isRunning = false;
    console.log("[BulkRefresh] Refresh cancelled by user");
  }
}
