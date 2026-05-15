import React, { useState } from 'react';
import { NavigationBar } from "@/components/NavigationBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, User, Trophy } from "lucide-react";

interface MatchResult {
  studentId: string;
  name: string;
  score: number;
  reason: string;
  analytics?: any;
}

export default function JDMatcher() {
  const [jd, setJd] = useState('');
  const [topN, setTopN] = useState(3);
  const [results, setResults] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const resp = await fetch('/api/match', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ jd, topN }),
      });
      const data = await resp.json();
      setResults(data.matches || []);
    } catch (err) {
      console.error('Match request failed', err);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <div className="min-h-screen bg-background">
      <NavigationBar />
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Search className="w-8 h-8" />
            JD Matcher
          </h1>
          <p className="text-muted-foreground mt-2">
            Find the best student candidates for your job description
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Form */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Job Description</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="jd">Job Description</Label>
                    <Textarea
                      id="jd"
                      value={jd}
                      onChange={(e) => setJd(e.target.value)}
                      rows={8}
                      placeholder="Paste the job description here..."
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="topN">Top N Results</Label>
                    <Input
                      id="topN"
                      type="number"
                      value={topN}
                      min={1}
                      max={20}
                      onChange={(e) => setTopN(parseInt(e.target.value, 10) || 1)}
                      className="mt-1 w-24"
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    disabled={loading || !jd.trim()}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Matching...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Find Candidates
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {results.length > 0 && (
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Top Candidates ({results.length})
                </h2>
              )}
              
              {results.map((result) => (
                <Card key={result.studentId} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{result.name}</h3>
                          <p className="text-sm text-muted-foreground">Student ID: {result.studentId}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${getScoreColor(result.score)}`}>
                          {result.score}%
                        </div>
                        <div className="text-xs text-muted-foreground">Match Score</div>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground mb-2">Matching Reason:</p>
                      <p className="text-sm">{result.reason}</p>
                    </div>

                    {result.analytics && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                        <div className="text-center">
                          <div className="text-lg font-semibold text-primary">
                            {result.analytics.performanceMetrics.problemSolvingScore}
                          </div>
                          <div className="text-xs text-muted-foreground">Problem Solving</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-primary">
                            {result.analytics.activityMetrics.recentActivityScore}
                          </div>
                          <div className="text-xs text-muted-foreground">Activity Score</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-primary">
                            {result.analytics.projectMetrics.projectCount}
                          </div>
                          <div className="text-xs text-muted-foreground">Projects</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-primary">
                            {result.analytics.normalizedSkills.length}
                          </div>
                          <div className="text-xs text-muted-foreground">Skills</div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              
              {results.length === 0 && !loading && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Search className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">
                      Enter a job description to find matching candidates
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}