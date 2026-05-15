import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Brain, Target, Activity, Code, TrendingUp } from "lucide-react";

interface SkillVector {
  [skill: string]: number;
}

interface PerformanceMetrics {
  problemSolvingScore: number;
  contestScore: number;
  difficultyScore: {
    easy: number;
    medium: number;
    hard: number;
  };
}

interface ActivityMetrics {
  recentActivityScore: number;
  problemsLast7Days: number;
  ratingGrowth: number;
}

interface ProjectMetrics {
  projectCount: number;
  relevantTech: string[];
  projectStrengthScore: number;
}

interface EnhancedAnalytics {
  studentId: string;
  normalizedSkills: string[];
  skillVector: SkillVector;
  performanceMetrics: PerformanceMetrics;
  activityMetrics: ActivityMetrics;
  projectMetrics: ProjectMetrics;
}

interface EnhancedAnalyticsCardProps {
  username: string;
  canRefresh?: boolean;
}

export function EnhancedAnalyticsCard({ username, canRefresh = false }: EnhancedAnalyticsCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: analytics, isLoading } = useQuery<EnhancedAnalytics>({
    queryKey: [`/api/student/${username}/enhanced-analytics`],
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/student/${username}/refresh-enhanced-analytics`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to refresh enhanced analytics");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/student/${username}/enhanced-analytics`] });
      toast({
        title: "Success",
        description: "Enhanced analytics refreshed successfully!",
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

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Brain className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground mb-4">Enhanced analytics not available</p>
          {canRefresh && (
            <Button
              onClick={() => refreshMutation.mutate()}
              disabled={refreshMutation.isPending}
              size="sm"
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
              Generate Analytics
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Brain className="w-5 h-5" />
          Enhanced Analytics
        </h3>
        {canRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Skill Vector */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="w-5 h-5" />
              Skill Proficiency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(analytics.skillVector).length > 0 ? (
                Object.entries(analytics.skillVector)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 6)
                  .map(([skill, score]) => (
                    <div key={skill} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{skill}</span>
                        <Badge variant={getScoreBadgeVariant(score)}>
                          {score}%
                        </Badge>
                      </div>
                      <Progress value={score} className="h-2" />
                    </div>
                  ))
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No skill proficiency data available
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getScoreColor(analytics.performanceMetrics.problemSolvingScore)}`}>
                    {analytics.performanceMetrics.problemSolvingScore}
                  </div>
                  <div className="text-xs text-muted-foreground">Problem Solving</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getScoreColor(analytics.performanceMetrics.contestScore)}`}>
                    {analytics.performanceMetrics.contestScore}
                  </div>
                  <div className="text-xs text-muted-foreground">Contest Score</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Difficulty Breakdown</h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <Badge variant="outline" className="text-green-600">
                      Easy: {analytics.performanceMetrics.difficultyScore.easy}
                    </Badge>
                  </div>
                  <div>
                    <Badge variant="outline" className="text-yellow-600">
                      Medium: {analytics.performanceMetrics.difficultyScore.medium}
                    </Badge>
                  </div>
                  <div>
                    <Badge variant="outline" className="text-red-600">
                      Hard: {analytics.performanceMetrics.difficultyScore.hard}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Activity Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className={`text-3xl font-bold ${getScoreColor(analytics.activityMetrics.recentActivityScore)}`}>
                  {analytics.activityMetrics.recentActivityScore}
                </div>
                <div className="text-sm text-muted-foreground">Activity Score</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-lg font-semibold text-primary">
                    {analytics.activityMetrics.problemsLast7Days}
                  </div>
                  <div className="text-xs text-muted-foreground">Problems (7 days)</div>
                </div>
                <div>
                  <div className={`text-lg font-semibold ${analytics.activityMetrics.ratingGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {analytics.activityMetrics.ratingGrowth >= 0 ? '+' : ''}{analytics.activityMetrics.ratingGrowth}
                  </div>
                  <div className="text-xs text-muted-foreground">Rating Growth</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Project Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Project Portfolio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {analytics.projectMetrics.projectCount}
                  </div>
                  <div className="text-sm text-muted-foreground">Projects</div>
                </div>
                <div>
                  <div className={`text-2xl font-bold ${getScoreColor(analytics.projectMetrics.projectStrengthScore)}`}>
                    {analytics.projectMetrics.projectStrengthScore}
                  </div>
                  <div className="text-sm text-muted-foreground">Strength Score</div>
                </div>
              </div>
              
              {analytics.projectMetrics.relevantTech.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Technologies Used</h4>
                  <div className="flex flex-wrap gap-1">
                    {analytics.projectMetrics.relevantTech.slice(0, 8).map((tech) => (
                      <Badge key={tech} variant="secondary" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                    {analytics.projectMetrics.relevantTech.length > 8 && (
                      <Badge variant="outline" className="text-xs">
                        +{analytics.projectMetrics.relevantTech.length - 8} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Skills Summary */}
      {analytics.normalizedSkills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Normalized Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {analytics.normalizedSkills.map((skill) => (
                <Badge key={skill} variant="outline">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}