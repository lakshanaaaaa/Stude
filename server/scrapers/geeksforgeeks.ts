import axios from "axios";
import * as cheerio from "cheerio";
import type { ProblemStats, ContestStats, Badge } from "@shared/schema";

export async function scrapeGeeksforGeeks(username: string): Promise<{
  problemStats: ProblemStats;
  contestStats: { currentRating: number; highestRating: number; totalContests: number; ratingHistory: { date: string; rating: number; platform: CodingPlatform }[] };
  badges: Badge[];
}> {
  try {
    const profileUrl = `https://www.geeksforgeeks.org/user/${username}/`;
    const response = await axios.get(profileUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);

    let totalSolved = 0;
    
    $('.score_card_value, .scoreCard_head_left--score__oSi_x, .problemNavbar_head--score__pWZV8').each((_, elem) => {
      const text = $(elem).text().trim();
      const match = text.match(/^(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > totalSolved && num < 10000) {
          totalSolved = num;
        }
      }
    });

    if (totalSolved === 0) {
      $('div, span, h3').each((_, elem) => {
        const text = $(elem).text();
        if (text.includes('Coding Score') || text.includes('Overall Coding Score')) {
          const match = text.match(/(\d+)/);
          if (match && parseInt(match[1], 10) > 0 && parseInt(match[1], 10) < 10000) {
            totalSolved = parseInt(match[1], 10);
            return false;
          }
        }
      });
    }

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
          GeeksforGeeks: totalSolved,
          HackerRank: 0,
          CodeStudio: 0,
        },
        solvedOverTime: [],
      },
      contestStats: { currentRating: 0, highestRating: 0, totalContests: 0, ratingHistory: [] },
      badges: [],
    };
  } catch (error: any) {
    console.error(`[GFG] ${username}: ${error.message}`);
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
