"""
Integration test for depth API endpoint (requires sample COG).
"""

import pytest
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)


def test_health():
    """Test health endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data


def test_depth_endpoint_missing_params():
    """Test depth endpoint with missing parameters."""
    response = client.get("/v1/depth")
    assert response.status_code == 422  # Validation error


def test_depth_endpoint_out_of_bounds():
    """Test depth endpoint with out-of-bounds coordinates."""
    # Coordinates far from Turkey
    response = client.get("/v1/depth?lat=0.0&lon=0.0")
    # Should return 404 if out of bounds
    assert response.status_code in [404, 500]


# Note: Full integration test requires a sample COG file
# Place a small test COG in tests/fixtures/ and update COG_PATH env var

