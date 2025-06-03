// components/localized-overview-content.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  Users, 
  Lock, 
  FileText, 
  Shield, 
  User, 
  Key,
  Wallet,
  Wifi,
  CreditCard,
  Mail,
  UserCheck,
  Edit,
  Trash2,
  Plus,
  Activity,
  Eye,
  EyeOff
} from "lucide-react";
import { useTranslator } from "@/hooks/use-translations";
import { useEffect, useState, useCallback } from "react";
import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/libs/Redux/store";
import { setWorkspaceData } from "@/libs/Redux/workspaceSlice";
import { Workspace, Project } from "@/libs/Redux/workspaceSlice";
import { useFormatter } from "next-intl";
import { useUser } from "@stackframe/stack";
import { loadInitialData, fetchProjects, fetchProjectKeys, fetchDashboardOverview, fetchRecentActivity } from "@/libs/getWorkspace";
import { importRSAPrivateKey, decryptAESKeyWithRSA, decryptAccountData } from "@/libs/encryption";
import { ProjectDialog } from "./project-dialog";
import { secureSetItem, secureGetItem } from '@/libs/session-storage-utils';
import { WelcomeModal } from "./welcom-modal";
import axios from "axios";
import axiosInstance from "@/libs/Middleware/axiosInstace";

interface DashboardData {
  [key: string]: number;
}

interface Activity {
  doc_id: string;
  project_id: string;
  data_type: string;
  user_id: string;
  record_id: string;
  action: string;
  created_at: string;
  updated_at: string;
}

interface Account {
  doc_id: string;
  name?: string;
  title?: string;
  lower_name: string;
  user_name?: string;
  username?: string;
  password?: string;
  data?: string | { username: string; password: string };
  website?: string | null;
  url?: string | null;
  notes?: string | null;
  tags?: string[];
  created_at: string;
  updated_at: string;
  created_by: string;
  project_id: string;
}

// Helper function to get icon for data type
const getDataTypeIcon = (dataType: string, className: string = "h-4 w-4") => {
  const iconMap: Record<string, React.ReactElement> = {
    login: <UserCheck className={className} />,
    api_key: <Key className={className} />,
    wallet_address: <Wallet className={className} />,
    wifi: <Wifi className={className} />,
    identity: <User className={className} />,
    card: <CreditCard className={className} />,
    email: <Mail className={className} />,
  };
  return iconMap[dataType] || <FileText className={className} />;
};

// Helper function to get action icon
const getActionIcon = (action: string, className: string = "h-3 w-3") => {
  const iconMap: Record<string, React.ReactElement> = {
    create: <Plus className={className} />,
    update: <Edit className={className} />,
    delete: <Trash2 className={className} />,
  };
  return iconMap[action] || <Activity className={className} />;
};

// Helper function to get action color
const getActionColor = (action: string) => {
  const colorMap: Record<string, string> = {
    create: "text-green-600",
    update: "text-blue-600",
    delete: "text-red-600",
  };
  return colorMap[action] || "text-gray-600";
};

