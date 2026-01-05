import type { Student, CodingAccount, CodingPlatform, ContestStats } from "@shared/schema";
import { scrapeLeetCode } from "../scrapers/leetcode";
import { scrapeCodeChef } from "../scrapers/codechef";
import { scrapeCodeForces } from "../scrapers/codeforces";

/**
 * Detailed contest information for a single contest
 */
export interface ContestDetail {
  platform: CodingPlatform;
  contestName: string;
  date: string; // ISO timestamp
  rating: number;
  accountType: "main" | "sub-account";
  accountHandle: string;
}

/**
 * Aggregated contest statistics across all accounts
 */
export interface AggregatedContestStats {
  totalContests: number;
  latestContest: ContestDetail | null;
}

/**
 * Contest entry with timestamp for comparison and deduplication
 */
interface ContestEntry {
  date: Date;
  rating: number;
  platform: CodingPlatform;
  accountType: "main" | "sub-account";
  accountHandle: string;
  contestName?: string;
  endTime?: number; // Unix timestamp for end time (used for same-day comparison)
  contestId?: string; // Platform-specific contest identifier for deduplication
}

/**
 * Extracts contest entries from rating history for a given account
 */
function extractContestEntriesFromRatingHistory(
  ratingHistory: Array<{ date: string; rating: number }>,
  platform: CodingPlatform,
  account: CodingAccount,
  accountType: "main" | "sub-account"
): ContestEntry[] {
  const entries: ContestEntry[] = [];

  for (const entry of ratingHistory) {
    if (entry.rating === undefined || entry.rating === null) {
      continue; // Skip entries with missing ratings
    }

    // Parse date - handle both ISO format and date-only format
    const dateStr = entry.date;
    let date: Date;
    if (dateStr.includes('T')) {
      date = new Date(dateStr);
    } else {
      // Assume date-only format (YYYY-MM-DD), use start of day
      date = new Date(dateStr + 'T00:00:00Z');
    }

    // Create a unique contest ID for deduplication
    // Use date as contest ID (since platforms don't always provide contest names)
    const contestId = `${platform}-${date.toISOString().split('T')[0]}`;

    entries.push({
      date,
      rating: entry.rating,
      platform,
      accountType,
      accountHandle: account.username,
      contestName: undefined, // Will be populated if available from scrapers
      contestId,
    });
  }

  return entries;
}

/**
 * Fetches contest data for a specific account by scraping
 */
async function fetchContestDataForAccount(
  account: CodingAccount,
  accountType: "main" | "sub-account"
): Promise<ContestEntry[]> {
  try {
    let contestStats: any;

    switch (account.platform) {
      case "LeetCode": {
        const result = await scrapeLeetCode(account.username);
        contestStats = result.contestStats?.leetcode;
        break;
      }
      case "CodeChef": {
        const result = await scrapeCodeChef(account.username);
        contestStats = result.contestStats?.codechef;
        break;
      }
      case "CodeForces": {
        const result = await scrapeCodeForces(account.username);
        contestStats = result.contestStats?.codeforces;
        break;
      }
      default:
        return [];
    }

    if (!contestStats || !contestStats.ratingHistory) {
      return [];
    }

    return extractContestEntriesFromRatingHistory(
      contestStats.ratingHistory,
      account.platform,
      account,
      accountType
    );
  } catch (error: any) {
    console.error(`Error fetching contest data for ${account.platform} account ${account.username}:`, error.message);
    return [];
  }
}

/**
 * Deduplicates contest entries based on contest date (same contest on multiple accounts)
 * Keeps the entry with the latest timestamp if multiple accounts participated in the same contest
 */
