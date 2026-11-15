"""
Verification Test for NavJyoti Demo Accounts:
1. Parent: 9876543210 / NavJyoti@123
2. Health Worker: worker.demo@navjyoti.test / NavJyoti@123
3. Supervisor: supervisor.demo@navjyoti.test / NavJyoti@123
4. Rejection of invalid credentials
"""

import sys
from pathlib import Path
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from fastapi.testclient import TestClient
from main import app
from database import SessionLocal
from models import User, Child

client = TestClient(app)

def test_parent_demo_login():
    response = client.post("/auth/login", json={
        "identifier": "9876543210",
        "password": "NavJyoti@123"
    })
    assert response.status_code == 200, f"Parent login failed: {response.text}"
    data = response.json()
    assert data["role"] == "parent", f"Expected parent role, got {data['role']}"
    assert "access_token" in data
    token = data["access_token"]
    assert data["user"]["name"] == "Sunita Sharma"
    print("PASS: Parent Demo Login verified (Sunita Sharma, 9876543210)")

    # Verify parent child records
    ch_resp = client.get("/children", headers={"Authorization": f"Bearer {token}"})
    assert ch_resp.status_code == 200
    children = ch_resp.json()
    assert any(c["name"] == "Aarav Sharma" for c in children), "Aarav Sharma not linked to Parent"
    print(f"PASS: Parent linked child verified: {len(children)} child(ren) found")

def test_health_worker_demo_login():
    response = client.post("/auth/login", json={
        "identifier": "worker.demo@navjyoti.test",
        "password": "NavJyoti@123"
    })
    assert response.status_code == 200, f"Worker login failed: {response.text}"
    data = response.json()
    assert data["role"] == "worker", f"Expected worker role, got {data['role']}"
    assert data["user"]["name"] == "Rekha Devi"
    assert data["user"]["worker_id"] == "ANM-UP-BLS-4019"
    token = data["access_token"]
    print("PASS: Health Worker Demo Login verified (Rekha Devi, worker.demo@navjyoti.test)")

    # Verify assigned children
    w_ch_resp = client.get("/worker/children", headers={"Authorization": f"Bearer {token}"})
    assert w_ch_resp.status_code == 200
    w_children = w_ch_resp.json()
    assert any(c["name"] == "Aarav Sharma" for c in w_children), "Aarav Sharma not in assigned children"
    print(f"PASS: Worker assigned children verified: {len(w_children)} child(ren) assigned")

def test_supervisor_demo_login():
    response = client.post("/auth/login", json={
        "identifier": "supervisor.demo@navjyoti.test",
        "password": "NavJyoti@123"
    })
    assert response.status_code == 200, f"Supervisor login failed: {response.text}"
    data = response.json()
    assert data["role"] == "supervisor", f"Expected supervisor role, got {data['role']}"
    assert data["user"]["name"] == "Dr. Alok Verma"
    assert data["user"]["worker_id"] == "MOIC-UP-BLS-1001"
    token = data["access_token"]
    print("PASS: Supervisor Demo Login verified (Dr. Alok Verma, supervisor.demo@navjyoti.test)")

    # Verify supervisor analytics
    s_dash = client.get("/supervisor/dashboard", headers={"Authorization": f"Bearer {token}"})
    assert s_dash.status_code == 200
    dash_data = s_dash.json()
    assert "total_children" in dash_data
    print(f"PASS: Supervisor dashboard analytics verified: {dash_data['total_children']} total children tracked")

def test_invalid_logins():
    # Wrong password for Parent
    p_bad = client.post("/auth/login", json={"identifier": "9876543210", "password": "WrongPassword!"})
    assert p_bad.status_code == 401
    print("PASS: Wrong password for Parent rejected (401)")

    # Wrong password for Worker
    w_bad = client.post("/auth/login", json={"identifier": "worker.demo@navjyoti.test", "password": "WrongPassword!"})
    assert w_bad.status_code == 401
    print("PASS: Wrong password for Worker rejected (401)")

    # Wrong password for Supervisor
    s_bad = client.post("/auth/login", json={"identifier": "supervisor.demo@navjyoti.test", "password": "WrongPassword!"})
    assert s_bad.status_code == 401
    print("PASS: Wrong password for Supervisor rejected (401)")

    # Non-existent user
    non_user = client.post("/auth/login", json={"identifier": "nonexistent@navjyoti.test", "password": "NavJyoti@123"})
    assert non_user.status_code == 401
    print("PASS: Nonexistent email rejected (401)")

if __name__ == "__main__":
    print("=== RUNNING DEMO CREDENTIAL AUTHENTICATION TESTS ===")
    test_parent_demo_login()
    test_health_worker_demo_login()
    test_supervisor_demo_login()
    test_invalid_logins()
    print("=== ALL DEMO CREDENTIAL AUTHENTICATION TESTS PASSED ===")
