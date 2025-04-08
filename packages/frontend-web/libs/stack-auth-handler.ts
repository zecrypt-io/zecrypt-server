// lib/stack-auth-handler.ts

type StackAuthAction = "login" | "signup";

export async function stackAuthHandler(uid: string, action: StackAuthAction) {
  const route = action === "login" 
    ? process.env.NEXT_PUBLIC_API_AUTH_LOGIN_ROUTE 
    : process.env.NEXT_PUBLIC_API_AUTH_SIGNUP_ROUTE;

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${route}`, {
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
