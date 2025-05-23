// libs/getWorkspace.ts
import axiosInstance from '../libs/Middleware/axiosInstace';
import { Workspace } from '@/libs/Redux/workspaceSlice';

export const loadInitialData = async (accessToken: string): Promise<Workspace[] | null> => {
  if (!accessToken) {
    console.error('No access token provided for loadInitialData');
    return null;
  }
  
  try {
    const response = await axiosInstance.post('/load-initial-data');
    const data = response.data;
    
    // Create workspaces with empty projects array since the API no longer returns projects
    const workspaces = data.data.map((workspace: any) => ({
      workspaceId: workspace.doc_id,
      name: workspace.name,
      created_by: workspace.created_by,
      created_at: workspace.created_at,
      updated_at: workspace.updated_at,
      projects: [], // Initialize with empty array since projects are no longer included
    }));
    
    // console.log("Transformed workspaces:", JSON.stringify(workspaces, null, 2));
    return workspaces;
  } catch (err) {
    console.error('Error loading initial data:', err);
    return null;
  }
};

// New function to fetch projects using the dedicated endpoint
export const fetchProjects = async (workspaceId: string, accessToken: string, page = 1, limit = 20) => {
  if (!accessToken) {
    console.error("No access token provided for fetchProjects");
    return null;
  }
  
  if (!workspaceId) {
    console.error("No workspace ID provided for fetchProjects");
    return null;
  }
  
  try {
    const response = await axiosInstance.get(`/${workspaceId}/projects?page=${page}&limit=${limit}`);
    
    const data = response.data;
    
    if (data.status_code === 200) {
      return {
        projects: data.data.map((project: any) => ({
          project_id: project.doc_id,
          name: project.name,
          lower_name: project.lower_name || project.name.toLowerCase(),
          description: project.description ?? "",
          color: project.color || "#4f46e5",
          created_by: project.created_by,
          created_at: project.created_at,
          updated_at: project.updated_at,
          is_default: project.is_default,
          workspace_id: project.workspace_id || workspaceId,
          features: project.features || {},
        })),
        page: data.page,
        limit: data.limit,
        count: data.count
      };
    } else {
      throw new Error(data.message || "Failed to fetch projects");
    }
  } catch (err) {
    console.error("Error fetching projects:", err);
    return null;
  }
};

// New function to fetch details of a specific project
export const fetchProjectDetails = async (workspaceId: string, projectId: string, accessToken: string) => {
  if (!accessToken) {
    console.error("No access token provided for fetchProjectDetails");
    return null;
  }
  
  if (!workspaceId || !projectId) {
    console.error("Missing workspace ID or project ID for fetchProjectDetails");
    return null;
  }
  
  try {
    const response = await axiosInstance.get(`/web/${workspaceId}/projects/${projectId}`);
    
    const data = response.data;
    
    if (data.status_code === 200) {
      return {
        project_id: data.data?.doc_id,
        name: data.data?.name,
        lower_name: data.data?.lower_name || data.data?.name.toLowerCase(),
        description: data.data?.description ?? "",
        color: data.data?.color || "#4f46e5",
        created_by: data.data?.created_by,
        created_at: data.data?.created_at,
        updated_at: data.data?.updated_at,
        is_default: data.data?.is_default,
        workspace_id: data.data?.workspace_id || workspaceId,
        features: data.data?.features || {},
      };
    } else {
      throw new Error(data.message || "Failed to fetch project details");
    }
  } catch (err) {
    console.error("Error fetching project details:", err);
    return null;
  }
};

// New function to fetch project keys for a workspace
export const fetchProjectKeys = async (workspaceId: string, accessToken: string) => {
  if (!accessToken) {
    console.error("No access token provided for fetchProjectKeys");
    return null;
  }
  
  if (!workspaceId) {
    console.error("No workspace ID provided for fetchProjectKeys");
    return null;
  }
  
  try {
    const response = await axiosInstance.get(`/${workspaceId}/project-keys`);
    const data = response.data;
    
    if (data.status_code === 200) {
      return data.data.map((projectKey: any) => ({
        doc_id: projectKey.doc_id,
        project_id: projectKey.project_id,
        user_id: projectKey.user_id,
        project_key: projectKey.project_key,
        workspace_id: projectKey.workspace_id,
        created_at: projectKey.created_at,
        updated_at: projectKey.updated_at,
        project_name: projectKey.project_name || ""
      }));
    } else {
      throw new Error(data.message || "Failed to fetch project keys");
    }
  } catch (err) {
    console.error("Error fetching project keys:", err);
    return null;
  }
};