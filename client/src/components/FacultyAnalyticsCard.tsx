import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Trophy, Users, ChevronDown, ChevronUp, Calendar, CalendarX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Link } from "wouter";

interface StudentImprovementStatus {
  userId: string;
  username: string;
  name: string;
  dept: string;
  hasImproved: boolean;
  platforms: {
    platform: string;
    previousRating: number;
    currentRating: number;
    ratingChange: number;
  }[];
}

interface StudentContestStatus {
  userId: string;
  username: string;
  name: string;
  dept: string;
  attendedLastContest: boolean;
  platforms: {
    platform: string;
    totalContests: number;
    lastContestDate?: string;
    daysSinceLastContest?: number;
  }[];
}

interface FacultyAnalytics {
  department: string;
  totalStudents: number;
  improvement: {
    improved: StudentImprovementStatus[];
    notImproved: StudentImprovementStatus[];
    improvedCount: number;
    notImprovedCount: number;
    improvementPercentage: number;
  };
  contestParticipation: {
    attendedLast: StudentContestStatus[];
    didNotAttendLast: StudentContestStatus[];
    attendedCount: number;
    didNotAttendCount: number;
    participationPercentage: number;
  };
}

interface FacultyAnalyticsCardProps {
  analytics: FacultyAnalytics;
}

