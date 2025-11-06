from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from .serializers import MessageSerializer

# New imports for calculator API
from django.http import JsonResponse
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.db import transaction
from .models import CalcStat
import json
from typing import List, Union


class HelloView(APIView):
    """
    A simple API endpoint that returns a greeting message.
    """

    @extend_schema(
        responses={200: MessageSerializer}, description="Get a hello world message"
    )
    def get(self, request):
        data = {"message": "Hello!", "timestamp": timezone.now()}
        serializer = MessageSerializer(data)
        return Response(serializer.data)


# =========================
# Calculator implementation
# =========================

AllowedChar = Union[str, float]


def _validate_expression(expr: str, max_len: int = 100) -> None:
    """Validate raw expression length and allowed characters."""
    if not isinstance(expr, str):
        raise ValueError("Invalid expression type")

    expr = expr.strip()
    if len(expr) == 0:
        raise ValueError("Empty expression")

    if len(expr) > max_len:
        raise ValueError("Expression too long")

    allowed = set("0123456789.+-*/() ")
    if any(ch not in allowed for ch in expr):
        raise ValueError("Invalid characters")


def _tokenize(expr: str) -> List[AllowedChar]:
    """
    Convert expression string into tokens (numbers as float, operators/parentheses as str).
    Supports unary + and - directly before a number (e.g., -2, +3).
    """
    tokens: List[AllowedChar] = []
    i = 0
    n = len(expr)

    def prev_is_operator_or_lparen() -> bool:
        if not tokens:
            return True
        t = tokens[-1]
        if isinstance(t, float):
            return False
        return t in {"+", "-", "*", "/", "("}

    while i < n:
        ch = expr[i]

        if ch.isspace():
            i += 1
            continue

        if ch in "+-":
            # Check for unary sign before a number
            if prev_is_operator_or_lparen() and (i + 1 < n) and (expr[i + 1].isdigit() or expr[i + 1] == "."):
                # Parse signed number
                sign = -1.0 if ch == "-" else 1.0
                i += 1
                start = i
                dot_seen = False
                while i < n and (expr[i].isdigit() or expr[i] == "."):
                    if expr[i] == ".":
                        if dot_seen:
                            raise ValueError("Invalid number format")
                        dot_seen = True
                    i += 1
                num_str = expr[start:i]
                if num_str in {"", "."}:
                    raise ValueError("Invalid number format")
                tokens.append(float(num_str) * sign)
                continue
            else:
                tokens.append(ch)
                i += 1
                continue

        if ch in "*/()":
            tokens.append(ch)
            i += 1
            continue

        if ch.isdigit() or ch == ".":
            start = i
            dot_seen = False
            while i < n and (expr[i].isdigit() or expr[i] == "."):
                if expr[i] == ".":
                    if dot_seen:
                        raise ValueError("Invalid number format")
                    dot_seen = True
                i += 1
            num_str = expr[start:i]
            if num_str in {"", "."}:
                raise ValueError("Invalid number format")
            tokens.append(float(num_str))
            continue

        # Any other character should have been rejected before
        raise ValueError("Invalid characters")

    return tokens


def _to_rpn(tokens: List[AllowedChar]) -> List[AllowedChar]:
    """Convert infix tokens to RPN using the shunting-yard algorithm."""
    output: List[AllowedChar] = []
    stack: List[str] = []

    precedence = {"+": 1, "-": 1, "*": 2, "/": 2}

    for t in tokens:
        if isinstance(t, float):
            output.append(t)
        elif t in {"+", "-", "*", "/"}:
            while stack and stack[-1] in precedence and precedence[stack[-1]] >= precedence[t]:
                output.append(stack.pop())
            stack.append(t)
        elif t == "(":
            stack.append(t)
        elif t == ")":
            found_lparen = False
            while stack:
                top = stack.pop()
                if top == "(":
                    found_lparen = True
                    break
                output.append(top)
            if not found_lparen:
                raise ValueError("Mismatched parentheses")
        else:
            raise ValueError("Invalid token")

    while stack:
        top = stack.pop()
        if top in {"(", ")"}:
            raise ValueError("Mismatched parentheses")
        output.append(top)

    return output


def _eval_rpn(rpn: List[AllowedChar]) -> float:
    """Evaluate RPN token list and return float result."""
    stack: List[float] = []

    for t in rpn:
        if isinstance(t, float):
            stack.append(t)
        elif t in {"+", "-", "*", "/"}:
            if len(stack) < 2:
                raise ValueError("Invalid expression")
            b = stack.pop()
            a = stack.pop()
            if t == "+":
                stack.append(a + b)
            elif t == "-":
                stack.append(a - b)
            elif t == "*":
                stack.append(a * b)
            elif t == "/":
                if b == 0:
                    raise ZeroDivisionError("Division by zero")
                stack.append(a / b)
        else:
            raise ValueError("Invalid token")

    if len(stack) != 1:
        raise ValueError("Invalid expression")

    return stack[0]


def compute_expression(expr: str) -> float:
    """
    Full pipeline: validate -> tokenize -> to RPN -> evaluate.
    Raises ValueError for validation/parsing errors, ZeroDivisionError for divide by zero.
    """
    _validate_expression(expr)
    tokens = _tokenize(expr)
    rpn = _to_rpn(tokens)
    return _eval_rpn(rpn)


@method_decorator(csrf_exempt, name="dispatch")
class ComputeView(View):
    """POST /api/calc/compute/ with JSON {"expression": str} -> {"expression": str, "result": number}"""

    def post(self, request, *args, **kwargs):
        try:
            payload = json.loads(request.body or b"{}")
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON body"}, status=400)

        expression = payload.get("expression")
        if expression is None:
            return JsonResponse({"error": "'expression' is required"}, status=400)

        # Compute safely
        try:
            result = compute_expression(str(expression))
        except ZeroDivisionError:
            return JsonResponse({"error": "Division by zero"}, status=400)
        except ValueError as e:
            msg = str(e) if str(e) else "Invalid expression"
            return JsonResponse({"error": msg}, status=400)

        # Increment today's counter atomically; do not store expression or result
        today = timezone.localdate()
        with transaction.atomic():
            stat, created = CalcStat.objects.select_for_update().get_or_create(date=today, defaults={"count": 0})
            stat.count += 1
            stat.save(update_fields=["count"])

        return JsonResponse({"expression": str(expression), "result": result}, status=200)


class StatsView(View):
    """GET /api/calc/stats/ -> {"date": "YYYY-MM-DD", "today_count": number}"""

    def get(self, request, *args, **kwargs):
        today = timezone.localdate()
        stat = CalcStat.objects.filter(date=today).first()
        count = stat.count if stat else 0
        return JsonResponse({"date": today.isoformat(), "today_count": count}, status=200)
