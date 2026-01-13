from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# Device Schemas
class DeviceBase(BaseModel):
    name: str
    ip_address: str
    vpn_ip: Optional[str] = None
    api_port: int = 8728
    snmp_community: str = "public"
    username: str

class DeviceCreate(DeviceBase):
    password: str

class Device(DeviceBase):
    id: int
    class Config:
        orm_mode = True

# Config Automation Schemas
class ConfigRequest(BaseModel):
    device_id: int
    template_name: str
    params: dict  # e.g., {"url": "facebook.com"}

class ConfigResponse(BaseModel):
    status: str
    status: str
    message: str

class ConfigLogResponse(BaseModel):
    log_id: int
    device_id: int
    timestamp: datetime
    action_type: str
    status: str
    details: str

    class Config:
        orm_mode = True

# Auth Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    role: str
    class Config:
        orm_mode = True
