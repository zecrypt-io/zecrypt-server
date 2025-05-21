"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash, Check, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/libs/Redux/store";
import { addProject, updateProject, deleteProject, setSelectedProject } from "@/libs/Redux/workspaceSlice";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslator } from "@/hooks/use-translations";
import { generateEncryptedProjectKey } from "@/libs/encryption";
import { useToast } from "@/hooks/use-toast";

interface ProjectDialogProps {
  onClose: () => void;
  forceCreate?: boolean;
}

const defaultFeatures = {
  login: { enabled: false, is_client_side_encryption: false },
  api_key: { enabled: false, is_client_side_encryption: false },
  wallet_address: { enabled: false, is_client_side_encryption: false },
  wifi: { enabled: false, is_client_side_encryption: false },
  identity: { enabled: false, is_client_side_encryption: false },
  card: { enabled: false, is_client_side_encryption: false },
  software_license: { enabled: false, is_client_side_encryption: false },
};

export function ProjectDialog({ onClose, forceCreate = false }: ProjectDialogProps) {
  const [activeTab, setActiveTab] = useState("select");
  const [localSelectedProject, setLocalSelectedProject] = useState<string | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const workspaces = useSelector((state: RootState) => state.workspace.workspaces);
  const selectedWorkspaceId = useSelector((state: RootState) => state.workspace.selectedWorkspaceId);

  const projects = Array.isArray(workspaces) && selectedWorkspaceId
    ? workspaces
        .find((ws) => ws.workspaceId === selectedWorkspaceId)
        ?.projects.map((project) => ({
          id: project.project_id,
          name: project.name,
          description: project.description,
          color: project.color,
          items: 0,
          isDefault: project.is_default,
          created_by: project.created_by ?? "unknown",
          created_at: project.created_at ?? new Date().toISOString(),
          features: {
            ...defaultFeatures,
            ...(project.features || {}),
          },
        })) || []
    : [];

  useEffect(() => {
    if (forceCreate && projects.length === 0) {
      setActiveTab("select");
      setShowCreateDialog(true);
    }
  }, [forceCreate, projects]);

  const handleDialogClose = () => {
    if (forceCreate && projects.length === 0) {
      return;
    }
    onClose();
  };

  const handleSelectProject = (projectId: string) => {
    dispatch(setSelectedProject({ projectId }));
    setLocalSelectedProject(projectId);
    onClose();
  };

  const handleEditProject = (projectId: string) => {
    setLocalSelectedProject(projectId);
    setShowEditDialog(true);
  };

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) handleDialogClose(); }}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Projects</DialogTitle>
          <DialogDescription>Select a project or create a new one</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {!(forceCreate && projects.length === 0) && (
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="select">Select Project</TabsTrigger>
              <TabsTrigger value="manage">Manage Projects</TabsTrigger>
            </TabsList>
          )}

          <TabsContent value="select" className="space-y-4 py-4">
            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-2 py-6 border-dashed"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="h-5 w-5" />
              <span>Create New Project</span>
            </Button>

            <div className="space-y-2">
              {projects.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center">No projects available</p>
              ) : (
                projects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center gap-3 p-3 rounded-md border border-border hover:border-primary cursor-pointer transition-colors"
                    onClick={() => handleSelectProject(project.id)}
                  >
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-full"
                      style={{ backgroundColor: `${project.color}20` }}
                    >
                      <div className="h-5 w-5 rounded-full" style={{ backgroundColor: project.color }}></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{project.name}</p>
                        {project.isDefault && <span className="text-xs bg-muted px-1.5 py-0.5 rounded">Default</span>}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {project.description || "No description"}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="manage" className="space-y-4 py-4">
            <div className="space-y-2">
              {projects.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center">No projects available</p>
              ) : (
                projects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center gap-3 p-3 rounded-md border border-border hover:border-primary transition-colors"
                  >
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-full"
                      style={{ backgroundColor: `${project.color}20` }}
                    >
                      <div className="h-5 w-5 rounded-full" style={{ backgroundColor: project.color }}></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{project.name}</p>
                        {project.isDefault && <span className="text-xs bg-muted px-1.5 py-0.5 rounded">Default</span>}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {project.description || "No description"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEditProject(project.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <DeleteProjectDialog
                        projectId={project.id}
                        projectName={project.name}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="h-4 w-4" />
              <span>Create New Project</span>
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>

      {showEditDialog && localSelectedProject && (
        <EditProjectDialog
          project={projects.find((p) => p.id === localSelectedProject)!}
          workspaceId={selectedWorkspaceId || ""}
          onClose={() => setShowEditDialog(false)}
        />
      )}

      {showCreateDialog && (
        <CreateProjectDialog
          workspaceId={selectedWorkspaceId || ""}
          onClose={() => {
            setShowCreateDialog(false);
          }}
          forceCreate={forceCreate && projects.length === 0}
        />
      )}
    </Dialog>
  );
}

interface EditProjectDialogProps {
  project: {
    id: string;
    name: string;
    description: string;
    color: string;
    isDefault: boolean;
    created_by: string;
    created_at: string;
    features: { [key: string]: { enabled: boolean; is_client_side_encryption: boolean } };
  };
  workspaceId: string;
  onClose: () => void;
}

function EditProjectDialog({ project, workspaceId, onClose }: EditProjectDialogProps) {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const [color, setColor] = useState(project.color);
  const [isDefault, setIsDefault] = useState(project.isDefault);
  const [features, setFeatures] = useState({ ...defaultFeatures, ...project.features });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const accessToken = useSelector((state: RootState) => state.user.userData?.access_token);
  const workspaces = useSelector((state: RootState) => state.workspace.workspaces);

  const colors = [
    { name: "Indigo", value: "#4f46e5" },
    { name: "Sky", value: "#0ea5e9" },
    { name: "Emerald", value: "#10b981" },
    { name: "Amber", value: "#f59e0b" },
    { name: "Rose", value: "#f43f5e" },
    { name: "Violet", value: "#8b5cf6" },
  ];

  const featureOptions = [
    { key: "login", label: "Accounts" },
    { key: "api_key", label: "API Keys" },
    { key: "wallet_address", label: "Wallet Passphrases" },
    { key: "wifi", label: "Wi-Fi" },
    { key: "identity", label: "Identity" },
    { key: "card", label: "Cards" },
    { key: "software_license", label: "Software Licenses" },
  ] as const;

  const { translate } = useTranslator();

  type FeatureKey = typeof featureOptions[number]["key"];

  const handleFeatureToggle = (featureKey: FeatureKey) => {
    setFeatures((prev) => ({
      ...prev,
      [featureKey]: {
        ...prev[featureKey],
        enabled: !prev[featureKey]?.enabled,
      },
    }));
  };

  const handleSave = async () => {
    if (!accessToken) {
      setError("Authentication required. Please log in.");
      return;
    }
    if (!workspaceId) {
      setError("No workspace selected.");
      return;
    }
    if (!name.trim()) {
      setError("Project name is required.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const trimmedDescription = description.trim();
    const payload = {
      name: name.trim(),
      description: trimmedDescription,
      is_default: isDefault,
      color,
      features,
    };

    try {
      // Check if the project name is being changed and if there's a stored project key for this project
      const oldProjectKey = sessionStorage.getItem(`project_key_${project.name}`);
      if (oldProjectKey && project.name !== name.trim()) {
        // Store the key with the new project name and remove the old one
        sessionStorage.setItem(`project_key_${name.trim()}`, oldProjectKey);
        sessionStorage.removeItem(`project_key_${project.name}`);
        console.log(`Project key renamed in session storage from ${project.name} to ${name.trim()}`);
        // Update the common project key if it matches the one we're changing
        if (sessionStorage.getItem("projectKey") === oldProjectKey) {
          sessionStorage.setItem("projectKey", oldProjectKey);
        }
      }
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/${workspaceId}/projects/${project.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "access-token": accessToken,
          },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();
      console.log("EditProject API response:", result);

      if (!response.ok) {
        throw new Error(result.message || "Failed to update project");
      }

      const updatedProject = {
        project_id: project.id,
        name: name.trim(),
        lower_name: name.trim().toLowerCase(),
        description: trimmedDescription,
        color,
        created_by: result.data.created_by || project.created_by,
        created_at: result.data.created_at || project.created_at,
        updated_at: result.data.updated_at || new Date().toISOString(),
        is_default: isDefault,
        workspace_id: workspaceId,
        features: { ...defaultFeatures, ...(result.data.features || {}) },
      };

      dispatch(
        updateProject({
          workspaceId,
          project: updatedProject,
        })
      );

      if (isDefault) {
        const currentProjects = workspaces
          .find((ws) => ws.workspaceId === workspaceId)
          ?.projects.filter((p) => p.project_id !== project.id && p.is_default) || [];

        for (const otherProject of currentProjects) {
          const updatePayload = {
            is_default: false,
          };
          await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/${workspaceId}/projects/${otherProject.project_id}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                "access-token": accessToken,
              },
              credentials: "include",
              body: JSON.stringify(updatePayload),
            }
          );
          dispatch(
            updateProject({
              workspaceId,
              project: { ...otherProject, is_default: false },
            })
          );
        }
      }

      onClose();
    } catch (err: any) {
      console.error("EditProject error:", err);
      setError(err.message || "An error occurred while updating the project");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{translate("edit_project", "dashboard")}</DialogTitle>
          <DialogDescription>{translate("update_project_details", "dashboard")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
          <div className="space-y-2">
            <Label htmlFor="project-name">{translate("project_name", "dashboard")}</Label>
            <Input id="project-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-description">{translate("description", "dashboard")} ({translate("optional", "dashboard")})</Label>
            <Textarea
              id="project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder={translate("describe_project_purpose", "dashboard")}
            />
          </div>

          <div className="space-y-2">
            <Label>{translate("project_color", "dashboard")}</Label>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    color === c.value ? "ring-2 ring-offset-2 ring-primary" : ""
                  }`}
                  style={{ backgroundColor: c.value }}
                  onClick={() => setColor(c.value)}
                  title={c.name}
                >
                  {color === c.value && <Check className="h-4 w-4 text-white" />}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>{translate("enabled_modules", "dashboard")}</Label>
            <div className="grid grid-cols-2 gap-2">
              {featureOptions.map((option) => (
                <div key={option.key} className="flex items-center gap-2">
                  <Checkbox
                    id={`feature-${option.key}`}
                    checked={features[option.key]?.enabled || false}
                    onCheckedChange={() => handleFeatureToggle(option.key)}
                  />
                  <Label htmlFor={`feature-${option.key}`} className="cursor-pointer">
                    {translate(option.label.toLowerCase().replace(/ /g, '_').replace(/-/g, '_'), "dashboard")}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="default-project"
              checked={isDefault}
              onCheckedChange={(checked) => setIsDefault(!!checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="default-project" className="cursor-pointer">
              {translate("set_as_default_project", "dashboard")}
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {translate("cancel", "dashboard")}
          </Button>
          <Button onClick={handleSave} disabled={isLoading || !name.trim()}>
            {isLoading ? translate("saving", "dashboard") : translate("save_changes", "dashboard")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface CreateProjectDialogProps {
  workspaceId: string;
  onClose: () => void;
  forceCreate?: boolean;
}

function CreateProjectDialog({ workspaceId, onClose, forceCreate = false }: CreateProjectDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#10b981");
  const [isDefault, setIsDefault] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [features, setFeatures] = useState({ ...defaultFeatures });

  const dispatch = useDispatch<AppDispatch>();
  const accessToken = useSelector((state: RootState) => state.user.userData?.access_token);
  const workspaces = useSelector((state: RootState) => state.workspace.workspaces);
  const { translate } = useTranslator();
  const { toast } = useToast();

  const colors = [
    { name: "Indigo", value: "#4f46e5" },
    { name: "Sky", value: "#0ea5e9" },
    { name: "Emerald", value: "#10b981" },
    { name: "Amber", value: "#f59e0b" },
    { name: "Rose", value: "#f43f5e" },
    { name: "Violet", value: "#8b5cf6" },
  ];

  const featureOptions = [
    { key: "login", label: "Accounts" },
    { key: "api_key", label: "API Keys" },
    { key: "wallet_address", label: "Wallet Passphrases" },
    { key: "wifi", label: "Wi-Fi" },
    { key: "identity", label: "Identity" },
    { key: "card", label: "Cards" },
    { key: "software_license", label: "Software Licenses" },
  ] as const;

  type FeatureKey = typeof featureOptions[number]["key"];

  const handleFeatureToggle = (featureKey: FeatureKey) => {
    setFeatures((prev) => ({
      ...prev,
      [featureKey]: {
        ...prev[featureKey],
        enabled: !prev[featureKey]?.enabled,
      },
    }));
  };

  const handleCreate = async () => {
    if (!accessToken) {
      setError("Authentication required. Please log in.");
      return;
    }
    if (!workspaceId) {
      setError("No workspace selected.");
      return;
    }
    if (!name.trim()) {
      setError("Project name is required.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get the user's public key from localStorage instead of API
      const userPublicKey = localStorage.getItem('userPublicKey');
      
      if (!userPublicKey) {
        throw new Error("User's public key not available in localStorage");
      }
      
      // Ensure the public key is in PEM format with proper headers and footers
      const formattedPublicKey = userPublicKey.includes("-----BEGIN PUBLIC KEY-----") 
        ? userPublicKey 
        : `-----BEGIN PUBLIC KEY-----\n${userPublicKey}\n-----END PUBLIC KEY-----`;
      
      // Generate an AES key and encrypt it with the user's public key
      const { aesKey, encryptedKey } = await generateEncryptedProjectKey(formattedPublicKey);
      
      // Store the plain AES key in session storage for current use
      const projectStorageKey = `project_key_${name.trim()}`;
      sessionStorage.setItem(projectStorageKey, aesKey);
      console.log(`Project key stored in session storage with key: ${projectStorageKey}`);
      
      // Also store the latest project key under a common key for backward compatibility
      sessionStorage.setItem("projectKey", aesKey);
      
      const trimmedDescription = description.trim();
      const payload = {
        name: name.trim(),
        key: encryptedKey, // Send the encrypted AES key
        description: trimmedDescription,
        is_default: isDefault,
        color,
        features,
      };
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/${workspaceId}/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "access-token": accessToken,
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log("CreateProject API response:", result);

      if (!response.ok) {
        throw new Error(result.message || "Failed to create project");
      }

      const newProject = {
        project_id: result.data.doc_id,
        name: result.data.name,
        lower_name: result.data.lower_name || result.data.name.toLowerCase(),
        description: result.data.description ?? "",
        color: result.data.color || "#10b981",
        created_by: result.data.created_by || "unknown",
        created_at: result.data.created_at || new Date().toISOString(),
        updated_at: result.data.updated_at || new Date().toISOString(),
        is_default: isDefault,
        workspace_id: result.data.workspace_id || workspaceId,
        features: { ...defaultFeatures, ...(result.data.features || {}) },
      };

      dispatch(
        addProject({
          workspaceId,
          project: newProject,
        })
      );

      if (isDefault) {
        const currentProjects = workspaces
          .find((ws) => ws.workspaceId === workspaceId)
          ?.projects.filter((p) => p.project_id !== newProject.project_id && p.is_default) || [];

        for (const otherProject of currentProjects) {
          const updatePayload = {
            is_default: false,
          };
          await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/${workspaceId}/projects/${otherProject.project_id}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                "access-token": accessToken,
              },
              credentials: "include",
              body: JSON.stringify(updatePayload),
            }
          );
          dispatch(
            updateProject({
              workspaceId,
              project: { ...otherProject, is_default: false },
            })
          );
        }
      }

      dispatch(setSelectedProject({ projectId: newProject.project_id }));
      onClose();
    } catch (err: any) {
      console.error("CreateProject error:", err);
      setError(err.message || "An error occurred while creating the project");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDialogClose = () => {
    if (forceCreate) {
      toast({
        title: translate("project_required_title", "dashboard"),
        description: translate("project_required_description", "dashboard"),
        variant: "default",
      });
      return;
    }
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) handleDialogClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{translate("create_new_project", "dashboard")}</DialogTitle>
          <DialogDescription>{translate("add_new_project_description", "dashboard")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
          <div className="space-y-2">
            <Label htmlFor="new-project-name">{translate("project_name", "dashboard")}</Label>
            <Input
              id="new-project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={translate("my_project", "dashboard")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-project-description">{translate("description", "dashboard")} ({translate("optional", "dashboard")})</Label>
            <Textarea
              id="new-project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={translate("describe_project_purpose", "dashboard")}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>{translate("project_color", "dashboard")}</Label>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    color === c.value ? "ring-2 ring-offset-2 ring-primary" : ""
                  }`}
                  style={{ backgroundColor: c.value }}
                  onClick={() => setColor(c.value)}
                  title={c.name}
                >
                  {color === c.value && <Check className="h-4 w-4 text-white" />}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>{translate("enabled_modules", "dashboard")}</Label>
            <div className="grid grid-cols-2 gap-2">
              {featureOptions.map((option) => (
                <div key={option.key} className="flex items-center gap-2">
                  <Checkbox
                    id={`feature-${option.key}`}
                    checked={features[option.key]?.enabled || false}
                    onCheckedChange={() => handleFeatureToggle(option.key)}
                  />
                  <Label htmlFor={`feature-${option.key}`} className="cursor-pointer">
                    {translate(option.label.toLowerCase().replace(/ /g, '_').replace(/-/g, '_'), "dashboard")}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="default-project"
              checked={isDefault}
              onCheckedChange={(checked) => setIsDefault(!!checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="default-project" className="cursor-pointer">
              {translate("set_as_default_project", "dashboard")}
            </Label>
          </div>
        </div>

        <DialogFooter>
          { !forceCreate && (
            <Button variant="outline" onClick={handleDialogClose} disabled={isLoading}>
              {translate("cancel", "dashboard")}
            </Button>
          )}
          <Button onClick={handleCreate} disabled={isLoading || !name.trim()}>
            {isLoading ? translate("creating", "dashboard") : translate("create_project", "dashboard")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface DeleteProjectDialogProps {
  projectId: string;
  projectName: string;
}

function DeleteProjectDialog({ projectId, projectName }: DeleteProjectDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dispatch = useDispatch<AppDispatch>();
  const accessToken = useSelector((state: RootState) => state.user.userData?.access_token);
  const selectedWorkspaceId = useSelector((state: RootState) => state.workspace.selectedWorkspaceId);

  const { translate } = useTranslator();

  const handleDelete = async () => {
    if (!accessToken) {
      setError("Authentication required. Please log in.");
      return;
    }
    if (!selectedWorkspaceId) {
      setError("No workspace selected.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/${selectedWorkspaceId}/projects/${projectId}`,
        {
          method: "DELETE",
          headers: {
            "access-token": accessToken,
          },
          credentials: "include",
        }
      );

      const result = await response.json();
      console.log("DeleteProject API response:", result);

      if (!response.ok) {
        throw new Error(result.message || "Failed to delete project");
      }

      dispatch(
        deleteProject({
          workspaceId: selectedWorkspaceId,
          projectId,
        })
      );
    } catch (err: any) {
      console.error("DeleteProject error:", err);
      setError(err.message || "An error occurred while deleting the project");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Trash className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <DialogTitle>{translate("delete_project", "dashboard")}</DialogTitle>
          <DialogDescription>
            {translate("confirm_delete_project", "dashboard", { projectName })}
          </DialogDescription>
        </AlertDialogHeader>
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>{translate("cancel", "dashboard")}</AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-500 hover:bg-red-600"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? translate("deleting", "dashboard") : translate("delete", "dashboard")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}