// components/localized-overview-content.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, TrendingUp, Users, Shield, FileText } from "lucide-react";
import { useTranslator } from "@/hooks/use-translations";
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/libs/Redux/store";
import { setWorkspaceData } from "@/libs/Redux/workspaceSlice";
import { loadInitialData } from "@/libs/getWorkspace";
import { Workspace } from "@/libs/Redux/workspaceSlice";
import { useFormatter } from "next-intl";
import { WelcomeModal } from "./welcom-modal";
import { ProjectDialog } from "./project-dialog";

export function LocalizedOverviewContent() {
  const { translate } = useTranslator();
  const format = useFormatter();
  const dispatch = useDispatch<AppDispatch>();
  const accessToken = useSelector((state: RootState) => state.user.userData?.access_token);
  const workspaces = useSelector((state: RootState) => state.workspace.workspaces);
  const selectedWorkspaceId = useSelector((state: RootState) => state.workspace.selectedWorkspaceId);
  const selectedProjectId = useSelector((state: RootState) => state.workspace.selectedProjectId);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showProjectDialog, setShowProjectDialog] = useState(false);

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
    totalPasswords: 124,
    totalAccounts: 34,
    totalFolders: 8,
    teamMembers: 4,
    passwordsTrend: "+12%",
    accountsTrend: "+5%",
    foldersTrend: "+2%",
    workspacesTrend: "+10%",
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!accessToken) {
        console.error("No access token available in Redux");
        dispatch(
          setWorkspaceData({
            workspaces: [],
            selectedWorkspaceId: null,
            selectedProjectId: null,
          })
        );
        return;
      }

      const initialData: Workspace[] | null = await loadInitialData(accessToken);
      if (initialData && Array.isArray(initialData) && initialData.length > 0) {
        console.log("✅ Dispatching initial data to Redux:", initialData);
        const defaultWorkspace = initialData[0];
        const defaultProject = defaultWorkspace.projects.find((p) => p.is_default);
        dispatch(
          setWorkspaceData({
            workspaces: initialData,
            selectedWorkspaceId: defaultWorkspace.workspaceId,
            selectedProjectId: selectedProjectId || defaultProject?.project_id || initialData[0].projects[0]?.project_id || null,
          })
        );

        // Check if no projects exist to show welcome modal
        if (initialData[0].projects.length === 0) {
          setShowWelcomeModal(true);
        }
      } else {
        console.error("❌ Failed to load initial data or no workspaces available.");
        dispatch(
          setWorkspaceData({
            workspaces: [],
            selectedWorkspaceId: null,
            selectedProjectId: null,
          })
        );
        setShowWelcomeModal(true); // Show welcome modal for new users with no workspaces
      }
    };

    fetchData();
  }, [accessToken, dispatch, selectedProjectId]);

  // Mock recent activities with dynamic time formatting
  const recentActivities = [
    { type: "password_updated", timestamp: new Date(Date.now() - 5 * 60 * 1000) },
    { type: "note_created", timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) },
    { type: "password_updated", timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    { type: "note_created", timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{translate("dashboard", "navigation")}</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-muted-foreground">{translate("current_project", "dashboard")}:</p>
            {displayProject ? (
              <div className="flex items-center gap-2">
                <div
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: displayProject.color }}
                ></div>
                <span className="text-sm font-medium">{displayProject.name}</span>
                {displayProject.is_default && (
                  <span className="text-xs bg-muted px-1.5 py-0.5 rounded">{translate("default", "dashboard")}</span>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{translate("no_project_selected", "dashboard")}</p>
            )}
          </div>
        </div>
        <div>
          <select className="rounded-md border border-border bg-background px-3 py-2 text-sm">
            <option>{translate("today", "time")}</option>
            <option>{translate("last_7_days", "time")}</option>
            <option>{translate("last_30_days", "time")}</option>
            <option>{translate("all_time", "time")}</option>
          </select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {translate("total_passwords", "dashboard")}
              </CardTitle>
              <Lock className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalPasswords}</div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              <span className="text-green-500 font-medium">{stats.passwordsTrend}</span>{" "}
              {translate("from_last_month", "dashboard")}
            </div>
          </CardContent>
        </Card>

        {/* Other Card components remain unchanged */}
        <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {translate("total_accounts", "dashboard")}
              </CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalAccounts}</div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              <span className="text-green-500 font-medium">{stats.accountsTrend}</span>{" "}
              {translate("from_last_month", "dashboard")}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/5 to-purple-500/10 border-purple-500/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {translate("total_folders", "dashboard")}
              </CardTitle>
              <Shield className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalFolders}</div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              <span className="text-green-500 font-medium">{stats.foldersTrend}</span>{" "}
              {translate("from_last_month", "dashboard")}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {translate("total_workspaces", "dashboard")}
              </CardTitle>
              <Users className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalWorkspaces}</div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              <span className="text-green-500 font-medium">{stats.workspacesTrend}</span>{" "}
              {translate("from_last_month", "dashboard")}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{translate("recent_activity", "dashboard")}</CardTitle>
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
                      <p className="font-medium truncate">{translate(activity.type, "activity")}</p>
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
            <CardTitle>{translate("quick_stats", "dashboard")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{translate("workspaces", "dashboard")}</span>
                </div>
                <span className="text-sm font-medium">{totalWorkspaces}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{translate("projects", "dashboard")}</span>
                </div>
                <span className="text-sm font-medium">{totalProjects}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{translate("team_members", "dashboard")}</span>
                </div>
                <span className="text-sm font-medium">{stats.teamMembers}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {showWelcomeModal && (
        <WelcomeModal
          isOpen={showWelcomeModal}
          onClose={() => setShowWelcomeModal(false)}
          onContinue={() => {
            setShowWelcomeModal(false);
            setShowProjectDialog(true);
          }}
        />
      )}

      {showProjectDialog && <ProjectDialog onClose={() => setShowProjectDialog(false)} />}
    </div>
  );
}