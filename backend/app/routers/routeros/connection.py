import routeros_api
import socket
import time
from fastapi import HTTPException
from ...models import Device
import logging

logger = logging.getLogger(__name__)

class RouterOSConnectionError(Exception):
    """Base exception for RouterOS connection errors"""
    pass

class RouterOSTimeoutError(RouterOSConnectionError):
    """Raised when connection times out"""
    pass

class RouterOSAuthError(RouterOSConnectionError):
    """Raised when authentication fails"""
    pass

class RouterOSNetworkError(RouterOSConnectionError):
    """Raised when network connectivity fails"""
    pass

def get_routeros_connection(
    device: Device, 
    timeout: int = 10, 
    retries: int = 2,
    retry_delay: float = 1.0
):
    """
    Establish connection to RouterOS device with improved error handling.
    
    Args:
        device: Device model with connection parameters
        timeout: Connection timeout in seconds (default: 10)
        retries: Number of retry attempts (default: 2)
        retry_delay: Initial delay between retries in seconds (default: 1.0)
        
    Returns:
        Tuple of (connection, api) objects
        
    Raises:
        HTTPException: With appropriate status code and detailed error message
    """
    last_error = None
    
    for attempt in range(retries + 1):
        try:
            # Set socket timeout
            socket.setdefaulttimeout(timeout)
            
            logger.info(f"Attempting RouterOS connection to {device.ip_address}:{device.api_port} (attempt {attempt + 1}/{retries + 1})")
            
            connection = routeros_api.RouterOsApiPool(
                device.ip_address,
                username=device.username,
                password=device.password,
                port=device.api_port,
                plaintext_login=True  # Often needed for newer RouterOS if SSL not set up
            )
            api = connection.get_api()
            
            logger.info(f"Successfully connected to RouterOS device {device.name} at {device.ip_address}")
            return connection, api
            
        except socket.timeout as e:
            last_error = e
            error_msg = f"Connection timeout to {device.ip_address}:{device.api_port} after {timeout}s"
            logger.warning(f"{error_msg} (attempt {attempt + 1}/{retries + 1})")
            
            if attempt < retries:
                delay = retry_delay * (2 ** attempt)  # Exponential backoff
                logger.info(f"Retrying in {delay}s...")
                time.sleep(delay)
            else:
                raise RouterOSTimeoutError(error_msg)
                
        except socket.gaierror as e:
            last_error = e
            error_msg = f"DNS resolution failed for {device.ip_address}"
            logger.error(error_msg)
            raise RouterOSNetworkError(error_msg)
            
        except socket.error as e:
            last_error = e
            error_msg = f"Network error connecting to {device.ip_address}:{device.api_port}"
            logger.warning(f"{error_msg}: {str(e)} (attempt {attempt + 1}/{retries + 1})")
            
            if attempt < retries:
                delay = retry_delay * (2 ** attempt)
                time.sleep(delay)
            else:
                raise RouterOSNetworkError(f"{error_msg}: {str(e)}")
                
        except Exception as e:
            last_error = e
            error_str = str(e).lower()
            
            # Check for authentication errors
            if any(word in error_str for word in ['login', 'auth', 'password', 'username', 'credentials']):
                error_msg = f"Authentication failed for {device.username}@{device.ip_address}"
                logger.error(error_msg)
                raise RouterOSAuthError(error_msg)
            
            # Generic error
            error_msg = f"Failed to connect to RouterOS at {device.ip_address}:{device.api_port}"
            logger.error(f"{error_msg}: {str(e)}")
            
            if attempt < retries:
                delay = retry_delay * (2 ** attempt)
                time.sleep(delay)
            else:
                raise RouterOSConnectionError(f"{error_msg}: {str(e)}")
    
    # Should never reach here, but just in case
    raise RouterOSConnectionError(f"Failed to connect after {retries + 1} attempts: {str(last_error)}")

def test_routeros_connection(device: Device, timeout: int = 5) -> tuple[bool, str]:
    """
    Test RouterOS connection without raising exceptions.
    
    Args:
        device: Device model with connection parameters
        timeout: Connection timeout in seconds
        
    Returns:
        Tuple of (success: bool, message: str)
    """
    try:
        connection, api = get_routeros_connection(device, timeout=timeout, retries=0)
        connection.disconnect()
        return True, "Connection successful"
    except RouterOSTimeoutError as e:
        return False, f"Timeout: {str(e)}"
    except RouterOSAuthError as e:
        return False, f"Authentication failed: {str(e)}"
    except RouterOSNetworkError as e:
        return False, f"Network error: {str(e)}"
    except RouterOSConnectionError as e:
        return False, f"Connection error: {str(e)}"
    except Exception as e:
        return False, f"Unknown error: {str(e)}"

def sync_identity(device: Device, db) -> str:
    """
    Connect to device, fetch system identity, and update database if changed.
    Returns the new name if updated, or partial error string if failed.
    """
    connection = None
    try:
        connection, api = get_routeros_connection(device, retries=1, timeout=5)
        identity_data = api.get_resource('/system/identity').get()
        
        if identity_data and identity_data[0].get('name'):
            new_name = identity_data[0].get('name')
            if device.name != new_name:
                old_name = device.name
                logger.info(f"Auto-Sync: Renaming {device.ip_address} from '{old_name}' to '{new_name}'")
                device.name = new_name
                db.add(device)
                
                # Log the sync event
                from ... import models # Import here to avoid circular deps if any, or just ensure it's available
                new_log = models.ConfigurationLog(
                    device_id=device.id,
                    action_type="Identity Synced",
                    status="Success",
                    details=f"Renamed '{old_name}' to '{new_name}' (Auto-Sync)"
                )
                db.add(new_log)
                
                db.commit()
                db.refresh(device)
            return new_name
    except Exception as e:
        logger.warning(f"Auto-Sync failed for {device.ip_address}: {e}")
        return None
    finally:
        if connection:
            connection.disconnect()
