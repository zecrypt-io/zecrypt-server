// libs/getWorkspace.ts
import axiosInstance from '../libs/Middleware/axiosInstace';
import { Workspace } from '@/libs/Redux/workspaceSlice';

export const loadInitialData = async (accessToken: string): Promise<Workspace[] | null> => {
  if (!accessToken) {
    console.error('No access token provided for loadInitialData');
    return null;
  }

  try {
    // Fetch workspace IDs
    const workspaceResponse = await axiosInstance.post('/load-initial-data');
    const workspaceData = workspaceResponse.data.data;

    if (!Array.isArray(workspaceData) || workspaceData.length === 0) {
      console.error('No workspaces found in load-initial-data response');
      return [];
    }

    // Fetch projects for each workspace
    const workspaces: Workspace[] = await Promise.all(
      workspaceData.map(async (workspace: any) => {
        // Update this line to use the correct API path format
        const projectResponse = await axiosInstance.get(`/${workspace.doc_id}/projects`);
        const projects = projectResponse.data.data.map((project: any) => ({
          project_id: project.doc_id,
          name: project.name,
          lower_name: project.lower_name,
          description: project.description ?? '',
          color: project.color || '#4f46e5',
          created_by: project.created_by,
          created_at: project.created_at,
          updated_at: project.updated_at,
          is_default: project.is_default,
          workspace_id: project.workspace_id,
          features: project.features || {},
        }));

        return {
          workspaceId: workspace.doc_id,
          name: workspace.name,
          created_by: workspace.created_by,
          created_at: workspace.created_at,
          updated_at: workspace.updated_at,
          projects,
        };
      })
    );

    console.log('Transformed workspaces:', JSON.stringify(workspaces, null, 2));
    return workspaces;
  } catch (err) {
    console.error('Error loading initial data:', err);
    return null;
  }
};