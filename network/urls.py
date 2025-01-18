from django.urls import path, re_path
from django.conf.urls.static import static
from django.conf import settings
from django.views.generic import TemplateView
from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("feed", views.feed, name="feed"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("profile", views.profile, name="profile"),
    path("create_post", views.create_post, name = "create_post"),
    path("follow", views.follow_unfollow_request, name = "follow"),
    path("edit_post", views.edit_post, name = "edit_post"),
    path("recommendations", views.get_friend_recommendations, name = "recommendations"),
    path("search", views.search, name = "search")
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
handler404 = 'network.views.for_o_for'