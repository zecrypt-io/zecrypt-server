// libs/Redux/workspaceSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

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
  features: { [key: string]: { enabled: boolean; is_client_side_encryption: boolean } };
}

export interface Workspace {
  workspaceId: string;
  name: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  projects: Project[];
}

interface WorkspaceState {
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
  name: 'workspace',
  initialState,
  reducers: {
    setWorkspaceData: (
      state,
      action: PayloadAction<{
        workspaces: Workspace[];
        selectedWorkspaceId: string | null;
        selectedProjectId: string | null;
      }>
    ) => {
      state.workspaces = action.payload.workspaces;
      state.selectedWorkspaceId = action.payload.selectedWorkspaceId;
      state.selectedProjectId = action.payload.selectedProjectId;
    },
    addProject: (
      state,
      action: PayloadAction<{ workspaceId: string; project: Project }>
    ) => {
      const workspace = state.workspaces.find(
        (ws) => ws.workspaceId === action.payload.workspaceId
      );
      if (workspace) {
        workspace.projects.push(action.payload.project);
        if (action.payload.project.is_default) {
          workspace.projects.forEach((p) => {
            if (p.project_id !== action.payload.project.project_id) {
              p.is_default = false;
            }
          });
        }
      }
    },
    updateProject: (
      state,
      action: PayloadAction<{ workspaceId: string; project: Project }>
    ) => {
      const workspace = state.workspaces.find(
        (ws) => ws.workspaceId === action.payload.workspaceId
      );
      if (workspace) {
        const projectIndex = workspace.projects.findIndex(
          (p) => p.project_id === action.payload.project.project_id
        );
        if (projectIndex !== -1) {
          workspace.projects[projectIndex] = action.payload.project;
          if (action.payload.project.is_default) {
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
      const workspace = state.workspaces.find(
        (ws) => ws.workspaceId === action.payload.workspaceId
      );
      if (workspace) {
        workspace.projects = workspace.projects.filter(
          (p) => p.project_id !== action.payload.projectId
        );
        if (state.selectedProjectId === action.payload.projectId) {
          state.selectedProjectId =
            workspace.projects.find((p) => p.is_default)?.project_id ||
            workspace.projects[0]?.project_id ||
            null;
        }
      }
    },
    setSelectedProject: (
      state,
      action: PayloadAction<{ projectId: string }>
    ) => {
      state.selectedProjectId = action.payload.projectId;
    },
    resetWorkspaceState: () => initialState,
  },
});

export const {
  setWorkspaceData,
  addProject,
  updateProject,
  deleteProject,
  setSelectedProject,
  resetWorkspaceState,
} = workspaceSlice.actions;
export default workspaceSlice.reducer;
