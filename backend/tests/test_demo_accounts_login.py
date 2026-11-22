"""
Verification Test for NavJyoti Demo Accounts:
1. Parent: 9876543210 / NavJyoti@123
2. Health Worker: worker.demo@navjyoti.test / NavJyoti@123
3. Supervisor: supervisor.demo@navjyoti.test / NavJyoti@123
4. Rejection of invalid credentials
"""

import sys
from pathlib import Path
from datetime import date

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from fastapi.testclient import TestClient
import main
from auth import hash_password
from models import Base, Child, User

test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="module", autouse=True)
def isolated_demo_database():
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    parent = User(
        name="Sunita Sharma",
        phone="+919876543210",
        password_hash=hash_password("NavJyoti@123"),
        role="parent",
        village="Rampur",
    )
    worker = User(
        name="Rekha Devi",
        email="worker.demo@navjyoti.test",
        worker_id="ANM-UP-BLS-4019",
        password_hash=hash_password("NavJyoti@123"),
        role="worker",
        village="Rampur",
        jurisdiction="Rampur",
    )
    supervisor = User(
        name="Dr. Alok Verma",
        email="supervisor.demo@navjyoti.test",
        worker_id="MOIC-UP-BLS-1001",
        password_hash=hash_password("NavJyoti@123"),
        role="supervisor",
        village="Rampur",
        jurisdiction="Rampur",
    )
    db.add_all([parent, worker, supervisor])
    db.flush()
    db.add(
        Child(
            name="Aarav Sharma",
            date_of_birth=date(2024, 3, 15),
            parent_id=parent.id,
            assigned_worker_id=worker.id,
            village="Rampur",
        )
    )
    db.commit()
    db.close()
    main.app.dependency_overrides[main.get_db] = override_get_db
    yield
    main.app.dependency_overrides.pop(main.get_db, None)
    Base.metadata.drop_all(bind=test_engine)
    test_engine.dispose()


client = TestClient(main.app)

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
    raise SystemExit(pytest.main([__file__]))
