from django.db import models


class CalcStat(models.Model):
    """Aggregated per-day calculation statistics."""

    date = models.DateField(unique=True)
    count = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Calculation statistic"
        verbose_name_plural = "Calculation statistics"

    def __str__(self) -> str:
        return f"{self.date}: {self.count}"