function deduplicateContestEntries(entries: ContestEntry[]): ContestEntry[] {
  // Group entries by contest ID (platform + date)
  const contestMap = new Map<string, ContestEntry>();

  for (const entry of entries) {
    const key = entry.contestId || `${entry.platform}-${entry.date.toISOString().split('T')[0]}`;
    const existing = contestMap.get(key);

    if (!existing) {
      contestMap.set(key, entry);
    } else {
      // Same contest on multiple accounts - keep the one with the latest date/time
      const existingTime = existing.date.getTime();
      const entryTime = entry.date.getTime();

      if (entryTime > existingTime) {
        // Entry is newer, replace
        contestMap.set(key, entry);
      } else if (entryTime === existingTime && entry.endTime && existing.endTime) {
        // Same date, compare end times
        if (entry.endTime > existing.endTime) {
          contestMap.set(key, entry);
        }
      }
      // If entryTime < existingTime, keep existing (do nothing)
    }
  }

  return Array.from(contestMap.values());
}

/**
 * Aggregates contest statistics from stored contestStats (single account per platform)
 * 
 * Note: This function works with the current data structure where contestStats
 * stores one set of data per platform (main account preferred).
 * 
 * For full multi-account aggregation, use aggregateContestStatsFromMultipleAccounts.
 */
export function aggregateContestStatsFromStoredData(
  student: Student,
  platform: CodingPlatform
): AggregatedContestStats {
  const contestStats = student.contestStats?.[platform.toLowerCase() as keyof ContestStats] as any;
  
  if (!contestStats) {
    return {
      totalContests: 0,
      latestContest: null,
    };
  }

  const ratingHistory = contestStats.ratingHistory || [];
  
  if (ratingHistory.length === 0) {
    return {
      totalContests: 0,
      latestContest: null,
    };
  }

  // Determine which account this data belongs to (main preferred)
  const mainAccount = (student.mainAccounts || []).find(acc => acc.platform === platform);
  const subAccount = (student.subAccounts || []).find(acc => acc.platform === platform);
  const account = mainAccount || subAccount;
  const accountType: "main" | "sub-account" = mainAccount ? "main" : "sub-account";
  const accountHandle = account?.username || "unknown";

  // Convert rating history to contest entries
  const contestEntries = extractContestEntriesFromRatingHistory(
    ratingHistory,
    platform,
    account || { platform, username: accountHandle },
    accountType
  );

  if (contestEntries.length === 0) {
    return {
      totalContests: 0,
      latestContest: null,
    };
  }

  // Find latest contest
  const sortedEntries = sortContestEntriesByDate(contestEntries);
  const latestEntry = sortedEntries[0];

  // Generate contest name if not available
  const contestName = latestEntry.contestName || generateContestName(platform, latestEntry.date);

  const latestContest: ContestDetail = {
    platform: latestEntry.platform,
    contestName,
    date: latestEntry.date.toISOString(),
    rating: latestEntry.rating,
    accountType: latestEntry.accountType,
    accountHandle: latestEntry.accountHandle,
  };

  return {
    totalContests: contestEntries.length,
    latestContest,
  };
}

/**
 * Aggregates contest statistics across multiple accounts (main + sub-accounts) for a platform
 * 
 * This function fetches contest data for each account and aggregates them:
 * - Total contests = sum of unique contests (deduplicated)
 * - Latest contest = most recent contest across all accounts
 * 
 * @param student - Student object with mainAccounts and subAccounts
 * @param platform - Platform to aggregate contests for
 * @returns Aggregated contest statistics
 */
