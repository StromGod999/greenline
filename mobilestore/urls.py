"""
URL configuration for mobilestore project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('auth/', include('allauth.urls')),
    path('', include('store.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# Custom Admin Panel Titles
admin.site.site_header = "Greenline Mobile Store Admin"
admin.site.site_title = "Greenline Admin Portal"
admin.site.index_title = "Store Management & Delivery Dashboard"
