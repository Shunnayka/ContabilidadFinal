from django.shortcuts import render

def panel_admin(request):
    return render(request, 'dashboard/panel_admin.html')