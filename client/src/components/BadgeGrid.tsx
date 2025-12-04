import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge as BadgeUI } from "@/components/ui/badge";
import { Award, Target, Trophy, Flame, Sun, Moon, Zap, Star } from "lucide-react";
import type { Badge, CodingPlatform } from "@shared/schema";

const iconMap: Record<string, typeof Award> = {
  target: Target,
  trophy: Trophy,
  flame: Flame,
  sun: Sun,
  moon: Moon,
  zap: Zap,
  star: Star,
  award: Award,
};

const platformColors: Record<CodingPlatform, string> = {
  LeetCode: "from-amber-500/20 to-amber-600/10 border-amber-500/30",
  CodeChef: "from-orange-500/20 to-orange-600/10 border-orange-500/30",
  CodeForces: "from-blue-500/20 to-blue-600/10 border-blue-500/30",
  GeeksforGeeks: "from-green-500/20 to-green-600/10 border-green-500/30",
  HackerRank: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30",
  CodeStudio: "from-purple-500/20 to-purple-600/10 border-purple-500/30",
};

const platformTextColors: Record<CodingPlatform, string> = {
  LeetCode: "text-amber-600 dark:text-amber-400",
  CodeChef: "text-orange-600 dark:text-orange-400",
  CodeForces: "text-blue-600 dark:text-blue-400",
  GeeksforGeeks: "text-green-600 dark:text-green-400",
  HackerRank: "text-emerald-600 dark:text-emerald-400",
  CodeStudio: "text-purple-600 dark:text-purple-400",
};

interface BadgeGridProps {
  badges: Badge[];
}

export function BadgeGrid({ badges }: BadgeGridProps) {
  if (badges.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Achievements & Badges</h2>
        <Card>
          <CardContent className="p-8 text-center">
            <Award className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No badges earned yet</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const groupedBadges = badges.reduce((acc, badge) => {
    if (!acc[badge.platform]) {
      acc[badge.platform] = [];
    }
    acc[badge.platform].push(badge);
    return acc;
  }, {} as Record<CodingPlatform, Badge[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Achievements & Badges</h2>
        <BadgeUI variant="secondary" className="text-xs">
          {badges.length} Total
        </BadgeUI>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {badges.map((badge) => {
          const IconComponent = iconMap[badge.icon] || Award;
          
          return (
            <Card 
              key={badge.id}
              className={`bg-gradient-to-br ${platformColors[badge.platform]} hover-elevate`}
              data-testid={`badge-${badge.id}`}
            >
              <CardContent className="p-4 text-center">
                <div className={`mx-auto w-12 h-12 rounded-full bg-background/50 flex items-center justify-center mb-3`}>
                  <IconComponent className={`w-6 h-6 ${platformTextColors[badge.platform]}`} />
                </div>
                <h4 className="font-medium text-sm truncate" title={badge.name}>
                  {badge.name}
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {badge.platform}
                </p>
                <div className="flex items-center justify-center gap-0.5 mt-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Star 
                      key={i}
                      className={`w-3 h-3 ${i < badge.level ? platformTextColors[badge.platform] : "text-muted-foreground/30"}`}
                      fill={i < badge.level ? "currentColor" : "none"}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-muted-foreground">By Platform</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(groupedBadges).map(([platform, platformBadges]) => (
            <Card key={platform}>
              <CardHeader className="pb-2">
                <CardTitle className={`text-base ${platformTextColors[platform as CodingPlatform]}`}>
                  {platform}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {platformBadges.map((badge) => {
                    const IconComponent = iconMap[badge.icon] || Award;
                    return (
                      <BadgeUI 
                        key={badge.id} 
                        variant="secondary" 
                        className="gap-1"
                      >
                        <IconComponent className="w-3 h-3" />
                        {badge.name}
                      </BadgeUI>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
