from app.api.v1.web.master_data.schema import AddAccount, AddApiKey, AddWallet, AddIdentity

def process_payload(secret_type, payload):
    if secret_type=="login":
        specific_data=AddAccount(**payload)
        data=specific_data.model_dump()
    elif secret_type=="api_key":
        specific_data=AddApiKey(**payload)
        data=specific_data.model_dump()
    elif secret_type=="wallet_address":
        specific_data=AddWallet(**payload)
        data=specific_data.model_dump()
    elif secret_type=="identity":
        specific_data=AddIdentity(**payload)
        data=specific_data.model_dump()
    else:
        data=payload
    return data 

def build_query(payload,query:dict = {}):
    if payload.get("title"):
        query["lower_title"]=payload.get("title").strip().lower()
    if payload.get("tags"):
        query["tags"]={"$in": payload.get("tags")}
    if payload.get("secret_type"):
        query["secret_type"]=payload.get("secret_type")
    return query
