import routeros_api
from fastapi import HTTPException
from ...models import Device

def get_routeros_connection(device: Device):
    try:
        connection = routeros_api.RouterOsApiPool(
            device.ip_address,
            username=device.username,
            password=device.password,
            port=device.api_port,
            plaintext_login=True # Often needed for newer RouterOS if SSL not set up
        )
        api = connection.get_api()
        return connection, api
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to connect to RouterOS: {str(e)}")
