import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Trophy } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import type { ProblemStats, ContestStats } from "@shared/schema";

interface ProblemStatsCardProps {
  stats: ProblemStats;
  contestStats?: ContestStats;
}

const DIFFICULTY_COLORS = {
  easy: "hsl(142, 76%, 36%)",
  medium: "hsl(38, 92%, 50%)",
  hard: "hsl(0, 84%, 60%)",
};

export function ProblemStatsCard({ stats, contestStats }: ProblemStatsCardProps) {
  const pieData = [
    { name: "Easy", value: stats.easy, color: DIFFICULTY_COLORS.easy },
    { name: "Medium", value: stats.medium, color: DIFFICULTY_COLORS.medium },
    { name: "Hard", value: stats.hard, color: DIFFICULTY_COLORS.hard },
  ];

  // Get contest counts from contestStats
  const leetcodeContests = contestStats?.leetcode?.totalContests || 0;
  const codechefContests = contestStats?.codechef?.totalContests || 0;
  const codeforcesContests = contestStats?.codeforces?.totalContests || 0;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Problem Solving Analytics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Problems Solved</p>
                <p className="text-2xl font-bold" data-testid="text-problems-total">
                  {stats.total}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-yellow-500/10">
                <Trophy className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">Total Contests</p>
                <div className="flex gap-4 text-sm">
                  {leetcodeContests > 0 && (
                    <div>
                      <span className="text-muted-foreground">LC:</span>
                      <span className="ml-1 font-semibold">{leetcodeContests}</span>
                    </div>
                  )}
                  {codechefContests > 0 && (
                    <div>
                      <span className="text-muted-foreground">CC:</span>
                      <span className="ml-1 font-semibold">{codechefContests}</span>
                    </div>
                  )}
                  {codeforcesContests > 0 && (
                    <div>
                      <span className="text-muted-foreground">CF:</span>
                      <span className="ml-1 font-semibold">{codeforcesContests}</span>
                    </div>
                  )}
                  {leetcodeContests === 0 && codechefContests === 0 && codeforcesContests === 0 && (
                    <span className="text-muted-foreground">0</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Problems Solved Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.solvedOverTime}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString("en-US", { month: "short" });
                    }}
                    className="text-xs"
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis 
                    className="text-xs"
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                    }}
                    labelFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))", strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Difficulty Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Platform-wise Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(stats.platformStats || {}).map(([platform, count]) => (
              <div 
                key={platform} 
                className="text-center p-3 rounded-lg bg-muted/50"
                data-testid={`text-platform-${platform.toLowerCase()}`}
              >
                <p className="text-sm text-muted-foreground truncate">{platform}</p>
                <p className="text-xl font-bold mt-1">{count || 0}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
