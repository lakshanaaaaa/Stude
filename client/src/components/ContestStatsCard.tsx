import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { ContestStats } from "@shared/schema";

interface ContestStatsCardProps {
  stats: ContestStats;
}

export function ContestStatsCard({ stats }: ContestStatsCardProps) {
  const hasLeetCodeData = stats.leetcode?.ratingHistory && stats.leetcode.ratingHistory.length > 0;
  const hasCodeChefData = stats.codechef?.ratingHistory && stats.codechef.ratingHistory.length > 0;
  const hasCodeForcesData = stats.codeforces?.ratingHistory && stats.codeforces.ratingHistory.length > 0;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Contest Analytics</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">LeetCode Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {hasLeetCodeData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.leetcode.ratingHistory}>
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
                      domain={["auto", "auto"]}
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
                      dataKey="rating"
                      stroke="#FFA116"
                      strokeWidth={2}
                      dot={{ fill: "#FFA116", strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, fill: "#FFA116" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  No contest history available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">CodeChef Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {hasCodeChefData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.codechef.ratingHistory}>
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
                      domain={["auto", "auto"]}
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
                      dataKey="rating"
                      stroke="#5B4638"
                      strokeWidth={2}
                      dot={{ fill: "#5B4638", strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, fill: "#5B4638" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  No contest history available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">CodeForces Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {hasCodeForcesData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.codeforces.ratingHistory}>
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
                      domain={["auto", "auto"]}
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
                      dataKey="rating"
                      stroke="#1F8ACB"
                      strokeWidth={2}
                      dot={{ fill: "#1F8ACB", strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, fill: "#1F8ACB" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  No contest history available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
