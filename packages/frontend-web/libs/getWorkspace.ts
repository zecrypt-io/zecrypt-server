import axiosInstance from '../libs/Middleware/axiosInstace';

export const loadInitialData = async (accessToken: string) => {
  if (!accessToken) {
    console.error("No access token provided for loadInitialData");
    return null;
  }
  
  try {
    const response = await axiosInstance.post('/load-initial-data');
    

    const data = response.data;
    
    const workspaces = data.data.map((workspace: any) => ({
      workspaceId: workspace.doc_id,
      name: workspace.name,
      created_by: workspace.created_by,
      created_at: workspace.created_at,
      updated_at: workspace.updated_at,
      projects: workspace.projects.map((project: any) => ({
        project_id: project.doc_id,
        name: project.name,
        lower_name: project.lower_name,
        description: project.description ?? "",
        color: project.color || "#4f46e5",
        created_by: project.created_by,
        created_at: project.created_at,
        updated_at: project.updated_at,
        is_default: project.is_default,
        workspace_id: project.workspace_id,
        features: project.features || {},
      })),
    }));
    
    console.log("Transformed workspaces:", JSON.stringify(workspaces, null, 2));
    return workspaces;
  } catch (err) {
    console.error("Error loading initial data:", err);
    return null;
  }
};