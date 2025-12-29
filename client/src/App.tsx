import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import AuthCallback from "@/pages/AuthCallback";
import Onboarding from "@/pages/Onboarding";
import Dashboard from "@/pages/Dashboard";
import StudentProfile from "@/pages/StudentProfile";
import EditProfile from "@/pages/EditProfile";
import AdminDashboard from "@/pages/AdminDashboard";
import FacultyDashboard from "@/pages/FacultyDashboard";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

function ProtectedRoute({ component: Component, allowedRoles }: { component: () => JSX.Element; allowedRoles?: string[] }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, setLocation] = useLocation();
  const [location] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/login");
      return;
    }
    
    if (!isLoading && isAuthenticated && user) {
      // Only redirect to onboarding if user is not onboarded AND not already on onboarding page
      if (user.role === "student" && !user.isOnboarded && location !== "/onboarding") {
        setLocation("/onboarding");
        return;
      }
      
      // Check role permissions
      if (allowedRoles && !allowedRoles.includes(user.role)) {
        setLocation("/dashboard");
        return;
      }
    }
  }, [isLoading, isAuthenticated, user, allowedRoles, setLocation, location]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Block access if role not allowed
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return null;
  }

  // Block access to non-onboarding pages for non-onboarded students
  if (user?.role === "student" && !user?.isOnboarded && location !== "/onboarding") {
    return null;
  }

  return <Component />;
}

function PublicRoute({ component: Component }: { component: () => JSX.Element }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      if (user?.role === "student" && !user?.isOnboarded) {
        setLocation("/onboarding");
      } else {
        setLocation("/dashboard");
      }
    }
  }, [isLoading, isAuthenticated, user, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/">
        <Redirect to="/login" />
      </Route>
      <Route path="/login">
        <PublicRoute component={Login} />
      </Route>
      <Route path="/auth/callback" component={AuthCallback} />
      <Route path="/onboarding">
        <ProtectedRoute component={Onboarding} />
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/student/:username">
        <ProtectedRoute component={StudentProfile} />
      </Route>
      <Route path="/edit-profile">
        <ProtectedRoute component={EditProfile} />
      </Route>
      <Route path="/admin">
        <ProtectedRoute component={AdminDashboard} allowedRoles={["admin"]} />
      </Route>
      <Route path="/faculty">
        <ProtectedRoute component={FacultyDashboard} allowedRoles={["faculty"]} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
