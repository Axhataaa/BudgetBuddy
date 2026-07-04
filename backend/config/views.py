from django.http import JsonResponse


def home(request):
    return JsonResponse({
        "project": "BudgetBuddy API",
        "status": "Running",
        "version": "1.0",
        "message": "Welcome to the BudgetBuddy Backend API",
        "admin_panel": "/admin/",
        "authentication": "/api/users/"
    })