// Helper function to format data type name
const formatDataTypeName = (dataType: string) => {
  const nameMap: Record<string, string> = {
    login: "Login Credential",
    api_key: "API Key",
    wallet_address: "Wallet Address",
    wifi: "WiFi Configuration",
    identity: "Identity",
    card: "Card Information",
    email: "Email Configuration",
  };
  return nameMap[dataType] || dataType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export function LocalizedOverviewContent() {
  const { translate } = useTranslator();
  const format = useFormatter();
  const dispatch = useDispatch<AppDispatch>();
  const accessToken = useSelector((state: RootState) => state.user.userData?.access_token);
  const userId = useSelector((state: RootState) => state.user.userData?.user_id);
  console.log("Current user ID from Redux:", userId);
  const workspaces = useSelector((state: RootState) => state.workspace.workspaces);
  const selectedWorkspaceId = useSelector((state: RootState) => state.workspace.selectedWorkspaceId);
  const selectedProjectId = useSelector((state: RootState) => state.workspace.selectedProjectId);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [forceCreateProject, setForceCreateProject] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [recentAccounts, setRecentAccounts] = useState<Account[]>([]);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

  const processAccountData = useCallback(async (account: Account): Promise<Account> => {
    try {
      if (account.password && account.username) {
        return account;
      }

      let finalUsername = account.username || '';
      let finalPassword = account.password || '';

      if (account.data && typeof account.data === 'string') {
        try {
          const currentProject = workspaces
            .find(ws => ws.workspaceId === selectedWorkspaceId)
            ?.projects.find(p => p.project_id === selectedProjectId);
          
          if (!currentProject) {
            throw new Error("Project not found");
          }

          const projectKeyName = `projectKey_${currentProject.name}`;
          const projectAesKey = await secureGetItem(projectKeyName);
          
          if (!projectAesKey) {
            throw new Error("Project encryption key not found");
          }

          try {
            const decryptedData = await decryptAccountData(account.data, projectAesKey);
            const parsedData = JSON.parse(decryptedData);
            if (parsedData && typeof parsedData === 'object') {
              finalUsername = parsedData.username || finalUsername;
              finalPassword = parsedData.password || finalPassword;
            }
          } catch (decryptError) {
            console.error("Decryption failed, trying legacy JSON parse:", decryptError);
            try {
              const parsedData = JSON.parse(account.data);
              if (parsedData && typeof parsedData === 'object') {
                finalUsername = parsedData.username || finalUsername;
                finalPassword = parsedData.password || finalPassword;
              }
            } catch (parseError) {
              if (!finalPassword) finalPassword = "••••••••";
              console.log("Error parsing data:", parseError);
            }
          }
        } catch (e) {
          console.error("Error processing account data:", e);
          if (!finalPassword) finalPassword = "••••••••";
        }
      } else if (account.data && typeof account.data === 'object') {
        finalUsername = account.data.username || finalUsername;
        finalPassword = account.data.password || finalPassword;
      }
      
      if (!finalPassword && account.data) {
        finalPassword = "••••••••";
      } else if (!finalPassword && !account.data && !account.password) {
        finalPassword = "-";
      }

      return {
        ...account,
        username: finalUsername,
        password: finalPassword,
      };
    } catch (error) {
      console.error("Failed to process account data:", error);
      return {
        ...account,
        username: account.username || '-',
        password: "Error processing data",
      };
    }
  }, [selectedWorkspaceId, selectedProjectId, workspaces]);

  // Get selected and default project for display
  const selectedProject = useSelector((state: RootState) =>
    Array.isArray(state.workspace.workspaces) && selectedWorkspaceId && selectedProjectId
      ? state.workspace.workspaces
          .find((ws) => ws.workspaceId === selectedWorkspaceId)
          ?.projects.find((p) => p.project_id === selectedProjectId)
      : null
  );
  const defaultProject = useSelector((state: RootState) =>
    Array.isArray(state.workspace.workspaces) && selectedWorkspaceId
      ? state.workspace.workspaces
          .find((ws) => ws.workspaceId === selectedWorkspaceId)
          ?.projects.find((p) => p.is_default)
      : null
  );
  const displayProject = selectedProject || defaultProject;

  // Calculate totals from Redux state
  const totalProjects = workspaces?.reduce((sum, ws) => sum + ws.projects.length, 0) || 0;
  const totalWorkspaces = workspaces?.length || 0;

  // Fetch dashboard data when selected project changes
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!accessToken || !selectedWorkspaceId || !selectedProjectId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const [overviewData, activityData] = await Promise.all([
          fetchDashboardOverview(selectedWorkspaceId, selectedProjectId, accessToken),
          fetchRecentActivity(selectedWorkspaceId, selectedProjectId, accessToken)
        ]);

        if (overviewData) {
          setDashboardData(overviewData);
        }

        if (activityData) {
          setRecentActivities(activityData);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [accessToken, selectedWorkspaceId, selectedProjectId]);

  useEffect(() => {
    const fetchData = async () => {
      console.log("fetchData: Starting...");
      if (!accessToken) {
        console.error("fetchData: No access token available in Redux");
        dispatch(setWorkspaceData({ workspaces: [], selectedWorkspaceId: null, selectedProjectId: null }));
        return;
      }
      console.log("fetchData: Access token available.");

      const initialData: Workspace[] | null = await loadInitialData(accessToken);
      console.log("fetchData: initialData fetched", initialData);

      if (initialData && Array.isArray(initialData) && initialData.length > 0) {
        console.log("fetchData: initialData is valid and has workspaces.");
        const defaultWorkspace = initialData[0];

        const projectsData = await fetchProjects(defaultWorkspace.workspaceId, accessToken);
        console.log("fetchData: projectsData fetched", projectsData);

        if (projectsData && projectsData.projects && projectsData.projects.length > 0) {
          console.log("fetchData: projectsData is valid and has projects. Preparing to call syncProjectKeys.");
          setForceCreateProject(false);
          const updatedInitialData = initialData.map(ws => 
            ws.workspaceId === defaultWorkspace.workspaceId ? { ...ws, projects: projectsData.projects } : ws
          );
          
          console.log("✅ Dispatching initial data to Redux with new projects (localized):", updatedInitialData);
          const defaultProj = projectsData.projects.find((p: Project) => p.is_default);
          
          dispatch(setWorkspaceData({
            workspaces: updatedInitialData,
            selectedWorkspaceId: defaultWorkspace.workspaceId,
            selectedProjectId: selectedProjectId || defaultProj?.project_id || projectsData.projects[0]?.project_id || null,
          }));
          
          await syncProjectKeys(defaultWorkspace.workspaceId, projectsData.projects);
          console.log("fetchData: syncProjectKeys has been called.");
        } else {
          console.log("fetchData: No projects found in projectsData, or projectsData is invalid. Skipping syncProjectKeys.", projectsData);
          console.log("No projects found, showing project creation dialog (forced, localized)");
          dispatch(setWorkspaceData({
            workspaces: initialData.map(ws => ({ ...ws, projects: [] })),
            selectedWorkspaceId: defaultWorkspace.workspaceId,
            selectedProjectId: null,
          }));
          setForceCreateProject(true);
          setShowProjectDialog(true);
        }
      } else {
        console.error("❌ Failed to load initial data or no workspaces available (localized).");
        setForceCreateProject(false);
        dispatch(setWorkspaceData({ workspaces: [], selectedWorkspaceId: null, selectedProjectId: null }));
      }
    };

    fetchData();
  }, [accessToken, dispatch, selectedProjectId]);

  // Function to synchronize project keys
  const syncProjectKeys = async (workspaceId: string, projects: Project[]) => {
    console.log("syncProjectKeys: Function has been entered. Args:", { workspaceId, projects });
    if (!workspaceId || !projects.length) {
      console.log("syncProjectKeys: Returning early because workspaceId is missing or projects array is empty.", { workspaceId, projectsLength: projects?.length });
      return;
    }
    
    try {
      console.log("syncProjectKeys: Starting try block.");
      const storedKeys: Record<string, string> = {};
      for (const project of projects) {
        const storedKey = await secureGetItem(`projectKey_${project.project_id}`);
        console.log("syncProjectKeys: storedKey", storedKey);
        if (storedKey) {
          storedKeys[project.project_id] = storedKey;
        }
      }

      const missingKeyProjects = projects.filter(project => !storedKeys[project.project_id]);
      
      if (missingKeyProjects.length === 0) {
        console.log("All project keys are present in session storage");
        return;
      }
      
      console.log("Missing project keys for projects:", missingKeyProjects.map(p => p.name));

      if (!accessToken) {
        console.log("syncProjectKeys: Missing accessToken, returning early.");
        return;
      }
      const projectKeys = await fetchProjectKeys(workspaceId, accessToken);
      
      if (!projectKeys) {
        console.error("Failed to fetch project keys from API");
        return;
      }

      const privateKeyPEM = await secureGetItem('privateKey');
      console.log("syncProjectKeys: privateKeyPEM", privateKeyPEM);
      if (!privateKeyPEM) {
        console.error("Private key not found in session storage");
        return;
      }

      const privateKey = await importRSAPrivateKey(privateKeyPEM);
      console.log("syncProjectKeys: privateKey", privateKey);

      for (const projectKey of projectKeys) {
        if (missingKeyProjects.some(p => p.project_id === projectKey.project_id)) {
          try {
            console.log("decryption started")
            const decryptedKey = await decryptAESKeyWithRSA(projectKey.project_key, privateKey);
            console.log("syncProjectKeys: decryptedKey", decryptedKey);
            await secureSetItem(`projectKey_${projectKey.project_name}`, decryptedKey);
            console.log(`✅ Project key synchronized for project: ${projectKey.project_name || projectKey.project_id}`);
          } catch (error) {
            console.error(`Error processing key for project ID ${projectKey.project_id}:`, error);
          }
        }
      }
    } catch (error) {
      console.error("Error synchronizing project keys:", error);
    }
  };

  useEffect(() => {
    const fetchRecentAccounts = async () => {
      if (!accessToken || !selectedWorkspaceId || !selectedProjectId) {
        return;
      }

      try {
        const response = await axiosInstance.get(
          `/${selectedWorkspaceId}/${selectedProjectId}/accounts?limit=5&sort=created_at:desc`
        );

        if (response.status === 200) {
          const { data: accounts = [] } = response.data || {};
          const processedAccounts = await Promise.all(accounts.map(processAccountData));
          setRecentAccounts(processedAccounts);
        }
      } catch (error) {
        console.error("Error fetching recent accounts:", error);
      }
    };

    fetchRecentAccounts();
  }, [accessToken, selectedWorkspaceId, selectedProjectId, processAccountData]);

  const togglePasswordVisibility = (accountId: string) => {
    setRevealedPasswords(prev => ({
      ...prev,
      [accountId]: !prev[accountId]
    }));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{translate("dashboard", "navigation")}</h1>
          <p className="text-muted-foreground mt-1">
            {translate("welcome_back", "dashboard")} {useUser()?.displayName || "User"}
          </p>
        </div>
      </div>

      {/* Dashboard Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array(4).fill(0).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/3"></div>
                <div className="h-4 bg-muted rounded w-1/2 mt-2"></div>
              </CardContent>
            </Card>
          ))
        ) : (
          dashboardData && Object.entries(dashboardData).map(([key, value]) => (
            <Card key={key} className="relative overflow-hidden border-0 shadow-md">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/3 to-primary/10"></div>
              <CardHeader className="relative pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {formatDataTypeName(key)}
                  </CardTitle>
                  <div className="p-2 rounded-full bg-primary/10">
                    {getDataTypeIcon(key, "h-4 w-4 text-primary")}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-3xl font-bold text-foreground">{value.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground mt-2 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                  <span className="text-green-500 font-medium">+0%</span>{" "}
                  {translate("from_last_month", "dashboard")}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Activity */}
        <Card className="md:col-span-4 shadow-md">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                {translate("recent_activity", "dashboard")}
              </CardTitle>
              <div className="text-xs text-muted-foreground">
                {translate("last_24_hours", "dashboard") || "Last 24 hours"}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {isLoading ? (
                Array(5).fill(0).map((_, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 animate-pulse">
                    <div className="h-10 w-10 rounded-full bg-muted"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                ))
              ) : recentActivities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>{translate("no_recent_activity", "dashboard") || "No recent activity"}</p>
                </div>
              ) : (
                recentActivities.map((activity) => {
                  const isCurrentUser = activity.user_id === userId;
                  const userName = isCurrentUser ? "You" : "Team member";
                  const actionText = activity.action === "create" ? "created" : 
                                   activity.action === "update" ? "updated" : 
                                   activity.action === "delete" ? "deleted" : activity.action;
                  const dataTypeName = formatDataTypeName(activity.data_type);
                  
                  return (
                    <div 
                      key={activity.doc_id} 
                      className="flex items-start gap-4 p-4 hover:bg-muted/30 rounded-lg transition-all duration-200 border border-transparent hover:border-border"
                    >
                      <div className="relative">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 border-2 border-primary/20">
                          {getDataTypeIcon(activity.data_type, "h-4 w-4 text-primary")}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-background border-2 border-background flex items-center justify-center ${getActionColor(activity.action)}`}>
                          {getActionIcon(activity.action)}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm leading-5">
                              <span className={isCurrentUser ? "text-primary font-semibold" : "text-foreground"}>
                                {userName}
                              </span>
                              {" "}
                              <span className={`${getActionColor(activity.action)} font-medium`}>
                                {actionText}
                              </span>
                              {" "}
                              <span className="text-muted-foreground">a</span>
                              {" "}
                              <span className="text-foreground font-medium">
                                {dataTypeName}
                              </span>
                            </p>
                            
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-muted-foreground">
                                {format.relativeTime(new Date(activity.created_at), new Date())}
                              </span>
                              {activity.record_id && (
                                <>
                                  <span className="text-xs text-muted-foreground">•</span>
                                  <span className="text-xs text-muted-foreground font-mono">
                                    {activity.record_id.split('-')[0]}...
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="md:col-span-2 lg:col-span-3 shadow-md border-0 bg-gradient-to-br from-background to-muted/20">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              {translate("quick_stats", "dashboard")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Recent Accounts Section */}
              <div>
                <h3 className="text-sm font-medium mb-4 text-muted-foreground">{translate("recent_accounts", "dashboard")}</h3>
                <div className="space-y-3">
                  {recentAccounts.map((account) => (
                    <div 
                      key={account.doc_id} 
                      className="p-4 rounded-lg bg-gradient-to-r from-muted/30 to-muted/10 border border-border/50 hover:border-primary/20 transition-all duration-200 group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm group-hover:text-primary transition-colors">
                          {account.name || account.title}
                        </span>
                        <button
                          onClick={() => togglePasswordVisibility(account.doc_id)}
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          {revealedPasswords[account.doc_id] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <div className="text-sm space-y-1.5">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <User className="h-3.5 w-3.5" />
                          <span className="truncate">{account.username}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-mono text-xs bg-muted/50 px-2 py-0.5 rounded">
                            {revealedPasswords[account.doc_id] ? account.password : "••••••••"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {recentAccounts.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg border border-dashed border-border">
                      <Shield className="h-8 w-8 mx-auto mb-3 opacity-30" />
                      <p>{translate("no_recent_accounts", "dashboard")}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {showProjectDialog && (
        <ProjectDialog 
          onClose={() => {
            setShowProjectDialog(false);
          }} 
          forceCreate={forceCreateProject} 
        />
      )}
    </div>
  );
}