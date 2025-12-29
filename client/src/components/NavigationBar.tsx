import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { 
  BarChart3, 
  LogOut, 
  Moon, 
  Sun, 
  User,
  Edit3,
  Home,
  Shield
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function NavigationBar() {
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [location, setLocation] = useLocation();

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  if (!isAuthenticated) {
    return null;
  }

  const initials = user?.username?.slice(0, 2).toUpperCase() || "U";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3 hover-elevate active-elevate-2 rounded-md px-2 py-1 cursor-pointer" onClick={() => setLocation("/dashboard")}>
            <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary">
              <BarChart3 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg hidden sm:inline-block" data-testid="text-app-name">
              CodeTrack
            </span>
          </div>

          <nav className="flex items-center gap-2">
            <Button 
              variant={location === "/dashboard" ? "secondary" : "ghost"} 
              size="sm"
              className="gap-2"
              data-testid="link-dashboard"
              onClick={() => setLocation("/dashboard")}
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>

            {user?.role === "admin" && (
              <Button 
                variant={location === "/admin" ? "secondary" : "ghost"} 
                size="sm"
                className="gap-2"
                data-testid="link-admin"
                onClick={() => setLocation("/admin")}
              >
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Admin</span>
              </Button>
            )}

            {user?.role === "faculty" && (
              <Button 
                variant={location === "/faculty" ? "secondary" : "ghost"} 
                size="sm"
                className="gap-2"
                data-testid="link-faculty"
                onClick={() => setLocation("/faculty")}
              >
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">My Department</span>
              </Button>
            )}

            {user?.role === "student" && (
              <Button 
                variant={location === "/edit-profile" ? "secondary" : "ghost"} 
                size="sm"
                className="gap-2"
                data-testid="link-edit-profile"
                onClick={() => setLocation("/edit-profile")}
              >
                <Edit3 className="w-4 h-4" />
                <span className="hidden sm:inline">Edit Profile</span>
              </Button>
            )}
          </nav>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              data-testid="button-theme-toggle"
            >
              {theme === "light" ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="relative gap-2 px-2"
                  data-testid="button-user-menu"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline-block text-sm font-medium">
                    {user?.username}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user?.username}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                </div>
                <DropdownMenuSeparator />
                {user?.role === "student" && (
                  <>
                    <DropdownMenuItem 
                      onClick={() => setLocation(`/student/${user.username}`)}
                      className="flex items-center gap-2 cursor-pointer" 
                      data-testid="link-my-profile"
                    >
                      <User className="w-4 h-4" />
                      My Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setLocation("/edit-profile")}
                      className="flex items-center gap-2 cursor-pointer" 
                      data-testid="link-edit-settings"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="text-destructive focus:text-destructive cursor-pointer"
                  data-testid="button-logout"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
