from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.core.paginator import Paginator, EmptyPage
from django.shortcuts import render
from django.core.serializers import serialize
from django.db.models import Count
from django.urls import reverse
from .models import *
import json
import time 

def default(request):
    return render(request, "network/index.html", status=200)

def index(request):
    if request.META.get('Content-Type') == 'application/json':

        this_user = request.user
        if this_user.is_authenticated:
            userInfo = {'username' : this_user.username, 'authenticated' : True, 'userId' : this_user.pk}
            return JsonResponse(userInfo, status =200)

        else:
            userInfo = {'username' : None, 'authenticated' : False, 'userId': this_user.pk}
            return JsonResponse(userInfo, status =401)
    return render(request, "network/index.html", status=200)
@csrf_exempt
def login_view(request):
    if request.method == 'GET' and request.accepts('text/html') :
        return render(request, "network/index.html", status=200) 

    if request.method == "POST":
        
        data = json.loads(request.body) 
        username = data.get("username")
        password = data.get("password")
        
        user = authenticate(request, username=username, password=password)

        if user is not None:
            login(request, user)
            return JsonResponse({'message': 'login successful', 'userId' : request.user.pk}, status = 200)
        else:
            return JsonResponse({"message" : "Invalid username and/or password."}, status = 401)

def logout_view(request):
    logout(request)
    return JsonResponse({'message' : 'logout successful'}, status = 200)

@csrf_exempt
def register(request):
    if request.method == 'GET' and request.accepts('text/html') :
        return render(request, "network/index.html", status=200) 
   
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
        return  JsonResponse({"message": "Registeration successful.", "userId": user.pk},status = 200)

def create_post(request):

    if request.method == 'GET' and request.accepts('text/html') :
        return render(request, "network/index.html", status=200) 

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

@csrf_exempt
def profile(request):
    # If it's a GET request with Accept header for HTML, render the main page
    if request.method == 'GET' and request.accepts('text/html'):
        
        return render(request, "network/index.html", status=200)
    # process POST request
    if request.method == 'POST' and request.FILES.get('profile_pic'):
        profile_pic = request.FILES['profile_pic']
        user = User.objects.get(pk = request.user.pk)
        user.profile_picture = profile_pic
        user.save()
        return JsonResponse({'message' : 'Profile picture updated','new_profile_pic_url' : request.build_absolute_uri(user.profile_picture.url)}, status = 200)

    # process GET request
    # Safely retrieve the userID from the GET parameters
    index(request)
    user_id = request.GET.get('userID')
    if not user_id:
        return JsonResponse({'message': 'Missing userID in request parameters'}, status=400)

    try:
        this_user = User.objects.filter(pk=user_id).annotate(
            all_followers=Count('followers'),
            all_following=Count('following')
        ).first()    

        im_following = None
        if not int(request.user.pk) == int(user_id) :
            im_following = request.user.following.filter(pk=this_user.pk).exists()
        # Prepare the profile details
        profile_details = {
            'username': this_user.username,
            'profilePicUrl': request.build_absolute_uri(this_user.profile_picture.url),
            'followers': this_user.all_followers, # count of  
            'following': this_user.all_following,  # count of 
            'selfProfile' : int(request.user.pk) == int(user_id),
            'imFollowing' : im_following
        }
        print('I am following this user: ', im_following)

        return JsonResponse(profile_details, status=200)

    except User.DoesNotExist:
        return JsonResponse({'message': 'User not found'}, status=404)

    except Exception as e:
        return JsonResponse({'message': f'An unexpected error occurred: {str(e)}'}, status=500)

def feed (request) :    

    if request.method == 'GET' and request.accepts('text/html'):
        return render(request, "network/index.html", status=200)
    
    if request.method == "GET":
        category = request.GET.get('category')
        page = request.GET.get('page')
        if category == 'null' : category = 'all'

        if page is None:
            print('page is None')
        else :
            print(f"{type(page)} : {page}")
        posts = None
        all_posts = []  
        
        if category == 'all':
            posts = Post.objects.all().order_by('-timestamp')

        elif category == 'following' :
            posts = request.user.posts_of_followers().order_by('-timestamp')

        else :
            posts = Post.objects.filter(user=User.objects.get(pk=int(category))).order_by('-timestamp')
    
        # returning empty all_posts array if no posts at all  
        if not posts: return JsonResponse({"posts" : all_posts, 'hasNextPage' : False}, status = 200)
        
        posts = posts.annotate(post_likes = Count('user_likes'))
        
        posts = Paginator(posts, 10, allow_empty_first_page=False)
        
        # checking for the existence of next page.
        try:
            next_page = posts.page(int(page) + 1)
            has_next_page = True
        except EmptyPage:
            has_next_page = False
        
        posts = posts.get_page(int(page))
        
        print( has_next_page and "the feed has a next page to show")
        for post in posts.object_list:
            comments = []   
            comment_count = 0
            all_comments = Comment.objects.filter(post = post)

            if all_comments.exists():
                all_comments = all_comments.annotate(comment_likes = Count('user_likes'))
                comment_count = all_comments.count()
                for comment in all_comments:
 
                    c = {
                        'id' : comment.pk,
                        'userId' : comment.user.pk,
                        'user_profile_pic_url' : comment.user.profile_picture.url,
                        'comment_body' : comment.comment_body,
                        'likes' : comment.comment_likes,
                        'comment_post' : comment.post.pk
                    }
                    comments.append(c)
                          
            p = {
                'id' : post.pk,
                'username': post.user.username,
                'user_id' : post.user.pk,
                'profile_pic_url' : post.user.profile_picture.url,
                'title' : post.title, 
                'body' : post.text,
                'timestamp' : post.timestamp.strftime('%I:%M %p %d %b %Y'),
                'likes' : post.post_likes,
                'post_comments' : comments,
                'comment_count' : comment_count,
                'actual_timestamp' : post.timestamp,
                'self_post' : int(post.user.pk) == int(request.user.pk)
            }

            all_posts.append(p)

        return JsonResponse({"posts" : all_posts, 'hasNextPage' : has_next_page}, status = 200) # success

    #post request handler
    else :
        # time.sleep(1)
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

# @login_required
def follow_unfollow_request(request):
    
    current_user = request.user 
    body = json.loads(request.body)
    to_follow_user_id = body.get('userID')
    to_follow_user = User.objects.get(pk = to_follow_user_id) 
    following = None

    if current_user.following.filter(pk=to_follow_user_id).exists():
        current_user.following.remove(to_follow_user)
        to_follow_user.followers.remove(current_user)

    else:
        current_user.following.add(to_follow_user)
        to_follow_user.followers.add(current_user)
    current_user.save()

    following_people = current_user.following.all()
    for f in following_people:
        print(f.username) 
    
    return JsonResponse({'message' : 'follow/unfollow request successful'},status = 200)