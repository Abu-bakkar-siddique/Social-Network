from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone

class User(AbstractUser):
    bio = models.TextField(max_length=500, blank=True)
    profile_picture = models.ImageField(upload_to='profile_pictures/',default = "profile_pictures/placeholder.jpg", blank=True)
    followers = models.PositiveBigIntegerField(default=0)
    following = models.PositiveBigIntegerField(default=0)
    
    def __str__(self):
        return f"{self.username} + {self.bio}"

class Post(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=100, default="")
    timestamp = models.DateTimeField(default=timezone.now)
    text = models.TextField()
    user_likes = models.ManyToManyField(User, related_name = 'User_likes') 
    
class Comment(models.Model) :
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    post = models.ForeignKey(Post, on_delete= models.CASCADE)
    user_likes = models.ManyToManyField(User, related_name='User_comments') 
    comment_body = models.TextField()
