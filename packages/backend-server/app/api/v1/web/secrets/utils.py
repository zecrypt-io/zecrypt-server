from app.api.v1.web.master_data.schema import AddAccount, AddApiKey, AddWallet,UpdateApiKey
from app.utils.utils import filter_payload

# Schema mappings for create and update actions
schema_map={
  "create": {
    "login": AddAccount,
    "api_key": AddApiKey,
    "wallet_address": AddWallet,

  },
  "update": {
    "login": AddAccount,
    "api_key": UpdateApiKey,
    "wallet_address": AddWallet,

  },
}

def process_payload(secret_type: str, payload: dict, action: str):
  """Process payload using the appropriate schema based on secret_type and action."""
  schema_cls = schema_map.get(action, {}).get(secret_type)
  if not schema_cls:
    return payload

  data = schema_cls(**payload).model_dump()
  return data if action == "create" else filter_payload(data)

def build_query(payload,query:dict = {}):
    if payload.get("title"):
        query["lower_title"]=payload.get("title").strip().lower()
    if payload.get("tags"):
        query["tags"]={"$in": payload.get("tags")}
    if payload.get("secret_type"):
        query["secret_type"]=payload.get("secret_type")
    return query
