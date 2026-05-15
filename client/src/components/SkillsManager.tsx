import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, X, Wand2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface SkillsManagerProps {
  username: string;
  skills: string[];
  canEdit: boolean;
}

export function SkillsManager({ username, skills, canEdit }: SkillsManagerProps) {
  const [localSkills, setLocalSkills] = useState<string[]>(skills || []);
  const [newSkill, setNewSkill] = useState("");
  const [extractText, setExtractText] = useState("");
  const [showExtractor, setShowExtractor] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateSkillsMutation = useMutation({
    mutationFn: async (updatedSkills: string[]) => {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/student/${username}/skills`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ skills: updatedSkills }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update skills");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/student", username] });
      toast({
        title: "Success",
        description: "Skills updated successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const extractSkillsMutation = useMutation({
    mutationFn: async (text: string) => {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/student/${username}/extract-skills`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to extract skills");
      }
      return response.json();
    },
    onSuccess: (data) => {
      const extractedSkills = data.skills || [];
      const combinedSkills = [...new Set([...localSkills, ...extractedSkills])];
      setLocalSkills(combinedSkills);
      setExtractText("");
      setShowExtractor(false);
      toast({
        title: "Skills Extracted",
        description: `Found ${extractedSkills.length} new skills from the text.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addSkill = () => {
    if (newSkill.trim() && !localSkills.includes(newSkill.trim())) {
      const updatedSkills = [...localSkills, newSkill.trim()];
      setLocalSkills(updatedSkills);
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    const updatedSkills = localSkills.filter(skill => skill !== skillToRemove);
    setLocalSkills(updatedSkills);
  };

  const saveSkills = () => {
    updateSkillsMutation.mutate(localSkills);
  };

  const extractSkills = () => {
    if (extractText.trim()) {
      extractSkillsMutation.mutate(extractText.trim());
    }
  };

  const hasChanges = JSON.stringify(localSkills.sort()) !== JSON.stringify((skills || []).sort());

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Skills
          {canEdit && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExtractor(!showExtractor)}
                className="gap-2"
              >
                <Wand2 className="w-4 h-4" />
                Extract from Text
              </Button>
              {hasChanges && (
                <Button
                  size="sm"
                  onClick={saveSkills}
                  disabled={updateSkillsMutation.isPending}
                >
                  Save Changes
                </Button>
              )}
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showExtractor && canEdit && (
          <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
            <div>
              <label className="text-sm font-medium">Paste resume text or project descriptions:</label>
              <Textarea
                value={extractText}
                onChange={(e) => setExtractText(e.target.value)}
                placeholder="Paste your resume content, project descriptions, or any text containing skills..."
                className="mt-1"
                rows={4}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={extractSkills}
                disabled={!extractText.trim() || extractSkillsMutation.isPending}
                size="sm"
              >
                {extractSkillsMutation.isPending ? "Extracting..." : "Extract Skills"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExtractor(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {canEdit && (
          <div className="flex gap-2">
            <Input
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              placeholder="Add a skill (e.g., React, Python, DSA)"
              onKeyPress={(e) => e.key === "Enter" && addSkill()}
            />
            <Button onClick={addSkill} size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Add
            </Button>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {localSkills.length > 0 ? (
            localSkills.map((skill) => (
              <Badge key={skill} variant="secondary" className="gap-1">
                {skill}
                {canEdit && (
                  <button
                    onClick={() => removeSkill(skill)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </Badge>
            ))
          ) : (
            <p className="text-muted-foreground text-sm">
              {canEdit ? "No skills added yet. Add some skills to improve JD matching." : "No skills listed."}
            </p>
          )}
        </div>

        {canEdit && localSkills.length > 0 && (
          <p className="text-xs text-muted-foreground">
            💡 These skills help match you with relevant job descriptions and internship opportunities.
          </p>
        )}
      </CardContent>
    </Card>
  );
}