import { useMemo, useState } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { NavigationBar } from "@/components/NavigationBar";
import { ProfileHeader } from "@/components/ProfileHeader";
import { AccountCard } from "@/components/AccountCard";
import { ProblemStatsCard } from "@/components/ProblemStatsCard";
import { ContestStatsCard } from "@/components/ContestStatsCard";
import { BadgeGrid } from "@/components/BadgeGrid";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";
import type { Student } from "@shared/schema";

export default function StudentProfile() {
  const [, params] = useRoute("/student/:username");
  const username = params?.username;
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isScrapingLocal, setIsScrapingLocal] = useState(false);

  const isOwnProfile = user?.username === username && user?.role === "student";

  const { data: student, isLoading, error } = useQuery<Student>({
    queryKey: ["/api/student", username],
    enabled: !!username,
  });

  const scrapeMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/student/${username}/scrape`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to scrape data");
      }
      return response.json();
    },
    onMutate: () => {
      setIsScrapingLocal(true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/student", username] });
      toast({
        title: "Success",
        description: "Profile data updated successfully!",
      });
      setIsScrapingLocal(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setIsScrapingLocal(false);
    },
  });

  const analytics = useMemo(() => {
    if (!student) return null;
    // Only show analytics if available in database
    if (student.problemStats && student.contestStats) {
      return {
        problemStats: student.problemStats,
        contestStats: student.contestStats,
        badges: student.badges || [],
      };
    }
    return null;
  }, [student]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationBar />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="space-y-8">
            <div className="flex items-start gap-6">
              <Skeleton className="w-24 h-24 rounded-full" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-5 w-32" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Skeleton className="h-40" />
              <Skeleton className="h-40" />
            </div>
            <Skeleton className="h-64" />
            <Skeleton className="h-80" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationBar />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
              <h2 className="text-xl font-semibold mb-2">Student Not Found</h2>
              <p className="text-muted-foreground mb-6">
                The student profile you're looking for doesn't exist or you don't have permission to view it.
              </p>
              <Link href="/dashboard">
                <Button className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavigationBar />
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        {isOwnProfile && (
          <div className="flex justify-end mb-4">
            <Button
              onClick={() => scrapeMutation.mutate()}
              disabled={isScrapingLocal || scrapeMutation.isPending}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${(isScrapingLocal || scrapeMutation.isPending) ? 'animate-spin' : ''}`} />
              {(isScrapingLocal || scrapeMutation.isPending) ? "Updating..." : "Refresh Stats"}
            </Button>
          </div>
        )}

        <ProfileHeader student={student} />

        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AccountCard 
              title="Main Coding Accounts" 
              accounts={student.mainAccounts} 
              variant="main"
            />
            <AccountCard 
              title="Sub Accounts" 
              accounts={student.subAccounts} 
              variant="sub"
            />
          </div>

          {analytics && (
            <>
              <ProblemStatsCard stats={analytics.problemStats} />
              <ContestStatsCard stats={analytics.contestStats} />
              <BadgeGrid badges={analytics.badges} />
            </>
          )}

          {!analytics && (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Performance Data</h3>
                <p className="text-muted-foreground mb-4">
                  Click "Update Data" to fetch the latest performance statistics from coding platforms.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
