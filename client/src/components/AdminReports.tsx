import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Download,
  Loader2,
  FileText,
  Database,
  Play,
  Calendar,
  Users,
  Code2,
  Trophy,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
} from "lucide-react";

const PLATFORMS = [
  { id: "LeetCode", name: "LeetCode", color: "bg-orange-500" },
  { id: "CodeChef", name: "CodeChef", color: "bg-amber-600" },
  { id: "CodeForces", name: "CodeForces", color: "bg-blue-500" },
  { id: "GeeksforGeeks", name: "GeeksforGeeks", color: "bg-green-600" },
  { id: "HackerRank", name: "HackerRank", color: "bg-emerald-500" },
];

interface ScrapeProgress {
  total: number;
  completed: number;
  current: string;
  status: "idle" | "running" | "completed" | "error";
  errors: string[];
}

interface PlatformSnapshot {
  platform: string;
  totalProblems: number;
  easy: number;
  medium: number;
  hard: number;
  totalContests: number;
  avgRating: number;
  activeUsers: number;
}

interface StudentSnapshot {
  studentId: string;
  username: string;
  name: string;
  dept: string;
  platforms: {
    platform: string;
    username: string;
    problemsSolved: number;
    easy: number;
    medium: number;
    hard: number;
    contestsAttended: number;
    currentRating: number;
  }[];
  totalProblems: number;
  totalContests: number;
}

interface WeeklySnapshot {
  id: string;
  weekStart: string;
  weekEnd: string;
  createdAt: string;
  platformStats: PlatformSnapshot[];
  studentSnapshots: StudentSnapshot[];
  totalStudents: number;
  totalProblemsAllPlatforms: number;
  totalContestsAllPlatforms: number;
}

interface WeeklyComparison {
  platform: string;
  thisWeek: PlatformSnapshot;
  lastWeek: PlatformSnapshot | null;
  problemsChange: number;
  contestsChange: number;
  activeUsersChange: number;
}

interface ReportData {
  currentSnapshot: WeeklySnapshot;
  previousSnapshot: WeeklySnapshot | null;
  platformComparisons: WeeklyComparison[];
  topGainers: {
    student: StudentSnapshot;
    problemsGained: number;
    contestsGained: number;
  }[];
  departmentStats: {
    dept: string;
    totalProblems: number;
    totalContests: number;
    studentCount: number;
    avgProblems: number;
  }[];
}

