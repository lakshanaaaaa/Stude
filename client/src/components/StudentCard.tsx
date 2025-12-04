import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ExternalLink } from "lucide-react";
import type { Student } from "@shared/schema";

interface StudentCardProps {
  student: Student;
}

export function StudentCard({ student }: StudentCardProps) {
  const initials = student.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Link href={`/student/${student.username}`}>
      <a className="block group" data-testid={`card-student-${student.username}`}>
        <Card className="p-4 h-full transition-all duration-200 hover-elevate active-elevate-2 cursor-pointer">
          <div className="flex items-start gap-4">
            <Avatar className="w-14 h-14 flex-shrink-0">
              <AvatarFallback className={`${student.avatarColor || "bg-primary"} text-white font-medium text-lg`}>
                {initials}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-base truncate" data-testid={`text-name-${student.username}`}>
                    {student.name}
                  </h3>
                  <p className="text-sm text-muted-foreground font-mono" data-testid={`text-username-${student.username}`}>
                    @{student.username}
                  </p>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
              </div>
              
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <Badge variant="secondary" className="text-xs">
                  {student.dept}
                </Badge>
                {student.mainAccounts.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {student.mainAccounts.length} Platform{student.mainAccounts.length > 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </Card>
      </a>
    </Link>
  );
}
