import { useQuery } from "@tanstack/react-query";
import { Trophy, TrendingUp, Target, Calendar, Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface WeeklyMetrics {
  studentId: string;
  username: string;
  name: string;
  dept: string;
  
  weeklyProblems: {
    leetcode: number;
    codechef: number;
    codeforces: number;
    weightedTotal: number;
  };
  
  ratingDelta: {
    leetcode: number;
    codechef: number;
    codeforces: number;
    total: number;
  };
  
  contestsThisWeek: {
    leetcode: number;
    codechef: number;
    codeforces: number;
    points: number;
  };
  
  activeDays: number;
  consistencyBonus: number;
  hasStreakBonus: boolean;
  
  weeklyImpactScore: number;
  meetsThreshold: boolean;
}

export function WeeklyLeaderboard() {
  const { data, isLoading } = useQuery<{ leaderboard: WeeklyMetrics[]; count: number }>({
    queryKey: ["/api/weekly-leaderboard"],
    refetchInterval: 60 * 60 * 1000, // Refresh every hour
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  const leaderboard = data?.leaderboard || [];

  if (leaderboard.length === 0) {
    return (
      <div className="text-center py-12">
        <Trophy className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
        <p className="text-sm text-muted-foreground">
          No eligible students yet. Start solving problems to appear here!
        </p>
        <div className="text-xs text-muted-foreground space-y-1 mt-4">
          <p>To be eligible, you need:</p>
          <p>• At least 5 weighted problems solved this week</p>
          <p>• Active for at least 3 days</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {leaderboard.map((student, index) => {
        const rank = index + 1;
        const totalProblems = 
          student.weeklyProblems.leetcode + 
          student.weeklyProblems.codechef + 
          student.weeklyProblems.codeforces;

        return (
          <div
            key={student.studentId}
            className="flex items-center gap-4 p-4 rounded-lg border bg-card/40 hover:bg-card/60 transition-colors"
          >
            {/* Rank Badge */}
            <div
              className={
                "w-12 h-12 flex items-center justify-center rounded-full font-bold text-lg " +
                (rank === 1
                  ? "bg-yellow-500/10 text-yellow-400 border-2 border-yellow-500/30"
                  : rank === 2
                  ? "bg-gray-400/10 text-gray-300 border-2 border-gray-400/30"
                  : rank === 3
                  ? "bg-amber-700/10 text-amber-400 border-2 border-amber-700/30"
                  : "bg-primary/10 text-primary")
              }
            >
              #{rank}
            </div>

            {/* Student Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold truncate">{student.name}</p>
                {student.hasStreakBonus && (
                  <Badge variant="destructive" className="px-1.5 py-0 h-5 text-[10px]">
                    <Flame className="w-3 h-3 mr-0.5" />
                    7-Day Streak
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                @{student.username} • {student.dept}
              </p>
              
              {/* Metrics Row */}
              <div className="flex items-center gap-3 mt-2 text-xs">
                <div className="flex items-center gap-1">
                  <Target className="w-3 h-3 text-muted-foreground" />
                  <span className="font-medium">{totalProblems}</span>
                  <span className="text-muted-foreground">problems</span>
                </div>
                
                {student.ratingDelta.total > 0 && (
                  <div className="flex items-center gap-1 text-green-500">
                    <TrendingUp className="w-3 h-3" />
                    <span className="font-medium">+{student.ratingDelta.total}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-muted-foreground" />
                  <span className="font-medium">{student.activeDays}</span>
                  <span className="text-muted-foreground">days</span>
                </div>
              </div>
            </div>

            {/* Impact Score */}
            <div className="text-right">
              <div className="flex items-center justify-end gap-1 mb-1">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span className="text-xl font-bold text-yellow-500">
                  {Math.round(student.weeklyImpactScore)}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground">Impact Score</p>
              
              {/* Platform Breakdown */}
              <div className="flex gap-1 mt-1 justify-end">
                {student.weeklyProblems.codeforces > 0 && (
                  <Badge variant="secondary" className="px-1 py-0 h-4 text-[9px]">
                    CF: {student.weeklyProblems.codeforces}
                  </Badge>
                )}
                {student.weeklyProblems.leetcode > 0 && (
                  <Badge variant="secondary" className="px-1 py-0 h-4 text-[9px]">
                    LC: {student.weeklyProblems.leetcode}
                  </Badge>
                )}
                {student.weeklyProblems.codechef > 0 && (
                  <Badge variant="secondary" className="px-1 py-0 h-4 text-[9px]">
                    CC: {student.weeklyProblems.codechef}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
