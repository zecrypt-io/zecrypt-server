"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Edit, Trash, Check, ChevronRight, User } from "lucide-react";
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
import { secureSetItem, secureGetItem } from '@/libs/local-storage-utils';
import axiosInstance from "../libs/Middleware/axiosInstace";
import { Switch } from "@/components/ui/switch";

interface ProjectDialogProps {
  onClose: () => void;
  forceCreate?: boolean;
}

const defaultFeatures = {
  login: { enabled: true, is_client_side_encryption: false },
  api_key: { enabled: false, is_client_side_encryption: false },
  wallet_address: { enabled: false, is_client_side_encryption: false },
  wifi: { enabled: false, is_client_side_encryption: false },
  identity: { enabled: true, is_client_side_encryption: false },
  card: { enabled: false, is_client_side_encryption: false },
  software_license: { enabled: false, is_client_side_encryption: false },
  email: { enabled: false, is_client_side_encryption: false },
  ssh_key: { enabled: false, is_client_side_encryption: false }
};

// Define featureMenuItems to include icons for each module
const featureMenuItems: {
  key: keyof typeof defaultFeatures;
  labelKey: string;
  path: string;
  icon: React.ReactNode;
}[] = [
  {
    key: "login",
    labelKey: "accounts",
    path: "/dashboard/accounts",
    icon: <User className="h-4 w-4" />,
  },
  {
    key: "api_key",
    labelKey: "api_keys",
    path: "/dashboard/api-keys",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
      >
        <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
      </svg>
    ),
  },
  {
    key: "wallet_address",
    labelKey: "wallet_passphrases",
    path: "/dashboard/wallet-passphrases",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="lucide lucide-wallet-icon lucide-wallet"
      >
        <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
        <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
      </svg>
    ),
  },
  {
    key: "wifi",
    labelKey: "wifi",
    path: "/dashboard/wifi",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
      >
        <path d="M5 12.55a11 11 0 0 1 14.08 0" />
        <path d="M1.42 9a16 16 0 0 1 21.16 0" />
        <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
        <line x1="12" y1="20" x2="12.01" y2="20" />
      </svg>
    ),
  },
  {
    key: "identity",
    labelKey: "identity",
    path: "/dashboard/identity",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    key: "card",
    labelKey: "cards",
    path: "/dashboard/cards",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
      >
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="M7 15h0M2 9.5h20" />
      </svg>
    ),
  },
  {
    key: "software_license",
    labelKey: "software_licenses",
    path: "/dashboard/software-licenses",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
      >
        <path d="M15 3h6v6" />
        <path d="M10 14 21 3" />
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      </svg>
    ),
  },
  {
    key: "email",
    labelKey: "email",
    path: "/dashboard/emails",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
      >
        <rect width="20" height="16" x="2" y="4" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </svg>
    ),
  },
  {
    key: "ssh_key",
    labelKey: "ssh_keys",
    path: "/dashboard/ssh-keys",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
      >
        <circle cx="8" cy="8" r="4" />
        <path d="M10.5 8h9.5" />
        <path d="M15 12V8" />
        <path d="M17 12V8" />
      </svg>
    ),
  },
];

