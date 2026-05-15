import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, X, FileText, User, Briefcase } from "lucide-react";

interface ManualDataCollectionProps {
  username: string;
  onDataCollected: (data: {
    skills: string[];
    domains: string[];
    projects: any[];
    experience: string;
    achievements: string;
  }) => void;
}

const skillCategories = {
  "Programming Languages": [
    "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "Go", "Rust", 
    "PHP", "Ruby", "Swift", "Kotlin", "Dart", "C", "Scala"
  ],
  "Frontend Development": [
    "React", "Vue.js", "Angular", "HTML", "CSS", "SASS", "Tailwind CSS", 
    "Bootstrap", "jQuery", "Next.js", "Nuxt.js", "Svelte"
  ],
  "Backend Development": [
    "Node.js", "Express.js", "Django", "Flask", "Spring Boot", "ASP.NET", 
    "Laravel", "Ruby on Rails", "FastAPI", "NestJS"
  ],
  "Mobile Development": [
    "React Native", "Flutter", "Android", "iOS", "Xamarin", "Ionic"
  ],
  "Databases": [
    "MongoDB", "PostgreSQL", "MySQL", "Redis", "SQLite", "Firebase", 
    "DynamoDB", "Cassandra", "Oracle"
  ],
  "Cloud & DevOps": [
    "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Jenkins", "Git", 
    "GitHub Actions", "Terraform", "Ansible"
  ],
  "Data Science & AI": [
    "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "Pandas", 
    "NumPy", "Scikit-learn", "OpenCV", "NLP", "Computer Vision"
  ],
  "Other": [
    "DSA", "System Design", "GraphQL", "REST API", "Microservices", 
    "Blockchain", "IoT", "Cybersecurity", "Testing", "Agile"
  ]
};

const domainOptions = [
  "Web Development", "Mobile App Development", "Data Science & Analytics",
  "Machine Learning & AI", "Cloud Computing", "Cybersecurity", "Game Development",
  "IoT & Embedded Systems", "Blockchain & Cryptocurrency", "E-commerce",
  "FinTech", "HealthTech", "EdTech", "Social Media & Networking",
  "Enterprise Software", "DevOps & Infrastructure", "UI/UX Design",
  "Quality Assurance", "Research & Development", "Consulting & Strategy"
];

