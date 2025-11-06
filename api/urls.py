from django.urls import path
from .views import HelloView, ComputeView, StatsView, CalcAPIView

urlpatterns = [
    path("hello/", HelloView.as_view(), name="hello"),
    path("calc/", CalcAPIView.as_view(), name="calc"),
    path("calc/compute/", ComputeView.as_view(), name="calc-compute"),
    path("calc/stats/", StatsView.as_view(), name="calc-stats"),
]
