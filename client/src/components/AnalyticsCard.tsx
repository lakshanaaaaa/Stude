import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, TrendingUp, Target, Activity, Award } from "lucide-react";
import type { WeeklyActivity, DerivedScores } from "@shared/schema";

interface AnalyticsCardProps {
  username: string;
  weeklyActivity?: WeeklyActivity;
  derivedScores?: DerivedScores;
  canRefresh: boolean;
}

export function AnalyticsCard({ username, weeklyActivity, derivedScores, canRefresh }: AnalyticsCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const refreshAnalyticsMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/student/${username}/refresh-analytics`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to refresh analytics");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/student", username] });
      toast({
        title: "Success",
        description: "Analytics refreshed successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    return "outline";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Weekly Activity Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {weeklyActivity ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {weeklyActivity.problemsSolved7Days}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Problems (7 days)
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {weeklyActivity.contestsAttended30Days}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Contests (30 days)
                  </div>
                </div>
                <div>
                  <div className={`text-2xl font-bold ${weeklyActivity.ratingGrowth30Days >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {weeklyActivity.ratingGrowth30Days >= 0 ? '+' : ''}{weeklyActivity.ratingGrowth30Days}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Rating Growth (30 days)
                  </div>
                </div>
              </div>
              
              {weeklyActivity.lastUpdated && (
                <p className="text-xs text-muted-foreground text-center">
                  Last updated: {new Date(weeklyActivity.lastUpdated).toLocaleDateString()}
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No activity data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Scores Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Performance Scores
            </div>
            {canRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => refreshAnalyticsMutation.mutate()}
                disabled={refreshAnalyticsMutation.isPending}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${refreshAnalyticsMutation.isPending ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {derivedScores ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className={`text-3xl font-bold ${getScoreColor(derivedScores.overallScore)}`}>
                    {derivedScores.overallScore}
                  </div>
                  <div className="text-sm text-muted-foreground">Overall Score</div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Problem Solving</span>
                    <Badge variant={getScoreBadgeVariant(derivedScores.problemSolvingScore)}>
                      {derivedScores.problemSolvingScore}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Contest Strength</span>
                    <Badge variant={getScoreBadgeVariant(derivedScores.contestStrengthScore)}>
                      {derivedScores.contestStrengthScore}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Consistency</span>
                    <Badge variant={getScoreBadgeVariant(derivedScores.consistencyScore)}>
                      {derivedScores.consistencyScore}
                    </Badge>
                  </div>
                </div>
              </div>
              
              {derivedScores.lastCalculated && (
                <p className="text-xs text-muted-foreground text-center">
                  Last calculated: {new Date(derivedScores.lastCalculated).toLocaleDateString()}
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Target className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No performance scores available</p>
              {canRefresh && (
                <Button
                  onClick={() => refreshAnalyticsMutation.mutate()}
                  disabled={refreshAnalyticsMutation.isPending}
                  size="sm"
                  className="gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshAnalyticsMutation.isPending ? 'animate-spin' : ''}`} />
                  Calculate Scores
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}