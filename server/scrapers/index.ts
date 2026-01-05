import { scrapeLeetCode } from "./leetcode";
import { scrapeCodeChef } from "./codechef";
import { scrapeCodeForces } from "./codeforces";
import { scrapeGeeksforGeeks } from "./geeksforgeeks";
import { scrapeHackerRank } from "./hackerrank";
import type { ProblemStats, ContestStats, Badge, CodingPlatform } from "@shared/schema";

export interface ScrapeResult {
  problemStats: ProblemStats;
  contestStats: ContestStats;
  badges: Badge[];
}

/**
 * Scrapes data for all accounts of a specific platform and aggregates the results
 */
export async function scrapePlatformAccounts(
  platform: "LeetCode" | "CodeChef" | "CodeForces",
  usernames: string[]
): Promise<{ problemStats: ProblemStats; contestStats: ContestStats; badges: Badge[] }> {
  const results: Array<{ platform: string; data: { problemStats: ProblemStats; contestStats: ContestStats; badges: Badge[] } }> = [];

  for (const username of usernames) {
    try {
      let data: { problemStats: ProblemStats; contestStats: ContestStats; badges: Badge[] };
      
      switch (platform) {
        case "LeetCode":
          data = await scrapeLeetCode(username);
          break;
        case "CodeChef":
          data = await scrapeCodeChef(username);
          break;
        case "CodeForces":
          data = await scrapeCodeForces(username);
          break;
        default:
          continue;
      }
      
      results.push({ platform, data });
      // Rate limiting between accounts
      if (usernames.length > 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    } catch (error: any) {
      console.error(`[${platform}] Failed for ${username}:`, error.message);
      // Continue with other accounts
    }
  }

  if (results.length === 0) {
    return {
      problemStats: {
        total: 0,
        easy: 0,
        medium: 0,
        hard: 0,
        platformStats: {
          LeetCode: 0,
          CodeChef: 0,
          CodeForces: 0,
          GeeksforGeeks: 0,
          HackerRank: 0,
          CodeStudio: 0,
        },
        solvedOverTime: [],
      },
      contestStats: {
        leetcode: { currentRating: 0, highestRating: 0, totalContests: 0, ratingHistory: [] },
        codechef: { currentRating: 0, highestRating: 0, totalContests: 0, ratingHistory: [] },
        codeforces: { currentRating: 0, highestRating: 0, totalContests: 0, ratingHistory: [] },
      },
      badges: [],
    };
  }

  // Use mergeScrapeResults to aggregate results from multiple accounts
  const merged = mergeScrapeResults(results);
  return merged;
}

/**
 * Scrapes data from multiple platforms and merges the results
 */
export async function scrapeStudentData(
  leetcodeUsername?: string,
  codechefUsername?: string,
  codeforcesUsername?: string,
  geeksforgeeksUsername?: string,
  hackerrankUsername?: string
): Promise<ScrapeResult> {
  const results: ScrapeResult[] = [];

  console.log(`\n=== Starting scrapeStudentData ===`);
  console.log(`LeetCode: ${leetcodeUsername || 'N/A'}`);
  console.log(`CodeChef: ${codechefUsername || 'N/A'}`);
  console.log(`CodeForces: ${codeforcesUsername || 'N/A'}`);
  console.log(`GeeksforGeeks: ${geeksforgeeksUsername || 'N/A'}`);
  console.log(`HackerRank: ${hackerrankUsername || 'N/A'}`);

  if (leetcodeUsername) {
    try {
      console.log(`\n[LeetCode] Starting scrape for: ${leetcodeUsername}`);
      const leetcodeData = await scrapeLeetCode(leetcodeUsername);
      console.log(`[LeetCode] Success - Problems: ${leetcodeData.problemStats.total}`);
      results.push({ platform: 'LeetCode', data: leetcodeData });
      await new Promise((resolve) => setTimeout(resolve, 3000));
    } catch (error: any) {
      console.error(`[LeetCode] Failed for ${leetcodeUsername}:`, error.message);
    }
  }

  if (codechefUsername) {
    try {
      console.log(`\n[CodeChef] Starting scrape for: ${codechefUsername}`);
      const codechefData = await scrapeCodeChef(codechefUsername);
      console.log(`[CodeChef] Success - Problems: ${codechefData.problemStats.total}`);
      results.push({ platform: 'CodeChef', data: codechefData });
      await new Promise((resolve) => setTimeout(resolve, 3000));
    } catch (error: any) {
      console.error(`[CodeChef] Failed for ${codechefUsername}:`, error.message);
    }
  }

  if (codeforcesUsername) {
    try {
      console.log(`\n[CodeForces] Starting scrape for: ${codeforcesUsername}`);
      const codeforcesData = await scrapeCodeForces(codeforcesUsername);
      console.log(`[CodeForces] Success - Problems: ${codeforcesData.problemStats.total}`);
      results.push({ platform: 'CodeForces', data: codeforcesData });
      await new Promise((resolve) => setTimeout(resolve, 3000));
    } catch (error: any) {
      console.error(`[CodeForces] Failed for ${codeforcesUsername}:`, error.message);
    }
  }

  if (geeksforgeeksUsername) {
    try {
      console.log(`\n[GeeksforGeeks] Starting scrape for: ${geeksforgeeksUsername}`);
      const gfgData = await scrapeGeeksforGeeks(geeksforgeeksUsername);
      console.log(`[GeeksforGeeks] Success - Problems: ${gfgData.problemStats.total}`);
      results.push({ platform: 'GeeksforGeeks', data: gfgData });
      await new Promise((resolve) => setTimeout(resolve, 3000));
    } catch (error: any) {
      console.error(`[GeeksforGeeks] Failed for ${geeksforgeeksUsername}:`, error.message);
    }
  }

  if (hackerrankUsername) {
    try {
      console.log(`\n[HackerRank] Starting scrape for: ${hackerrankUsername}`);
      const hrData = await scrapeHackerRank(hackerrankUsername);
      console.log(`[HackerRank] Success - Problems: ${hrData.problemStats.total}`);
      results.push({ platform: 'HackerRank', data: hrData });
      await new Promise((resolve) => setTimeout(resolve, 3000));
    } catch (error: any) {
      console.error(`[HackerRank] Failed for ${hackerrankUsername}:`, error.message);
    }
  }

  console.log(`\n[Merge] Merging ${results.length} results...`);
  const merged = mergeScrapeResults(results);
  console.log(`[Merge] Final totals - Problems: ${merged.problemStats.total}`);
  console.log(`=== scrapeStudentData complete ===\n`);

  return merged;
}

/**
 * Aggregates rating history from multiple accounts for the same platform
 * Combines all contests chronologically, keeping all unique contests
 * Deduplicates only if same date AND same rating (same contest)
 */
function aggregateRatingHistory(
  histories: Array<{ date: string; rating: number }>[]
): { date: string; rating: number }[] {
  // Combine all rating histories
  const allEntries: Array<{ date: string; rating: number; timestamp: number }> = [];
  
  for (const history of histories) {
    for (const entry of history) {
      // Parse date to timestamp for comparison
      let timestamp: number;
      if (entry.date.includes('T')) {
        timestamp = new Date(entry.date).getTime();
      } else {
        // Date-only format
        timestamp = new Date(entry.date + 'T00:00:00Z').getTime();
      }
      
      allEntries.push({
        date: entry.date,
        rating: entry.rating,
        timestamp,
      });
    }
  }

  // Deduplicate: same date AND same rating = same contest
  // Use a Set with a composite key (date + rating) to identify unique contests
  const contestSet = new Set<string>();
  const uniqueEntries: Array<{ date: string; rating: number; timestamp: number }> = [];
  
  for (const entry of allEntries) {
    // Create a unique key: date (YYYY-MM-DD) + rating
    // This ensures we only deduplicate if it's the exact same contest
    const dateKey = entry.date.split('T')[0];
    const contestKey = `${dateKey}-${entry.rating}`;
    
    if (!contestSet.has(contestKey)) {
      contestSet.add(contestKey);
      uniqueEntries.push(entry);
    }
  }

  // Sort by timestamp (chronological order - oldest to newest)
  const aggregated = uniqueEntries
    .sort((a, b) => a.timestamp - b.timestamp)
    .map(({ date, rating }) => ({ date, rating }));

  return aggregated;
}

/**
 * Aggregates contest stats from multiple accounts for the same platform
 */
function aggregatePlatformContestStats(
  stats: Array<{
    currentRating: number;
    highestRating: number;
    totalContests: number;
    ratingHistory: Array<{ date: string; rating: number }>;
  }>
): {
  currentRating: number;
  highestRating: number;
  totalContests: number;
  ratingHistory: Array<{ date: string; rating: number }>;
} {
  if (stats.length === 0) {
    return {
      currentRating: 0,
      highestRating: 0,
      totalContests: 0,
      ratingHistory: [],
    };
  }

  // Aggregate rating history (combine all contests chronologically)
  const ratingHistories = stats.map(s => s.ratingHistory || []);
  const aggregatedHistory = aggregateRatingHistory(ratingHistories);

  // Get the latest rating from aggregated history (most recent contest)
  const currentRating = aggregatedHistory.length > 0
    ? aggregatedHistory[aggregatedHistory.length - 1].rating
    : Math.max(...stats.map(s => s.currentRating || 0));

  // Get highest rating across all accounts
  const highestRating = Math.max(
    ...stats.map(s => s.highestRating || 0),
    ...aggregatedHistory.map(h => h.rating)
  );

  // Total contests = SUM of all contests from all accounts (main + sub-accounts)
  // This gives: main_account_contests + sub_account_1_contests + sub_account_2_contests + ...
  const totalContests = stats.reduce((sum, s) => sum + (s.totalContests || 0), 0);

  return {
    currentRating,
    highestRating,
    totalContests,
    ratingHistory: aggregatedHistory,
  };
}

/**
 * Merges multiple scrape results into a single result
 * Handles aggregation of contest data from multiple accounts for the same platform
 */
export function mergeScrapeResults(results: Array<{ platform: string; data: { problemStats: ProblemStats; contestStats: ContestStats; badges: Badge[] } }>): ScrapeResult {
  if (results.length === 0) {
    return {
      problemStats: {
        total: 0,
        easy: 0,
        medium: 0,
        hard: 0,
        platformStats: {
          LeetCode: 0,
          CodeChef: 0,
          CodeForces: 0,
          GeeksforGeeks: 0,
          HackerRank: 0,
          CodeStudio: 0,
        },
        solvedOverTime: [],
      },
      contestStats: {
        leetcode: {
          currentRating: 0,
          highestRating: 0,
          totalContests: 0,
          ratingHistory: [],
        },
        codechef: {
          currentRating: 0,
          highestRating: 0,
          totalContests: 0,
          ratingHistory: [],
        },
        codeforces: {
          currentRating: 0,
          highestRating: 0,
          totalContests: 0,
          ratingHistory: [],
        },
      },
      badges: [],
    };
  }

  // Merge problem stats
  const mergedProblemStats: ProblemStats = {
    total: 0,
    easy: 0,
    medium: 0,
    hard: 0,
    platformStats: {
      LeetCode: 0,
      CodeChef: 0,
      CodeForces: 0,
      GeeksforGeeks: 0,
      HackerRank: 0,
      CodeStudio: 0,
    },
    solvedOverTime: [],
  };

  // Group results by platform for contest stats aggregation
  const platformGroups: {
    leetcode: Array<{ currentRating: number; highestRating: number; totalContests: number; ratingHistory: Array<{ date: string; rating: number }> }>;
    codechef: Array<{ currentRating: number; highestRating: number; totalContests: number; ratingHistory: Array<{ date: string; rating: number }> }>;
    codeforces: Array<{ currentRating: number; highestRating: number; totalContests: number; ratingHistory: Array<{ date: string; rating: number }> }>;
  } = {
    leetcode: [],
    codechef: [],
    codeforces: [],
  };

  const badges: Badge[] = [];

  for (const { platform, data } of results) {
    mergedProblemStats.total += data.problemStats.total;
    mergedProblemStats.easy += data.problemStats.easy;
    mergedProblemStats.medium += data.problemStats.medium;
    mergedProblemStats.hard += data.problemStats.hard;

    for (const p in data.problemStats.platformStats) {
      const key = p as CodingPlatform;
      mergedProblemStats.platformStats[key] += data.problemStats.platformStats[key] || 0;
    }

    // Group contest stats by platform for aggregation
    if (data.contestStats?.leetcode) {
      platformGroups.leetcode.push(data.contestStats.leetcode);
    }
    if (data.contestStats?.codechef) {
      platformGroups.codechef.push(data.contestStats.codechef);
    }
    if (data.contestStats?.codeforces) {
      platformGroups.codeforces.push(data.contestStats.codeforces);
    }

    badges.push(...data.badges);
  }

  // Aggregate contest stats for each platform
  const contestStats: ContestStats = {
    leetcode: aggregatePlatformContestStats(platformGroups.leetcode),
    codechef: aggregatePlatformContestStats(platformGroups.codechef),
    codeforces: aggregatePlatformContestStats(platformGroups.codeforces),
  };

  console.log(`[Merge] Contest stats - LeetCode: ${contestStats.leetcode?.totalContests || 0}, CodeChef: ${contestStats.codechef?.totalContests || 0}, CodeForces: ${contestStats.codeforces?.totalContests || 0}`);

  return {
    problemStats: mergedProblemStats,
    contestStats,
    badges,
  };
}










