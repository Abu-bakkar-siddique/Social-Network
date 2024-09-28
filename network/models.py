from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    bio = models.TextField(max_length=500, blank=True)
    profile_picture = models.ImageField(upload_to='profile_pictures/',default = "profile_pictures/placeholder.jpg", blank=True)
    cover_photo = models.ImageField(upload_to='profile_pictures/',default = "profile_pictures/placeholder_cover.png", blank=True)
    
    def __str__(self):
        return f"{self.username} + {self.bio}"
    
class Post(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=100, default="")
    text = models.TextField()
    likes = models.IntegerField(default=0)


