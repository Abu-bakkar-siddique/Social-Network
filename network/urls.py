from django.urls import path
from django.conf.urls.static import static
from django.conf import settings
from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("feed", views.feed, name="feed"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("profile", views.profile, name="profile"),
    path("create_post", views.create_post, name = "create_post"),
    path("follow", views.follow_unfollow_request, name = "follow")
    
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

