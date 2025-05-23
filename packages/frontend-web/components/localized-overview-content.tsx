"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Users, Lock, FileText, Shield, User } from "lucide-react";
import { useTranslator } from "@/hooks/use-translations";
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/libs/Redux/store";
import { setWorkspaceData } from "@/libs/Redux/workspaceSlice";
import { Workspace, Project } from "@/libs/Redux/workspaceSlice";
import { useFormatter } from "next-intl";
import { useUser } from "@stackframe/stack";
import { loadInitialData, fetchProjects, fetchProjectKeys } from "@/libs/getWorkspace";
import { importRSAPrivateKey, decryptAESKeyWithRSA } from "@/libs/encryption";
import { ProjectDialog } from "./project-dialog";
import { secureSetItem, secureGetItem } from '@/libs/session-storage-utils';

export function LocalizedOverviewContent() {
  const { translate } = useTranslator();
  const format = useFormatter(); // Use formatter from next-intl
  const user = useUser();
  const dispatch = useDispatch<AppDispatch>();
  const accessToken = useSelector((state: RootState) => state.user.userData?.access_token);
  const workspaces = useSelector((state: RootState) => state.workspace.workspaces);
  const selectedWorkspaceId = useSelector((state: RootState) => state.workspace.selectedWorkspaceId);
  const selectedProjectId = useSelector((state: RootState) => state.workspace.selectedProjectId);

  // State to control project dialog visibility
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [forceCreateProject, setForceCreateProject] = useState(false);

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

  // Placeholder for dynamic stats (to be fetched from backend)
  const stats = {
    totalPasswords: 124, // Replace with API call
    totalAccounts: 34,   // Replace with API call
    totalFolders: 8,     // Replace with API call
    teamMembers: 4,      // Replace with API call
    passwordsTrend: "+12%", // Replace with API calculation
    accountsTrend: "+5%",   // Replace with API calculation
    foldersTrend: "+2%",    // Replace with API calculation
    workspacesTrend: "+10%", // Replace with API calculation
  };

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
        // console.log("fetchData: defaultWorkspace", defaultWorkspace);

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
          
          // After projects are loaded, check and synchronize project keys
          console.log(`fetchData: About to call syncProjectKeys with workspaceId: ${defaultWorkspace.workspaceId} and projects:`, projectsData.projects);
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
      // Get all project keys from session storage
      const storedKeys: Record<string, string> = {};
      for (const project of projects) {
        const storedKey = await secureGetItem(`projectKey_${project.project_id}`);
        console.log("syncProjectKeys: storedKey", storedKey);
        if (storedKey) {
          storedKeys[project.project_id] = storedKey;
        }
      }

      // Check if any keys are missing
      const missingKeyProjects = projects.filter(project => !storedKeys[project.project_id]);
      
      if (missingKeyProjects.length === 0) {
        console.log("All project keys are present in session storage");
        return; // All keys are already in session storage
      }
      
      console.log("Missing project keys for projects:", missingKeyProjects.map(p => p.name));

      // Fetch project keys from API
      if (!accessToken) {
        console.log("syncProjectKeys: Missing accessToken, returning early.");
        return;
      }
      const projectKeys = await fetchProjectKeys(workspaceId, accessToken);
      
      if (!projectKeys) {
        console.error("Failed to fetch project keys from API");
        return;
      }

      // Get user's private key from session storage to decrypt project keys
      const privateKeyPEM = await secureGetItem('privateKey');
      console.log("syncProjectKeys: privateKeyPEM", privateKeyPEM);
      if (!privateKeyPEM) {
        console.error("Private key not found in session storage");
        return;
      }

      // Import the private key
      const privateKey = await importRSAPrivateKey(privateKeyPEM);
      console.log("syncProjectKeys: privateKey", privateKey);
      // Process each project key that needs to be added to session storage
      for (const projectKey of projectKeys) {
        if (missingKeyProjects.some(p => p.project_id === projectKey.project_id)) {
          try {
            console.log("decryption started")
            // Decrypt the project key using the user's private key
            const decryptedKey = await decryptAESKeyWithRSA(projectKey.project_key, privateKey);
            console.log("syncProjectKeys: decryptedKey", decryptedKey);
            // Store the decrypted key in session storage
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

  // Mock recent activities with dynamic time formatting
  const recentActivities = [
    { type: "password_updated", timestamp: new Date(Date.now() - 5 * 60 * 1000) }, // 5 minutes ago
    { type: "note_created", timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) }, // 2 hours ago
    { type: "password_updated", timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // 1 day ago
    { type: "note_created", timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) }, // 3 days ago
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{translate('dashboard', 'navigation')}</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-muted-foreground">{translate('current_project', 'dashboard')}:</p>
            {displayProject ? (
              <div className="flex items-center gap-2">
                <div
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: displayProject.color }}
                ></div>
                <span className="text-sm font-medium">{displayProject.name}</span>
                {displayProject.is_default && (
                  <span className="text-xs bg-muted px-1.5 py-0.5 rounded">{translate('default', 'dashboard')}</span>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{translate('no_project_selected', 'dashboard')}</p>
            )}
          </div>
        </div>
        <div>
          <select className="rounded-md border border-border bg-background px-3 py-2 text-sm">
            <option>{translate('today', 'time')}</option>
            <option>{translate('last_7_days', 'time')}</option>
            <option>{translate('last_30_days', 'time')}</option>
            <option>{translate('all_time', 'time')}</option>
          </select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {translate('total_passwords', 'dashboard')}
              </CardTitle>
              <Lock className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalPasswords}</div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              <span className="text-green-500 font-medium">{stats.passwordsTrend}</span> {translate('from_last_month', 'dashboard')}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {translate('total_accounts', 'dashboard')}
              </CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalAccounts}</div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              <span className="text-green-500 font-medium">{stats.accountsTrend}</span> {translate('from_last_month', 'dashboard')}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/5 to-purple-500/10 border-purple-500/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {translate('total_folders', 'dashboard')}
              </CardTitle>
              <Shield className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalFolders}</div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              <span className="text-green-500 font-medium">{stats.foldersTrend}</span> {translate('from_last_month', 'dashboard')}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {translate('total_workspaces', 'dashboard')}
              </CardTitle>
              <Users className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalWorkspaces}</div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              <span className="text-green-500 font-medium">{stats.workspacesTrend}</span> {translate('from_last_month', 'dashboard')}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{translate('recent_activity', 'dashboard')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start gap-4 p-3 hover:bg-muted/50 rounded-lg transition-colors">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {activity.type === "password_updated" ? (
                      <Lock className="h-4 w-4 text-primary" />
                    ) : (
                      <FileText className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium truncate">
                        {translate(activity.type, 'activity')}
                      </p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                        {format.relativeTime(activity.timestamp, new Date())}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{translate('quick_stats', 'dashboard')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{translate('workspaces', 'dashboard')}</span>
                </div>
                <span className="text-sm font-medium">{totalWorkspaces}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{translate('projects', 'dashboard')}</span>
                </div>
                <span className="text-sm font-medium">{totalProjects}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{translate('team_members', 'dashboard')}</span>
                </div>
                <span className="text-sm font-medium">{stats.teamMembers}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add project dialog at the end of the component */}
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