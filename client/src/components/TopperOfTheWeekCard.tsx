import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, Target, Calendar, Flame, Award } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
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

export function TopperOfTheWeekCard() {
  const { data, isLoading, error } = useQuery<{ topper: WeeklyMetrics | null; message?: string }>({
    queryKey: ["/api/topper-of-the-week"],
    refetchInterval: 60 * 60 * 1000, // Refresh every hour
  });

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-yellow-500/10 via-orange-500/10 to-red-500/10 border-yellow-500/20">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-gradient-to-br from-yellow-500/10 via-orange-500/10 to-red-500/10 border-yellow-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Topper of the Week
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Failed to load topper data</p>
        </CardContent>
      </Card>
    );
  }

  const topper = data?.topper;

  if (!topper) {
    return (
      <Card className="bg-gradient-to-br from-yellow-500/10 via-orange-500/10 to-red-500/10 border-yellow-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Topper of the Week
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-8">
            <Trophy className="w-16 h-16 mx-auto text-yellow-500/30 mb-4" />
            <p className="text-sm text-muted-foreground mb-2">
              {data?.message || "No eligible students yet"}
            </p>
            <div className="text-xs text-muted-foreground space-y-1 mt-4">
              <p>To be eligible, you need:</p>
              <p>• At least 5 weighted problems solved</p>
              <p>• Active for at least 3 days</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-yellow-500/10 via-orange-500/10 to-red-500/10 border-yellow-500/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-500" />
          Topper of the Week
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Based on last 7 days of activity
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Student Info */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
            {topper.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold">{topper.name}</h3>
            <p className="text-sm text-muted-foreground">
              @{topper.username} • {topper.dept}
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 justify-end">
              <Award className="w-5 h-5 text-yellow-500" />
              <span className="text-2xl font-bold text-yellow-500">
                {Math.round(topper.weeklyImpactScore)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Impact Score</p>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Problems Solved */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Target className="w-3 h-3" />
              <span className="text-xs">Problems</span>
            </div>
            <div className="space-y-0.5">
              <p className="text-lg font-bold">
                {topper.weeklyProblems.leetcode + 
                 topper.weeklyProblems.codechef + 
                 topper.weeklyProblems.codeforces}
              </p>
              <div className="flex gap-1 text-[10px]">
                {topper.weeklyProblems.codeforces > 0 && (
                  <Badge variant="secondary" className="px-1 py-0 h-4">
                    CF: {topper.weeklyProblems.codeforces}
                  </Badge>
                )}
                {topper.weeklyProblems.leetcode > 0 && (
                  <Badge variant="secondary" className="px-1 py-0 h-4">
                    LC: {topper.weeklyProblems.leetcode}
                  </Badge>
                )}
                {topper.weeklyProblems.codechef > 0 && (
                  <Badge variant="secondary" className="px-1 py-0 h-4">
                    CC: {topper.weeklyProblems.codechef}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Rating Improvement */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <TrendingUp className="w-3 h-3" />
              <span className="text-xs">Rating +</span>
            </div>
            <p className="text-lg font-bold text-green-500">
              +{topper.ratingDelta.total}
            </p>
            <div className="flex gap-1 text-[10px]">
              {topper.ratingDelta.codeforces > 0 && (
                <Badge variant="secondary" className="px-1 py-0 h-4">
                  CF: +{topper.ratingDelta.codeforces}
                </Badge>
              )}
              {topper.ratingDelta.leetcode > 0 && (
                <Badge variant="secondary" className="px-1 py-0 h-4">
                  LC: +{topper.ratingDelta.leetcode}
                </Badge>
              )}
              {topper.ratingDelta.codechef > 0 && (
                <Badge variant="secondary" className="px-1 py-0 h-4">
                  CC: +{topper.ratingDelta.codechef}
                </Badge>
              )}
            </div>
          </div>

          {/* Contests */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Trophy className="w-3 h-3" />
              <span className="text-xs">Contests</span>
            </div>
            <p className="text-lg font-bold">
              {topper.contestsThisWeek.leetcode + 
               topper.contestsThisWeek.codechef + 
               topper.contestsThisWeek.codeforces}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {topper.contestsThisWeek.points} pts
            </p>
          </div>

          {/* Active Days */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              {topper.hasStreakBonus ? (
                <Flame className="w-3 h-3 text-orange-500" />
              ) : (
                <Calendar className="w-3 h-3" />
              )}
              <span className="text-xs">Active Days</span>
            </div>
            <div className="flex items-center gap-1">
              <p className="text-lg font-bold">{topper.activeDays}/7</p>
              {topper.hasStreakBonus && (
                <Badge variant="destructive" className="px-1 py-0 h-4 text-[10px]">
                  🔥 Streak!
                </Badge>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground">
              +{topper.consistencyBonus} bonus
            </p>
          </div>
        </div>

        {/* Weighted Score Info */}
        <div className="pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground text-center">
            Weighted Score: {topper.weeklyProblems.weightedTotal.toFixed(1)} problems 
            (CF: 1.5x, LC: 1.2x, CC: 1.0x)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
