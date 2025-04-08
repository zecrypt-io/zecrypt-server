export const getWorkspace = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/web/workspace`, {
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
  