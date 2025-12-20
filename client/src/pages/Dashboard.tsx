import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { NavigationBar } from "@/components/NavigationBar";
import { StudentCard } from "@/components/StudentCard";
import { TopCoderCard } from "@/components/TopCoderCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Users, Filter } from "lucide-react";
import { generateStudentAnalytics, getTopCoder } from "@/lib/dummyData";
import type { Student } from "@shared/schema";

const departments = ["All", "CSE", "CSBS", "AI&DS", "CSE(AI&ML)"];

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("All");

  const { data: students, isLoading } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  const topCoder = useMemo(() => {
    if (!students || students.length === 0) return null;
    return getTopCoder(students);
  }, [students]);

  const topCoderAnalytics = useMemo(() => {
    if (!topCoder) return null;
    return generateStudentAnalytics();
  }, [topCoder]);

  const filteredStudents = useMemo(() => {
    if (!students) return [];
    
    return students.filter((student) => {
      const matchesSearch = 
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.username.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesDept = selectedDept === "All" || student.dept === selectedDept;
      
      return matchesSearch && matchesDept;
    });
  }, [students, searchQuery, selectedDept]);

  return (
    <div className="min-h-screen bg-background">
      <NavigationBar />
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="space-y-8">
            <Skeleton className="h-48 w-full rounded-lg" />
            <div className="flex gap-4">
              <Skeleton className="h-10 flex-1 max-w-sm" />
              <Skeleton className="h-10 w-32" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-lg" />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {topCoder && topCoderAnalytics && (
              <section>
                <TopCoderCard student={topCoder} analytics={topCoderAnalytics} />
              </section>
            )}

            <section>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search students by name or username..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <Select value={selectedDept} onValueChange={setSelectedDept}>
                    <SelectTrigger className="w-32" data-testid="select-department-filter">
                      <SelectValue placeholder="Department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">
                  All Students
                  <span className="text-muted-foreground font-normal ml-2">
                    ({filteredStudents.length})
                  </span>
                </h2>
              </div>

              {filteredStudents.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">
                      {searchQuery || selectedDept !== "All"
                        ? "No students found matching your criteria"
                        : "No students available"}
                    </p>
                    {(searchQuery || selectedDept !== "All") && (
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => {
                          setSearchQuery("");
                          setSelectedDept("All");
                        }}
                        data-testid="button-clear-filters"
                      >
                        Clear filters
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredStudents.map((student) => (
                    <StudentCard key={student.id} student={student} />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
