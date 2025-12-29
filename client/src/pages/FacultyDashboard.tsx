import { useQuery } from "@tanstack/react-query";
import { NavigationBar } from "@/components/NavigationBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Loader2, 
  TrendingUp, 
  Award, 
  Code2, 
  GraduationCap,
  Trophy,
  Target,
  BookOpen
} from "lucide-react";
import { Link } from "wouter";
import type { Student } from "@shared/schema";

interface DepartmentStats {
  department: string;
  totalStudents: number;
  totalProblems: number;
  avgProblems: number;
  totalContests: number;
  topPerformers: Student[];
  platformStats: Record<string, number>;
  difficultyStats: {
    easy: number;
    medium: number;
    hard: number;
  };
  activeStudents: number;
  contestParticipants: number;
}

export default function FacultyDashboard() {
  const { data: stats, isLoading } = useQuery<DepartmentStats>({
    queryKey: ["/api/faculty/department-stats"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationBar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationBar />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  No department assigned. Please contact an administrator.
                </p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const totalProblems = stats.totalProblems;

  return (
    <div className="min-h-screen bg-background">
      <NavigationBar />
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
                <GraduationCap className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{stats.department} Department</h1>
                <p className="text-muted-foreground">Student performance overview</p>
              </div>
            </div>
          </div>

          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Students</p>
                    <p className="text-3xl font-bold">{stats.totalStudents}</p>
                  </div>
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-500/10">
                    <Users className="w-6 h-6 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Students</p>
                    <p className="text-3xl font-bold">{stats.activeStudents}</p>
                  </div>
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-green-500/10">
                    <TrendingUp className="w-6 h-6 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Problems</p>
                    <p className="text-3xl font-bold">{stats.totalProblems}</p>
                    <p className="text-xs text-muted-foreground mt-1">Avg: {stats.avgProblems}/student</p>
                  </div>
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-purple-500/10">
                    <Code2 className="w-6 h-6 text-purple-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Contests</p>
                    <p className="text-3xl font-bold">{stats.totalContests}</p>
                  </div>
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-orange-500/10">
                    <Trophy className="w-6 h-6 text-orange-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Top Coders in {stats.department}
              </CardTitle>
              <CardDescription>Students with highest problem-solving counts</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.topPerformers.length > 0 ? (
                <div className="space-y-3">
                  {stats.topPerformers.map((student, index) => (
                    <Link key={student.id} href={`/student/${student.username}`}>
                      <div className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${
                          index === 0 ? 'bg-yellow-500/20 text-yellow-600' :
                          index === 1 ? 'bg-gray-400/20 text-gray-600' :
                          index === 2 ? 'bg-orange-500/20 text-orange-600' :
                          'bg-primary/10 text-primary'
                        }`}>
                          #{index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">{student.name}</p>
                          <p className="text-sm text-muted-foreground">@{student.username}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">{student.problemStats?.total || 0}</p>
                          <p className="text-xs text-muted-foreground">problems solved</p>
                        </div>
                        {index < 3 && (
                          <Trophy className={`w-6 h-6 ${
                            index === 0 ? 'text-yellow-500' :
                            index === 1 ? 'text-gray-400' :
                            'text-orange-500'
                          }`} />
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Trophy className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No student data available yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Analytics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code2 className="w-5 h-5" />
                  Platform Usage
                </CardTitle>
                <CardDescription>Active accounts by platform</CardDescription>
              </CardHeader>
              <CardContent>
                {Object.keys(stats.platformStats).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(stats.platformStats)
                      .sort(([, a], [, b]) => b - a)
                      .map(([platform, count]) => (
                        <div key={platform} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{platform}</span>
                          <div className="flex items-center gap-3">
                            <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-500 rounded-full"
                                style={{
                                  width: `${(count / stats.totalStudents) * 100}%`,
                                }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground w-8 text-right">
                              {count}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No data available</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Problem Difficulty Distribution
                </CardTitle>
                <CardDescription>Across all students</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    {
                      label: "Easy",
                      count: stats.difficultyStats.easy,
                      color: "bg-green-500",
                    },
                    {
                      label: "Medium",
                      count: stats.difficultyStats.medium,
                      color: "bg-yellow-500",
                    },
                    {
                      label: "Hard",
                      count: stats.difficultyStats.hard,
                      color: "bg-red-500",
                    },
                  ].map(({ label, count, color }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{label}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full ${color} rounded-full`}
                            style={{
                              width: `${totalProblems ? (count / totalProblems) * 100 : 0}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-12 text-right">
                          {count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Engagement Metrics
                </CardTitle>
                <CardDescription>Student activity overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm font-medium">Active Students</span>
                    <span className="text-2xl font-bold">{stats.activeStudents}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm font-medium">Contest Participants</span>
                    <span className="text-2xl font-bold">{stats.contestParticipants}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm font-medium">Participation Rate</span>
                    <span className="text-2xl font-bold">
                      {stats.totalStudents ? Math.round((stats.activeStudents / stats.totalStudents) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
