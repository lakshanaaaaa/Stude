import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProfilePictureUpload } from "@/components/ProfilePictureUpload";
import { 
  Mail, 
  Linkedin, 
  Github, 
  FileText, 
  ExternalLink,
  ArrowLeft
} from "lucide-react";
import { Link } from "wouter";
import type { Student } from "@shared/schema";

interface ProfileHeaderProps {
  student: Student;
}

export function ProfileHeader({ student }: ProfileHeaderProps) {
  return (
    <div className="mb-8">
      <Link href="/dashboard">
        <Button variant="ghost" size="sm" className="gap-2 mb-6 -ml-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>
      </Link>

      <div className="flex flex-col md:flex-row md:items-start gap-6">
        <ProfilePictureUpload 
          currentAvatar={student.avatarColor} 
          username={student.username}
          size="lg"
        />

        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold" data-testid="text-student-name">
                {student.name}
              </h1>
              <p className="text-lg text-muted-foreground font-mono mt-1" data-testid="text-student-username">
                @{student.username}
              </p>
              
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <Badge variant="secondary" data-testid="text-student-dept">
                  {student.dept}
                </Badge>
                <Badge variant="outline" data-testid="text-student-regno">
                  {student.regNo}
                </Badge>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {student.email && (
                <Button 
                  variant="outline" 
                  size="icon" 
                  asChild
                  data-testid="link-email"
                >
                  <a href={`mailto:${student.email}`} title="Email">
                    <Mail className="w-4 h-4" />
                  </a>
                </Button>
              )}
              
              {student.linkedin && (
                <Button 
                  variant="outline" 
                  size="icon" 
                  asChild
                  data-testid="link-linkedin"
                >
                  <a href={student.linkedin} target="_blank" rel="noopener noreferrer" title="LinkedIn">
                    <Linkedin className="w-4 h-4" />
                  </a>
                </Button>
              )}
              
              {student.github && (
                <Button 
                  variant="outline" 
                  size="icon" 
                  asChild
                  data-testid="link-github"
                >
                  <a href={student.github} target="_blank" rel="noopener noreferrer" title="GitHub">
                    <Github className="w-4 h-4" />
                  </a>
                </Button>
              )}
              
              {student.resumeLink && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  asChild
                  data-testid="link-resume"
                >
                  <a href={student.resumeLink} target="_blank" rel="noopener noreferrer">
                    <FileText className="w-4 h-4" />
                    Resume
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </Button>
              )}
            </div>
          </div>

          {student.email && (
            <p className="text-sm text-muted-foreground mt-4" data-testid="text-student-email">
              {student.email}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
