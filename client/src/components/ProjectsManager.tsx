import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Save, X, ExternalLink, Github } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { Project } from "@shared/schema";
import React from "react";

interface ProjectsManagerProps {
  username: string;
  projects: Project[];
  canEdit: boolean;
}

interface ProjectFormData {
  name: string;
  techStack: string[];
  domain: string;
  impactScore: number;
  description: string;
  githubUrl: string;
  liveUrl: string;
}

export function ProjectsManager({ username, projects, canEdit }: ProjectsManagerProps) {
  const [localProjects, setLocalProjects] = useState<Project[]>(projects || []);
  const [editingProject, setEditingProject] = useState<number | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState<ProjectFormData>({
    name: "",
    techStack: [],
    domain: "",
    impactScore: 75,
    description: "",
    githubUrl: "",
    liveUrl: "",
  });
  const [newTech, setNewTech] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateProjectsMutation = useMutation({
    mutationFn: async (updatedProjects: Project[]) => {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/student/${username}/projects`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ projects: updatedProjects }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update projects");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/student", username] });
      toast({
        title: "Success",
        description: "Projects updated successfully!",
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

  const resetForm = () => {
    setFormData({
      name: "",
      techStack: [],
      domain: "",
      impactScore: 75,
      description: "",
      githubUrl: "",
      liveUrl: "",
    });
    setNewTech("");
  };

  const addTechToStack = useCallback((e?: React.KeyboardEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (newTech.trim() && !formData.techStack.includes(newTech.trim())) {
      setFormData(prev => ({
        ...prev,
        techStack: [...prev.techStack, newTech.trim()]
      }));
      setNewTech("");
    }
  }, [newTech, formData.techStack]);

  const removeTechFromStack = useCallback((tech: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setFormData(prev => ({
      ...prev,
      techStack: prev.techStack.filter(t => t !== tech)
    }));
  }, []);

  const addProject = () => {
    if (formData.name.trim() && formData.domain.trim() && formData.techStack.length > 0) {
      const newProject: Project = {
        name: formData.name.trim(),
        techStack: formData.techStack,
        domain: formData.domain.trim(),
        impactScore: formData.impactScore,
        description: formData.description.trim(),
        githubUrl: formData.githubUrl.trim(),
        liveUrl: formData.liveUrl.trim(),
      };
      
      const updatedProjects = [...localProjects, newProject];
      setLocalProjects(updatedProjects);
      updateProjectsMutation.mutate(updatedProjects);
      
      resetForm();
      setShowAddDialog(false);
    }
  };

  const editProject = (index: number) => {
    const project = localProjects[index];
    setFormData({
      name: project.name,
      techStack: [...project.techStack],
      domain: project.domain,
      impactScore: project.impactScore,
      description: project.description || "",
      githubUrl: project.githubUrl || "",
      liveUrl: project.liveUrl || "",
    });
    setEditingProject(index);
  };

  const saveProject = () => {
    if (editingProject !== null && formData.name.trim() && formData.domain.trim() && formData.techStack.length > 0) {
      const updatedProject: Project = {
        name: formData.name.trim(),
        techStack: formData.techStack,
        domain: formData.domain.trim(),
        impactScore: formData.impactScore,
        description: formData.description.trim(),
        githubUrl: formData.githubUrl.trim(),
        liveUrl: formData.liveUrl.trim(),
      };
      
      const updatedProjects = [...localProjects];
      updatedProjects[editingProject] = updatedProject;
      setLocalProjects(updatedProjects);
      updateProjectsMutation.mutate(updatedProjects);
      
      resetForm();
      setEditingProject(null);
    }
  };

  const deleteProject = (index: number) => {
    const updatedProjects = localProjects.filter((_, i) => i !== index);
    setLocalProjects(updatedProjects);
    updateProjectsMutation.mutate(updatedProjects);
  };

interface ProjectFormProps {
  formData: ProjectFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProjectFormData>>;
  newTech: string;
  setNewTech: React.Dispatch<React.SetStateAction<string>>;
  addTechToStack: (e?: React.KeyboardEvent) => void;
  removeTechFromStack: (tech: string, e?: React.MouseEvent) => void;
}

const ProjectForm = React.memo(({ 
  formData, 
  setFormData, 
  newTech, 
  setNewTech, 
  addTechToStack, 
  removeTechFromStack 
}: ProjectFormProps) => (
  <div className="space-y-4">
    <div>
      <label className="text-sm font-medium block mb-1">Project Name *</label>
      <Input
        value={formData.name}
        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
        placeholder="e.g., TapRide, Student Analytics Dashboard"
        autoComplete="off"
      />
    </div>

    <div>
      <label className="text-sm font-medium block mb-1">Domain *</label>
      <Input
        value={formData.domain}
        onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
        placeholder="e.g., Smart Transport, Education Technology, E-commerce"
        autoComplete="off"
      />
    </div>

    <div>
      <label className="text-sm font-medium block mb-1">Tech Stack *</label>
      <div className="flex gap-2 mb-2">
        <Input
          value={newTech}
          onChange={(e) => setNewTech(e.target.value)}
          placeholder="Add technology (e.g., React, Node.js)"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTechToStack(e);
            }
          }}
          autoComplete="off"
        />
        <Button 
          onClick={(e) => {
            e.preventDefault();
            addTechToStack();
          }} 
          size="sm" 
          type="button"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-1">
        {formData.techStack.map((tech) => (
          <Badge key={tech} variant="secondary" className="gap-1">
            {tech}
            <button 
              onClick={(e) => {
                e.preventDefault();
                removeTechFromStack(tech, e);
              }} 
              type="button"
              className="hover:bg-destructive/20 rounded-sm"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>

    <div>
      <label className="text-sm font-medium block mb-1">Impact Score (0-100)</label>
      <Input
        type="number"
        min="0"
        max="100"
        value={formData.impactScore}
        onChange={(e) => setFormData(prev => ({ ...prev, impactScore: parseInt(e.target.value) || 0 }))}
        autoComplete="off"
      />
    </div>

    <div>
      <label className="text-sm font-medium block mb-1">Description</label>
      <Textarea
        value={formData.description}
        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
        placeholder="Brief description of the project and its impact"
        rows={3}
        autoComplete="off"
      />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="text-sm font-medium block mb-1">GitHub URL</label>
        <Input
          value={formData.githubUrl}
          onChange={(e) => setFormData(prev => ({ ...prev, githubUrl: e.target.value }))}
          placeholder="https://github.com/username/project"
          autoComplete="off"
        />
      </div>
      <div>
        <label className="text-sm font-medium block mb-1">Live URL</label>
        <Input
          value={formData.liveUrl}
          onChange={(e) => setFormData(prev => ({ ...prev, liveUrl: e.target.value }))}
          placeholder="https://project-demo.com"
          autoComplete="off"
        />
      </div>
    </div>
  </div>
));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Projects
          {canEdit && (
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Project
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Project</DialogTitle>
                </DialogHeader>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  addProject();
                }}>
                  <ProjectForm 
                    formData={formData}
                    setFormData={setFormData}
                    newTech={newTech}
                    setNewTech={setNewTech}
                    addTechToStack={addTechToStack}
                    removeTechFromStack={removeTechFromStack}
                  />
                  <div className="flex gap-2 justify-end pt-4">
                    <Button 
                      variant="outline" 
                      onClick={(e) => {
                        e.preventDefault();
                        setShowAddDialog(false);
                        resetForm();
                      }}
                      type="button"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={updateProjectsMutation.isPending || !formData.name.trim() || !formData.domain.trim() || formData.techStack.length === 0}
                    >
                      {updateProjectsMutation.isPending ? "Adding..." : "Add Project"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {localProjects.length > 0 ? (
          <div className="space-y-4">
            {localProjects.map((project, index) => (
              <div key={index} className="border rounded-lg p-4">
                {editingProject === index ? (
                  <div className="space-y-4">
                    <ProjectForm 
                      formData={formData}
                      setFormData={setFormData}
                      newTech={newTech}
                      setNewTech={setNewTech}
                      addTechToStack={addTechToStack}
                      removeTechFromStack={removeTechFromStack}
                    />
                    <div className="flex gap-2 pt-4">
                      <Button 
                        onClick={(e) => {
                          e.preventDefault();
                          saveProject();
                        }} 
                        size="sm" 
                        className="gap-2"
                        disabled={updateProjectsMutation.isPending || !formData.name.trim() || !formData.domain.trim() || formData.techStack.length === 0}
                        type="button"
                      >
                        <Save className="w-4 h-4" />
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        onClick={(e) => {
                          e.preventDefault();
                          setEditingProject(null);
                          resetForm();
                        }}
                        size="sm"
                        type="button"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-lg">{project.name}</h4>
                        <p className="text-sm text-muted-foreground">{project.domain}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Score: {project.impactScore}</Badge>
                        {canEdit && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => editProject(index)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteProject(index)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-3">
                      {project.techStack.map((tech) => (
                        <Badge key={tech} variant="secondary" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                    </div>

                    {project.description && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {project.description}
                      </p>
                    )}

                    <div className="flex gap-2">
                      {project.githubUrl && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="gap-2">
                            <Github className="w-4 h-4" />
                            Code
                          </a>
                        </Button>
                      )}
                      {project.liveUrl && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="gap-2">
                            <ExternalLink className="w-4 h-4" />
                            Live Demo
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            {canEdit ? "No projects added yet. Add some projects to showcase your work." : "No projects listed."}
          </p>
        )}

        {canEdit && localProjects.length > 0 && (
          <p className="text-xs text-muted-foreground mt-4">
            💡 Projects help demonstrate your practical experience and technical skills to potential employers.
          </p>
        )}
      </CardContent>
    </Card>
  );
}