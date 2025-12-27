import axios from "axios";
import type { ProblemStats, ContestStats, Badge } from "@shared/schema";

export async function scrapeHackerRank(username: string): Promise<{
  problemStats: ProblemStats;
  contestStats: { currentRating: number; highestRating: number; totalContests: number; ratingHistory: { date: string; rating: number; platform: CodingPlatform }[] };
  badges: Badge[];
}> {
  try {
    const apiUrl = `https://www.hackerrank.com/rest/hackers/${username}/scores_elo`;
    const response = await axios.get(apiUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
      timeout: 10000,
    });

    console.log(`[HackerRank] Fetching data for: ${username}`);

    const data = response.data;
    let totalSolved = 0;

    if (data.models) {
      for (const model of data.models) {
        if (model.challenge_count) {
          totalSolved += model.challenge_count;
        }
      }
    }

    console.log(`[HackerRank] Problems solved: ${totalSolved}`);

    return {
      problemStats: {
        total: totalSolved,
        easy: 0,
        medium: 0,
        hard: 0,
        platformStats: {
          LeetCode: 0,
          CodeChef: 0,
          CodeForces: 0,
          GeeksforGeeks: 0,
          HackerRank: totalSolved,
          CodeStudio: 0,
        },
        solvedOverTime: [],
      },
      contestStats: { currentRating: 0, highestRating: 0, totalContests: 0, ratingHistory: [] },
      badges: [],
    };
  } catch (error: any) {
    console.error(`Error scraping HackerRank for ${username}:`, error.message);
    return {
      problemStats: {
        total: 0,
        easy: 0,
        medium: 0,
        hard: 0,
        platformStats: { LeetCode: 0, CodeChef: 0, CodeForces: 0, GeeksforGeeks: 0, HackerRank: 0, CodeStudio: 0 },
        solvedOverTime: [],
      },
      contestStats: { currentRating: 0, highestRating: 0, totalContests: 0, ratingHistory: [] },
      badges: [],
    };
  }
}
