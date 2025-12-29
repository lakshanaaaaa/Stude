import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const userStr = params.get("user");
    const error = params.get("error");

    if (error) {
      setLocation("/login?error=" + error);
      return;
    }

    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));
        login(token, user);
        
        // Redirect based on onboarding status
        if (user.role === "student" && !user.isOnboarded) {
          setLocation("/onboarding");
        } else {
          setLocation("/dashboard");
        }
      } catch (error) {
        console.error("Failed to parse user data:", error);
        setLocation("/login?error=invalid_data");
      }
    } else {
      setLocation("/login?error=missing_data");
    }
  }, [login, setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
}
