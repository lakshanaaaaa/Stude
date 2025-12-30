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
 * Merges multiple scrape results into a single result
 */
function mergeScrapeResults(results: Array<{ platform: string; data: { problemStats: ProblemStats; contestStats: ContestStats; badges: Badge[] } }>): ScrapeResult {
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

  // Initialize contest stats for each platform
  const contestStats: ContestStats = {
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

    // Merge contest stats from each platform
    if (data.contestStats?.leetcode) {
      contestStats.leetcode = data.contestStats.leetcode;
    }
    if (data.contestStats?.codechef) {
      contestStats.codechef = data.contestStats.codechef;
    }
    if (data.contestStats?.codeforces) {
      contestStats.codeforces = data.contestStats.codeforces;
    }

    badges.push(...data.badges);
  }

  console.log(`[Merge] Contest stats - LeetCode: ${contestStats.leetcode?.totalContests || 0}, CodeChef: ${contestStats.codechef?.totalContests || 0}, CodeForces: ${contestStats.codeforces?.totalContests || 0}`);

  return {
    problemStats: mergedProblemStats,
    contestStats,
    badges,
  };
}









