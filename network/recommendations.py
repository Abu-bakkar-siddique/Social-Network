from collections import defaultdict
from .models import *

class UserNode:
    def __init__(self, user, relation_type=None):
        # relationship type for the the starting user is None
        self.user = user
        self.relation_type = relation_type  # 'two_way', 'follower', 'following'
        self.common_interests = 0

class FriendGraph:
 
    def __init__(self, user):
        self.user = user
        self.graph = defaultdict(list)  # adjacency list
        self.visited = set()
        self.recommendations = []
        self.already_connected = {user.id}  # Set of users already connected to original user

    def build_graph(self):
        """Build the initial graph with user's direct connections"""
   
        # Add the user's followings
        for following in self.user.following.all():
            self.graph[self.user.id].append(UserNode(following, self._get_relation_type(following)))
            self.already_connected.add(following.id)

        # For each direct connection, add their connections
        for following in self.user.following.all():
            for friend_of_friend in following.following.all():
                if friend_of_friend.id != self.user.id:  # Don't add the original user
                    node = UserNode(friend_of_friend, self._get_relation_type(friend_of_friend))
                    self.graph[following.id].append(node)

    def _get_relation_type(self, target_user):
        """Determine the relationship type between two users"""
        is_following = target_user.followers.filter(id=self.user.id).exists()
        is_follower = target_user.following.filter(id=self.user.id).exists()
        
        if is_following and is_follower:
            return 'two_way'
        elif is_following:
            return 'following'
        elif is_follower:
            return 'follower'
        return None

    def _calculate_common_interests(self, user1, user2):
        """Calculate number of common interests between two users"""
        user1_interests = set(user1.interests.all())
        user2_interests = set(user2.interests.all())
        return len(user1_interests.intersection(user2_interests))

    def get_recommendations(self):
        """Get friend recommendations based on graph analysis"""
        potential_recommendations = defaultdict(lambda: {'user': None, 'score': 0, 'relation_type': None})
     
        # Analyze connections
        for source_id, connections in self.graph.items():
            for node in connections:
                # this if statement is because we have to recommend friend_of_friend
                if node.user.id not in self.already_connected:
                    rec = potential_recommendations[node.user.id]
                    rec['user'] = node.user
                    rec['relation_type'] = node.relation_type
                    
                    # Score based on relationship type
                    if node.relation_type == 'two_way':
                        rec['score'] += 3
                    elif node.relation_type in ['following', 'follower']:
                        rec['score'] += 1

                    # Add score for common interests
                    common_interests = self._calculate_common_interests(self.user, node.user)
                    rec['score'] += common_interests * 2

        # Convert to list and sort by score
        recommendations = list(potential_recommendations.values())
        recommendations.sort(key=lambda x: (-x['score'], x['user'].username))
        
        return [rec['user'] for rec in recommendations]