import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { BarChart3, Loader2 } from "lucide-react";

const onboardingSchema = z.object({
  leetcode: z.string().optional(),
  codeforces: z.string().optional(),
  codechef: z.string().optional(),
}).refine((data) => data.leetcode || data.codeforces || data.codechef, {
  message: "At least one coding platform account is required",
  path: ["leetcode"],
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { user, updateUser } = useAuth();
  const { toast } = useToast();

  // Redirect if already onboarded
  useEffect(() => {
    if (user?.isOnboarded) {
      setLocation("/dashboard");
    }
  }, [user?.isOnboarded, setLocation]);

  if (user?.isOnboarded) {
    return null;
  }

  const form = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      leetcode: "",
      codeforces: "",
      codechef: "",
    },
  });

  const onboardMutation = useMutation({
    mutationFn: async (data: OnboardingFormData) => {
      return await apiRequest("POST", "/api/auth/onboard", data);
    },
    onSuccess: (response) => {
      if (user && response.user) {
        updateUser(response.user);
        setLocation("/dashboard");
      }
      toast({
        title: "Welcome aboard!",
        description: "Your profile has been set up successfully.",
      });
    },
    onError: (error: any) => {
      if (error.message?.includes("already onboarded")) {
        // User is already onboarded, redirect to dashboard
        setLocation("/dashboard");
        return;
      }
      toast({
        title: "Onboarding failed",
        description: error.message || "Failed to complete onboarding. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: OnboardingFormData) => {
    onboardMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-6">
              <BarChart3 className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold">Welcome to CodeTrack</h1>
            <p className="text-muted-foreground mt-2">
              Let's set up your coding platform accounts
            </p>
          </div>

          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Connect Your Accounts</CardTitle>
              <CardDescription>
                Add at least one coding platform username to get started
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="leetcode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>LeetCode Username</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Your LeetCode username" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="codeforces"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CodeForces Username</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Your CodeForces username" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="codechef"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CodeChef Username</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Your CodeChef username" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    disabled={onboardMutation.isPending}
                  >
                    {onboardMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Setting up...
                      </>
                    ) : (
                      "Complete Setup"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
