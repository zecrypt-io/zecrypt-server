import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Project {
  project_id: string;
  name: string;
  lower_name: string;
  description: string;
  color: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_default: boolean;
  workspace_id: string;
}

export interface Workspace {
  workspaceId: string;
  name: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  projects: Project[];
}

export interface WorkspaceState {
  workspaces: Workspace[];
  selectedWorkspaceId: string | null;
  selectedProjectId: string | null;
}

const initialState: WorkspaceState = {
  workspaces: [],
  selectedWorkspaceId: null,
  selectedProjectId: null,
};

const workspaceSlice = createSlice({
  name: "workspace",
  initialState,
  reducers: {
    setWorkspaceData: (state, action: PayloadAction<WorkspaceState>) => {
      state.workspaces = action.payload.workspaces;
      state.selectedWorkspaceId = action.payload.selectedWorkspaceId;
      state.selectedProjectId = action.payload.selectedProjectId;
    },
    addProject: (
      state,
      action: PayloadAction<{ workspaceId: string; project: Project }>
    ) => {
      const { workspaceId, project } = action.payload;
      const workspace = state.workspaces.find(
        (ws) => ws.workspaceId === workspaceId
      );
      if (workspace) {
        workspace.projects.push({
          ...project,
          description: project.description ?? "",
          color: project.color ?? "#4f46e5",
        });
        if (project.is_default) {
          // Unset other defaults
          workspace.projects.forEach((p) => {
            if (p.project_id !== project.project_id) {
              p.is_default = false;
            }
          });
        }
      }
    },

    // Add to workspaceSlice.ts reducers
    resetWorkspaceState: (state) => {
      state.workspaces = [];
      state.selectedWorkspaceId = null;
      state.selectedProjectId = null;
    },
    updateProject: (
      state,
      action: PayloadAction<{ workspaceId: string; project: Project }>
    ) => {
      const { workspaceId, project } = action.payload;
      const workspace = state.workspaces.find(
        (ws) => ws.workspaceId === workspaceId
      );
      if (workspace) {
        const projectIndex = workspace.projects.findIndex(
          (p) => p.project_id === project.project_id
        );
        if (projectIndex !== -1) {
          workspace.projects[projectIndex] = {
            ...project,
            description: project.description ?? "",
            color: project.color ?? "#4f46e5",
          };
          if (project.is_default) {
            // Unset other defaults
            workspace.projects.forEach((p, index) => {
              if (index !== projectIndex) {
                p.is_default = false;
              }
            });
          }
        }
      }
    },
    deleteProject: (
      state,
      action: PayloadAction<{ workspaceId: string; projectId: string }>
    ) => {
      const { workspaceId, projectId } = action.payload;
      const workspace = state.workspaces.find(
        (ws) => ws.workspaceId === workspaceId
      );
      if (workspace) {
        workspace.projects = workspace.projects.filter(
          (p) => p.project_id !== projectId
        );
      }
    },
    setSelectedProject: (
      state,
      action: PayloadAction<{ projectId: string | null }>
    ) => {
      state.selectedProjectId = action.payload.projectId;
    },
    setDefaultProject: (
      state,
      action: PayloadAction<{ workspaceId: string; projectId: string }>
    ) => {
      const { workspaceId, projectId } = action.payload;
      const workspace = state.workspaces.find(
        (ws) => ws.workspaceId === workspaceId
      );
      if (workspace) {
        workspace.projects.forEach((project) => {
          project.is_default = project.project_id === projectId;
        });
      }
    },
  },
});

export const {
  setWorkspaceData,
  addProject,
  updateProject,
  deleteProject,
  setSelectedProject,
  setDefaultProject,
  resetWorkspaceState,
} = workspaceSlice.actions;
export default workspaceSlice.reducer;
