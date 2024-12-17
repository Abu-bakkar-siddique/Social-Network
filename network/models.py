from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone

class User(AbstractUser):
    profile_picture = models.ImageField(upload_to='profile_pictures/', default="profile_pictures/placeholder.jpg", blank=True)
    followers = models.ManyToManyField('self', symmetrical=False, related_name='followed_by', blank=True)
    following = models.ManyToManyField('self', symmetrical=False, related_name='follows', blank=True)

    def posts_of_followers(self):
        return Post.objects.filter(user__in=self.following.all())

    def __str__(self):  
        return f"{self.username}"

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
