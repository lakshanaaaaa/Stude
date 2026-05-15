import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, X } from "lucide-react";

interface DomainPreferencesProps {
  username: string;
  domains: string[];
  canEdit: boolean;
}

const domainOptions = [
  "Web Development",
  "Mobile App Development", 
  "Data Science & Analytics",
  "Machine Learning & AI",
  "Cloud Computing",
  "Cybersecurity",
  "Game Development",
  "IoT & Embedded Systems",
  "Blockchain & Cryptocurrency",
  "E-commerce",
  "FinTech",
  "HealthTech",
  "EdTech",
  "Social Media & Networking",
  "Enterprise Software",
  "DevOps & Infrastructure",
  "UI/UX Design",
  "Quality Assurance",
  "Research & Development",
  "Consulting & Strategy"
];

export function DomainPreferences({ username, domains, canEdit }: DomainPreferencesProps) {
  const [localDomains, setLocalDomains] = useState<string[]>(domains || []);
  const [newDomain, setNewDomain] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateDomainsMutation = useMutation({
    mutationFn: async (updatedDomains: string[]) => {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/student/${username}/domains`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ domains: updatedDomains }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update domains");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/student", username] });
      toast({
        title: "Success",
        description: "Domain preferences updated successfully!",
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

  const addDomain = () => {
    if (newDomain.trim() && !localDomains.includes(newDomain.trim())) {
      const updatedDomains = [...localDomains, newDomain.trim()];
      setLocalDomains(updatedDomains);
      setNewDomain("");
    }
  };

  const removeDomain = (domainToRemove: string) => {
    const updatedDomains = localDomains.filter(domain => domain !== domainToRemove);
    setLocalDomains(updatedDomains);
  };

  const toggleDomain = (domain: string) => {
    if (localDomains.includes(domain)) {
      removeDomain(domain);
    } else {
      setLocalDomains([...localDomains, domain]);
    }
  };

  const saveDomains = () => {
    updateDomainsMutation.mutate(localDomains);
  };

  const hasChanges = JSON.stringify(localDomains.sort()) !== JSON.stringify((domains || []).sort());

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Domain Preferences
          {canEdit && hasChanges && (
            <Button
              size="sm"
              onClick={saveDomains}
              disabled={updateDomainsMutation.isPending}
            >
              Save Changes
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {canEdit && (
          <>
            <div>
              <label className="text-sm font-medium mb-3 block">Available Domains</label>
              <div className="grid grid-cols-2 gap-2">
                {domainOptions.map((domain) => (
                  <Badge
                    key={domain}
                    variant={localDomains.includes(domain) ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/80 justify-center p-2 text-center text-xs"
                    onClick={() => toggleDomain(domain)}
                  >
                    {domain}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Input
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                placeholder="Add a custom domain"
                onKeyPress={(e) => e.key === "Enter" && addDomain()}
              />
              <Button onClick={addDomain} size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Add
              </Button>
            </div>
          </>
        )}

        <div>
          <label className="text-sm font-medium mb-2 block">
            {canEdit ? `Selected Domains (${localDomains.length})` : "Domains of Interest"}
          </label>
          <div className="flex flex-wrap gap-2">
            {localDomains.length > 0 ? (
              localDomains.map((domain) => (
                <Badge key={domain} variant="secondary" className="gap-1">
                  {domain}
                  {canEdit && (
                    <button
                      onClick={() => removeDomain(domain)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </Badge>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">
                {canEdit ? "No domains selected yet. Choose domains that interest you." : "No domains listed."}
              </p>
            )}
          </div>
        </div>

        {canEdit && localDomains.length > 0 && (
          <p className="text-xs text-muted-foreground">
            💡 Domain preferences help match you with relevant opportunities and projects in your areas of interest.
          </p>
        )}
      </CardContent>
    </Card>
  );
}