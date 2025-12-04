import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import type { CodingAccount, CodingPlatform } from "@shared/schema";

const platformColors: Record<CodingPlatform, string> = {
  LeetCode: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  CodeChef: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  CodeForces: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  GeeksforGeeks: "bg-green-500/10 text-green-600 dark:text-green-400",
  HackerRank: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  CodeStudio: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
};

const platformUrls: Record<CodingPlatform, (username: string) => string> = {
  LeetCode: (u) => `https://leetcode.com/${u}`,
  CodeChef: (u) => `https://codechef.com/users/${u}`,
  CodeForces: (u) => `https://codeforces.com/profile/${u}`,
  GeeksforGeeks: (u) => `https://auth.geeksforgeeks.org/user/${u}`,
  HackerRank: (u) => `https://hackerrank.com/${u}`,
  CodeStudio: (u) => `https://codestudio.com/profile/${u}`,
};

interface AccountCardProps {
  title: string;
  accounts: CodingAccount[];
  variant?: "main" | "sub";
}

export function AccountCard({ title, accounts, variant = "main" }: AccountCardProps) {
  if (accounts.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          {title}
          <Badge variant="secondary" className="text-xs font-normal">
            {accounts.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`flex flex-wrap gap-2 ${variant === "sub" ? "gap-2" : "gap-3"}`}>
          {accounts.map((account, index) => (
            <Button
              key={`${account.platform}-${index}`}
              variant="outline"
              size={variant === "sub" ? "sm" : "default"}
              className={`gap-2 ${platformColors[account.platform]}`}
              asChild
              data-testid={`link-account-${account.platform.toLowerCase()}-${index}`}
            >
              <a
                href={platformUrls[account.platform](account.username)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="font-medium">{account.platform}</span>
                <span className="font-mono text-xs opacity-80">@{account.username}</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
