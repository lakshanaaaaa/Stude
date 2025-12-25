import { scrapeLeetCode } from "./leetcode";
import { scrapeCodeChef } from "./codechef";
import { scrapeCodeForces } from "./codeforces";
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
  codeforcesUsername?: string
): Promise<ScrapeResult> {
  const results: ScrapeResult[] = [];

  console.log(`\n=== Starting scrapeStudentData ===`);
  console.log(`LeetCode: ${leetcodeUsername || 'N/A'}`);
  console.log(`CodeChef: ${codechefUsername || 'N/A'}`);
  console.log(`CodeForces: ${codeforcesUsername || 'N/A'}`);

  // Scrape LeetCode if username provided
  if (leetcodeUsername) {
    try {
      console.log(`\n[LeetCode] Starting scrape for: ${leetcodeUsername}`);
      const leetcodeData = await scrapeLeetCode(leetcodeUsername);
      console.log(`[LeetCode] Success - Problems: ${leetcodeData.problemStats.total}`);
      results.push(leetcodeData);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error: any) {
      console.error(`[LeetCode] Failed for ${leetcodeUsername}:`, error.message);
    }
  }

  // Scrape CodeChef if username provided
  if (codechefUsername) {
    try {
      console.log(`\n[CodeChef] Starting scrape for: ${codechefUsername}`);
      const codechefData = await scrapeCodeChef(codechefUsername);
      console.log(`[CodeChef] Success - Problems: ${codechefData.problemStats.total}`);
      results.push(codechefData);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error: any) {
      console.error(`[CodeChef] Failed for ${codechefUsername}:`, error.message);
    }
  }

  // Scrape CodeForces if username provided
  if (codeforcesUsername) {
    try {
      console.log(`\n[CodeForces] Starting scrape for: ${codeforcesUsername}`);
      const codeforcesData = await scrapeCodeForces(codeforcesUsername);
      console.log(`[CodeForces] Success - Problems: ${codeforcesData.problemStats.total}`);
      results.push(codeforcesData);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error: any) {
      console.error(`[CodeForces] Failed for ${codeforcesUsername}:`, error.message);
    }
  }

  console.log(`\n[Merge] Merging ${results.length} results...`);
  const merged = mergeScrapeResults(results);
  console.log(`[Merge] Final totals - Problems: ${merged.problemStats.total}, Rating: ${merged.contestStats.currentRating}`);
  console.log(`=== scrapeStudentData complete ===\n`);

  return merged;
}

/**
 * Merges multiple scrape results into a single result
 */
function mergeScrapeResults(results: ScrapeResult[]): ScrapeResult {
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
        currentRating: 0,
        highestRating: 0,
        totalContests: 0,
        ratingHistory: [],
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

  // Merge contest stats
  let highestRating = 0;
  let totalContests = 0;
  const ratingHistory: ContestStats["ratingHistory"] = [];

  // Merge badges
  const badges: Badge[] = [];

  for (const result of results) {
    // Merge problem stats
    mergedProblemStats.total += result.problemStats.total;
    mergedProblemStats.easy += result.problemStats.easy;
    mergedProblemStats.medium += result.problemStats.medium;
    mergedProblemStats.hard += result.problemStats.hard;

    // Merge platform stats
    for (const platform in result.problemStats.platformStats) {
      const key = platform as CodingPlatform;
      mergedProblemStats.platformStats[key] += result.problemStats.platformStats[key] || 0;
    }

    // Merge contest stats
    if (result.contestStats.highestRating > highestRating) {
      highestRating = result.contestStats.highestRating;
    }
    totalContests += result.contestStats.totalContests;
    ratingHistory.push(...result.contestStats.ratingHistory);

    // Merge badges
    badges.push(...result.badges);
  }

  // Get current rating from the most recent rating history entry
  const sortedHistory = ratingHistory.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const currentRating = sortedHistory[0]?.rating || 0;

  const mergedContestStats: ContestStats = {
    currentRating,
    highestRating,
    totalContests,
    ratingHistory: sortedHistory,
  };

  return {
    problemStats: mergedProblemStats,
    contestStats: mergedContestStats,
    badges,
  };
}





