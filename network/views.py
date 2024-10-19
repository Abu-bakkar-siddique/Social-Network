from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.db.models import Count
from django.urls import reverse
from .models import *
import json

def index(request):
    
    if request.META.get('Content-Type') == 'application/json':
                
        this_user = request.user 
        if this_user.is_authenticated:
            userInfo = {'username' : this_user.username, 'authenticated' : True}
            return JsonResponse(userInfo, status =200)
        else:
            userInfo = {'username' : None, 'authenticated' : False, 'userId': this_user.pk}
            return JsonResponse(userInfo, status =210)
   
    return render(request, "network/index.html", status=219)

def login_view(request):
    if request.method == "POST":
        
        data = json.loads(request.body) 
        username = data.get("username")
        password = data.get("password")
        
        user = authenticate(request, username=username, password=password)

        if user is not None:
            login(request, user)
            return JsonResponse({'message': 'login successful'}, status = 200)
        else:
            return JsonResponse({"message" : "Invalid username and/or password."}, status = 401)
    
def logout_view(request):
    logout(request)
    return JsonResponse({'message' : 'logout successful'}, status = 200)

def register(request):
    if request.method == "POST":
        
        data = json.loads(request.body)
        username = data.get("username")
        password = data.get("password")
        confirmation = data.get("confirmation")
        email = data.get("email")
    
        # Ensure password matches confirmation
        if password != confirmation:
            return JsonResponse({"message": "Passwords must match."},status = 401)
        
        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
             return  JsonResponse({"message": "Username already taken."},status = 409)
         
        login(request, user)
        return  JsonResponse({"message": "Registeration successful."},status = 200)

    else:
        return render(request, "network/register.html")

def create_post(request):
    if request.method == 'POST':
        post = json.loads(request.body)
        title = post['title']
        body = post['body']
        
        if not title:
            return JsonResponse({'error': 'Title is missing'}, status=400)  # Bad request

        if not body:
            return JsonResponse({'error': 'hmm... fill up the post body'}, status=400)  # Bad request

        post = Post(user=request.user, title=title, text = body)
        post.save()

        return JsonResponse({'message': 'Post created successfully', 'post_id': post.id}, status=200)
    return JsonResponse({'error': 'Invalid request method'}, status=405)  # Method not allowed

def profile(request):
    if request.method != 'GET':
        return JsonResponse({'messagee': 'this endpoint only expects get request'}, status = 401)    
    this_user = User.objects.get(pk = request.get('userID'))
    
    profile_details = {
        'username': this_user.username, 
        'profilePicUrl': this_user.profile_picture.url,
        'followers' : this_user.followers,
        'following' : this_user.following,
        
        }
    return JsonResponse(profile_details, status = 200)

def feed (request) :    
    """ This is to be altered, to add comment section"""
    # initial request.
    if request.method == "GET":

        category = request.GET.get('category')
        posts = None
        all_posts = []

        # checking c ategory
        if category == 'all':
            posts = Post.objects.all()
        else :
            posts = Post.objects.filter(user=User.objects.get(pk=int(category))).order_by('-timestamp')
        
        # returning empty all_posts array if no posts at all  
        if not posts: return JsonResponse({"posts" : all_posts}, status = 200) 
        posts = posts.annotate(post_likes = Count('user_likes'))

        for post in posts:
            check = True
            comments = []
            comment_count = 0

            try :
                all_comments = Comment.objects.all().filter(post = post)
            except Comment.DoesNotExist :
                check = False

            # if comments exist
            if check :            
                all_comments = all_comments.annotate(comment_likes = Count('user_likes'))
                comment_count = all_comments.count()
                for comment in all_comments:
                    c = {
                        'id' : comment.pk,
                        'user_profile_pic_url' : comment.user.profile_picture.url,
                        'comment_body' : comment.comment_body,
                        'likes' : comment.comment_likes,
                        'comment_post' : comment.post.pk
                    }
                    comments.append(c)

            p = {
                'id' : post.pk,
                'username': post.user.username,
                'profile_pic_url' : post.user.profile_picture.url,
                'title' : post.title, 
                'body' : post.text,
                'timestamp' : post.timestamp.strftime('%I:%M %p %d %b %Y'),
                'likes' : post.post_likes,
                'post_comments' : comments,
                'comment_count' : comment_count,
                'actual_timestamp' : post.timestamp
            }

            all_posts.append(p)    
        return JsonResponse({"posts" : all_posts}, status = 200) # success

    # if post request => update likes
    body = json.loads(request.body)
    id = None
    operation = body.get('operation') 

    if operation == 'update_post_likes': # user liked the this post 
        
        id = body.get('id')

        this_post = Post.objects.get(pk = id)

        if this_post.user_likes.filter(id=request.user.id).exists():
            # Remove the like
            this_post.user_likes.remove(request.user)
        else:
            # Add the like
            this_post.user_likes.add(request.user)

    elif operation == 'update_comment_likes': # user liked the this post 
        id = body.get('id')    
        this_comment = Comment.objects.get(pk = int(id))

        if this_comment.user_likes.filter(id=request.user.id).exists():
            # Remove the like
            this_comment.user_likes.remove(request.user)
        else:
            # Add the like
            this_comment.user_likes.add(request.user)

 
    elif operation == 'new_comment': # user liked the this post 

        id = body.get('post_id')    
        comment_body = body.get('comment_body')
        post = Post.objects.all().get(pk = int(id)) 
        new_comment = Comment(user = request.user, post = post, comment_body = comment_body)     
        new_comment.save()

    return JsonResponse({'message' : 'operation successful!'}, status = 200)
