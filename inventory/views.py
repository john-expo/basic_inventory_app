from django.shortcuts import render
from django.http import JsonResponse
import os
from django.conf import settings

def inventory_view(request):
    """
    Main view for the inventory management system.
    
    This view renders the inventory.html template which contains the frontend
    interface for managing products. The actual data operations happen on the
    client-side via Firebase JavaScript SDK, making this a single-page application
    with real-time updates.
    
    Use case: When users access the root URL, they see the complete inventory
    management interface where they can add, edit, and delete products.
    """
    return render(request, 'inventory.html')

def get_firebase_config(request):
    """
    Securely provide Firebase configuration to the frontend.
    This helps avoid hardcoding sensitive configuration in 
    frontend JavaScript files.
    """
    # Access Firebase config from settings directly
    firebase_config = {
        "apiKey": settings.FIREBASE_API_KEY,
        "authDomain": settings.FIREBASE_AUTH_DOMAIN,
        "projectId": settings.FIREBASE_PROJECT_ID,
        "storageBucket": settings.FIREBASE_STORAGE_BUCKET,
        "messagingSenderId": settings.FIREBASE_MESSAGING_SENDER_ID,
        "appId": settings.FIREBASE_APP_ID,
    }
    
    return JsonResponse(firebase_config)
