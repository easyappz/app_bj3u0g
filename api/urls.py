from django.urls import path
from .views import HelloView, ComputeView, StatsView

urlpatterns = [
    path("hello/", HelloView.as_view(), name="hello"),
    path("calc/compute/", ComputeView.as_view(), name="calc-compute"),
    path("calc/stats/", StatsView.as_view(), name="calc-stats"),
]
