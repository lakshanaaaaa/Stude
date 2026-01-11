import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { NavigationBar } from "@/components/NavigationBar";
import { StudentCard } from "@/components/StudentCard";
import { TopperOfTheWeekCard } from "@/components/TopperOfTheWeekCard";
import { WeeklyLeaderboard } from "@/components/WeeklyLeaderboard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Users, Filter, Trophy, Star } from "lucide-react";
import type { Student } from "@shared/schema";

const departments = ["All", "CSE", "CSBS", "AI&DS", "CSE(AI&ML)"];

interface OverallLeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  name: string;
  dept: string;
  totalSolved: number;
  highestRatingValue: number;
  highestRatingPlatform: "LeetCode" | "CodeChef" | "CodeForces" | null;
}

interface PlatformLeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  name: string;
  dept: string;
  platform: "LeetCode" | "CodeChef" | "CodeForces";
  problemsSolved: number;
  highestRating: number;
}

type LeaderboardTableProps =
  | {
      type: "overall";
      overall: OverallLeaderboardEntry[];
      platformEntries?: never;
      platform?: never;
    }
  | {
      type: "platform";
      overall?: never;
      platformEntries: PlatformLeaderboardEntry[];
      platform: "LeetCode" | "CodeChef" | "CodeForces";
    };

function LeaderboardTable(props: LeaderboardTableProps) {
  const rows =
    props.type === "overall" ? props.overall : props.platformEntries;

  if (!rows || rows.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-6">
        Leaderboard will appear here once stats are available.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {rows.slice(0, 10).map((row) => (
        <div
          key={row.userId}
          className="flex items-center gap-4 p-3 rounded-lg border bg-card/40"
        >
          <div
            className={
              "w-10 h-10 flex items-center justify-center rounded-full font-semibold " +
              (row.rank === 1
                ? "bg-yellow-500/10 text-yellow-400"
                : row.rank === 2
                ? "bg-gray-400/10 text-gray-300"
                : row.rank === 3
                ? "bg-amber-700/10 text-amber-400"
                : "bg-primary/10 text-primary")
            }
          >
            #{row.rank}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">
              {"name" in row ? row.name : row.username}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              @{row.username} • {row.dept}
            </p>
          </div>
          {props.type === "overall" ? (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-lg font-bold">{row.totalSolved}</p>
                <p className="text-[11px] text-muted-foreground">
                  total solved
                </p>
              </div>
              <div className="text-right text-xs">
                <div className="flex items-center justify-end gap-1">
                  <Star className="w-3 h-3 text-yellow-500" />
                  <span className="font-semibold">
                    {row.highestRatingValue || 0}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {row.highestRatingPlatform || "No rating"}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-lg font-bold">{row.highestRating || 0}</p>
                <p className="text-[11px] text-muted-foreground">rating</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">
                  {row.problemsSolved || 0}
                </p>
                <p className="text-[11px] text-muted-foreground">solved</p>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("All");

  const { data: students, isLoading } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  const { data: overallLeaderboard } = useQuery<{
    generatedAt: string | null;
    entries: OverallLeaderboardEntry[];
  }>({
    queryKey: ["/api/leaderboard/overall"],
  });

  const { data: cfLeaderboard } = useQuery<{
    generatedAt: string | null;
    entries: PlatformLeaderboardEntry[];
  }>({
    queryKey: ["/api/leaderboard/platform/CodeForces"],
  });

  const { data: ccLeaderboard } = useQuery<{
    generatedAt: string | null;
    entries: PlatformLeaderboardEntry[];
  }>({
    queryKey: ["/api/leaderboard/platform/CodeChef"],
  });

  const { data: lcLeaderboard } = useQuery<{
    generatedAt: string | null;
    entries: PlatformLeaderboardEntry[];
  }>({
    queryKey: ["/api/leaderboard/platform/LeetCode"],
  });

  const filteredStudents = useMemo(() => {
    if (!students) return [];
    
    return students.filter((student) => {
      const matchesSearch = 
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.username.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesDept = selectedDept === "All" || student.dept === selectedDept;
      
      return matchesSearch && matchesDept;
    });
  }, [students, searchQuery, selectedDept]);

  return (
    <div className="min-h-screen bg-background">
      <NavigationBar />
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="space-y-8">
            <Skeleton className="h-48 w-full rounded-lg" />
            <div className="flex gap-4">
              <Skeleton className="h-10 flex-1 max-w-sm" />
              <Skeleton className="h-10 w-32" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-lg" />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <section>
              <TopperOfTheWeekCard />
            </section>

            <section className="flex flex-col gap-6">
              {/* Leaderboard */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Trophy className="w-5 h-5 text-yellow-500" />
                      Leaderboard
                    </CardTitle>
                    {overallLeaderboard?.generatedAt && (
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Last updated{" "}
                        {new Date(
                          overallLeaderboard.generatedAt
                        ).toLocaleString()}
                      </p>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="overall">
                    <TabsList className="grid grid-cols-5 mb-4">
                      <TabsTrigger value="overall">Overall</TabsTrigger>
                      <TabsTrigger value="weekly">Weekly</TabsTrigger>
                      <TabsTrigger value="codeforces">Codeforces</TabsTrigger>
                      <TabsTrigger value="codechef">CodeChef</TabsTrigger>
                      <TabsTrigger value="leetcode">LeetCode</TabsTrigger>
                    </TabsList>
                    <TabsContent value="overall" className="mt-0">
                      <LeaderboardTable
                        type="overall"
                        overall={overallLeaderboard?.entries || []}
                      />
                    </TabsContent>
                    <TabsContent value="weekly" className="mt-0">
                      <WeeklyLeaderboard />
                    </TabsContent>
                    <TabsContent value="codeforces" className="mt-0">
                      <LeaderboardTable
                        type="platform"
                        platform="CodeForces"
                        platformEntries={cfLeaderboard?.entries || []}
                      />
                    </TabsContent>
                    <TabsContent value="codechef" className="mt-0">
                      <LeaderboardTable
                        type="platform"
                        platform="CodeChef"
                        platformEntries={ccLeaderboard?.entries || []}
                      />
                    </TabsContent>
                    <TabsContent value="leetcode" className="mt-0">
                      <LeaderboardTable
                        type="platform"
                        platform="LeetCode"
                        platformEntries={lcLeaderboard?.entries || []}
                      />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search students by name or username..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <Select value={selectedDept} onValueChange={setSelectedDept}>
                    <SelectTrigger className="w-32" data-testid="select-department-filter">
                      <SelectValue placeholder="Department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">
                  All Students
                  <span className="text-muted-foreground font-normal ml-2">
                    ({filteredStudents.length})
                  </span>
                </h2>
              </div>

              {filteredStudents.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">
                      {searchQuery || selectedDept !== "All"
                        ? "No students found matching your criteria"
                        : "No students available"}
                    </p>
                    {(searchQuery || selectedDept !== "All") && (
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => {
                          setSearchQuery("");
                          setSelectedDept("All");
                        }}
                        data-testid="button-clear-filters"
                      >
                        Clear filters
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredStudents.map((student) => (
                    <StudentCard key={student.id} student={student} />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
