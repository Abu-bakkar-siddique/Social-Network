from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError, transaction
from django.db import connection
from django.contrib.auth.decorators import login_required
from django.db.models import Q
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.core.paginator import Paginator
from django.shortcuts import render
from django.core.serializers import serialize
from django.db.models import Count
from django.urls import reverse
from .models import *
from .recommendations import *
import json
import time
from .LRU_cache import UserSearchCache 

# global cache object
user_cache = UserSearchCache(1000)

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

@login_required(login_url="/login")
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

@login_required(login_url="/login")
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
            all_followers=Count('followers', distinct = True),
            all_following=Count('following', distinct = True)
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

            self_post = False
            current_user_profile_pic = ""

            if not request.user.is_anonymous and int(request.user.pk) == int(post.user.pk):
                self_post = True

            if not request.user.is_anonymous:
                current_user_profile_pic = request.user.profile_picture.url

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
                'self_post' : self_post
            }
            all_posts.append(p)


        return JsonResponse({"posts" : all_posts, 'current_user_profile_pic' : current_user_profile_pic}, status = 200) # success

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


@login_required
def get_friend_recommendations(request):
    if request.method == 'GET' and request.accepts('text/html'):
        return render('network/index.html')
 
    friend_graph = FriendGraph(request.user)
    friend_graph.build_graph()
    recommended_users = friend_graph.get_recommendations()
    
    recommendations = []
    for user in recommended_users:

        recommendations.append({
            'id': user.id,
            'username': user.username,
            'followers' : user.followed_by.count(),
            'following' : user.follows.count(),
            'profile_picture': request.build_absolute_uri(user.profile_picture.url),
            'interests' : [interest.name for interest in user.interests.all()]
        })
        
    return JsonResponse({'recommendations': recommendations}, status=200)

@login_required(login_url="/login")
def follow_unfollow_request(request):
    
    current_user = request.user 
    body = json.loads(request.body)
    to_follow_user_id = body.get('userID')
    to_follow_user = User.objects.get(pk = to_follow_user_id) 
    following = None

    with transaction.atomic():
        if current_user.following.filter(pk=to_follow_user_id).exists():
            current_user.following.remove(to_follow_user)
            to_follow_user.followers.remove(current_user)

        else:
            current_user.following.add(to_follow_user)
            to_follow_user.followers.add(current_user)
        current_user.save()

        following_people = current_user.following.all()
    
    return JsonResponse({'message' : 'follow/unfollow request successful'},status = 200)

def edit_post(request):
    try:
        body = json.loads(request.body)
        

        if 'postId' not in body or 'title' not in body or 'body' not in body:
            return JsonResponse({"error": "Invalid data"}, status=400)

        post = Post.objects.get(pk=body['postId'])
        if int(post.user.pk) != int(request.user.pk) : return JsonResponse({"message" : "Cannot Edit someone elses post"})
        post.title = body['title']
        post.text = body['body']
        post.save()

        return JsonResponse({"message": "Post edited successfully"}, status=200)

    except ObjectDoesNotExist:
        return JsonResponse({"error": "Post not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": f"Something went wrong: {str(e)}"}, status=500)

def for_o_for(request, exception):
    return render (request ,'network/for_o_for.html', 404)

@login_required
def search(request):
    if request.method == "GET" and request.accepts('text/html'):
        return render(request, "network/index.html", status=200)
    
    elif request.method == 'POST':
        return JsonResponse({"message": "bad request, only GET is accepted"}, status=400)

    elif request.method == "GET":
        query = request.GET.get('query', '').strip()
        print(f"cache : {user_cache.cache_dict}")
        if not query :
            return JsonResponse({"message" : "search query is empty"}, status = 400)
        
        result_set = []

        # look into the cache first
        for k, v in user_cache.cache_dict.items(): 
            if query in k:
                user = user_cache.get(k)
                result_set.append({
                    'id': user.id,
                    'username': user.username,
                    'followers': user.followed_by.count(),
                    'following': user.follows.count(),
                    'profile_picture': request.build_absolute_uri(user.profile_picture.url),
                    'interests': [interest.name for interest in user.interests.all()]
                })  
                
        # user found in cache 
        if result_set:
            return JsonResponse({"search_results": result_set}, status=200)

                
        # Corrected the spelling of `contains` to `icontains` for case-insensitive search
        results = User.objects.filter(
            Q(first_name__icontains=query) | Q(last_name__icontains=query) | Q(username__icontains = query)
        )
        for user in results:
            user_cache.put(user)
            print(f"{user.profile_picture.url}") 

            result_set.append({
                    'id': user.id,
                    'username': user.username,
                    'followers': user.followed_by.count(),
                    'following': user.follows.count(),
                    'profile_picture': request.build_absolute_uri(user.profile_picture.url),
                    'interests': [interest.name for interest in user.interests.all()]
                })
        return JsonResponse({"search_results": result_set}, status=200)

    raise ValueError("Invalid request")
