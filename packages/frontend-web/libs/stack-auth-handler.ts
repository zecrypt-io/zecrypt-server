import { API_ROUTES } from '@/constants/routes';

type StackAuthAction = "login" | "signup";

interface AuthResponse {
  status_code: number;
  message: string;
  data: {
    user_id: string;
    name: string;
    profile_url: string;
    access_token: string;
    email?: string; // Optional, add if backend provides it
  };
}

export async function stackAuthHandler(uid: string, action: StackAuthAction): Promise<AuthResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not defined in environment variables");
  }

  const endpoint = action === "login" 
    ? API_ROUTES.AUTH.LOGIN
    : API_ROUTES.AUTH.SIGNUP;
  const fullUrl = `${baseUrl}${endpoint}`;
  console.log(`Fetching ${action} at: ${fullUrl}`);

  try {
    const res = await fetch(fullUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ uid }),
    });

    const data: AuthResponse = await res.json();
    return data;
  } catch (error) {
    console.error(`Error during ${action}:`, error);
    throw error;
  }
}