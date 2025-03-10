from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('register/', views.register_view, name='register'),
    path('password-reset/', views.password_reset_view, name='password_reset'),
    path(
        'new-conversation/', views.start_new_conversation, name='start_new_conversation'
    ),
    path(
        'delete-conversation/<uuid:conversation_id>/',
        views.delete_conversation,
        name='delete_conversation',
    ),
]
