import { scrapeLeetCode } from "./leetcode";
import { scrapeCodeChef } from "./codechef";
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
  codechefUsername?: string
): Promise<ScrapeResult> {
  const results: ScrapeResult[] = [];

  // Scrape LeetCode if username provided
  if (leetcodeUsername) {
    try {
      console.log(`Scraping LeetCode for: ${leetcodeUsername}`);
      const leetcodeData = await scrapeLeetCode(leetcodeUsername);
      results.push(leetcodeData);
      // Add delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`Failed to scrape LeetCode for ${leetcodeUsername}:`, error);
    }
  }

  // Scrape CodeChef if username provided
  if (codechefUsername) {
    try {
      console.log(`Scraping CodeChef for: ${codechefUsername}`);
      const codechefData = await scrapeCodeChef(codechefUsername);
      results.push(codechefData);
      // Add delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`Failed to scrape CodeChef for ${codechefUsername}:`, error);
    }
  }

  // Merge all results
  return mergeScrapeResults(results);
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





