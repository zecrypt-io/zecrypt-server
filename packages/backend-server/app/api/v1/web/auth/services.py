import firebase_admin

import requests

from app.core.config import settings


def stack_auth_request(method, endpoint, **kwargs):
  res = requests.request(
    method,
    f'https://api.stack-auth.com/{endpoint}',
    headers={
      'x-stack-access-type': 'server',  # or 'client' if you're only accessing the client API
      'x-stack-project-id': settings.STACK_AUTH_PROJECT_ID,
      'x-stack-publishable-client-key': settings.STACK_AUTH_CLIENT_ID,
      'x-stack-secret-server-key': settings.STACK_AUTH_CLIENT_SECRET,  # not necessary if access type is 'client'
      **kwargs.pop('headers', {}),
    },
    **kwargs,
  )
  if res.status_code >= 400:
    raise Exception(f"Stack Auth API request failed with {res.status_code}: {res.text}")
  return res.json()


