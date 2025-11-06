import json
from django.test import TestCase
from django.utils import timezone


class CalculatorApiTests(TestCase):
    def test_compute_success_and_precedence(self):
        resp = self.client.post(
            "/api/calc/compute/",
            data=json.dumps({"expression": "12 + 3*4"}),
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("result", data)
        self.assertAlmostEqual(data["result"], 24.0)

    def test_division_by_zero(self):
        resp = self.client.post(
            "/api/calc/compute/",
            data=json.dumps({"expression": "10/0"}),
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(resp.json().get("error"), "Division by zero")

    def test_invalid_characters(self):
        resp = self.client.post(
            "/api/calc/compute/",
            data=json.dumps({"expression": "2+2a"}),
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(resp.json().get("error"), "Invalid characters")

    def test_stats_increment(self):
        # Two successful computations
        for _ in range(2):
            r = self.client.post(
                "/api/calc/compute/",
                data=json.dumps({"expression": "(1+2)*3"}),
                content_type="application/json",
            )
            self.assertEqual(r.status_code, 200)

        # Check today's stats
        resp = self.client.get("/api/calc/stats/")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data.get("date"), timezone.localdate().isoformat())
        self.assertEqual(data.get("today_count"), 2)