export function ManualDataCollection({ username, onDataCollected }: ManualDataCollectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [experience, setExperience] = useState("");
  const [achievements, setAchievements] = useState("");
  const [projects, setProjects] = useState<any[]>([]);
  const [currentProject, setCurrentProject] = useState({
    name: "",
    description: "",
    techStack: "",
    domain: "",
    githubUrl: "",
    liveUrl: ""
  });
  const { toast } = useToast();

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const toggleDomain = (domain: string) => {
    setSelectedDomains(prev =>
      prev.includes(domain)
        ? prev.filter(d => d !== domain)
        : [...prev, domain]
    );
  };

  const addCustomSkill = () => {
    if (customSkill.trim() && !selectedSkills.includes(customSkill.trim())) {
      setSelectedSkills([...selectedSkills, customSkill.trim()]);
      setCustomSkill("");
    }
  };

  const addCustomDomain = () => {
    if (customDomain.trim() && !selectedDomains.includes(customDomain.trim())) {
      setSelectedDomains([...selectedDomains, customDomain.trim()]);
      setCustomDomain("");
    }
  };

  const addProject = () => {
    if (currentProject.name.trim() && currentProject.description.trim()) {
      const project = {
        name: currentProject.name.trim(),
        description: currentProject.description.trim(),
        techStack: currentProject.techStack.split(',').map(t => t.trim()).filter(t => t),
        domain: currentProject.domain.trim() || "General",
        impactScore: 75, // Default score
        githubUrl: currentProject.githubUrl.trim(),
        liveUrl: currentProject.liveUrl.trim()
      };
      
      setProjects([...projects, project]);
      setCurrentProject({
        name: "",
        description: "",
        techStack: "",
        domain: "",
        githubUrl: "",
        liveUrl: ""
      });
    }
  };

  const removeProject = (index: number) => {
    setProjects(projects.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (selectedSkills.length === 0) {
      toast({
        title: "Skills Required",
        description: "Please select at least one skill.",
        variant: "destructive",
      });
      return;
    }

    if (selectedDomains.length === 0) {
      toast({
        title: "Domains Required",
        description: "Please select at least one domain of interest.",
        variant: "destructive",
      });
      return;
    }

    onDataCollected({
      skills: selectedSkills,
      domains: selectedDomains,
      projects,
      experience,
      achievements
    });

    // Reset form
    setSelectedSkills([]);
    setSelectedDomains([]);
    setProjects([]);
    setExperience("");
    setAchievements("");
    setIsOpen(false);

    toast({
      title: "Data Collected",
      description: "Your information has been collected successfully!",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <FileText className="w-4 h-4" />
          Collect Manual Data
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Manual Data Collection for {username}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Skills Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Skills & Technologies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(skillCategories).map(([category, skills]) => (
                <div key={category}>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">{category}</h4>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <Badge
                        key={skill}
                        variant={selectedSkills.includes(skill) ? "default" : "outline"}
                        className="cursor-pointer hover:bg-primary/80"
                        onClick={() => toggleSkill(skill)}
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
              
              <div className="flex gap-2">
                <Input
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  placeholder="Add custom skill"
                  onKeyPress={(e) => e.key === "Enter" && addCustomSkill()}
                />
                <Button onClick={addCustomSkill} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {selectedSkills.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Selected Skills ({selectedSkills.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedSkills.map((skill) => (
                      <Badge key={skill} variant="default" className="gap-1">
                        {skill}
                        <button onClick={() => toggleSkill(skill)}>
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Domains Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Domains of Interest</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {domainOptions.map((domain) => (
                  <Badge
                    key={domain}
                    variant={selectedDomains.includes(domain) ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/80 justify-center p-2 text-center text-xs"
                    onClick={() => toggleDomain(domain)}
                  >
                    {domain}
                  </Badge>
                ))}
              </div>
              
              <div className="flex gap-2">
                <Input
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  placeholder="Add custom domain"
                  onKeyPress={(e) => e.key === "Enter" && addCustomDomain()}
                />
                <Button onClick={addCustomDomain} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {selectedDomains.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Selected Domains ({selectedDomains.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedDomains.map((domain) => (
                      <Badge key={domain} variant="default" className="gap-1">
                        {domain}
                        <button onClick={() => toggleDomain(domain)}>
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Projects Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Projects
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  value={currentProject.name}
                  onChange={(e) => setCurrentProject(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Project name"
                />
                <Input
                  value={currentProject.domain}
                  onChange={(e) => setCurrentProject(prev => ({ ...prev, domain: e.target.value }))}
                  placeholder="Project domain"
                />
              </div>
              
              <Textarea
                value={currentProject.description}
                onChange={(e) => setCurrentProject(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Project description"
                rows={3}
              />
              
              <Input
                value={currentProject.techStack}
                onChange={(e) => setCurrentProject(prev => ({ ...prev, techStack: e.target.value }))}
                placeholder="Tech stack (comma separated)"
              />
              
              <div className="grid grid-cols-2 gap-4">
                <Input
                  value={currentProject.githubUrl}
                  onChange={(e) => setCurrentProject(prev => ({ ...prev, githubUrl: e.target.value }))}
                  placeholder="GitHub URL (optional)"
                />
                <Input
                  value={currentProject.liveUrl}
                  onChange={(e) => setCurrentProject(prev => ({ ...prev, liveUrl: e.target.value }))}
                  placeholder="Live URL (optional)"
                />
              </div>
              
              <Button onClick={addProject} className="w-full">
                Add Project
              </Button>

              {projects.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Added Projects ({projects.length})</p>
                  <div className="space-y-2">
                    {projects.map((project, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="font-medium">{project.name}</p>
                          <p className="text-sm text-muted-foreground">{project.domain}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeProject(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Experience & Achievements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Experience</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="Describe your work experience, internships, freelance work, etc."
                  rows={5}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Achievements</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={achievements}
                  onChange={(e) => setAchievements(e.target.value)}
                  placeholder="List your achievements, certifications, awards, hackathon wins, etc."
                  rows={5}
                />
              </CardContent>
            </Card>
          </div>

          {/* Submit Button */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              Submit Data
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}