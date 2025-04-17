export const getWorkspace = async () => {
    try {
      // Parse the URL to extract host and existing path
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
      // Remove trailing slash from baseUrl if it exists
      const baseUrlNoTrailingSlash = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
      // The workspace route
      const workspaceRoute = "/web/workspace";
      // Remove leading slash from route if it exists
      const routeNoLeadingSlash = workspaceRoute.startsWith('/') ? workspaceRoute.slice(1) : workspaceRoute;
      
      // Construct the full URL
      const fullUrl = `${baseUrlNoTrailingSlash}/${routeNoLeadingSlash}`;
      
      const res = await fetch(fullUrl, {
        method: "GET",
        credentials: "include", // This is key to include the cookie
      });
  
      const data = await res.json();
  
      if (!res.ok) {
        throw new Error(data?.message || "Failed to fetch workspace");
      }
  
      return data?.data; // contains project_id, name, etc.
    } catch (err) {
      console.error("Error fetching workspace:", err);
      return null;
    }
  };
  