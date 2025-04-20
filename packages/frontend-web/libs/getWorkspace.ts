export const loadInitialData = async (accessToken: string) => {
  if (!accessToken) {
    console.error("No access token provided for loadInitialData");
    return null;
  }
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_API_LOAD_INITIAL_DATA_ROUTE}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "access-token": accessToken,
      },
      credentials: "include",
    });
    const data = await res.json();
    console.log("Raw response status:", res.status);
    console.log("Raw response data:", JSON.stringify(data, null, 2));

    if (!res.ok) {
      throw new Error(data?.message || "Failed to load initial data");
    }

    // Transform API response into Workspace[] format
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
      })),
    }));

    console.log("Transformed workspaces:", JSON.stringify(workspaces, null, 2));
    return workspaces;
  } catch (err) {
    console.error("Error loading initial data:", err);
    return null;
  }
};