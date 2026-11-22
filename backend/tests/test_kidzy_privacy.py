import os
import sys
import unittest
from types import SimpleNamespace
from unittest.mock import Mock, patch

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
os.environ.setdefault("JWT_SECRET_KEY", "kidzy_privacy_test_secret_32_characters")
os.environ.setdefault("ENVIRONMENT", "testing")

from fastapi import HTTPException

import main
from schemas import ChatHistoryItem, ChatRequest
from models import User


class TestKidzyPrivacy(unittest.TestCase):
    def test_chat_sends_only_a_canonical_topic_not_user_text_or_history(self):
        private_message = "My baby Arjun at 23 Maple Street needs a vaccination."
        data = ChatRequest(
            message=private_message,
            history=[ChatHistoryItem(role="user", content="Aadhaar 123456789012")],
            role="supervisor",
            page="/children/42?name=Arjun",
        )
        completion = SimpleNamespace(
            choices=[
                SimpleNamespace(
                    message=SimpleNamespace(content="General vaccine guidance."),
                    finish_reason="stop",
                )
            ]
        )
        client = SimpleNamespace(
            chat=SimpleNamespace(
                completions=SimpleNamespace(create=Mock(return_value=completion))
            )
        )

        with patch.dict(os.environ, {"GROQ_API_KEY": "test-key"}), patch.object(
            main, "Groq", return_value=client
        ):
            result = main.chat(
                data=data,
                current_user=User(id=91001, role="parent", name="Test Parent"),
            )

        sent_messages = client.chat.completions.create.call_args.kwargs["messages"]
        serialized = str(sent_messages)
        self.assertEqual(result["reply"], "General vaccine guidance.")
        self.assertEqual(len(sent_messages), 2)
        self.assertNotIn("Arjun", serialized)
        self.assertNotIn("Maple Street", serialized)
        self.assertNotIn("123456789012", serialized)
        self.assertIn("parent/caregiver", sent_messages[0]["content"])
        self.assertIn("vaccination", sent_messages[1]["content"])

    def test_missing_groq_key_returns_service_unavailable(self):
        with patch.dict(os.environ, {"GROQ_API_KEY": ""}):
            with self.assertRaises(HTTPException) as raised:
                main.chat(
                    data=ChatRequest(message="How does vaccination work?"),
                    current_user=User(id=91002, role="parent", name="Test Parent"),
                )

        self.assertEqual(raised.exception.status_code, 503)

    def test_provider_connection_failure_returns_gateway_error(self):
        client = SimpleNamespace(
            chat=SimpleNamespace(
                completions=SimpleNamespace(
                    create=Mock(
                        side_effect=main.APIConnectionError(request=Mock())
                    )
                )
            )
        )
        with patch.dict(os.environ, {"GROQ_API_KEY": "test-key"}), patch.object(
            main, "Groq", return_value=client
        ):
            with self.assertRaises(HTTPException) as raised:
                main.chat(
                    data=ChatRequest(message="What is a vaccine schedule?"),
                    current_user=User(id=91003, role="parent", name="Test Parent"),
                )

        self.assertEqual(raised.exception.status_code, 502)


if __name__ == "__main__":
    unittest.main()
