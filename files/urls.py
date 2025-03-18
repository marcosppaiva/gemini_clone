from django.urls import path

from . import views

urlpatterns = [
    path("files/", views.file_manager, name="file_manager"),
    # path('download/<uuid:attachment_id>/', views.download_attachment, name='download_attachment'),
    path('delete-file/<uuid:file_id>', views.delete_file, name='delete_file'),
]
