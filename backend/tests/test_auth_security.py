import os
import secrets
import unittest
from datetime import timedelta
import jwt
from fastapi import HTTPException

# Explicitly ensure clean environment before importing auth
os.environ.pop("JWT_SECRET_KEY", None)

import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import auth


class TestAuthSecurity(unittest.TestCase):
    def test_missing_jwt_secret_raises_runtime_error(self):
        """Fails safely in production when JWT_SECRET_KEY is absent."""
        if "JWT_SECRET_KEY" in os.environ:
            del os.environ["JWT_SECRET_KEY"]

        with self.assertRaises(RuntimeError) as ctx:
            auth.create_access_token(user_id=1)
        self.assertIn("JWT_SECRET_KEY is not configured", str(ctx.exception))

    def test_create_and_decode_valid_token(self):
        """Creates and decodes a valid JWT token with explicit environment secret."""
        test_secret = secrets.token_hex(32)
        os.environ["JWT_SECRET_KEY"] = test_secret

        token = auth.create_access_token(user_id=42, role="worker")
        user_id = auth.decode_access_token(token)
        self.assertEqual(user_id, 42)

    def test_expired_token_is_rejected(self):
        """Expired JWT raises HTTP 401."""
        test_secret = secrets.token_hex(32)
        os.environ["JWT_SECRET_KEY"] = test_secret

        expired_token = auth.create_access_token(
            user_id=99,
            expires_delta=timedelta(seconds=-1)
        )
        with self.assertRaises(HTTPException) as ctx:
            auth.decode_access_token(expired_token)
        self.assertEqual(ctx.exception.status_code, 401)
        self.assertEqual(ctx.exception.detail, "Invalid or expired token")

    def test_tampered_token_is_rejected(self):
        """Tampered JWT raises HTTP 401."""
        test_secret = secrets.token_hex(32)
        os.environ["JWT_SECRET_KEY"] = test_secret

        token = auth.create_access_token(user_id=10)
        tampered_token = token[:-5] + "XXXXX"

        with self.assertRaises(HTTPException) as ctx:
            auth.decode_access_token(tampered_token)
        self.assertEqual(ctx.exception.status_code, 401)

    def test_password_hashing_and_verification(self):
        """Argon2 password hashing securely hashes and verifies passwords."""
        plain = "SuperSecurePassword123!"
        hashed = auth.hash_password(plain)
        self.assertNotEqual(plain, hashed)
        self.assertTrue(auth.verify_password(plain, hashed))
        self.assertFalse(auth.verify_password("WrongPassword123!", hashed))


if __name__ == "__main__":
    unittest.main()
