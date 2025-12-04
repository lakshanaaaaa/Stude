import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Save, Loader2 } from "lucide-react";
import { codingPlatforms, type Student, type CodingPlatform } from "@shared/schema";

const editProfileSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  dept: z.string().min(1, "Department is required"),
  linkedin: z.string().url("Please enter a valid URL").or(z.literal("")),
  github: z.string().url("Please enter a valid URL").or(z.literal("")),
  resumeLink: z.string().url("Please enter a valid URL").or(z.literal("")),
  mainAccounts: z.array(z.object({
    platform: z.enum(codingPlatforms),
    username: z.string().min(1, "Username is required"),
  })),
  subAccounts: z.array(z.object({
    platform: z.enum(codingPlatforms),
    username: z.string().min(1, "Username is required"),
  })),
});

type EditProfileFormData = z.infer<typeof editProfileSchema>;

interface EditProfileFormProps {
  student: Student;
  onSubmit: (data: EditProfileFormData) => void;
  isPending?: boolean;
}

const departments = ["CSE", "ECE", "IT", "EEE", "MECH", "CIVIL"];

export function EditProfileForm({ student, onSubmit, isPending }: EditProfileFormProps) {
  const form = useForm<EditProfileFormData>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      email: student.email || "",
      dept: student.dept || "",
      linkedin: student.linkedin || "",
      github: student.github || "",
      resumeLink: student.resumeLink || "",
      mainAccounts: student.mainAccounts || [],
      subAccounts: student.subAccounts || [],
    },
  });

  const mainAccountsArray = useFieldArray({
    control: form.control,
    name: "mainAccounts",
  });

  const subAccountsArray = useFieldArray({
    control: form.control,
    name: "subAccounts",
  });

  const handleSubmit = (data: EditProfileFormData) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Personal Information</CardTitle>
              <CardDescription>Update your basic profile details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="your.email@college.edu" 
                        {...field} 
                        data-testid="input-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dept"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-department">
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="linkedin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LinkedIn Profile</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://linkedin.com/in/yourprofile" 
                        {...field} 
                        data-testid="input-linkedin"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="github"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GitHub Profile</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://github.com/yourusername" 
                        {...field} 
                        data-testid="input-github"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="resumeLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resume Link</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://drive.google.com/your-resume" 
                        {...field} 
                        data-testid="input-resume"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Main Coding Accounts</CardTitle>
                    <CardDescription>Your primary platform accounts</CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => mainAccountsArray.append({ platform: "LeetCode" as CodingPlatform, username: "" })}
                    data-testid="button-add-main-account"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {mainAccountsArray.fields.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No main accounts added yet
                  </p>
                )}
                {mainAccountsArray.fields.map((field, index) => (
                  <div key={field.id} className="flex items-start gap-2">
                    <FormField
                      control={form.control}
                      name={`mainAccounts.${index}.platform`}
                      render={({ field }) => (
                        <FormItem className="w-36">
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid={`select-main-platform-${index}`}>
                                <SelectValue placeholder="Platform" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {codingPlatforms.map((platform) => (
                                <SelectItem key={platform} value={platform}>
                                  {platform}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`mainAccounts.${index}.username`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input 
                              placeholder="Username" 
                              {...field} 
                              data-testid={`input-main-username-${index}`}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => mainAccountsArray.remove(index)}
                      className="text-destructive"
                      data-testid={`button-remove-main-${index}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Sub Coding Accounts</CardTitle>
                    <CardDescription>Additional platform accounts</CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => subAccountsArray.append({ platform: "CodeChef" as CodingPlatform, username: "" })}
                    disabled={subAccountsArray.fields.length >= 5}
                    data-testid="button-add-sub-account"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {subAccountsArray.fields.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No sub accounts added yet
                  </p>
                )}
                {subAccountsArray.fields.map((field, index) => (
                  <div key={field.id} className="flex items-start gap-2">
                    <FormField
                      control={form.control}
                      name={`subAccounts.${index}.platform`}
                      render={({ field }) => (
                        <FormItem className="w-36">
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid={`select-sub-platform-${index}`}>
                                <SelectValue placeholder="Platform" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {codingPlatforms.map((platform) => (
                                <SelectItem key={platform} value={platform}>
                                  {platform}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`subAccounts.${index}.username`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input 
                              placeholder="Username" 
                              {...field} 
                              data-testid={`input-sub-username-${index}`}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => subAccountsArray.remove(index)}
                      className="text-destructive"
                      data-testid={`button-remove-sub-${index}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {subAccountsArray.fields.length >= 5 && (
                  <p className="text-xs text-muted-foreground text-center">
                    Maximum 5 sub accounts allowed
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end">
          <Button 
            type="submit" 
            size="lg" 
            disabled={isPending}
            className="gap-2"
            data-testid="button-save-profile"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
}
