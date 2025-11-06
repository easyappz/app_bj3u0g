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


class StructuredCalculatorApiTests(TestCase):
    base_url = "/api/calc/"

    def post_calc(self, payload):
        return self.client.post(
            self.base_url,
            data=json.dumps(payload),
            content_type="application/json",
        )

    def test_add(self):
        resp = self.post_calc({"a": 5, "b": 7, "op": "add"})
        self.assertEqual(resp.status_code, 200)
        self.assertAlmostEqual(resp.json()["result"], 12.0)

    def test_sub(self):
        resp = self.post_calc({"a": 5, "b": 7, "op": "sub"})
        self.assertEqual(resp.status_code, 200)
        self.assertAlmostEqual(resp.json()["result"], -2.0)

    def test_mul(self):
        resp = self.post_calc({"a": -3, "b": 2.5, "op": "mul"})
        self.assertEqual(resp.status_code, 200)
        self.assertAlmostEqual(resp.json()["result"], -7.5)

    def test_div(self):
        resp = self.post_calc({"a": 12, "b": 3, "op": "div"})
        self.assertEqual(resp.status_code, 200)
        self.assertAlmostEqual(resp.json()["result"], 4.0)

    def test_division_by_zero(self):
        resp = self.post_calc({"a": 5, "b": 0, "op": "div"})
        self.assertEqual(resp.status_code, 400)
        body = resp.json()
        # Error bound to 'b' field by serializer
        self.assertTrue("b" in body or "error" in body)

    def test_invalid_op(self):
        resp = self.post_calc({"a": 1, "b": 2, "op": "pow"})
        self.assertEqual(resp.status_code, 400)

    def test_invalid_types(self):
        resp = self.post_calc({"a": "x", "b": 2, "op": "add"})
        self.assertEqual(resp.status_code, 400)
        resp = self.post_calc({"a": 1, "b": "y", "op": "add"})
        self.assertEqual(resp.status_code, 400)

    def test_edge_values(self):
        resp = self.post_calc({"a": 1e12, "b": -3.5, "op": "add"})
        self.assertEqual(resp.status_code, 200)
        self.assertAlmostEqual(resp.json()["result"], 1e12 - 3.5)
