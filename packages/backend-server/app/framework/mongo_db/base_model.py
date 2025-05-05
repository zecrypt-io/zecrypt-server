from pydantic import BaseModel as Model, ConfigDict


class BaseModel(Model):
    model_config = ConfigDict(protected_namespaces=())
