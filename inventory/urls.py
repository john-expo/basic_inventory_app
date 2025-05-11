from django.urls import path
from . import views

"""
URL Configuration for the inventory app.

This module defines the URL patterns specific to the inventory management functionality.
It maps URL paths to their corresponding view functions, allowing the application to
route HTTP requests to the appropriate handlers.
"""

urlpatterns = [
    # Main inventory interface - displays the complete inventory management UI
    # Use case: User accesses the root URL to view and manage inventory items
    path('', views.inventory_view, name='inventory'),
    
    # Firebase configuration endpoint - provides Firebase credentials to frontend
    # Use case: Frontend JavaScript makes an AJAX request to this endpoint to 
    # securely retrieve Firebase configuration instead of hardcoding it in HTML
    path('get-firebase-config/', views.get_firebase_config, name='firebase_config'),
]