export async function aggregateContestStatsFromMultipleAccounts(
  student: Student,
  platform: CodingPlatform
): Promise<AggregatedContestStats> {
  // Get all accounts (main + sub-accounts) for this platform
  const mainAccounts = (student.mainAccounts || []).filter(acc => acc.platform === platform);
  const subAccounts = (student.subAccounts || []).filter(acc => acc.platform === platform);
  const allAccounts: Array<{ account: CodingAccount; type: "main" | "sub-account" }> = [
    ...mainAccounts.map(acc => ({ account: acc, type: "main" as const })),
    ...subAccounts.map(acc => ({ account: acc, type: "sub-account" as const })),
  ];

  if (allAccounts.length === 0) {
    return {
      totalContests: 0,
      latestContest: null,
    };
  }

  // Fetch contest data for each account
  const allContestEntries: ContestEntry[] = [];
  
  for (const { account, type } of allAccounts) {
    try {
      const entries = await fetchContestDataForAccount(account, type);
      allContestEntries.push(...entries);
    } catch (error: any) {
      console.error(`Error fetching contests for ${account.platform} account ${account.username}:`, error.message);
      // Continue with other accounts
    }
  }

  if (allContestEntries.length === 0) {
    return {
      totalContests: 0,
      latestContest: null,
    };
  }

  // Deduplicate contests (same contest on multiple accounts)
  const uniqueContestEntries = deduplicateContestEntries(allContestEntries);

  // Sort by date (latest first) to find the most recent contest
  const sortedEntries = sortContestEntriesByDate(uniqueContestEntries);

  // Get the latest contest
  const latestEntry = sortedEntries[0];
  const contestName = latestEntry.contestName || generateContestName(platform, latestEntry.date);

  const latestContest: ContestDetail = {
    platform: latestEntry.platform,
    contestName,
    date: latestEntry.date.toISOString(),
    rating: latestEntry.rating,
    accountType: latestEntry.accountType,
    accountHandle: latestEntry.accountHandle,
  };

  return {
    totalContests: uniqueContestEntries.length,
    latestContest,
  };
}

/**
 * Sorts contest entries by date (latest first)
 * For same-day contests, sorts by end time if available
 */
function sortContestEntriesByDate(entries: ContestEntry[]): ContestEntry[] {
  return [...entries].sort((a, b) => {
    const dateA = a.date.getTime();
    const dateB = b.date.getTime();
    
    // Compare by date first
    if (dateA !== dateB) {
      return dateB - dateA; // Descending (latest first)
    }
    
    // Same day - compare by end time if available
    if (a.endTime && b.endTime) {
      return b.endTime - a.endTime; // Descending (later end time first)
    }
    
    // Same day, no end time - maintain order
    return 0;
  });
}

/**
 * Helper function to generate a contest name when not available
 */
function generateContestName(platform: CodingPlatform, date: Date): string {
  const dateStr = date.toISOString().split('T')[0];
  switch (platform) {
    case "LeetCode":
      return `LeetCode Contest ${dateStr}`;
    case "CodeChef":
      return `CodeChef Contest ${dateStr}`;
    case "CodeForces":
      return `CF Round ${dateStr}`;
    default:
      return `${platform} Contest ${dateStr}`;
  }
}

/**
 * Aggregates contest statistics across all platforms (using stored data)
 * Returns a map of platform -> aggregated stats
 */
export function aggregateAllPlatformContests(
  student: Student
): Record<CodingPlatform, AggregatedContestStats> {
  const platforms: CodingPlatform[] = ["LeetCode", "CodeChef", "CodeForces"];
  const results: Partial<Record<CodingPlatform, AggregatedContestStats>> = {};

  for (const platform of platforms) {
    results[platform] = aggregateContestStatsFromStoredData(student, platform);
  }

  return results as Record<CodingPlatform, AggregatedContestStats>;
}

/**
 * Gets aggregated contest stats for a specific platform with detailed contest information
 * 
 * This function provides the output format specified in the requirements.
 * It returns total contests and latest contest with all required details.
 * 
 * Uses stored data (single account per platform).
 * For multi-account aggregation, use aggregateContestStatsFromMultipleAccounts.
 */
export function getPlatformContestAggregation(
  student: Student,
  platform: CodingPlatform
): AggregatedContestStats {
  return aggregateContestStatsFromStoredData(student, platform);
}

/**
 * Gets the latest contest across all platforms (using stored data)
 */
export function getLatestContestAcrossAllPlatforms(
  student: Student
): ContestDetail | null {
  const allPlatformStats = aggregateAllPlatformContests(student);
  
  const allLatestContests = Object.values(allPlatformStats)
    .map(stats => stats.latestContest)
    .filter((contest): contest is ContestDetail => contest !== null);

  if (allLatestContests.length === 0) {
    return null;
  }

  // Sort by date descending and return the latest
  allLatestContests.sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateB - dateA;
  });

  return allLatestContests[0];
}
