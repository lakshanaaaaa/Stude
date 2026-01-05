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

  if (leetcodeUsername) {
    try {
      const leetcodeData = await scrapeLeetCode(leetcodeUsername);
      results.push({ platform: 'LeetCode', data: leetcodeData });
      await new Promise((resolve) => setTimeout(resolve, 3000));
    } catch (error: any) {
      console.error(`[LC] ${leetcodeUsername}: ${error.message}`);
    }
  }

  if (codechefUsername) {
    try {
      const codechefData = await scrapeCodeChef(codechefUsername);
      results.push({ platform: 'CodeChef', data: codechefData });
      await new Promise((resolve) => setTimeout(resolve, 3000));
    } catch (error: any) {
      console.error(`[CC] ${codechefUsername}: ${error.message}`);
    }
  }

  if (codeforcesUsername) {
    try {
      const codeforcesData = await scrapeCodeForces(codeforcesUsername);
      results.push({ platform: 'CodeForces', data: codeforcesData });
      await new Promise((resolve) => setTimeout(resolve, 3000));
    } catch (error: any) {
      console.error(`[CF] ${codeforcesUsername}: ${error.message}`);
    }
  }

  if (geeksforgeeksUsername) {
    try {
      const gfgData = await scrapeGeeksforGeeks(geeksforgeeksUsername);
      results.push({ platform: 'GeeksforGeeks', data: gfgData });
      await new Promise((resolve) => setTimeout(resolve, 3000));
    } catch (error: any) {
      console.error(`[GFG] ${geeksforgeeksUsername}: ${error.message}`);
    }
  }

  if (hackerrankUsername) {
    try {
      const hrData = await scrapeHackerRank(hackerrankUsername);
      results.push({ platform: 'HackerRank', data: hrData });
      await new Promise((resolve) => setTimeout(resolve, 3000));
    } catch (error: any) {
      console.error(`[HR] ${hackerrankUsername}: ${error.message}`);
    }
  }

  const merged = mergeScrapeResults(results);
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

  return {
    problemStats: mergedProblemStats,
    contestStats,
    badges,
  };
}









