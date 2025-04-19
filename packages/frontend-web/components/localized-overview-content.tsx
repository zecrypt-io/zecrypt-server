"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Lock, 
  TrendingUp, 
  Users, 
  Shield, 
  FileText 
} from "lucide-react";
import { useTranslator } from "@/hooks/use-translations";
import { useUser } from "@stackframe/stack";
import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/libs/Redux/store";
import { setWorkspaceData } from "@/libs/Redux/workspaceSlice";
import { loadInitialData } from "@/libs/getWorkspace";
import { Workspace } from "@/libs/Redux/workspaceSlice";

export function LocalizedOverviewContent() {
  const { translate } = useTranslator();
  const dispatch = useDispatch<AppDispatch>();
  // const { user } = useUser();
  const accessToken = useSelector((state: RootState) => state.user.userData?.access_token);
  const workspaces = useSelector((state: RootState) => state.workspace.workspaces);
  const selectedWorkspaceId = useSelector((state: RootState) => state.workspace.selectedWorkspaceId);
  const selectedProjectId = useSelector((state: RootState) => state.workspace.selectedProjectId);

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
      } else {
        console.error("❌ Failed to load initial data or no workspaces available.");
        dispatch(
          setWorkspaceData({
            workspaces: [],
            selectedWorkspaceId: null,
            selectedProjectId: null,
          })
        );
      }
    };

    fetchData();
  }, [accessToken, dispatch, selectedProjectId]);

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
            <div className="text-3xl font-bold">124</div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              <span className="text-green-500 font-medium">+12%</span> {translate('from_last_month', 'dashboard')}
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
            <div className="text-3xl font-bold">34</div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              <span className="text-green-500 font-medium">+5%</span> {translate('from_last_month', 'dashboard')}
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
            <div className="text-3xl font-bold">8</div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              <span className="text-green-500 font-medium">+2%</span> {translate('from_last_month', 'dashboard')}
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
              <span className="text-green-500 font-medium">+10%</span> {translate('from_last_month', 'dashboard')}
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
                      <p className="font-medium truncate">
                        {i % 2 === 0 
                          ? translate('password_updated', 'activity')
                          : translate('note_created', 'activity')}
                      </p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                        {i === 1 
                          ? translate('just_now', 'time')
                          : i === 2 
                            ? translate('hours_ago', 'time', { hours: 2 })
                            : i === 3 
                              ? translate('yesterday', 'time')
                              : translate('days_ago', 'time', { days: 3 })}
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
                <span className="text-sm font-medium">4</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}