export function FacultyAnalyticsCard({ analytics }: FacultyAnalyticsCardProps) {
  const [showImproved, setShowImproved] = useState(false);
  const [showNotImproved, setShowNotImproved] = useState(false);
  const [showAttended, setShowAttended] = useState(false);
  const [showNotAttended, setShowNotAttended] = useState(false);

  const { improvement, contestParticipation } = analytics;

  return (
    <div className="space-y-6">
      {/* Rating Improvement Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Rating Improvement Analytics
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Students who improved vs didn't improve their contest ratings
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <Users className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-2xl font-bold">{improvement.improvedCount + improvement.notImprovedCount}</p>
              <p className="text-xs text-muted-foreground">Students with Ratings</p>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <TrendingUp className="w-6 h-6 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold text-green-600">{improvement.improvedCount}</p>
              <p className="text-xs text-muted-foreground">Improved</p>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <TrendingDown className="w-6 h-6 mx-auto mb-2 text-orange-600" />
              <p className="text-2xl font-bold text-orange-600">{improvement.notImprovedCount}</p>
              <p className="text-xs text-muted-foreground">Not Improved</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Improvement Rate</span>
              <span className="text-sm font-bold text-primary">{improvement.improvementPercentage}%</span>
            </div>
            <Progress value={improvement.improvementPercentage} className="h-3" />
          </div>

          {/* Student Lists */}
          <div className="space-y-3 pt-4 border-t">
            {/* Improved Students */}
            <Collapsible open={showImproved} onOpenChange={setShowImproved}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between" size="sm">
                  <span className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="font-medium">Students Who Improved ({improvement.improvedCount})</span>
                  </span>
                  {showImproved ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3">
                {improvement.improved.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No students have improved yet.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {improvement.improved.map((student) => (
                      <Link key={student.userId} href={`/student/${student.username}`}>
                        <div className="flex items-center justify-between p-3 rounded-lg border bg-green-500/5 hover:bg-green-500/10 transition-colors cursor-pointer">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{student.name}</p>
                            <p className="text-xs text-muted-foreground truncate">@{student.username}</p>
                          </div>
                          <div className="flex flex-wrap gap-1 justify-end">
                            {student.platforms.map((platform, idx) => (
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
                      </Link>
                    ))}
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>

            {/* Not Improved Students */}
            <Collapsible open={showNotImproved} onOpenChange={setShowNotImproved}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between" size="sm">
                  <span className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-orange-600" />
                    <span className="font-medium">Students Who Didn't Improve ({improvement.notImprovedCount})</span>
                  </span>
                  {showNotImproved ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3">
                {improvement.notImproved.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    All students have improved!
                  </p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {improvement.notImproved.map((student) => (
                      <Link key={student.userId} href={`/student/${student.username}`}>
                        <div className="flex items-center justify-between p-3 rounded-lg border bg-orange-500/5 hover:bg-orange-500/10 transition-colors cursor-pointer">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{student.name}</p>
                            <p className="text-xs text-muted-foreground truncate">@{student.username}</p>
                          </div>
                          <div className="flex flex-wrap gap-1 justify-end">
                            {student.platforms.map((platform, idx) => (
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
                      </Link>
                    ))}
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          </div>
        </CardContent>
      </Card>

      {/* Contest Participation Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Contest Participation Analytics
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Students who attended vs didn't attend contests in last 30 days
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <Users className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-2xl font-bold">{contestParticipation.attendedCount + contestParticipation.didNotAttendCount}</p>
              <p className="text-xs text-muted-foreground">Students with Contest Data</p>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Calendar className="w-6 h-6 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold text-blue-600">{contestParticipation.attendedCount}</p>
              <p className="text-xs text-muted-foreground">Attended Recently</p>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <CalendarX className="w-6 h-6 mx-auto mb-2 text-red-600" />
              <p className="text-2xl font-bold text-red-600">{contestParticipation.didNotAttendCount}</p>
              <p className="text-xs text-muted-foreground">Didn't Attend</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Participation Rate</span>
              <span className="text-sm font-bold text-primary">{contestParticipation.participationPercentage}%</span>
            </div>
            <Progress value={contestParticipation.participationPercentage} className="h-3" />
          </div>

          {/* Student Lists */}
          <div className="space-y-3 pt-4 border-t">
            {/* Attended Students */}
            <Collapsible open={showAttended} onOpenChange={setShowAttended}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between" size="sm">
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span className="font-medium">Students Who Attended ({contestParticipation.attendedCount})</span>
                  </span>
                  {showAttended ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3">
                {contestParticipation.attendedLast.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No students attended contests recently.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {contestParticipation.attendedLast.map((student) => {
                      // Get the most recent contest across all platforms
                      const recentPlatforms = student.platforms.filter(p => p.lastContestDate);
                      const mostRecentDays = recentPlatforms.length > 0 
                        ? Math.min(...recentPlatforms.map(p => p.daysSinceLastContest || 999))
                        : null;

                      return (
                        <Link key={student.userId} href={`/student/${student.username}`}>
                          <div className="flex items-center justify-between p-3 rounded-lg border bg-blue-500/5 hover:bg-blue-500/10 transition-colors cursor-pointer">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{student.name}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                @{student.username}
                                {mostRecentDays !== null && (
                                  <span className="ml-2 text-blue-600">
                                    • {mostRecentDays === 0 ? 'Today' : mostRecentDays === 1 ? 'Yesterday' : `${mostRecentDays} days ago`}
                                  </span>
                                )}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-1 justify-end">
                              {recentPlatforms.map((platform, idx) => (
                                <Badge 
                                  key={idx}
                                  variant="secondary" 
                                  className="text-[10px] px-1.5 py-0 h-5 bg-blue-500/20 text-blue-700 dark:text-blue-400"
                                  title={`Last contest: ${new Date(platform.lastContestDate!).toLocaleDateString()}`}
                                >
                                  {platform.platform}: {platform.totalContests}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>

            {/* Not Attended Students */}
            <Collapsible open={showNotAttended} onOpenChange={setShowNotAttended}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between" size="sm">
                  <span className="flex items-center gap-2">
                    <CalendarX className="w-4 h-4 text-red-600" />
                    <span className="font-medium">Students Who Didn't Attend ({contestParticipation.didNotAttendCount})</span>
                  </span>
                  {showNotAttended ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3">
                {contestParticipation.didNotAttendLast.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    All students attended contests recently!
                  </p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {contestParticipation.didNotAttendLast.map((student) => {
                      // Get the oldest contest date across all platforms
                      const allPlatforms = student.platforms.filter(p => p.lastContestDate);
                      const oldestDays = allPlatforms.length > 0 
                        ? Math.max(...allPlatforms.map(p => p.daysSinceLastContest || 0))
                        : null;

                      return (
                        <Link key={student.userId} href={`/student/${student.username}`}>
                          <div className="flex items-center justify-between p-3 rounded-lg border bg-red-500/5 hover:bg-red-500/10 transition-colors cursor-pointer">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{student.name}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                @{student.username}
                                {oldestDays !== null && oldestDays > 0 && (
                                  <span className="ml-2 text-red-600">
                                    • Last contest: {oldestDays} days ago
                                  </span>
                                )}
                                {allPlatforms.length === 0 && (
                                  <span className="ml-2 text-red-600">
                                    • No contests yet
                                  </span>
                                )}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-1 justify-end">
                              {student.platforms.map((platform, idx) => (
                                <Badge 
                                  key={idx}
                                  variant="secondary" 
                                  className="text-[10px] px-1.5 py-0 h-5 bg-red-500/20 text-red-700 dark:text-red-400"
                                  title={platform.lastContestDate ? `Last: ${new Date(platform.lastContestDate).toLocaleDateString()}` : 'No contests'}
                                >
                                  {platform.platform}: {platform.totalContests}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
