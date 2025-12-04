import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { NavigationBar } from "@/components/NavigationBar";
import { EditProfileForm } from "@/components/EditProfileForm";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AlertCircle, ArrowLeft, ShieldAlert } from "lucide-react";
import type { Student, UpdateStudent } from "@shared/schema";

export default function EditProfile() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: student, isLoading, error } = useQuery<Student>({
    queryKey: ["/api/student", user?.username],
    enabled: !!user?.username && user?.role === "student",
  });

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateStudent) => {
      return apiRequest("PATCH", `/api/student/${user?.username}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/student", user?.username] });
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      setLocation(`/student/${user?.username}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (user?.role === "faculty") {
    return (
      <div className="min-h-screen bg-background">
        <NavigationBar />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <ShieldAlert className="w-12 h-12 mx-auto text-amber-500 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Faculty View Only</h2>
              <p className="text-muted-foreground mb-6">
                Faculty members can view student profiles but cannot edit them.
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationBar />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="space-y-6">
            <Skeleton className="h-8 w-48" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Skeleton className="h-96" />
              <div className="space-y-6">
                <Skeleton className="h-44" />
                <Skeleton className="h-44" />
              </div>
            </div>
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
              <h2 className="text-xl font-semibold mb-2">Profile Not Found</h2>
              <p className="text-muted-foreground mb-6">
                Unable to load your profile. Please try again later.
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
        <div className="mb-8">
          <Link href={`/student/${student.username}`}>
            <a className="inline-flex items-center gap-2 text-sm text-muted-foreground mb-4 hover-elevate active-elevate-2 rounded-md px-2 py-1 -ml-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Profile
            </a>
          </Link>
          <h1 className="text-3xl font-bold">Edit Profile</h1>
          <p className="text-muted-foreground mt-2">
            Update your profile information and coding accounts
          </p>
        </div>

        <EditProfileForm 
          student={student} 
          onSubmit={(data) => updateMutation.mutate(data)}
          isPending={updateMutation.isPending}
        />
      </main>
    </div>
  );
}
