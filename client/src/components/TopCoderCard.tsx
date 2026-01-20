import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Star, Target, Flame, ArrowRight } from "lucide-react";
import type { Student, StudentAnalytics } from "@shared/schema";

interface TopCoderCardProps {
  student: Student & { avatar?: string };
  analytics: StudentAnalytics;
}

export function TopCoderCard({ student, analytics }: TopCoderCardProps) {
  const initials = student.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="relative overflow-visible bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
      <div className="absolute -top-3 -right-3 w-16 h-16 bg-primary/10 rounded-full blur-2xl" />
      <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-primary/5 rounded-full blur-3xl" />
      
      <div className="relative p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/20">
            <Trophy className="w-4 h-4 text-amber-500" />
          </div>
          <h2 className="text-lg font-semibold">Top Coder of the Week</h2>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20 ring-4 ring-primary/20">
              <AvatarImage src={student.avatar} alt={student.name} />
              <AvatarFallback className={`${student.avatarColor || "bg-primary"} text-white font-semibold text-2xl`}>
                {initials}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <h3 className="text-2xl font-bold" data-testid="text-top-coder-name">
                {student.name}
              </h3>
              <p className="text-muted-foreground font-mono">@{student.username}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary">{student.dept}</Badge>
              </div>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="flex flex-col items-center p-3 rounded-lg bg-background/50">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/20 mb-2">
                <Target className="w-4 h-4 text-green-500" />
              </div>
              <span className="text-2xl font-bold" data-testid="text-top-coder-problems">
                {analytics.problemStats.total}
              </span>
              <span className="text-xs text-muted-foreground">Problems</span>
            </div>
            
            <div className="flex flex-col items-center p-3 rounded-lg bg-background/50">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20 mb-2">
                <Star className="w-4 h-4 text-blue-500" />
              </div>
              <span className="text-2xl font-bold" data-testid="text-top-coder-rating">
                {analytics.contestStats.currentRating}
              </span>
              <span className="text-xs text-muted-foreground">Rating</span>
            </div>
            
            <div className="flex flex-col items-center p-3 rounded-lg bg-background/50">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-500/20 mb-2">
                <Trophy className="w-4 h-4 text-purple-500" />
              </div>
              <span className="text-2xl font-bold" data-testid="text-top-coder-contests">
                {analytics.contestStats.totalContests}
              </span>
              <span className="text-xs text-muted-foreground">Contests</span>
            </div>
            
            <div className="flex flex-col items-center p-3 rounded-lg bg-background/50">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-500/20 mb-2">
                <Flame className="w-4 h-4 text-orange-500" />
              </div>
              <span className="text-2xl font-bold" data-testid="text-top-coder-badges">
                {analytics.badges.length}
              </span>
              <span className="text-xs text-muted-foreground">Badges</span>
            </div>
          </div>

          <Link href={`/student/${student.username}`}>
            <Button className="gap-2" data-testid="button-view-top-coder">
              View Profile
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
