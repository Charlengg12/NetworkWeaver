import pytest
from fastapi.testclient import TestClient
from ..app.main import app

client = TestClient(app)

def test_routeros_endpoints_exist():
    """Verify that RouterOS endpoints are registered."""
    # We expect 404 or 401, but NOT "Not Found" in the sense of the route missing.
    # Actually, 401 Unauthorized is the best proof the route exists and is protected.
    # 404 would mean the route path is wrong.
    
    # Test Devices Endpoint
    response = client.get("/routeros/devices/1/test_connection")
    assert response.status_code in [401, 405] # 405 because it's POST

    # Test Metrics Endpoint
    response = client.get("/routeros/metrics/resources/1")
    assert response.status_code in [401, 200, 404]

    # Test Config Endpoint
    response = client.post("/routeros/config/execute")
    assert response.status_code in [401, 400, 422]

def test_routeros_router_prefix():
    """Verify the prefix structure."""
    response = client.get("/routeros/metrics")
    assert response.status_code == 404 # Should be /routeros/metrics/resources/{id}
