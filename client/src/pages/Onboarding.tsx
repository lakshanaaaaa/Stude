import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { BarChart3, Loader2, CheckCircle2, GraduationCap, Users, Shield, Clock, XCircle } from "lucide-react";

// Student onboarding schema
const studentOnboardingSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(20, "Username must be at most 20 characters"),
  department: z.string().min(1, "Please select a department"),
  leetcode: z.string().optional(),
  codeforces: z.string().optional(),
  codechef: z.string().optional(),
}).refine((data) => data.leetcode || data.codeforces || data.codechef, {
  message: "At least one coding platform account is required",
  path: ["leetcode"],
});

// Role request schema
const roleRequestSchema = z.object({
  requestedRole: z.enum(["faculty", "admin"]),
  department: z.string().optional(),
  reason: z.string().min(10, "Please provide a reason (at least 10 characters)"),
}).refine((data) => {
  if (data.requestedRole === "faculty" && !data.department) {
    return false;
  }
  return true;
}, {
  message: "Department is required for faculty role",
  path: ["department"],
});

type StudentOnboardingData = z.infer<typeof studentOnboardingSchema>;
type RoleRequestData = z.infer<typeof roleRequestSchema>;

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

type SelectedRole = "student" | "faculty" | "admin" | null;

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { user, updateUser, login } = useAuth();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<SelectedRole>(null);
  const [step, setStep] = useState(1);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  // Check if user has a pending role request
  const { data: roleRequestStatus, isLoading: checkingRoleRequest } = useQuery({
    queryKey: ["/api/role-request/status"],
    enabled: !!user,
  });

  const studentForm = useForm<StudentOnboardingData>({
    resolver: zodResolver(studentOnboardingSchema),
    defaultValues: {
      username: "",
      department: "",
      leetcode: "",
      codeforces: "",
      codechef: "",
    },
  });

  const roleRequestForm = useForm<RoleRequestData>({
    resolver: zodResolver(roleRequestSchema),
    defaultValues: {
      requestedRole: "faculty",
      department: "",
      reason: "",
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
    mutationFn: async (data: StudentOnboardingData) => {
      return await apiRequest("POST", "/api/auth/onboard", data);
    },
    onSuccess: (response: any) => {
      if (user && response.user) {
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

  const roleRequestMutation = useMutation({
    mutationFn: async (data: RoleRequestData) => {
      return await apiRequest("POST", "/api/role-request", data);
    },
    onSuccess: () => {
      toast({
        title: "Request submitted!",
        description: "Your role request has been submitted. An admin will review it soon.",
      });
      // Refresh the status
      window.location.reload();
    },
    onError: (error: any) => {
      toast({
        title: "Request failed",
        description: error.message || "Failed to submit role request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleUsernameCheck = () => {
    const username = studentForm.getValues("username");
    if (username && username.length >= 3) {
      setCheckingUsername(true);
      checkUsernameMutation.mutate(username);
      setCheckingUsername(false);
    }
  };

  const handleNextStep = async () => {
    if (step === 2) {
      const isValid = await studentForm.trigger("username");
      if (isValid && usernameAvailable) {
        setStep(3);
      } else if (!usernameAvailable) {
        toast({
          title: "Username not available",
          description: "Please check username availability first.",
          variant: "destructive",
        });
      }
    } else if (step === 3) {
      const isValid = await studentForm.trigger("department");
      if (isValid) {
        setStep(4);
      }
    }
  };

  const onStudentSubmit = (data: StudentOnboardingData) => {
    onboardMutation.mutate(data);
  };

  const onRoleRequestSubmit = (data: RoleRequestData) => {
    roleRequestMutation.mutate(data);
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

  // Show loading while checking role request status
  if (checkingRoleRequest) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show pending request status
  const pendingRequest = roleRequestStatus?.request;
  if (pendingRequest && pendingRequest.status === "pending") {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-yellow-500 mb-6">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold">Request Pending</h1>
              <p className="text-muted-foreground mt-2">
                Your role request is being reviewed
              </p>
            </div>

            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-xl">Waiting for Approval</CardTitle>
                <CardDescription>
                  An admin will review your request soon
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Requested Role:</span>
                    <span className="font-medium capitalize">{pendingRequest.requestedRole}</span>
                  </div>
                  {pendingRequest.department && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Department:</span>
                      <span className="font-medium">{pendingRequest.department}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="font-medium text-yellow-600">Pending</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  You'll be notified once your request is approved. Please check back later.
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  // Show rejected request status
  if (pendingRequest && pendingRequest.status === "rejected") {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500 mb-6">
                <XCircle className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold">Request Rejected</h1>
              <p className="text-muted-foreground mt-2">
                Your role request was not approved
              </p>
            </div>

            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-xl">Continue as Student</CardTitle>
                <CardDescription>
                  You can still use CodeTrack as a student
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  Your request for {pendingRequest.requestedRole} role was rejected. 
                  You can continue with student onboarding.
                </p>
                <Button 
                  className="w-full" 
                  onClick={() => {
                    setSelectedRole("student");
                    setStep(2);
                  }}
                >
                  Continue as Student
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  // Step 1: Role Selection
  if (step === 1 && !selectedRole) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-2xl space-y-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-6">
                <BarChart3 className="w-8 h-8 text-primary-foreground" />
              </div>
              <h1 className="text-3xl font-bold">Welcome to CodeTrack</h1>
              <p className="text-muted-foreground mt-2">
                Select your role to get started
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Student Card */}
              <Card 
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => {
                  setSelectedRole("student");
                  setStep(2);
                }}
              >
                <CardHeader className="text-center pb-2">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-blue-500/10 mx-auto mb-2">
                    <GraduationCap className="w-6 h-6 text-blue-500" />
                  </div>
                  <CardTitle className="text-lg">Student</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription>
                    Track your coding progress across platforms
                  </CardDescription>
                </CardContent>
              </Card>

              {/* Faculty Card */}
              <Card 
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => {
                  setSelectedRole("faculty");
                  roleRequestForm.setValue("requestedRole", "faculty");
                }}
              >
                <CardHeader className="text-center pb-2">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-green-500/10 mx-auto mb-2">
                    <Users className="w-6 h-6 text-green-500" />
                  </div>
                  <CardTitle className="text-lg">Faculty</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription>
                    Monitor your department's students
                  </CardDescription>
                </CardContent>
              </Card>

              {/* Admin Card */}
              <Card 
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => {
                  setSelectedRole("admin");
                  roleRequestForm.setValue("requestedRole", "admin");
                }}
              >
                <CardHeader className="text-center pb-2">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-purple-500/10 mx-auto mb-2">
                    <Shield className="w-6 h-6 text-purple-500" />
                  </div>
                  <CardTitle className="text-lg">Admin</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription>
                    Manage users and system settings
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Faculty/Admin Role Request Form
  if (selectedRole === "faculty" || selectedRole === "admin") {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 ${
                selectedRole === "faculty" ? "bg-green-500" : "bg-purple-500"
              }`}>
                {selectedRole === "faculty" ? (
                  <Users className="w-8 h-8 text-white" />
                ) : (
                  <Shield className="w-8 h-8 text-white" />
                )}
              </div>
              <h1 className="text-3xl font-bold">
                Request {selectedRole === "faculty" ? "Faculty" : "Admin"} Access
              </h1>
              <p className="text-muted-foreground mt-2">
                Submit a request for admin approval
              </p>
            </div>

            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-xl">Role Request</CardTitle>
                <CardDescription>
                  An admin will review your request
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...roleRequestForm}>
                  <form onSubmit={roleRequestForm.handleSubmit(onRoleRequestSubmit)} className="space-y-4">
                    {selectedRole === "faculty" && (
                      <FormField
                        control={roleRequestForm.control}
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

                    <FormField
                      control={roleRequestForm.control}
                      name="reason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reason for Request</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder={`Why do you need ${selectedRole} access?`}
                              className="min-h-[100px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Provide details to help admin verify your request
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-2">
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setSelectedRole(null);
                          setStep(1);
                        }}
                        className="flex-1"
                      >
                        Back
                      </Button>
                      <Button 
                        type="submit" 
                        className="flex-1"
                        disabled={roleRequestMutation.isPending}
                      >
                        {roleRequestMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          "Submit Request"
                        )}
                      </Button>
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

  // Student Onboarding Flow (Steps 2-4)
  const totalSteps = 4;
  const currentStepLabel = step === 2 ? "Choose Username" : step === 3 ? "Select Department" : "Connect Accounts";

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
              Step {step - 1} of {totalSteps - 1}: {currentStepLabel}
            </p>
          </div>

          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">
                {step === 2 && "Choose Your Username"}
                {step === 3 && "Select Your Department"}
                {step === 4 && "Connect Your Accounts"}
              </CardTitle>
              <CardDescription>
                {step === 2 && "Pick a unique username for your profile"}
                {step === 3 && "Tell us which department you belong to"}
                {step === 4 && "Add at least one coding platform username"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...studentForm}>
                <form onSubmit={studentForm.handleSubmit(onStudentSubmit)} className="space-y-4">
                  {step === 2 && (
                    <FormField
                      control={studentForm.control}
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

                  {step === 3 && (
                    <FormField
                      control={studentForm.control}
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

                  {step === 4 && (
                    <>
                      <FormField
                        control={studentForm.control}
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
                        control={studentForm.control}
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
                        control={studentForm.control}
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
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (step === 2) {
                          setSelectedRole(null);
                          setStep(1);
                        } else {
                          setStep(step - 1);
                        }
                      }}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    
                    {step < 4 ? (
                      <Button 
                        type="button"
                        onClick={handleNextStep}
                        className="flex-1"
                        disabled={step === 2 && !usernameAvailable}
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
