"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Users, Lock, FileText, Shield, User } from "lucide-react";
import { useUser } from "@stackframe/stack";
import { useEffect, useState } from "react";
import { loadInitialData, fetchProjects, fetchProjectKeys } from "../libs/getWorkspace";
import { RootState, AppDispatch } from "../libs/Redux/store";
import { useSelector, useDispatch } from "react-redux";
import { setWorkspaceData } from "../libs/Redux/workspaceSlice";
import { Workspace, Project } from "../libs/Redux/workspaceSlice";
import { log } from "node:console";
import { ProjectDialog } from "./project-dialog";
import { importRSAPrivateKey, decryptAESKeyWithRSA } from "../libs/encryption";
import { secureSetItem, secureGetItem } from '@/libs/session-storage-utils';

export function OverviewContent() {
  const user = useUser();
  const dispatch = useDispatch<AppDispatch>();
  const accessToken = useSelector((state: RootState) => state.user.userData?.access_token);
  console.log(`access token ${accessToken}`);
  
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

  useEffect(() => {
    const fetchAuthDetails = async () => {
      const authDetails = await user?.getAuthJson();
      console.log("Access Token from Stack:", authDetails?.accessToken);
    };
    fetchAuthDetails();
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      console.log("fetchData: Starting...");
      if (!accessToken) {
        console.error("fetchData: No access token available in Redux, returning.");
        dispatch(
          setWorkspaceData({
            workspaces: [],
            selectedWorkspaceId: null,
            selectedProjectId: null,
          })
        );
        return;
      }
      console.log("fetchData: Access token available.");

      const initialData: Workspace[] | null = await loadInitialData(accessToken);
      console.log("fetchData: initialData fetched", initialData);

      if (initialData && Array.isArray(initialData) && initialData.length > 0) {
        console.log("fetchData: initialData is valid and has workspaces.");
        const defaultWorkspace = initialData[0];
        console.log("fetchData: defaultWorkspace", defaultWorkspace);

        const projectsData = await fetchProjects(defaultWorkspace.workspaceId, accessToken);
        console.log("fetchData: projectsData fetched", projectsData);
        
        if (projectsData && projectsData.projects && projectsData.projects.length > 0) {
          console.log("fetchData: projectsData is valid and has projects. Preparing to call syncProjectKeys.");
          setForceCreateProject(false); // Projects exist, no need to force creation
          const updatedInitialData = initialData.map(workspace => {
            if (workspace.workspaceId === defaultWorkspace.workspaceId) {
              return { ...workspace, projects: projectsData.projects };
            }
            return workspace;
          });
          
          console.log("✅ Dispatching initial data to Redux with new projects:", updatedInitialData);
          const defaultProj = projectsData.projects.find((p: Project) => p.is_default);
          
          dispatch(
            setWorkspaceData({
              workspaces: updatedInitialData,
              selectedWorkspaceId: defaultWorkspace.workspaceId,
              selectedProjectId: selectedProjectId || defaultProj?.project_id || projectsData.projects[0]?.project_id || null,
            })
          );

          // After projects are loaded, check and synchronize project keys
          console.log(`fetchData: About to call syncProjectKeys with workspaceId: ${defaultWorkspace.workspaceId} and projects:`, projectsData.projects);
          await syncProjectKeys(defaultWorkspace.workspaceId, projectsData.projects);
          console.log("fetchData: syncProjectKeys has been called.");
        } else {
          console.log("fetchData: No projects found in projectsData, or projectsData is invalid. Skipping syncProjectKeys.", projectsData);
          // No projects found
          console.log("No projects found for the workspace, showing project creation dialog (forced)");
          dispatch(
            setWorkspaceData({
              workspaces: initialData.map(workspace => ({
                ...workspace,
                projects: [], // Ensure projects array is empty
              })),
              selectedWorkspaceId: defaultWorkspace.workspaceId,
              selectedProjectId: null,
            })
          );
          setForceCreateProject(true);
          setShowProjectDialog(true);
        }
      } else {
        console.error("❌ Failed to load initial data or no workspaces available.");
        setForceCreateProject(false); // Ensure force create is false if there's an error or no workspaces
        dispatch(
          setWorkspaceData({
            workspaces: [],
            selectedWorkspaceId: null,
            selectedProjectId: null,
          })
        );
        // Consider if you need to show a generic "create workspace/project" dialog here if initialData itself is empty
      }
    };

    fetchData();
  }, [accessToken, dispatch, selectedProjectId, user]); // Added user to dependency array for fetchAuthDetails sync

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
      if (!privateKeyPEM) {
        console.error("Private key not found in session storage");
        return;
      }

      // Import the private key
      const privateKey = await importRSAPrivateKey(privateKeyPEM);
      
      // Process each project key that needs to be added to session storage
      for (const projectKey of projectKeys) {
        if (missingKeyProjects.some(p => p.project_id === projectKey.project_id)) {
          try {
            // Decrypt the project key using the user's private key
            const decryptedKey = await decryptAESKeyWithRSA(projectKey.project_key, privateKey);
            
            // Store the decrypted key in session storage
            await secureSetItem(`projectKey_${projectKey.project_id}`, decryptedKey);
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

  // Calculate totals from Redux state
  const totalProjects = workspaces?.reduce((sum, ws) => sum + ws.projects.length, 0) || 0;
  const totalWorkspaces = workspaces?.length || 0;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          {/* <div className="flex items-center gap-2 mt-1">
            <p className="text-muted-foreground">Current Project:</p>
            {displayProject ? (
              <div className="flex items-center gap-2">
                <div
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: displayProject.color }}
                ></div>
                <span className="text-sm font-medium">{displayProject.name}</span>
                {displayProject.is_default && (
                  <span className="text-xs bg-muted px-1.5 py-0.5 rounded">Default</span>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No project selected</p>
            )}
          </div> */}
        </div>
        <div>
          <select className="rounded-md border border-border bg-background px-3 py-2 text-sm">
            <option>Today</option>
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>All time</option>
          </select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Passwords</CardTitle>
              <Lock className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">124</div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              <span className="text-green-500 font-medium">+12%</span> from last month
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Accounts</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">34</div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              <span className="text-green-500 font-medium">+5%</span> from last month
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/5 to-purple-500/10 border-purple-500/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Folders</CardTitle>
              <Shield className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">8</div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              <span className="text-green-500 font-medium">+2%</span> from last month
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Notes</CardTitle>
              <FileText className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">16</div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              <span className="text-green-500 font-medium">+8%</span> from last month
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Tabs defaultValue="recent">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Your Accounts</h2>
            <TabsList>
              <TabsTrigger value="recent">Recently Added</TabsTrigger>
              <TabsTrigger value="favorites">Favorites</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="recent" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Recently Added Accounts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          {i % 3 === 0 ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 text-primary"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                            </svg>
                          ) : i % 3 === 1 ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 text-blue-500"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
                            </svg>
                          ) : (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 text-green-500"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                              <rect x="2" y="9" width="4" height="12" />
                              <circle cx="4" cy="4" r="2" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">
                            {i % 3 === 0 ? "Facebook" : i % 3 === 1 ? "Twitter" : "LinkedIn"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Added {i === 1 ? "today" : i === 2 ? "yesterday" : i + " days ago"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-2 rounded-md hover:bg-muted transition-colors">
                          <Lock className="h-4 w-4 text-muted-foreground" />
                        </button>
                        <button className="p-2 rounded-md hover:bg-muted transition-colors">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 text-muted-foreground"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                          </svg>
                        </button>
                        <button className="p-2 rounded-md hover:bg-muted transition-colors">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 text-muted-foreground"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <circle cx="12" cy="12" r="1" />
                            <circle cx="19" cy="12" r="1" />
                            <circle cx="5" cy="12" r="1" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex justify-center">
                  <button className="text-sm text-primary hover:underline">View All Recent Accounts</button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="favorites" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Favorite Accounts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          {i % 4 === 0 ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 text-red-500"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                            </svg>
                          ) : i % 4 === 1 ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 text-blue-500"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                              <line x1="8" y1="21" x2="16" y2="21" />
                              <line x1="12" y1="17" x2="12" y2="21" />
                            </svg>
                          ) : i % 4 === 2 ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 text-green-500"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                            </svg>
                          ) : (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 text-yellow-500"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                              <polyline points="22,6 12,13 2,6" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">
                            {i % 4 === 0 ? "GitHub" : i % 4 === 1 ? "Apple" : i % 4 === 2 ? "Verizon" : "Gmail"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Last used {i === 1 ? "today" : i === 2 ? "yesterday" : i + " days ago"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-2 rounded-md hover:bg-muted transition-colors">
                          <Lock className="h-4 w-4 text-muted-foreground" />
                        </button>
                        <button className="p-2 rounded-md hover:bg-muted transition-colors">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 text-yellow-500"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                          </svg>
                        </button>
                        <button className="p-2 rounded-md hover:bg-muted transition-colors">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 text-muted-foreground"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <circle cx="12" cy="12" r="1" />
                            <circle cx="19" cy="12" r="1" />
                            <circle cx="5" cy="12" r="1" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex justify-center">
                  <button className="text-sm text-primary hover:underline">View All Favorite Accounts</button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-start gap-4 p-3 hover:bg-muted/50 rounded-lg transition-colors">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {i % 2 === 0 ? (
                      <Lock className="h-4 w-4 text-primary" />
                    ) : (
                      <FileText className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium truncate">{i % 2 === 0 ? "Password updated" : "Secure note created"}</p>
                      <p className="text-xs text-muted-foreground flex-shrink-0">
                        {i === 1 ? "Today" : i === 2 ? "Yesterday" : `${i} days ago`}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {i % 2 === 0 ? "Updated password for GitHub" : "Created note for project planning"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Workspaces</span>
                </div>
                <span className="text-sm font-medium">{totalWorkspaces}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Projects</span>
                </div>
                <span className="text-sm font-medium">{totalProjects}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Team Members</span>
                </div>
                <span className="text-sm font-medium">4</span>
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
            // If projects are still zero and it was a forced create, user might have tried to escape.
            // Re-fetching or checking project count here could re-trigger, but for now,
            // the dialog's internal logic will prevent closing if forceCreate is true.
          }} 
          forceCreate={forceCreateProject} 
        />
      )}
    </div>
  );
}