// lib/stack-auth-handler.ts

type StackAuthAction = "login" | "signup";

export async function stackAuthHandler(uid: string, action: StackAuthAction) {
  const route = action === "login" 
    ? process.env.NEXT_PUBLIC_API_AUTH_LOGIN_ROUTE 
    : process.env.NEXT_PUBLIC_API_AUTH_SIGNUP_ROUTE;

  // Parse the URL to extract host and existing path
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  // Remove trailing slash from baseUrl if it exists
  const baseUrlNoTrailingSlash = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  // Remove leading slash from route if it exists
  const routeNoLeadingSlash = route?.startsWith('/') ? route.slice(1) : route || '';
  
  // Construct the full URL
  const fullUrl = `${baseUrlNoTrailingSlash}/${routeNoLeadingSlash}`;
  
  const res = await fetch(fullUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // So that cookies (JWT) are stored
    body: JSON.stringify({
      uid: uid,
    }),
  });

  const data = await res.json();
  return data;
}
