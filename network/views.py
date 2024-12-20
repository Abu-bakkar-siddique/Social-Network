from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError, transaction
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.core.paginator import Paginator
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

        # post updated request
        if 'postId' in post :
            update_post = Post.objects.get(pk = post['userId']) 

            update_post.title = post['title']
            update_post.body = post['body']

            update_post.save()
            return JsonResponse({'message' : 'post edited successfully'}, status = 200)

        # post creation request
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
    try:
        user_id = request.GET.get('userID')
        if not user_id:
            return JsonResponse({'message': 'Missing userID'}, status=400)
            
        # Use prefetch_related to optimize queries and ensure consistency
        this_user = User.objects.prefetch_related(
            'followers', 
            'following'
        ).filter(pk=user_id).annotate(
            all_followers=Count('followers', distinct=True),
            all_following=Count('following', distinct=True)
        ).first()
        
        if not this_user:
            return JsonResponse({'message': 'User not found'}, status=404)
            
        im_following = False
        if request.user.is_authenticated and int(request.user.pk) != int(user_id):
            im_following = request.user.following.filter(pk=this_user.pk).exists()
            
        profile_details = {
            'userId': this_user.pk,
            'username': this_user.username,    
            'profilePicUrl': request.build_absolute_uri(this_user.profile_picture.url),
            'followers': this_user.all_followers,
            'following': this_user.all_following,
            'selfProfile': request.user.is_authenticated and int(request.user.pk) == int(user_id),
            'imFollowing': im_following
        }
        
        return JsonResponse(profile_details, status=200)
        
    except Exception as e:
        return JsonResponse({'message': f'Error: {str(e)}'}, status=500)
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
        if not posts: return JsonResponse({"posts" : all_posts}, status = 200)
        posts = posts.annotate(post_likes = Count('user_likes'))
        posts = Paginator(posts, 10)
        posts = posts.get_page(int(page))

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

        return JsonResponse({"posts" : all_posts}, status = 200) # success

    #post request handler
    else :

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
    try:
        current_user = request.user 
        body = json.loads(request.body)
        to_follow_user_id = body.get('userID')
        
        # Use select_for_update() to prevent race conditions
        with transaction.atomic():
            to_follow_user = User.objects.select_for_update().get(pk=to_follow_user_id)
            current_user = User.objects.select_for_update().get(pk=current_user.pk)
            
            if current_user.following.filter(pk=to_follow_user_id).exists():
                current_user.following.remove(to_follow_user)
                to_follow_user.followers.remove(current_user)
            else:
                current_user.following.add(to_follow_user)
                to_follow_user.followers.add(current_user)
                
            # Save both users within the transaction
            current_user.save()
            to_follow_user.save()
            
        return JsonResponse({'message': 'follow/unfollow request successful'}, status=200)
    except User.DoesNotExist:
        return JsonResponse({'message': 'User not found'}, status=404)
    except Exception as e:
        return JsonResponse({'message': f'Error processing request: {str(e)}'}, status=500)

def edit_post(request) :
    if request.method == 'GET' and request.accepts('text/html'):
        return render(request, "network/index.html", status=200)
    
    # read the request body
    post_data = json.loads(request.body)

    to_edit_post = Post.objects.get(pk = post_data["id"])

    to_edit_post.title = post_data["title"]
    to_edit_post.text = post_data["body"]

    to_edit_post.save()

    return JsonResponse({"message" : "post edited successfully"}, status = 200)
