from django.contrib import admin

from .models import CalcStat


@admin.register(CalcStat)
class CalcStatAdmin(admin.ModelAdmin):
    list_display = ("date", "count")
    search_fields = ("date",)
    ordering = ("-date",)
