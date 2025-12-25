import axios from "axios";
import type { ProblemStats, ContestStats, Badge, CodingPlatform } from "@shared/schema";

interface LeetCodeResponse {
  data: {
    matchedUser: {
      username: string;
      submitStats: {
        acSubmissionNum: Array<{
          difficulty: string;
          count: number;
          submissions: number;
        }>;
      };
      profile: {
        ranking: number;
        reputation: number;
      };
      userContestRanking: {
        attendedContestsCount: number;
        rating: number;
        globalRanking: number;
        totalParticipants: number;
      } | null;
      userContestRankingHistory: Array<{
        contest: {
          title: string;
          startTime: number;
        };
        rating: number;
        ranking: number;
      }>;
    };
  };
}

export async function scrapeLeetCode(username: string): Promise<{
  problemStats: ProblemStats;
  contestStats: ContestStats;
  badges: Badge[];
}> {
  const query = `
    query userPublicProfile($username: String!) {
      matchedUser(username: $username) {
        username
        submitStatsGlobal {
          acSubmissionNum {
            difficulty
            count
          }
        }
        profile {
          ranking
          reputation
        }
        userContestRanking {
          attendedContestsCount
          rating
          globalRanking
          topPercentage
        }
        userContestRankingHistory {
          attended
          rating
          ranking
          contest {
            title
            startTime
          }
        }
      }
    }
  `;

  try {
    console.log(`Fetching LeetCode data for: ${username}`);
    const response = await axios.post(
      "https://leetcode.com/graphql",
      {
        query,
        variables: { username },
        operationName: "userPublicProfile"
      },
      {
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Referer": `https://leetcode.com/${username}/`,
          "Origin": "https://leetcode.com"
        },
        timeout: 15000,
      }
    );

    console.log(`LeetCode response status: ${response.status}`);
    
    if (!response.data || !response.data.data) {
      console.error(`Invalid LeetCode response for ${username}:`, JSON.stringify(response.data).substring(0, 200));
      throw new Error(`Invalid response from LeetCode`);
    }

    const user = response.data.data.matchedUser;
    if (!user) {
      console.error(`LeetCode user ${username} not found`);
      throw new Error(`LeetCode user ${username} not found`);
    }

    console.log(`Successfully fetched LeetCode data for ${username}`);

    // Extract problem stats - try both submitStatsGlobal and submitStats
    const submissions = user.submitStatsGlobal?.acSubmissionNum || user.submitStats?.acSubmissionNum || [];
    const easy = submissions.find((s: any) => s.difficulty === "Easy")?.count || 0;
    const medium = submissions.find((s: any) => s.difficulty === "Medium")?.count || 0;
    const hard = submissions.find((s: any) => s.difficulty === "Hard")?.count || 0;
    const total = easy + medium + hard;

    console.log(`LeetCode problems - Total: ${total}, Easy: ${easy}, Medium: ${medium}, Hard: ${hard}`);

    const problemStats: ProblemStats = {
      total,
      easy,
      medium,
      hard,
      platformStats: {
        LeetCode: total,
        CodeChef: 0,
        CodeForces: 0,
        GeeksforGeeks: 0,
        HackerRank: 0,
        CodeStudio: 0,
      },
      solvedOverTime: [],
    };

    // Extract contest stats
    const contestRanking = user.userContestRanking;
    const ratingHistory = (user.userContestRankingHistory || []).filter((h: any) => h.attended);

    // Calculate highest rating from history
    let highestRating = contestRanking?.rating || 0;
    if (ratingHistory.length > 0) {
      highestRating = Math.max(...ratingHistory.map((h: any) => h.rating), highestRating);
    }

    const contestStats: ContestStats = {
      currentRating: Math.round(contestRanking?.rating || 0),
      highestRating: Math.round(highestRating),
      totalContests: contestRanking?.attendedContestsCount || 0,
      ratingHistory: ratingHistory.map((entry: any) => ({
        date: new Date(entry.contest.startTime * 1000).toISOString().split("T")[0],
        rating: Math.round(entry.rating),
        platform: "LeetCode" as CodingPlatform,
      })),
    };

    console.log(`LeetCode contests - Rating: ${contestStats.currentRating}, Contests: ${contestStats.totalContests}`);

    // Extract badges
    const badges: Badge[] = [];
    if (contestRanking?.rating) {
      if (contestRanking.rating >= 2400) {
        badges.push({
          id: `leetcode-grandmaster-${username}`,
          name: "Grandmaster",
          platform: "LeetCode",
          icon: "🏆",
          level: 5,
        });
      } else if (contestRanking.rating >= 2100) {
        badges.push({
          id: `leetcode-master-${username}`,
          name: "Master",
          platform: "LeetCode",
          icon: "🥇",
          level: 4,
        });
      } else if (contestRanking.rating >= 1800) {
        badges.push({
          id: `leetcode-expert-${username}`,
          name: "Expert",
          platform: "LeetCode",
          icon: "🥈",
          level: 3,
        });
      } else if (contestRanking.rating >= 1600) {
        badges.push({
          id: `leetcode-specialist-${username}`,
          name: "Specialist",
          platform: "LeetCode",
          icon: "🥉",
          level: 2,
        });
      }
    }

    if (user.profile?.reputation && user.profile.reputation >= 1000) {
      badges.push({
        id: `leetcode-reputation-${username}`,
        name: "High Reputation",
        platform: "LeetCode",
        icon: "⭐",
        level: 1,
      });
    }

    return { problemStats, contestStats, badges };
  } catch (error: any) {
    console.error(`Error scraping LeetCode for ${username}:`, error.message);
    if (error.response) {
      console.error(`LeetCode API response status: ${error.response.status}`);
      console.error(`LeetCode API response data:`, JSON.stringify(error.response.data).substring(0, 500));
    }
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