export function ProjectDialog({ onClose, forceCreate = false }: ProjectDialogProps) {
  const dispatch = useDispatch<AppDispatch>();
  const workspaces = useSelector((state: RootState) => state.workspace.workspaces);
  const selectedWorkspaceId = useSelector((state: RootState) => state.workspace.selectedWorkspaceId);
  const selectedProjectId = useSelector((state: RootState) => state.workspace.selectedProjectId);
  const [activeTab, setActiveTab] = useState(workspaces[0]?.projects.length === 0 ? "manage" : "select");
  const [localSelectedProject, setLocalSelectedProject] = useState<string | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(workspaces[0]?.projects.length === 0);
  const [error, setError] = useState<string | null>(null);

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

  const { translate } = useTranslator();

  useEffect(() => {
    if (!selectedWorkspaceId) {
      setError(translate("no_workspace_selected", "dashboard"));
    } else {
      setError(null);
    }
  }, [selectedWorkspaceId, translate]);

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) handleDialogClose(); }}>
      <DialogContent className="sm:max-w-[650px] p-8 border border-blue-500/20 shadow-lg shadow-blue-500/10">
        <DialogHeader className="space-y-1 pb-4">
          <DialogTitle className="text-2xl font-semibold">{translate("projects", "dashboard")}</DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">{translate("select_or_create_project", "dashboard")}</DialogDescription>
        </DialogHeader>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-2 rounded-md">{error}</div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {!(forceCreate && projects.length === 0) && (
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="select">Select Project</TabsTrigger>
              <TabsTrigger value="manage">Manage Projects</TabsTrigger>
            </TabsList>
          )}

          <TabsContent value="select" className="space-y-2 py-2">
            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-2 py-6 border-dashed h-12 rounded-md"
              onClick={() => {
                setActiveTab("manage");
                setShowCreateDialog(true);
              }}
            >
              <Plus className="h-5 w-5" />
              <span className="text-sm font-medium">{translate("create_new_project", "dashboard")}</span>
            </Button>

            <div className="space-y-1.5">
              {projects.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center">{translate("no_projects_available", "dashboard")}</p>
              ) : (
                projects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center gap-1.5 p-1 rounded-lg border border-border/50 hover:border-primary cursor-pointer transition-colors"
                    onClick={() => handleSelectProject(project.id)}
                  >
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-full"
                      style={{ backgroundColor: `${project.color}20` }}
                    >
                      <div className="h-5 w-5 rounded-full" style={{ backgroundColor: project.color }}></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-medium truncate text-sm">{project.name}</p>
                        {project.isDefault && <span className="text-xs bg-muted px-1.5 py-0.5 rounded">{translate("default", "dashboard")}</span>}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {project.description || translate("no_description", "dashboard")}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="manage" className="space-y-2 py-2">
            <div className="space-y-1.5">
              {projects.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center">{translate("no_projects_available", "dashboard")}</p>
              ) : (
                projects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center gap-1.5 p-1 rounded-lg border border-border/50 hover:border-primary transition-colors"
                  >
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-full"
                      style={{ backgroundColor: `${project.color}20` }}
                    >
                      <div className="h-5 w-5 rounded-full" style={{ backgroundColor: project.color }}></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-medium truncate text-sm">{project.name}</p>
                        {project.isDefault && <span className="text-xs bg-muted px-1.5 py-0.5 rounded">{translate("default", "dashboard")}</span>}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {project.description || translate("no_description", "dashboard")}
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
                        workspaceId={selectedWorkspaceId || ""}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-1.5 h-8 rounded-md"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="h-4 w-4" />
              <span className="text-sm font-medium">{translate("create_new_project", "dashboard")}</span>
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

  const { translate } = useTranslator();

  type FeatureKey = keyof typeof defaultFeatures;

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
      setError(translate("authentication_required", "dashboard"));
      return;
    }
    if (!workspaceId) {
      setError(translate("no_workspace_selected", "dashboard"));
      return;
    }
    if (!name.trim()) {
      setError(translate("project_name_required", "dashboard"));
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
      const response = await axiosInstance.put(`/${workspaceId}/projects/${project.id}`, payload);
      const result = response.data;

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
          await axiosInstance.put(`/${workspaceId}/projects/${otherProject.project_id}`, {
            is_default: false,
          });
          dispatch(
            updateProject({
              workspaceId,
              project: { ...otherProject, is_default: false },
            })
          );
        }
      }

      // Dispatch project updated event
      document.dispatchEvent(new CustomEvent("project-updated"));
      onClose();
    } catch (err: any) {
      console.error("EditProject error:", err);
      setError(err.response?.data?.message || translate("error_updating_project", "dashboard"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] p-8 border border-blue-500/20 shadow-lg shadow-blue-500/10">
        <DialogHeader className="space-y-1 pb-5 text-center">
          <DialogTitle className="text-2xl font-semibold">{translate("edit_project", "dashboard")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-1.5 rounded-md">{error}</div>
          )}
          <div>
            <Input 
              id="project-name" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="h-10 rounded-md"
              placeholder={translate("project_name", "dashboard")}
            />
          </div>

          <div>
            <Textarea
              id="project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={1}
              className="rounded-md"
              placeholder={translate("describe_project_purpose", "dashboard")}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">{translate("project_color", "dashboard")}</Label>
              <div className="flex items-center gap-2">
                <Switch
                  id="default-project"
                  checked={isDefault}
                  onCheckedChange={(checked) => setIsDefault(!!checked)}
                  className="data-[state=checked]:bg-primary"
                />
                <Label htmlFor="default-project" className="cursor-pointer text-sm">{translate("set_as_default_project", "dashboard")}</Label>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
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

          <div className="space-y-2 mt-4">
            <Label className="text-base font-medium">{translate("enabled_modules", "dashboard")}</Label>
            <div className="grid grid-cols-2 gap-3">
              {featureMenuItems.map((option) => (
                <div 
                  key={option.key} 
                  onClick={() => handleFeatureToggle(option.key)}
                  className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all duration-200 ${
                    features[option.key]?.enabled 
                      ? "border-primary/40 bg-primary/5 hover:bg-primary/10" 
                      : "border-border/50 hover:border-border/80 hover:bg-muted/50"
                  }`}
                >
                  <div className={`p-1.5 rounded-lg transition-colors duration-200 ${
                    features[option.key]?.enabled 
                      ? "bg-primary/10 text-primary" 
                      : "bg-muted/50 text-muted-foreground/70"
                  }`}>
                    {option.icon}
                  </div>
                  <Label 
                    htmlFor={`feature-${option.key}`} 
                    className="cursor-pointer text-base font-medium flex-1"
                  >
                    {translate(option.labelKey, "dashboard")}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="pt-4 flex justify-end gap-3">
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={isLoading}
            className="h-10 px-5 text-base rounded-md"
          >
            {translate("cancel", "dashboard")}
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isLoading || !name.trim()}
            className="h-10 px-5 text-base rounded-md"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {translate("saving", "dashboard")}
              </div>
            ) : translate("save_changes", "dashboard")}
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
  const [isDefault, setIsDefault] = useState(true);
  const [features, setFeatures] = useState(defaultFeatures);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
    { key: "email", label: "Email Accounts" },
    { key: "ssh_key", label: "SSH Keys" }
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
      setError(translate("authentication_required", "dashboard"));
      return;
    }
    if (!workspaceId) {
      setError(translate("no_workspace_selected", "dashboard"));
      return;
    }
    if (!name.trim()) {
      setError(translate("project_name_required", "dashboard"));
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
      
      // Store project key in session storage for current use
      const projectStorageKey = `projectKey_${name.trim()}`;
      await secureSetItem(projectStorageKey, aesKey);
      
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
        name: name.trim(),
        lower_name: name.trim().toLowerCase(),
        description: trimmedDescription,
        color,
        created_by: result.data.created_by || "unknown",
        created_at: result.data.created_at || new Date().toISOString(),
        updated_at: result.data.updated_at || new Date().toISOString(),
        is_default: isDefault,
        workspace_id: workspaceId,
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
          await axiosInstance.put(`/${workspaceId}/projects/${otherProject.project_id}`, {
            is_default: false,
          });
          dispatch(
            updateProject({
              workspaceId,
              project: { ...otherProject, is_default: false },
            })
          );
        }
      }

      dispatch(setSelectedProject({ projectId: newProject.project_id }));
      
      // Dispatch project updated event
      document.dispatchEvent(new CustomEvent("project-updated"));
      onClose();
    } catch (err: any) {
      console.error("CreateProject error:", err);
      setError(err.response?.data?.message || translate("error_creating_project", "dashboard"));
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
      <DialogContent className="sm:max-w-[800px] p-8 border border-blue-500/20 shadow-lg shadow-blue-500/10">
        <DialogHeader className="space-y-1 pb-5 text-center">
          <DialogTitle className="text-2xl font-semibold">{translate("create_new_project", "dashboard")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-1.5 rounded-md">{error}</div>
          )}
          <div>
            <Input id="project-name" value={name} onChange={(e) => setName(e.target.value)} className="h-10 rounded-md" placeholder={translate("project_name", "dashboard")}/>
          </div>

          <div>
            <Textarea
              id="project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={1}
              className="rounded-md"
              placeholder={translate("describe_project_purpose", "dashboard")}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">{translate("project_color", "dashboard")}</Label>
              <div className="flex items-center gap-2">
                <Switch
                  id="default-project"
                  checked={isDefault}
                  onCheckedChange={(checked) => setIsDefault(!!checked)}
                  className="data-[state=checked]:bg-primary"
                />
                <Label htmlFor="default-project" className="cursor-pointer text-sm">{translate("set_as_default_project", "dashboard")}</Label>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
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

          <div className="space-y-2 mt-4">
            <Label className="text-base font-medium">{translate("enabled_modules", "dashboard")}</Label>
            <div className="grid grid-cols-2 gap-3">
              {featureMenuItems.map((option) => (
                <div 
                  key={option.key} 
                  onClick={() => handleFeatureToggle(option.key)}
                  className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all duration-200 ${
                    features[option.key]?.enabled 
                      ? "border-primary/40 bg-primary/5 hover:bg-primary/10" 
                      : "border-border/50 hover:border-border/80 hover:bg-muted/50"
                  }`}
                >
                  <div className={`p-1.5 rounded-lg transition-colors duration-200 ${
                    features[option.key]?.enabled 
                      ? "bg-primary/10 text-primary" 
                      : "bg-muted/50 text-muted-foreground/70"
                  }`}>
                    {option.icon}
                  </div>
                  <Label 
                    htmlFor={`feature-${option.key}`} 
                    className="cursor-pointer text-base font-medium flex-1"
                  >
                    {translate(option.labelKey, "dashboard")}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="pt-4 flex justify-end gap-3">
          { !forceCreate && (
            <Button variant="outline" onClick={handleDialogClose} disabled={isLoading} className="h-10 px-5 text-base rounded-md">
              {translate("cancel", "dashboard")}
            </Button>
          )}
          <Button onClick={handleCreate} disabled={isLoading || !name.trim()} className="h-10 px-5 text-base rounded-md">
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {translate("creating", "dashboard")}
              </div>
            ) : translate("create_project", "dashboard")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface DeleteProjectDialogProps {
  projectId: string;
  projectName: string;
  workspaceId: string;
}

function DeleteProjectDialog({ projectId, projectName, workspaceId }: DeleteProjectDialogProps) {
  const dispatch = useDispatch<AppDispatch>();
  const accessToken = useSelector((state: RootState) => state.user.userData?.access_token);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { translate } = useTranslator();

  const handleDelete = async () => {
    if (!accessToken || !workspaceId) {
      setError(translate("authentication_required", "dashboard"));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.delete(`/${workspaceId}/projects/${projectId}`);

      if (response.status !== 200) {
        throw new Error(translate("failed_to_delete_project", "dashboard"));
      }

      dispatch(
        deleteProject({
          workspaceId,
          projectId,
        })
      );
    } catch (err: any) {
      console.error("DeleteProject error:", err);
      setError(err.response?.data?.message || translate("error_deleting_project", "dashboard"));
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
          <AlertDialogTitle>{translate("delete_project", "dashboard")}</AlertDialogTitle>
          <AlertDialogDescription>
            {translate("confirm_delete_project", "dashboard", { projectName })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>{translate("cancel", "dashboard")}</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isLoading}>
            {isLoading ? translate("deleting", "dashboard") : translate("delete", "dashboard")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
