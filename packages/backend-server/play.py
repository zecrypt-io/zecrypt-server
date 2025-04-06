import requests


STACK_AUTH_PROJECT_ID = "2b58f962-2722-4f6c-85d4-ebc999bdb4fb"
STACK_AUTH_CLIENT_ID = "pck_tey3xegv5tn5y5p1j5tj96ehh7aak96xgy7xzm4qkhnxg"
STACK_AUTH_CLIENT_SECRET = "ssk_9natem3gcatdykeesmj9m7efqyfk6nac0wmrjghtdrkag"


def stack_auth_request(method, endpoint, **kwargs):
    res = requests.request(
        method,
        f"https://api.stack-auth.com/{endpoint}",
        headers={
            "x-stack-access-type": "server",  # or 'client' if you're only accessing the client API
            "x-stack-project-id": STACK_AUTH_PROJECT_ID,
            "x-stack-publishable-client-key": STACK_AUTH_CLIENT_ID,
            "x-stack-secret-server-key": STACK_AUTH_CLIENT_SECRET,  # not necessary if access type is 'client'
            **kwargs.pop("headers", {}),
        },
        **kwargs,
    )
    if res.status_code >= 400:
        raise Exception(
            f"Stack Auth API request failed with {res.status_code}: {res.text}"
        )
    return res.json()


def run():
    access_token = "eyJhbGciOiJFUzI1NiIsImtpZCI6IkFuVWd1OTE1VC0zMyJ9.eyJzdWIiOiI1MTgzZTI3Zi02MTJhLTRmNDItODllMC1lYmJhZGVjMTNjZjQiLCJicmFuY2hJZCI6Im1haW4iLCJyZWZyZXNoVG9rZW5JZCI6ImM2ZGY0NDJjLWQ4YTYtNDE1ZS05NmM0LTgyMDExZmU4YjA3ZCIsImlzcyI6Imh0dHBzOi8vYWNjZXNzLXRva2VuLmp3dC1zaWduYXR1cmUuc3RhY2stYXV0aC5jb20iLCJpYXQiOjE3NDM3NzQzNjIsImF1ZCI6IjJiNThmOTYyLTI3MjItNGY2Yy04NWQ0LWViYzk5OWJkYjRmYiIsImV4cCI6MTc0MzgxNzU2Mn0.apA5rX_n-LRafbs0VKhbd_oqln0k4HbPy3dS-LovtKyS7oPZCiNPnOWVmYMF7pFKXUD5961-nueIjwa3cdIhQQ"
    print(
        stack_auth_request(
            "GET",
            "/api/v1/users/me",
            headers={
                "x-stack-access-token": access_token,
            },
        )
    )


if __name__ == "__main__":
    run()
