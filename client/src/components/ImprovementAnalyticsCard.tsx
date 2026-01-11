import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Users, Award, ChevronDown, ChevronUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface UserImprovementStatus {
  userId: string;
  username: string;
  name: string;
  hasImproved: boolean;
  platform: string;
  previousRating: number;
  currentRating: number;
  ratingChange: number;
}

interface ImprovementAnalytics {
  totalUsers: number;
  improvedUsers: number;
  notImprovedUsers: number;
  improvementPercentage: number;
  userDetails: UserImprovementStatus[];
  platformBreakdown: {
    leetcode: { improved: number; notImproved: number; total: number };
    codechef: { improved: number; notImproved: number; total: number };
    codeforces: { improved: number; notImproved: number; total: number };
  };
}

interface ImprovementAnalyticsCardProps {
  analytics: ImprovementAnalytics;
}

export function ImprovementAnalyticsCard({ analytics }: ImprovementAnalyticsCardProps) {
  const { totalUsers, improvedUsers, notImprovedUsers, improvementPercentage, platformBreakdown, userDetails } = analytics;
  const [showImproved, setShowImproved] = useState(false);
  const [showNotImproved, setShowNotImproved] = useState(false);

  // Group users by improvement status
  const improvedList = userDetails.filter(u => u.hasImproved);
  const notImprovedList = userDetails.filter(u => !u.hasImproved);

  // Get unique users (a user might appear multiple times for different platforms)
  const uniqueImprovedUsers = Array.from(
    new Map(improvedList.map(u => [u.userId, u])).values()
  );
  const uniqueNotImprovedUsers = Array.from(
    new Map(notImprovedList.map(u => [u.userId, u])).values()
  );

  if (totalUsers === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Award className="w-5 h-5 text-primary" />
            Contest Rating Improvement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No contest rating data available yet.</p>
            <p className="text-sm mt-2">Users need at least 2 contest participations to track improvement.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Award className="w-5 h-5 text-primary" />
          Contest Rating Improvement
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Based on latest vs previous contest ratings
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg bg-muted/50">
            <Users className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-2xl font-bold">{totalUsers}</p>
            <p className="text-xs text-muted-foreground">Total Users</p>
          </div>
          
          <div className="text-center p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <TrendingUp className="w-6 h-6 mx-auto mb-2 text-green-600" />
            <p className="text-2xl font-bold text-green-600">{improvedUsers}</p>
            <p className="text-xs text-muted-foreground">Improved</p>
          </div>
          
          <div className="text-center p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
            <TrendingDown className="w-6 h-6 mx-auto mb-2 text-orange-600" />
            <p className="text-2xl font-bold text-orange-600">{notImprovedUsers}</p>
            <p className="text-xs text-muted-foreground">Not Improved</p>
          </div>
        </div>

        {/* Improvement Percentage */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Improvement Rate</span>
            <span className="text-sm font-bold text-primary">{improvementPercentage}%</span>
          </div>
          <Progress value={improvementPercentage} className="h-3" />
          <p className="text-xs text-muted-foreground">
            {improvementPercentage >= 50 
              ? "Great! More than half of users are improving their ratings." 
              : "Keep practicing! Encourage more users to participate in contests."}
          </p>
        </div>

        {/* Platform Breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Platform Breakdown</h4>
          
          {/* LeetCode */}
          {platformBreakdown.leetcode.total > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium">LeetCode</span>
                <span className="text-xs text-muted-foreground">
                  {platformBreakdown.leetcode.improved}/{platformBreakdown.leetcode.total} improved
                </span>
              </div>
              <div className="flex gap-2">
                <div 
                  className="h-2 bg-green-500 rounded-full" 
                  style={{ 
                    width: `${(platformBreakdown.leetcode.improved / platformBreakdown.leetcode.total) * 100}%` 
                  }}
                />
                <div 
                  className="h-2 bg-orange-500 rounded-full flex-1"
                  style={{ 
                    width: `${(platformBreakdown.leetcode.notImproved / platformBreakdown.leetcode.total) * 100}%` 
                  }}
                />
              </div>
            </div>
          )}

          {/* CodeChef */}
          {platformBreakdown.codechef.total > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium">CodeChef</span>
                <span className="text-xs text-muted-foreground">
                  {platformBreakdown.codechef.improved}/{platformBreakdown.codechef.total} improved
                </span>
              </div>
              <div className="flex gap-2">
                <div 
                  className="h-2 bg-green-500 rounded-full" 
                  style={{ 
                    width: `${(platformBreakdown.codechef.improved / platformBreakdown.codechef.total) * 100}%` 
                  }}
                />
                <div 
                  className="h-2 bg-orange-500 rounded-full flex-1"
                  style={{ 
                    width: `${(platformBreakdown.codechef.notImproved / platformBreakdown.codechef.total) * 100}%` 
                  }}
                />
              </div>
            </div>
          )}

          {/* CodeForces */}
          {platformBreakdown.codeforces.total > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium">CodeForces</span>
                <span className="text-xs text-muted-foreground">
                  {platformBreakdown.codeforces.improved}/{platformBreakdown.codeforces.total} improved
                </span>
              </div>
              <div className="flex gap-2">
                <div 
                  className="h-2 bg-green-500 rounded-full" 
                  style={{ 
                    width: `${(platformBreakdown.codeforces.improved / platformBreakdown.codeforces.total) * 100}%` 
                  }}
                />
                <div 
                  className="h-2 bg-orange-500 rounded-full flex-1"
                  style={{ 
                    width: `${(platformBreakdown.codeforces.notImproved / platformBreakdown.codeforces.total) * 100}%` 
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 text-xs pt-2 border-t">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <span className="text-muted-foreground">Improved</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full" />
            <span className="text-muted-foreground">Not Improved</span>
          </div>
        </div>

        {/* Student Lists */}
        <div className="space-y-3 pt-4 border-t">
          {/* Improved Students List */}
          <Collapsible open={showImproved} onOpenChange={setShowImproved}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full justify-between"
                size="sm"
              >
                <span className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="font-medium">Students Who Improved ({uniqueImprovedUsers.length})</span>
                </span>
                {showImproved ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              {uniqueImprovedUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No students have improved their ratings yet.
                </p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {uniqueImprovedUsers.map((user) => {
                    // Get all platform improvements for this user
                    const userPlatforms = improvedList.filter(u => u.userId === user.userId);
                    
                    return (
                      <div 
                        key={user.userId} 
                        className="flex items-center justify-between p-3 rounded-lg border bg-green-500/5 hover:bg-green-500/10 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{user.name}</p>
                          <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                        </div>
                        <div className="flex flex-wrap gap-1 justify-end">
                          {userPlatforms.map((platform, idx) => (
                            <Badge 
                              key={idx}
                              variant="secondary" 
                              className="text-[10px] px-1.5 py-0 h-5 bg-green-500/20 text-green-700 dark:text-green-400"
                            >
                              {platform.platform}: +{platform.ratingChange}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Not Improved Students List */}
          <Collapsible open={showNotImproved} onOpenChange={setShowNotImproved}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full justify-between"
                size="sm"
              >
                <span className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-orange-600" />
                  <span className="font-medium">Students Who Didn't Improve ({uniqueNotImprovedUsers.length})</span>
                </span>
                {showNotImproved ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              {uniqueNotImprovedUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  All students have improved their ratings!
                </p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {uniqueNotImprovedUsers.map((user) => {
                    // Get all platform data for this user
                    const userPlatforms = notImprovedList.filter(u => u.userId === user.userId);
                    
                    return (
                      <div 
                        key={user.userId} 
                        className="flex items-center justify-between p-3 rounded-lg border bg-orange-500/5 hover:bg-orange-500/10 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{user.name}</p>
                          <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                        </div>
                        <div className="flex flex-wrap gap-1 justify-end">
                          {userPlatforms.map((platform, idx) => (
                            <Badge 
                              key={idx}
                              variant="secondary" 
                              className="text-[10px] px-1.5 py-0 h-5 bg-orange-500/20 text-orange-700 dark:text-orange-400"
                            >
                              {platform.platform}: {platform.ratingChange}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </CardContent>
    </Card>
  );
}
