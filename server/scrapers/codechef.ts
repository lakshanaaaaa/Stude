import axios from "axios";
import * as cheerio from "cheerio";
import type { ProblemStats, ContestStats, Badge, CodingPlatform } from "@shared/schema";

export async function scrapeCodeChef(username: string): Promise<{
  problemStats: ProblemStats;
  contestStats: any;
  badges: Badge[];
}> {
  try {
    const profileUrl = `https://www.codechef.com/users/${username}`;
    const response = await axios.get(profileUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      timeout: 30000,
    });

    const $ = cheerio.load(response.data);
    console.log(`[CodeChef] Fetching data for: ${username}`);

    let totalSolved = 0;
    
    // Extract from the problems solved section
    $('section.problems-solved h3').each((_, elem) => {
      const text = $(elem).text();
      const match = text.match(/Total Problems Solved:\s*(\d+)/i);
      if (match) {
        totalSolved = parseInt(match[1], 10);
        return false;
      }
    });

    console.log(`[CodeChef] Problems solved: ${totalSolved}`);

    const problemStats: ProblemStats = {
      total: totalSolved,
      easy: 0,
      medium: 0,
      hard: 0,
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

    let currentRating = 0;
    let highestRating = 0;
    const ratingText = $('.rating-number').text().trim();
    if (ratingText) {
      currentRating = parseInt(ratingText.replace(/,/g, ""), 10) || 0;
    }

    // Try to get highest rating
    $('.rating-header').each((_, elem) => {
      const text = $(elem).text();
      const match = text.match(/Highest Rating\s*(\d+)/i);
      if (match) {
        highestRating = parseInt(match[1], 10);
        return false;
      }
    });

    if (highestRating === 0) highestRating = currentRating;

    // Fetch rating graph data
    let ratingHistory: Array<{ date: string; rating: number }> = [];
    try {
      // Try to extract rating data from the page itself
      const scriptTags = $('script').toArray();
      for (const script of scriptTags) {
        const scriptContent = $(script).html() || '';
        if (scriptContent.includes('all_rating')) {
          const match = scriptContent.match(/all_rating\s*=\s*(\[.*?\]);/s);
          if (match) {
            const ratingData = JSON.parse(match[1]);
            ratingHistory = ratingData.map((entry: any) => ({
              date: entry.end_date,
              rating: parseInt(entry.rating, 10),
            }));
            console.log(`[CodeChef] Extracted ${ratingHistory.length} rating entries from page`);
            break;
          }
        }
      }
    } catch (parseError) {
      console.log(`[CodeChef] Failed to parse rating data from page`);
    }

    // If no data from page, use current rating as single point
    if (ratingHistory.length === 0 && currentRating > 0) {
      ratingHistory = [{
        date: new Date().toISOString().split("T")[0],
        rating: currentRating,
      }];
    }

    const contestStats: any = {
      currentRating,
      highestRating,
      totalContests: ratingHistory.length,
      ratingHistory,
    };

    console.log(`[CodeChef] Rating: ${currentRating}, Contests: ${ratingHistory.length}`);

    const badges: Badge[] = [];
    if (currentRating >= 2500) badges.push({ id: `codechef-7star-${username}`, name: "7 Star", platform: "CodeChef", icon: "⭐", level: 7 });
    else if (currentRating >= 2200) badges.push({ id: `codechef-6star-${username}`, name: "6 Star", platform: "CodeChef", icon: "⭐", level: 6 });
    else if (currentRating >= 2000) badges.push({ id: `codechef-5star-${username}`, name: "5 Star", platform: "CodeChef", icon: "⭐", level: 5 });
    else if (currentRating >= 1800) badges.push({ id: `codechef-4star-${username}`, name: "4 Star", platform: "CodeChef", icon: "⭐", level: 4 });
    else if (currentRating >= 1600) badges.push({ id: `codechef-3star-${username}`, name: "3 Star", platform: "CodeChef", icon: "⭐", level: 3 });
    else if (currentRating >= 1400) badges.push({ id: `codechef-2star-${username}`, name: "2 Star", platform: "CodeChef", icon: "⭐", level: 2 });
    else if (currentRating >= 1200) badges.push({ id: `codechef-1star-${username}`, name: "1 Star", platform: "CodeChef", icon: "⭐", level: 1 });

    return { problemStats, contestStats, badges };
  } catch (error: any) {
    console.error(`Error scraping CodeChef for ${username}:`, error.message);
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