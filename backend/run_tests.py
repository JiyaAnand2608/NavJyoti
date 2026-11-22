"""
NavJyoti Backend Test Runner
Runs the full test suite with proper environment isolation.
"""
import os
import sys
import unittest

# Set environment variables BEFORE any imports
os.environ.setdefault("JWT_SECRET_KEY", "navjyoti_isolated_test_secret_key_32chars_ok")
os.environ.setdefault("ENVIRONMENT", "testing")

# Add backend directory to path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

if __name__ == "__main__":
    loader = unittest.TestLoader()
    suite = loader.discover(start_dir=os.path.join(backend_dir, "tests"), pattern="test_*.py")
    runner = unittest.TextTestRunner(verbosity=2, stream=sys.stdout)
    result = runner.run(suite)
    sys.exit(0 if result.wasSuccessful() else 1)
