import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { NavigationBar } from "@/components/NavigationBar";
import { AdminBulkRefreshButton } from "@/components/AdminBulkRefreshButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { AdminReports } from "@/components/AdminReports";
import { ImprovementAnalyticsCard } from "@/components/ImprovementAnalyticsCard";
import { 
  Search, 
  Trash2, 
  Shield, 
  Users, 
  Loader2, 
  TrendingUp, 
  Award, 
  Code2, 
  GraduationCap,
  Trophy,
  Target,
  RefreshCw,
  AlertCircle,
  FileText,
  UserCog
} from "lucide-react";
import type { UserRole, Student } from "@shared/schema";
import { Link } from "wouter";

interface User {
  id: string;
  username: string;
  role: UserRole;
  isOnboarded?: boolean;
  email?: string;
  name?: string;
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: students, isLoading: studentsLoading } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  const { data: incompleteOnboarding, isLoading: incompleteLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users/incomplete-onboarding"],
  });

  const { data: improvementAnalytics } = useQuery<{
    totalUsers: number;
    improvedUsers: number;
    notImprovedUsers: number;
    improvementPercentage: number;
    platformBreakdown: {
      leetcode: { improved: number; notImproved: number; total: number };
      codechef: { improved: number; notImproved: number; total: number };
      codeforces: { improved: number; notImproved: number; total: number };
    };
  }>({
    queryKey: ["/api/analytics/improvement"],
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: UserRole }) => {
      return await apiRequest("PATCH", `/api/admin/users/${userId}`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Role updated",
        description: "User role has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update user role.",
        variant: "destructive",
      });
    },
  });

  const updateDepartmentMutation = useMutation({
    mutationFn: async ({ userId, department }: { userId: string; department: string }) => {
      return await apiRequest("PATCH", `/api/admin/users/${userId}/department`, { department });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Department updated",
        description: "Faculty department has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update department.",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("DELETE", `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users/incomplete-onboarding"] });
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({
        title: "User deleted",
        description: "User has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete user.",
        variant: "destructive",
      });
    },
  });

  const resetOnboardingMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("POST", `/api/admin/users/${userId}/reset-onboarding`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users/incomplete-onboarding"] });
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({
        title: "Onboarding reset",
        description: "User onboarding has been reset successfully. They will need to choose a new username.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Reset failed",
        description: error.message || "Failed to reset onboarding.",
        variant: "destructive",
      });
    },
  });

  const filteredUsers = users?.filter((user) => {
    const matchesSearch =
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Calculate analytics
  const totalProblems = students?.reduce((sum, s) => sum + (s.problemStats?.total || 0), 0) || 0;
  const avgProblems = students?.length ? Math.round(totalProblems / students.length) : 0;
  
  const totalContests = students?.reduce((sum, s) => {
    const lc = s.contestStats?.leetcode?.totalContests || 0;
    const cc = s.contestStats?.codechef?.totalContests || 0;
    const cf = s.contestStats?.codeforces?.totalContests || 0;
    return sum + lc + cc + cf;
  }, 0) || 0;

  // Department distribution
  const deptStats = students?.reduce((acc, s) => {
    acc[s.dept] = (acc[s.dept] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  // Platform usage
  const platformStats = students?.reduce((acc, s) => {
    [...(s.mainAccounts || []), ...(s.subAccounts || [])].forEach(account => {
      acc[account.platform] = (acc[account.platform] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>) || {};

  // Top performers by total problems
  const topPerformers = [...(students || [])]
    .sort((a, b) => (b.problemStats?.total || 0) - (a.problemStats?.total || 0))
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      <NavigationBar />
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-8">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
                  <Shield className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                  <p className="text-muted-foreground">System overview and user management</p>
                </div>
              </div>
              <AdminBulkRefreshButton />
            </div>
          </div>

          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                    <p className="text-3xl font-bold">{users?.length || 0}</p>
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
                    <p className="text-sm text-muted-foreground">Total Students</p>
                    <p className="text-3xl font-bold">{students?.length || 0}</p>
                  </div>
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-green-500/10">
                    <GraduationCap className="w-6 h-6 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Incomplete Onboarding</p>
                    <p className="text-3xl font-bold">{incompleteOnboarding?.length || 0}</p>
                  </div>
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-orange-500/10">
                    <AlertCircle className="w-6 h-6 text-orange-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Admins</p>
                    <p className="text-3xl font-bold">
                      {users?.filter((u) => u.role === "admin").length || 0}
                    </p>
                  </div>
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-purple-500/10">
                    <Shield className="w-6 h-6 text-purple-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="users" className="space-y-6">
            <TabsList>
              <TabsTrigger value="users">User Management</TabsTrigger>
              <TabsTrigger value="incomplete" className="relative">
                Incomplete Onboarding
                {incompleteOnboarding && incompleteOnboarding.length > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-xs">
                    {incompleteOnboarding.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="leaderboard">Top Performers</TabsTrigger>
              <TabsTrigger value="reports" className="gap-2">
                <FileText className="w-4 h-4" />
                Reports
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    User Management
                  </CardTitle>
                  <CardDescription>
                    View, update roles, and manage all users in the system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search users by username or ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Filter by role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="faculty">Faculty</SelectItem>
                        <SelectItem value="student">Student</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : filteredUsers && filteredUsers.length > 0 ? (
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Username</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status/Department</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredUsers.map((user) => (
                            <TableRow key={user.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{user.username}</p>
                                  {user.name && (
                                    <p className="text-xs text-muted-foreground">{user.name}</p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {user.email || "N/A"}
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={user.role}
                                  onValueChange={(value) =>
                                    updateRoleMutation.mutate({
                                      userId: user.id,
                                      role: value as UserRole,
                                    })
                                  }
                                  disabled={updateRoleMutation.isPending}
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="faculty">Faculty</SelectItem>
                                    <SelectItem value="student">Student</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                {user.role === "faculty" ? (
                                  <Select
                                    value={(user as any).department || ""}
                                    onValueChange={(value) => {
                                      updateDepartmentMutation.mutate({
                                        userId: user.id,
                                        department: value,
                                      });
                                    }}
                                    disabled={updateDepartmentMutation.isPending}
                                  >
                                    <SelectTrigger className="w-40">
                                      <SelectValue placeholder="Select dept" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="CSE">CSE</SelectItem>
                                      <SelectItem value="AI&DS">AI&DS</SelectItem>
                                      <SelectItem value="CSBS">CSBS</SelectItem>
                                      <SelectItem value="CSE(AI&ML)">CSE(AI&ML)</SelectItem>
                                      <SelectItem value="CTP">CTP</SelectItem>
                                      <SelectItem value="ECE">ECE</SelectItem>
                                      <SelectItem value="EEE">EEE</SelectItem>
                                      <SelectItem value="MECH">MECH</SelectItem>
                                      <SelectItem value="CIVIL">CIVIL</SelectItem>
                                    </SelectContent>
                                  </Select>
                                ) : user.role === "student" ? (
                                  user.isOnboarded ? (
                                    <Badge variant="default" className="bg-green-500">
                                      Onboarded
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary">
                                      Pending
                                    </Badge>
                                  )
                                ) : (
                                  <Badge variant="outline">N/A</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {user.role === "student" && user.isOnboarded && (
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="gap-2"
                                          disabled={resetOnboardingMutation.isPending}
                                        >
                                          <RefreshCw className="w-4 h-4" />
                                          Reset
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Reset Onboarding?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            This will reset the onboarding status for <strong>{user.username}</strong>.
                                            They will need to complete onboarding again.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => resetOnboardingMutation.mutate(user.id)}
                                          >
                                            Reset
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  )}
                                  
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        className="gap-2"
                                        disabled={deleteUserMutation.isPending}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                        Delete
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This action cannot be undone. This will permanently delete
                                          the user account for <strong>{user.username}</strong>.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => deleteUserMutation.mutate(user.id)}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground">
                        {searchQuery || roleFilter !== "all"
                          ? "No users found matching your criteria"
                          : "No users available"}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>User Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="text-2xl font-bold">
                        {users?.filter((u) => u.role === "admin").length || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Admins</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-2xl font-bold">
                        {users?.filter((u) => u.role === "faculty").length || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Faculty</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-2xl font-bold">
                        {users?.filter((u) => u.role === "student").length || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Students</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="incomplete" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Incomplete Onboarding
                  </CardTitle>
                  <CardDescription>
                    Students who have not completed their onboarding process
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {incompleteLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : incompleteOnboarding && incompleteOnboarding.length > 0 ? (
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Username</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {incompleteOnboarding.map((user) => (
                            <TableRow key={user.id}>
                              <TableCell className="font-medium">{user.username}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {user.email || "N/A"}
                              </TableCell>
                              <TableCell className="text-sm">
                                {user.name || "N/A"}
                              </TableCell>
                              <TableCell>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      className="gap-2"
                                      disabled={deleteUserMutation.isPending}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      Delete
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Incomplete User?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will permanently delete the user account for{" "}
                                        <strong>{user.username}</strong> who has not completed onboarding.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteUserMutation.mutate(user.id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <UserCog className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground">
                        All students have completed onboarding
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Problems Solved</p>
                        <p className="text-3xl font-bold">{totalProblems}</p>
                        <p className="text-xs text-muted-foreground mt-1">Avg: {avgProblems}/student</p>
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
                        <p className="text-3xl font-bold">{totalContests}</p>
                      </div>
                      <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-orange-500/10">
                        <Trophy className="w-6 h-6 text-orange-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="w-5 h-5" />
                      Department Distribution
                    </CardTitle>
                    <CardDescription>Students by department</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {studentsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    ) : Object.keys(deptStats).length > 0 ? (
                      <div className="space-y-3">
                        {Object.entries(deptStats)
                          .sort(([, a], [, b]) => b - a)
                          .map(([dept, count]) => (
                            <div key={dept} className="flex items-center justify-between">
                              <span className="text-sm font-medium">{dept}</span>
                              <div className="flex items-center gap-3">
                                <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary rounded-full"
                                    style={{
                                      width: `${(count / (students?.length || 1)) * 100}%`,
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
                      <Code2 className="w-5 h-5" />
                      Platform Usage
                    </CardTitle>
                    <CardDescription>Active accounts by platform</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {studentsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    ) : Object.keys(platformStats).length > 0 ? (
                      <div className="space-y-3">
                        {Object.entries(platformStats)
                          .sort(([, a], [, b]) => b - a)
                          .map(([platform, count]) => (
                            <div key={platform} className="flex items-center justify-between">
                              <span className="text-sm font-medium">{platform}</span>
                              <div className="flex items-center gap-3">
                                <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-green-500 rounded-full"
                                    style={{
                                      width: `${(count / (students?.length || 1)) * 100}%`,
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
              </div>

              {/* Contest Rating Improvement Analytics */}
              {improvementAnalytics && (
                <ImprovementAnalyticsCard analytics={improvementAnalytics} />
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Problem Difficulty Distribution
                    </CardTitle>
                    <CardDescription>Across all students</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {studentsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {[
                          {
                            label: "Easy",
                            count: students?.reduce((sum, s) => sum + (s.problemStats?.easy || 0), 0) || 0,
                            color: "bg-green-500",
                          },
                          {
                            label: "Medium",
                            count: students?.reduce((sum, s) => sum + (s.problemStats?.medium || 0), 0) || 0,
                            color: "bg-yellow-500",
                          },
                          {
                            label: "Hard",
                            count: students?.reduce((sum, s) => sum + (s.problemStats?.hard || 0), 0) || 0,
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
                    )}
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
                        <span className="text-2xl font-bold">
                          {students?.filter(s => (s.problemStats?.total || 0) > 0).length || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="text-sm font-medium">Contest Participants</span>
                        <span className="text-2xl font-bold">
                          {students?.filter(s => {
                            const lc = s.contestStats?.leetcode?.totalContests || 0;
                            const cc = s.contestStats?.codechef?.totalContests || 0;
                            const cf = s.contestStats?.codeforces?.totalContests || 0;
                            return (lc + cc + cf) > 0;
                          }).length || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="text-sm font-medium">Total Badges Earned</span>
                        <span className="text-2xl font-bold">
                          {students?.reduce((sum, s) => sum + (s.badges?.length || 0), 0) || 0}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="leaderboard" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Top Performers
                  </CardTitle>
                  <CardDescription>Students with highest problem-solving counts</CardDescription>
                </CardHeader>
                <CardContent>
                  {studentsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : topPerformers.length > 0 ? (
                    <div className="space-y-3">
                      {topPerformers.map((student, index) => (
                        <Link key={student.id} href={`/student/${student.username}`}>
                          <div className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 font-bold text-primary">
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
            </TabsContent>

            <TabsContent value="reports" className="space-y-6">
              <AdminReports />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
