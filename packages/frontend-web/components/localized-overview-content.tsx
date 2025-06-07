// components/localized-overview-content.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
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
  EyeOff,
  ChevronUp,
  ChevronDown,
  Copy,
  Check
} from "lucide-react";
import { getWebsiteIcon } from "@/libs/icon-mappings";
import { useTranslator } from "@/hooks/use-translations";
import { useEffect, useState, useCallback } from "react";
import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/libs/Redux/store";
import { setWorkspaceData } from "@/libs/Redux/workspaceSlice";
import { Workspace, Project } from "@/libs/Redux/workspaceSlice";
import { useFormatter } from "next-intl";
import { useUser } from "@stackframe/stack";
import { loadInitialData, fetchProjects, fetchProjectKeys, fetchDashboardOverview, fetchRecentActivity, fetchRecentAccounts } from "@/libs/getWorkspace";
import { importRSAPrivateKey, decryptAESKeyWithRSA, decryptAccountData } from "@/libs/encryption";
import { ProjectDialog } from "./project-dialog";
import { secureSetItem, secureGetItem } from '@/libs/session-storage-utils';
import { WelcomeModal } from "./welcom-modal";
import axios from "axios";
import axiosInstance from "@/libs/Middleware/axiosInstace";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useRouter } from "next/navigation";

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
  title?: string;
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
  const router = useRouter();
  const accessToken = useSelector((state: RootState) => state.user.userData?.access_token);
  const userId = useSelector((state: RootState) => state.user.userData?.user_id);
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
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [copiedAccountId, setCopiedAccountId] = useState<string | null>(null);
  const ACTIVITIES_DISPLAY_COUNT = 5;
  const ACCOUNTS_DISPLAY_COUNT = 5;

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
            try {
              const parsedData = JSON.parse(account.data);
              if (parsedData && typeof parsedData === 'object') {
                finalUsername = parsedData.username || finalUsername;
                finalPassword = parsedData.password || finalPassword;
              }
            } catch (parseError) {
              if (!finalPassword) finalPassword = "••••••••";
            }
          }
        } catch (e) {
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

    // Add event listener for project updates
    const handleProjectUpdate = () => {
      fetchDashboardData();
    };

    document.addEventListener("project-updated", handleProjectUpdate);

    return () => {
      document.removeEventListener("project-updated", handleProjectUpdate);
    };
  }, [accessToken, selectedWorkspaceId, selectedProjectId]);

  useEffect(() => {
    const fetchData = async () => {
      if (!accessToken) {
        dispatch(setWorkspaceData({ workspaces: [], selectedWorkspaceId: null, selectedProjectId: null }));
        return;
      }

      const initialData: Workspace[] | null = await loadInitialData(accessToken);

      if (initialData && Array.isArray(initialData) && initialData.length > 0) {
        const defaultWorkspace = initialData[0];
        const projectsData = await fetchProjects(defaultWorkspace.workspaceId, accessToken);

        if (projectsData && projectsData.projects && projectsData.projects.length > 0) {
          setForceCreateProject(false);
          const updatedInitialData = initialData.map(ws => 
            ws.workspaceId === defaultWorkspace.workspaceId ? { ...ws, projects: projectsData.projects } : ws
          );
          
          const defaultProj = projectsData.projects.find((p: Project) => p.is_default);
          
          dispatch(setWorkspaceData({
            workspaces: updatedInitialData,
            selectedWorkspaceId: defaultWorkspace.workspaceId,
            selectedProjectId: selectedProjectId || defaultProj?.project_id || projectsData.projects[0]?.project_id || null,
          }));
          
          await syncProjectKeys(defaultWorkspace.workspaceId, projectsData.projects);
        } else {
          dispatch(setWorkspaceData({
            workspaces: initialData.map(ws => ({ ...ws, projects: [] })),
            selectedWorkspaceId: defaultWorkspace.workspaceId,
            selectedProjectId: null,
          }));
          setForceCreateProject(true);
          setShowProjectDialog(true);
        }
      } else {
        setForceCreateProject(false);
        dispatch(setWorkspaceData({ workspaces: [], selectedWorkspaceId: null, selectedProjectId: null }));
      }
    };

    fetchData();
  }, [accessToken, dispatch, selectedProjectId]);

  // Function to synchronize project keys
  const syncProjectKeys = async (workspaceId: string, projects: Project[]) => {
    if (!workspaceId || !projects.length) {
      return;
    }
    
    try {
      const storedKeys: Record<string, string> = {};
      for (const project of projects) {
        const storedKey = await secureGetItem(`projectKey_${project.project_id}`);
        if (storedKey) {
          storedKeys[project.project_id] = storedKey;
        }
      }

      const missingKeyProjects = projects.filter(project => !storedKeys[project.project_id]);
      
      if (missingKeyProjects.length === 0) {
        return;
      }

      if (!accessToken) {
        return;
      }
      const projectKeys = await fetchProjectKeys(workspaceId, accessToken);
      
      if (!projectKeys) {
        return;
      }

      const privateKeyPEM = await secureGetItem('privateKey');
      if (!privateKeyPEM) {
        return;
      }

      const privateKey = await importRSAPrivateKey(privateKeyPEM);

      for (const projectKey of projectKeys) {
        if (missingKeyProjects.some(p => p.project_id === projectKey.project_id)) {
          try {
            const decryptedKey = await decryptAESKeyWithRSA(projectKey.project_key, privateKey);
            await secureSetItem(`projectKey_${projectKey.project_name}`, decryptedKey);
          } catch (error) {
            // Handle error silently
          }
        }
      }
    } catch (error) {
      // Handle error silently
    }
  };

  useEffect(() => {
    const loadRecentAccounts = async () => {
      if (!accessToken || !selectedWorkspaceId || !selectedProjectId) {
        return;
      }

      try {
        const accounts = await fetchRecentAccounts(selectedWorkspaceId, selectedProjectId, accessToken);
        if (accounts && Array.isArray(accounts)) {
          const processedAccounts = await Promise.all(accounts.map(processAccountData));
          setRecentAccounts(processedAccounts);
        }
      } catch (error) {
        // Handle error silently
      }
    };

    loadRecentAccounts();
  }, [accessToken, selectedWorkspaceId, selectedProjectId, processAccountData]);

  const togglePasswordVisibility = (accountId: string) => {
    setRevealedPasswords(prev => ({
      ...prev,
      [accountId]: !prev[accountId]
    }));
  };

  // Add navigation mapping for data types
  const getDataTypePath = (dataType: string) => {
    const pathMap: Record<string, string> = {
      login: "/dashboard/accounts",
      api_key: "/dashboard/api-keys",
      wallet_address: "/dashboard/wallet-passphrases",
      wifi: "/dashboard/wifi",
      identity: "/dashboard/identity",
      card: "/dashboard/cards",
      email: "/dashboard/emails",
    };
    return pathMap[dataType] || "/dashboard";
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{translate("dashboard", "navigation")}</h1>
      </div>

      {/* Dashboard Overview Cards - Max 2 rows, 5 cards per row */}
      <div className="grid gap-3 grid-cols-5">
        {isLoading ? (
          Array(10).fill(0).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-6 bg-muted rounded w-1/3"></div>
                <div className="h-3 bg-muted rounded w-1/2 mt-2"></div>
              </CardContent>
            </Card>
          ))
        ) : (
          dashboardData && Object.entries(dashboardData).slice(0, 10).map(([key, value]) => (
            <Card 
              key={key} 
              className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-background to-muted/20 cursor-pointer hover:shadow-xl transition-all duration-200"
              onClick={() => router.push(getDataTypePath(key))}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/3 to-primary/10"></div>
              <CardHeader className="relative pb-1 px-3 pt-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-medium text-muted-foreground leading-tight">
                    {formatDataTypeName(key)}
                  </CardTitle>
                  <div className="p-1.5 rounded-full bg-primary/10">
                    {getDataTypeIcon(key, "h-3 w-3 text-primary")}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative px-3 pb-3">
                <div className="text-2xl font-bold text-foreground">{value.toLocaleString()}</div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Activity */}
        <Card className="md:col-span-4 shadow-lg border-0 bg-gradient-to-br from-background to-muted/20">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                {translate("recent_activity", "dashboard")}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className={`pr-2 ${showAllActivities ? 'h-[320px] overflow-y-auto' : ''}`}>
              {isLoading ? (
                Array(5).fill(0).map((_, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 animate-pulse">
                    <div className="h-8 w-8 rounded-full bg-muted"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-muted rounded w-3/4"></div>
                      <div className="h-2 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                ))
              ) : recentActivities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>{translate("no_recent_activity", "dashboard") || "No recent activity"}</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {[...recentActivities].reverse().slice(0, showAllActivities ? recentActivities.length : ACTIVITIES_DISPLAY_COUNT).map((activity) => {
                    const isCurrentUser = activity.user_id === userId;
                    const userName = isCurrentUser ? "You" : "Team member";
                    const actionText = activity.action === "create" ? "created" : 
                                     activity.action === "update" ? "updated" : 
                                     activity.action === "delete" ? "deleted" : activity.action;
                    const dataTypeName = formatDataTypeName(activity.data_type);
                    
                    return (
                      <div 
                        key={activity.doc_id} 
                        className="flex items-start gap-3 p-3 hover:bg-muted/30 rounded-lg transition-all duration-200 border border-transparent hover:border-border group"
                      >
                        <div className="relative">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 border-2 border-primary/20 group-hover:border-primary/40 transition-colors">
                            {getDataTypeIcon(activity.data_type, "h-3 w-3 text-primary")}
                          </div>
                          <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-background border border-background flex items-center justify-center ${getActionColor(activity.action)}`}>
                            {getActionIcon(activity.action, "h-2 w-2")}
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
                                {activity.title ? (
                                  <>
                                    <span className="text-foreground font-medium">
                                      {activity.title}
                                    </span>
                                    {" "}
                                    <span className="text-muted-foreground">in</span>
                                    {" "}
                                  </>
                                ) : (
                                  <span className="text-muted-foreground">a</span>
                                )}
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
                  })}
                  {recentActivities.length > ACTIVITIES_DISPLAY_COUNT && (
                    <div className="flex justify-center pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAllActivities(!showAllActivities)}
                        className="text-muted-foreground hover:text-foreground group"
                      >
                        {showAllActivities ? (
                          <>
                            <ChevronUp className="h-4 w-4 mr-1 group-hover:transform group-hover:-translate-y-0.5 transition-transform" />
                            {translate("show_less", "dashboard") || "Show Less"}
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4 mr-1 group-hover:transform group-hover:translate-y-0.5 transition-transform" />
                            {translate("show_more", "dashboard") || "Show More"}
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recently Added Accounts */}
        <Card className="md:col-span-2 lg:col-span-3 shadow-lg border-0 bg-gradient-to-br from-background to-muted/20">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              {translate("recently_added_accounts", "dashboard") || "Recently Added Accounts"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[320px] overflow-y-auto pr-2">
              <div className="space-y-3">
                {recentAccounts.slice(0, ACCOUNTS_DISPLAY_COUNT).map((account) => (
                  <div 
                    key={account.doc_id} 
                    className="relative p-3 rounded-lg bg-gradient-to-r from-muted/30 to-muted/10 border border-border/50 hover:border-primary/20 transition-all duration-200 group"
                  >
                    {/* Main Account Info */}
                    <div className={`flex items-center justify-between gap-2 transition-all duration-300 ${revealedPasswords[account.doc_id] ? 'blur-sm opacity-50' : ''}`}>
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="p-2 rounded-lg bg-white shadow-sm group-hover:shadow-md transition-shadow">
                          {getWebsiteIcon(account.url || account.website || '', "h-4 w-4 text-slate-700")}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium text-sm group-hover:text-primary transition-colors truncate">
                            {account.name || account.title}
                          </span>
                          <span className="text-muted-foreground text-xs truncate">
                            {account.username}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => togglePasswordVisibility(account.doc_id)}
                        className="text-muted-foreground hover:text-primary transition-colors flex-shrink-0 z-10 relative"
                      >
                        {revealedPasswords[account.doc_id] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    {/* Password Modal/Projection */}
                    {revealedPasswords[account.doc_id] && (
                      <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                        <div className="bg-background/95 backdrop-blur-sm border border-primary/10 rounded-lg shadow-lg shadow-primary/30 px-3 py-2 max-w-[90%] animate-in fade-in-0 zoom-in-95 duration-200">
                          <div className="flex items-center gap-2">
                            <div className="font-mono text-sm bg-primary/5 text-primary px-2.5 py-0.5 rounded border border-primary/10 truncate">
                              {account.password}
                            </div>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-primary/70 hover:text-primary pointer-events-auto"
                                    onClick={() => {
                                      navigator.clipboard.writeText(account.password || '');
                                      setCopiedAccountId(account.doc_id);
                                      setTimeout(() => setCopiedAccountId(null), 2000);
                                    }}
                                  >
                                    {copiedAccountId === account.doc_id ? (
                                      <Check className="h-3.5 w-3.5 text-green-500" />
                                    ) : (
                                      <Copy className="h-3.5 w-3.5" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{copiedAccountId === account.doc_id ? translate("copied", "accounts") : translate("copy_password", "accounts")}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Click overlay to close when password is shown */}
                    {revealedPasswords[account.doc_id] && (
                      <div 
                        className="absolute inset-0 z-10 cursor-pointer"
                        onClick={() => togglePasswordVisibility(account.doc_id)}
                      />
                    )}
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