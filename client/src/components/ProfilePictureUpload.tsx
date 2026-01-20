import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface ProfilePictureUploadProps {
  currentAvatar?: string;
  username: string;
  size?: "sm" | "md" | "lg";
}

export function ProfilePictureUpload({ currentAvatar, username, size = "md" }: ProfilePictureUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch the user's current avatar from the API
  const { data: userData } = useQuery({
    queryKey: ["/api/auth/me"],
    enabled: !!user,
  });

  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32"
  };

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);

      const token = localStorage.getItem("token");
      const response = await fetch("/api/upload/profile-picture", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success!",
        description: "Profile picture updated successfully",
      });
      
      // Update the preview with the new avatar
      setPreview(data.avatarUrl);
      
      // Invalidate queries to refresh user data everywhere
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/student", username] });
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      
      // Force a page refresh after a short delay to ensure all components update
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload profile picture",
        variant: "destructive",
      });
      setPreview(null);
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload the file
    uploadMutation.mutate(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const initials = username.slice(0, 2).toUpperCase();
  // Use userData.avatar if available, otherwise fall back to preview or currentAvatar
  const displayAvatar = preview || userData?.avatar || currentAvatar;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative group">
        <Avatar className={`${sizeClasses[size]} border-2 border-border`}>
          <AvatarImage src={displayAvatar} alt={username} />
          <AvatarFallback className="bg-primary text-primary-foreground text-lg">
            {initials}
          </AvatarFallback>
        </Avatar>
        
        {/* Only show upload button if viewing own profile */}
        {user?.username === username && (
          <button
            onClick={handleClick}
            disabled={uploadMutation.isPending}
            className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            {uploadMutation.isPending ? (
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            ) : (
              <Camera className="w-6 h-6 text-white" />
            )}
          </button>
        )}
      </div>

      {user?.username === username && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleClick}
            disabled={uploadMutation.isPending}
            className="gap-2"
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload Photo
              </>
            )}
          </Button>
        </>
      )}
    </div>
  );
}
