import axios from "axios";
import type { ProblemStats, ContestStats, Badge, CodingPlatform } from "@shared/schema";

interface LeetCodeResponse {
  data: {
    matchedUser: {
      username: string;
      submitStatsGlobal?: {
        acSubmissionNum: Array<{
          difficulty: string;
          count: number;
          submissions: number;
        }>;
      };
      submitStats?: {
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
    } | null;
  };
}

export async function scrapeLeetCode(username: string): Promise<{
  problemStats: ProblemStats;
  contestStats: any;
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
            submissions
          }
        }
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
      }
      userContestRanking(username: $username) {
        attendedContestsCount
        rating
        globalRanking
        topPercentage
      }
      userContestRankingHistory(username: $username) {
        attended
        rating
        ranking
        trendDirection
        problemsSolved
        totalProblems
        finishTimeInSeconds
        contest {
          title
          startTime
        }
      }
    }
  `;

  try {
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
        timeout: 30000,
      }
    );

    if (!response.data || !response.data.data) {
      throw new Error(`Invalid response from LeetCode`);
    }

    const user = response.data.data.matchedUser;
    if (!user) {
      throw new Error(`LeetCode user ${username} not found`);
    }

    // Extract problem stats - try both submitStatsGlobal and submitStats
    const submissions = user.submitStatsGlobal?.acSubmissionNum || user.submitStats?.acSubmissionNum || [];
    
    // Try different case variations for difficulty
    const easy = submissions.find((s: any) => 
      s.difficulty === "Easy" || s.difficulty === "EASY" || s.difficulty === "easy"
    )?.count || 0;
    const medium = submissions.find((s: any) => 
      s.difficulty === "Medium" || s.difficulty === "MEDIUM" || s.difficulty === "medium"
    )?.count || 0;
    const hard = submissions.find((s: any) => 
      s.difficulty === "Hard" || s.difficulty === "HARD" || s.difficulty === "hard"
    )?.count || 0;
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
      solvedOverTime: [],
    };

    // Extract contest stats
    const contestRanking = (response.data.data as any).userContestRanking;
    const contestHistory = (response.data.data as any).userContestRankingHistory || [];
    
    const ratingHistory = contestHistory
      .filter((contest: any) => contest.attended && contest.rating)
      .map((contest: any) => ({
        date: new Date(contest.contest.startTime * 1000).toISOString(),
        rating: Math.round(contest.rating),
      }));
    
    const currentRating = contestRanking?.rating ? Math.round(contestRanking.rating) : 0;
    const highestRating = ratingHistory.length > 0 
      ? Math.max(...ratingHistory.map((h: any) => h.rating))
      : 0;
    const totalContests = contestRanking?.attendedContestsCount || 0;

    const contestStats = {
      leetcode: {
        currentRating,
        highestRating,
        totalContests,
        ratingHistory,
      }
    };

    // Extract badges based on problem solving achievements
    const badges: Badge[] = [];
    
    // Badges based on total problems solved
    if (total >= 1000) {
      badges.push({
        id: `leetcode-problem-solver-1000-${username}`,
        name: "Problem Solver 1000+",
        platform: "LeetCode",
        icon: "🏆",
        level: 5,
      });
    } else if (total >= 500) {
      badges.push({
        id: `leetcode-problem-solver-500-${username}`,
        name: "Problem Solver 500+",
        platform: "LeetCode",
        icon: "🥇",
        level: 4,
      });
    } else if (total >= 200) {
      badges.push({
        id: `leetcode-problem-solver-200-${username}`,
        name: "Problem Solver 200+",
        platform: "LeetCode",
        icon: "🥈",
        level: 3,
      });
    } else if (total >= 100) {
      badges.push({
        id: `leetcode-problem-solver-100-${username}`,
        name: "Problem Solver 100+",
        platform: "LeetCode",
        icon: "🥉",
        level: 2,
      });
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
    console.error(`[LC] ${username}: ${error.message}`);
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
        }
      },
      badges: [],
    };
  }
}






