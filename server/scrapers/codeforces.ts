import axios from "axios";
import type { ProblemStats, ContestStats, Badge, CodingPlatform } from "@shared/schema";

interface CodeforcesUser {
  handle: string;
  rating?: number;
  maxRating?: number;
  rank?: string;
  maxRank?: string;
}

interface CodeforcesRatingChange {
  contestId: number;
  contestName: string;
  handle: string;
  rank: number;
  ratingUpdateTimeSeconds: number;
  oldRating: number;
  newRating: number;
}

export async function scrapeCodeForces(username: string): Promise<{
  problemStats: ProblemStats;
  contestStats: { currentRating: number; highestRating: number; totalContests: number; ratingHistory: { date: string; rating: number; platform: CodingPlatform }[] };
  badges: Badge[];
}> {
  try {
    console.log(`[CodeForces] Fetching data for: ${username}`);
    
    const userInfo = await axios.get(`https://codeforces.com/api/user.info?handles=${username}`, { timeout: 10000 });
    
    if (userInfo.data.status !== "OK") {
      throw new Error(`Codeforces user ${username} not found`);
    }

    const user: CodeforcesUser = userInfo.data.result[0];
    console.log(`[CodeForces] User found: ${user.handle}, Rating: ${user.rating || 0}`);

    const [ratingHistory, submissions] = await Promise.all([
      axios.get(`https://codeforces.com/api/user.rating?handle=${username}`, { timeout: 10000 }).catch(() => ({ data: { result: [] } })),
      axios.get(`https://codeforces.com/api/user.status?handle=${username}&from=1&count=10000`, { timeout: 10000 }).catch(() => ({ data: { result: [] } })),
    ]);

    const ratings: CodeforcesRatingChange[] = ratingHistory.data.result || [];
    const submissionList = submissions.data.result || [];

    const solvedProblems = new Set<string>();
    submissionList.forEach((sub: any) => {
      if (sub.verdict === "OK" && sub.problem) {
        solvedProblems.add(`${sub.problem.contestId}-${sub.problem.index}`);
      }
    });

    const totalSolved = solvedProblems.size;
    console.log(`[CodeForces] Problems solved: ${totalSolved}`);

    const problemStats: ProblemStats = {
      total: totalSolved,
      easy: 0,
      medium: 0,
      hard: 0,
      platformStats: {
        LeetCode: 0,
        CodeChef: 0,
        CodeForces: totalSolved,
        GeeksforGeeks: 0,
        HackerRank: 0,
        CodeStudio: 0,
      },
      solvedOverTime: [],
    };

    const currentRating = user.rating || 0;
    const highestRating = user.maxRating || currentRating;
    const totalContests = ratings.length;

    const contestStats = {
      codeforces: {
        currentRating,
        highestRating,
        totalContests,
        ratingHistory: ratings.map(entry => ({
          date: new Date(entry.ratingUpdateTimeSeconds * 1000).toISOString().split("T")[0],
          rating: entry.newRating,
        })),
      }
    };

    const badges: Badge[] = [];
    const rank = user.maxRank || user.rank || "";
    
    if (rank.includes("legendary") || rank.includes("grandmaster")) {
      badges.push({ id: `codeforces-lgm-${username}`, name: "Legendary Grandmaster", platform: "CodeForces", icon: "👑", level: 7 });
    } else if (rank.includes("international grandmaster")) {
      badges.push({ id: `codeforces-igm-${username}`, name: "International Grandmaster", platform: "CodeForces", icon: "🏆", level: 6 });
    } else if (rank.includes("grandmaster")) {
      badges.push({ id: `codeforces-gm-${username}`, name: "Grandmaster", platform: "CodeForces", icon: "🥇", level: 5 });
    } else if (rank.includes("master")) {
      badges.push({ id: `codeforces-master-${username}`, name: "Master", platform: "CodeForces", icon: "🥈", level: 4 });
    } else if (rank.includes("candidate master")) {
      badges.push({ id: `codeforces-cm-${username}`, name: "Candidate Master", platform: "CodeForces", icon: "🥉", level: 3 });
    } else if (rank.includes("expert")) {
      badges.push({ id: `codeforces-expert-${username}`, name: "Expert", platform: "CodeForces", icon: "⭐", level: 2 });
    } else if (rank.includes("specialist")) {
      badges.push({ id: `codeforces-specialist-${username}`, name: "Specialist", platform: "CodeForces", icon: "⭐", level: 1 });
    }

    console.log(`[CodeForces] Success - Problems: ${totalSolved}, Rating: ${currentRating}`);
    return { problemStats, contestStats, badges };
  } catch (error: any) {
    console.error(`[CodeForces] Error for ${username}:`, error.message);
    if (error.response) {
      console.error(`[CodeForces] API Response:`, error.response.data);
    }
    return {
      problemStats: {
        total: 0,
        easy: 0,
        medium: 0,
        hard: 0,
        platformStats: { LeetCode: 0, CodeChef: 0, CodeForces: 0, GeeksforGeeks: 0, HackerRank: 0, CodeStudio: 0 },
        solvedOverTime: [],
      },
      contestStats: { 
        codeforces: {
          currentRating: 0, 
          highestRating: 0, 
          totalContests: 0, 
          ratingHistory: [] 
        }
      },
      badges: [],
    };
  }
}
