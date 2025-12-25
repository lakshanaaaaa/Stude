import axios from "axios";
import * as cheerio from "cheerio";
import type { ProblemStats, ContestStats, Badge, CodingPlatform } from "@shared/schema";

export async function scrapeCodeChef(username: string): Promise<{
  problemStats: ProblemStats;
  contestStats: ContestStats;
  badges: Badge[];
}> {
  try {
    // Scrape CodeChef profile page
    const profileUrl = `https://www.codechef.com/users/${username}`;
    const response = await axios.get(profileUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);

    // Extract problem stats
    let totalSolved = 0;
    let easy = 0;
    let medium = 0;
    let hard = 0;

    // CodeChef shows problems solved in different sections
    const solvedProblems = $(".problems-solved").find("h5").text();
    const match = solvedProblems.match(/(\d+)/);
    if (match) {
      totalSolved = parseInt(match[1], 10);
    }

    // Try to get difficulty breakdown (CodeChef structure may vary)
    const problemStats: ProblemStats = {
      total: totalSolved,
      easy: easy,
      medium: medium,
      hard: hard,
      platformStats: {
        LeetCode: 0,
        CodeChef: totalSolved,
        CodeForces: 0,
        GeeksforGeeks: 0,
        HackerRank: 0,
        CodeStudio: 0,
      },
      solvedOverTime: [],
    };

    // Extract contest rating
    let currentRating = 0;
    let highestRating = 0;
    let totalContests = 0;

    // CodeChef rating is usually in a specific div
    const ratingText = $(".rating-number").text().trim();
    if (ratingText) {
      currentRating = parseInt(ratingText.replace(/,/g, ""), 10) || 0;
    }

    // Get highest rating
    const highestRatingText = $(".rating-header__text").find("small").text();
    const highestMatch = highestRatingText.match(/(\d+)/);
    if (highestMatch) {
      highestRating = parseInt(highestMatch[1], 10);
    } else {
      highestRating = currentRating;
    }

    // Get contest count
    const contestCountText = $(".contest-participated-count").text();
    const contestMatch = contestCountText.match(/(\d+)/);
    if (contestMatch) {
      totalContests = parseInt(contestMatch[1], 10);
    }

    // Extract rating history (if available in the page)
    const ratingHistory: ContestStats["ratingHistory"] = [];
    // CodeChef may have rating history in a script tag or API call
    // For now, we'll create a basic entry
    if (currentRating > 0) {
      ratingHistory.push({
        date: new Date().toISOString().split("T")[0],
        rating: currentRating,
        platform: "CodeChef" as CodingPlatform,
      });
    }

    const contestStats: ContestStats = {
      currentRating,
      highestRating,
      totalContests,
      ratingHistory,
    };

    // Extract badges based on rating
    const badges: Badge[] = [];
    if (currentRating >= 2500) {
      badges.push({
        id: `codechef-7star-${username}`,
        name: "7 Star",
        platform: "CodeChef",
        icon: "⭐",
        level: 7,
      });
    } else if (currentRating >= 2200) {
      badges.push({
        id: `codechef-6star-${username}`,
        name: "6 Star",
        platform: "CodeChef",
        icon: "⭐",
        level: 6,
      });
    } else if (currentRating >= 2000) {
      badges.push({
        id: `codechef-5star-${username}`,
        name: "5 Star",
        platform: "CodeChef",
        icon: "⭐",
        level: 5,
      });
    } else if (currentRating >= 1800) {
      badges.push({
        id: `codechef-4star-${username}`,
        name: "4 Star",
        platform: "CodeChef",
        icon: "⭐",
        level: 4,
      });
    } else if (currentRating >= 1600) {
      badges.push({
        id: `codechef-3star-${username}`,
        name: "3 Star",
        platform: "CodeChef",
        icon: "⭐",
        level: 3,
      });
    } else if (currentRating >= 1400) {
      badges.push({
        id: `codechef-2star-${username}`,
        name: "2 Star",
        platform: "CodeChef",
        icon: "⭐",
        level: 2,
      });
    } else if (currentRating >= 1200) {
      badges.push({
        id: `codechef-1star-${username}`,
        name: "1 Star",
        platform: "CodeChef",
        icon: "⭐",
        level: 1,
      });
    }

    return { problemStats, contestStats, badges };
  } catch (error: any) {
    console.error(`Error scraping CodeChef for ${username}:`, error.message);
    // Return empty stats on error
    return {
      problemStats: {
        total: 0,
        easy: 0,
        medium: 0,
        hard: 0,
        platformStats: {},
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
}





