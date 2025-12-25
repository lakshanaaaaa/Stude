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
    query getUserProfile($username: String!) {
      matchedUser(username: $username) {
        username
        submitStats {
          acSubmissionNum {
            difficulty
            count
            submissions
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
          totalParticipants
        }
        userContestRankingHistory {
          contest {
            title
            startTime
          }
          rating
          ranking
        }
      }
    }
  `;

  try {
    const response = await axios.post<LeetCodeResponse>(
      "https://leetcode.com/graphql",
      {
        query,
        variables: { username },
      },
      {
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      }
    );

    const user = response.data.data?.matchedUser;
    if (!user) {
      throw new Error(`LeetCode user ${username} not found`);
    }

    // Extract problem stats
    const submissions = user.submitStats?.acSubmissionNum || [];
    const easy = submissions.find((s) => s.difficulty === "Easy")?.count || 0;
    const medium = submissions.find((s) => s.difficulty === "Medium")?.count || 0;
    const hard = submissions.find((s) => s.difficulty === "Hard")?.count || 0;
    const total = easy + medium + hard;

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
      solvedOverTime: [], // Can be populated from submission history if needed
    };

    // Extract contest stats
    const contestRanking = user.userContestRanking;
    const ratingHistory = user.userContestRankingHistory || [];

    const contestStats: ContestStats = {
      currentRating: contestRanking?.rating || 0,
      highestRating: contestRanking?.rating || 0, // LeetCode doesn't provide max rating separately
      totalContests: contestRanking?.attendedContestsCount || 0,
      ratingHistory: ratingHistory.map((entry) => ({
        date: new Date(entry.contest.startTime * 1000).toISOString().split("T")[0],
        rating: entry.rating,
        platform: "LeetCode" as CodingPlatform,
      })),
    };

    // Extract badges (LeetCode badges are based on achievements)
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