export function AdminReports() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activePlatform, setActivePlatform] = useState("LeetCode");
  const [isPolling, setIsPolling] = useState(false);

  // Fetch snapshots
  const { data: snapshots, isLoading: snapshotsLoading } = useQuery<WeeklySnapshot[]>({
    queryKey: ["/api/admin/snapshots"],
  });

  // Fetch scrape progress
  const { data: scrapeProgress } = useQuery<ScrapeProgress>({
    queryKey: ["/api/admin/scrape/progress"],
    refetchInterval: isPolling ? 2000 : false,
  });

  // Fetch platform-specific report
  const { data: platformReport, isLoading: reportLoading, refetch: refetchReport } = useQuery<ReportData>({
    queryKey: ["/api/admin/reports", activePlatform],
    queryFn: async () => {
      const res = await fetch(`/api/admin/reports/${activePlatform}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) throw new Error("Failed to fetch report");
      return res.json();
    },
    enabled: !!snapshots && snapshots.length > 0,
  });

  // Bulk scrape mutation
  const scrapeMutation = useMutation({
    mutationFn: async (platform: string) => {
      return await apiRequest("POST", `/api/admin/scrape/${platform}`);
    },
    onSuccess: (_, platform) => {
      setIsPolling(true);
      toast({
        title: "Scraping started",
        description: `Started scraping all students for ${platform}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Scrape failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create snapshot mutation
  const createSnapshotMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/admin/snapshots");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/snapshots"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reports"] });
      toast({
        title: "Snapshot created",
        description: "Weekly snapshot has been created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create snapshot",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Stop polling when scrape completes
  if (isPolling && scrapeProgress && (scrapeProgress.status === "completed" || scrapeProgress.status === "error")) {
    setIsPolling(false);
    queryClient.invalidateQueries({ queryKey: ["/api/students"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/reports"] });
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const downloadPlatformCSV = (platform: string) => {
    if (!platformReport) return;

    const snapshot = platformReport.currentSnapshot;
    let csvContent = `${platform} Report - Week: ${formatDate(snapshot.weekStart)} to ${formatDate(snapshot.weekEnd)}\n\n`;
    csvContent += `Student,Department,${platform} Username,Problems Solved,Easy,Medium,Hard,Contests,Rating\n`;
    
    snapshot.studentSnapshots.forEach(s => {
      const platformData = s.platforms.find(p => p.platform === platform);
      if (platformData && platformData.username) {
        csvContent += `"${s.name}","${s.dept}","${platformData.username}",${platformData.problemsSolved},${platformData.easy || 0},${platformData.medium || 0},${platformData.hard || 0},${platformData.contestsAttended},${platformData.currentRating}\n`;
      }
    });

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${platform}_report_${formatDate(snapshot.weekEnd).replace(/,?\s+/g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const ChangeIndicator = ({ value }: { value: number }) => {
    if (value > 0) {
      return (
        <span className="flex items-center text-green-500 text-sm font-medium">
          <ArrowUpRight className="w-4 h-4" />
          +{value}
        </span>
      );
    } else if (value < 0) {
      return (
        <span className="flex items-center text-red-500 text-sm font-medium">
          <ArrowDownRight className="w-4 h-4" />
          {value}
        </span>
      );
    }
    return <span className="text-muted-foreground text-sm">—</span>;
  };

  const PlatformReportContent = ({ platform }: { platform: string }) => {
    const platformInfo = PLATFORMS.find(p => p.id === platform);
    const comparison = platformReport?.platformComparisons.find(c => c.platform === platform);
    const platformStudents = platformReport?.currentSnapshot.studentSnapshots
      .map(s => ({
        ...s,
        platformData: s.platforms.find(p => p.platform === platform),
      }))
      .filter(s => s.platformData && s.platformData.username)
      .sort((a, b) => (b.platformData?.problemsSolved || 0) - (a.platformData?.problemsSolved || 0));

    const topGainersForPlatform = platformReport?.topGainers.filter(g => {
      const platformData = g.student.platforms.find(p => p.platform === platform);
      return platformData && platformData.username;
    }).slice(0, 5);

    return (
      <div className="space-y-6">
        {/* Platform Header & Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${platformInfo?.color}`} />
            <h3 className="text-lg font-semibold">{platform} Report</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => scrapeMutation.mutate(platform)}
              disabled={scrapeMutation.isPending || isPolling}
            >
              {isPolling && scrapeProgress?.status === "running" ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Scrape {platform}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchReport()}
              disabled={reportLoading}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => downloadPlatformCSV(platform)}
              disabled={!platformReport}
            >
              <Download className="w-4 h-4 mr-2" />
              Download CSV
            </Button>
          </div>
        </div>

        {/* Scrape Progress */}
        {isPolling && scrapeProgress && scrapeProgress.status === "running" && (
          <div className="space-y-2 p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                Scraping: {scrapeProgress.current}
              </span>
              <span className="text-sm text-muted-foreground">
                {scrapeProgress.completed} / {scrapeProgress.total}
              </span>
            </div>
            <Progress value={(scrapeProgress.completed / scrapeProgress.total) * 100} />
          </div>
        )}

        {reportLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !platformReport ? (
          <div className="text-center py-12 border rounded-lg">
            <Database className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              No snapshot data available. Create a weekly snapshot first.
            </p>
          </div>
        ) : (
          <>
            {/* Week Info */}
            <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/30">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">
                  Week: {formatDate(platformReport.currentSnapshot.weekStart)} - {formatDate(platformReport.currentSnapshot.weekEnd)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {platformReport.previousSnapshot
                    ? `Comparing with: ${formatDate(platformReport.previousSnapshot.weekStart)} - ${formatDate(platformReport.previousSnapshot.weekEnd)}`
                    : "No previous week data for comparison"}
                </p>
              </div>
            </div>

            {/* Platform Stats Cards */}
            {comparison && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Problems</p>
                        <p className="text-2xl font-bold">{comparison.thisWeek.totalProblems}</p>
                      </div>
                      <ChangeIndicator value={comparison.problemsChange} />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Contests</p>
                        <p className="text-2xl font-bold">{comparison.thisWeek.totalContests}</p>
                      </div>
                      <ChangeIndicator value={comparison.contestsChange} />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Active Users</p>
                        <p className="text-2xl font-bold">{comparison.thisWeek.activeUsers}</p>
                      </div>
                      <ChangeIndicator value={comparison.activeUsersChange} />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Rating</p>
                      <p className="text-2xl font-bold">{comparison.thisWeek.avgRating || "—"}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Difficulty Breakdown */}
            {comparison && (comparison.thisWeek.easy > 0 || comparison.thisWeek.medium > 0 || comparison.thisWeek.hard > 0) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Difficulty Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-sm">Easy: {comparison.thisWeek.easy}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <span className="text-sm">Medium: {comparison.thisWeek.medium}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <span className="text-sm">Hard: {comparison.thisWeek.hard}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Top Gainers */}
            {topGainersForPlatform && topGainersForPlatform.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Trophy className="w-4 h-4" />
                    Top Gainers This Week
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {topGainersForPlatform.map((gainer, idx) => (
                      <div key={gainer.student.studentId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{gainer.student.name}</p>
                          <p className="text-xs text-muted-foreground">{gainer.student.dept}</p>
                        </div>
                        <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                          +{gainer.problemsGained} problems
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Student Leaderboard */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Student Rankings - {platform}
                </CardTitle>
                <CardDescription>
                  {platformStudents?.length || 0} students with {platform} accounts
                </CardDescription>
              </CardHeader>
              <CardContent>
                {platformStudents && platformStudents.length > 0 ? (
                  <div className="border rounded-lg max-h-96 overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>Student</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>{platform} Username</TableHead>
                          <TableHead className="text-right">Problems</TableHead>
                          <TableHead className="text-right">Contests</TableHead>
                          <TableHead className="text-right">Rating</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {platformStudents.slice(0, 50).map((student, idx) => (
                          <TableRow key={student.studentId}>
                            <TableCell className="font-medium">{idx + 1}</TableCell>
                            <TableCell>{student.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{student.dept}</Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {student.platformData?.username}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {student.platformData?.problemsSolved || 0}
                            </TableCell>
                            <TableCell className="text-right">
                              {student.platformData?.contestsAttended || 0}
                            </TableCell>
                            <TableCell className="text-right">
                              {student.platformData?.currentRating || "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No students with {platform} accounts found
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Department Stats */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Code2 className="w-4 h-4" />
                  Department Statistics - {platform}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Department</TableHead>
                        <TableHead className="text-right">Students</TableHead>
                        <TableHead className="text-right">Total Problems</TableHead>
                        <TableHead className="text-right">Avg Problems</TableHead>
                        <TableHead className="text-right">Total Contests</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {platformReport.departmentStats.map(dept => (
                        <TableRow key={dept.dept}>
                          <TableCell className="font-medium">{dept.dept}</TableCell>
                          <TableCell className="text-right">{dept.studentCount}</TableCell>
                          <TableCell className="text-right">{dept.totalProblems}</TableCell>
                          <TableCell className="text-right">{dept.avgProblems}</TableCell>
                          <TableCell className="text-right">{dept.totalContests}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Snapshot Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Weekly Snapshot Management
          </CardTitle>
          <CardDescription>
            Create snapshots to track weekly progress and enable comparison reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => createSnapshotMutation.mutate()}
                disabled={createSnapshotMutation.isPending}
              >
                {createSnapshotMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Calendar className="w-4 h-4 mr-2" />
                )}
                Create Weekly Snapshot
              </Button>
              {snapshots && snapshots.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  Latest: {formatDate(snapshots[0].weekEnd)} ({snapshots.length} total)
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Platform Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Platform Reports
          </CardTitle>
          <CardDescription>
            View detailed reports and download data for each coding platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activePlatform} onValueChange={setActivePlatform}>
            <TabsList className="grid w-full grid-cols-5 mb-6">
              {PLATFORMS.map(platform => (
                <TabsTrigger key={platform.id} value={platform.id} className="gap-2">
                  <div className={`w-2 h-2 rounded-full ${platform.color}`} />
                  {platform.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {PLATFORMS.map(platform => (
              <TabsContent key={platform.id} value={platform.id}>
                <PlatformReportContent platform={platform.id} />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Snapshot History */}
      {snapshots && snapshots.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Snapshot History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-auto">
              {snapshots.map(snapshot => (
                <div key={snapshot.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">
                      {formatDate(snapshot.weekStart)} - {formatDate(snapshot.weekEnd)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {snapshot.totalStudents} students • {snapshot.totalProblemsAllPlatforms} problems
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {formatDate(snapshot.createdAt)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
