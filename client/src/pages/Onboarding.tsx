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
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { BarChart3, Loader2, CheckCircle2 } from "lucide-react";

const onboardingSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(20, "Username must be at most 20 characters"),
  department: z.string().min(1, "Please select a department"),
  leetcode: z.string().optional(),
  codeforces: z.string().optional(),
  codechef: z.string().optional(),
}).refine((data) => data.leetcode || data.codeforces || data.codechef, {
  message: "At least one coding platform account is required",
  path: ["leetcode"],
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

const departments = [
  "CSE",
  "AI&DS",
  "CSE(AI&ML)",
  "CSBS",
  "IT",
  "ECE",
  "EEE",
  "MECH",
  "CIVIL",
];

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { user, updateUser, login } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const form = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      username: "",
      department: "",
      leetcode: "",
      codeforces: "",
      codechef: "",
    },
  });

  const checkUsernameMutation = useMutation({
    mutationFn: async (username: string) => {
      return await apiRequest("POST", "/api/auth/check-username", { username });
    },
    onSuccess: (response: any) => {
      setUsernameAvailable(response.available);
      if (response.available) {
        toast({
          title: "Username available!",
          description: "This username is ready to use.",
        });
      } else {
        toast({
          title: "Username taken",
          description: "Please choose a different username.",
          variant: "destructive",
        });
      }
    },
    onError: () => {
      setUsernameAvailable(null);
      toast({
        title: "Error",
        description: "Failed to check username availability.",
        variant: "destructive",
      });
    },
  });

  const onboardMutation = useMutation({
    mutationFn: async (data: OnboardingFormData) => {
      return await apiRequest("POST", "/api/auth/onboard", data);
    },
    onSuccess: (response: any) => {
      if (user && response.user) {
        // If a new token is provided (username changed), update it
        if (response.token) {
          login(response.token, response.user);
        } else {
          updateUser(response.user);
        }
        setLocation("/dashboard");
      }
      toast({
        title: "Welcome aboard!",
        description: "Your profile has been set up successfully.",
      });
    },
    onError: (error: any) => {
      if (error.message?.includes("already onboarded")) {
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

  const handleUsernameCheck = () => {
    const username = form.getValues("username");
    if (username && username.length >= 3) {
      setCheckingUsername(true);
      checkUsernameMutation.mutate(username);
      setCheckingUsername(false);
    }
  };

  const handleNextStep = async () => {
    if (step === 1) {
      const isValid = await form.trigger("username");
      if (isValid && usernameAvailable) {
        setStep(2);
      } else if (!usernameAvailable) {
        toast({
          title: "Username not available",
          description: "Please check username availability first.",
          variant: "destructive",
        });
      }
    } else if (step === 2) {
      const isValid = await form.trigger("department");
      if (isValid) {
        setStep(3);
      }
    }
  };

  const onSubmit = (data: OnboardingFormData) => {
    onboardMutation.mutate(data);
  };

  // Redirect if already onboarded
  useEffect(() => {
    if (user?.isOnboarded) {
      setLocation("/dashboard");
    }
  }, [user?.isOnboarded, setLocation]);

  if (user?.isOnboarded) {
    return null;
  }

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
              Step {step} of 3: {step === 1 ? "Choose Username" : step === 2 ? "Select Department" : "Connect Accounts"}
            </p>
          </div>

          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">
                {step === 1 && "Choose Your Username"}
                {step === 2 && "Select Your Department"}
                {step === 3 && "Connect Your Accounts"}
              </CardTitle>
              <CardDescription>
                {step === 1 && "Pick a unique username for your profile"}
                {step === 2 && "Tell us which department you belong to"}
                {step === 3 && "Add at least one coding platform username"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {step === 1 && (
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input 
                                placeholder="Choose a unique username" 
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  setUsernameAvailable(null);
                                }}
                              />
                            </FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleUsernameCheck}
                              disabled={checkingUsername || !field.value || field.value.length < 3}
                            >
                              {checkingUsername ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : usernameAvailable === true ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              ) : (
                                "Check"
                              )}
                            </Button>
                          </div>
                          {usernameAvailable === true && (
                            <FormDescription className="text-green-600">
                              Username is available!
                            </FormDescription>
                          )}
                          {usernameAvailable === false && (
                            <FormDescription className="text-destructive">
                              Username is already taken
                            </FormDescription>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {step === 2 && (
                    <FormField
                      control={form.control}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Department</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select your department" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {departments.map((dept) => (
                                <SelectItem key={dept} value={dept}>
                                  {dept}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {step === 3 && (
                    <>
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
                    </>
                  )}

                  <div className="flex gap-2">
                    {step > 1 && (
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={() => setStep(step - 1)}
                        className="flex-1"
                      >
                        Back
                      </Button>
                    )}
                    
                    {step < 3 ? (
                      <Button 
                        type="button"
                        onClick={handleNextStep}
                        className="flex-1"
                        disabled={step === 1 && !usernameAvailable}
                      >
                        Next
                      </Button>
                    ) : (
                      <Button 
                        type="submit" 
                        className="flex-1"
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
                    )}
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
