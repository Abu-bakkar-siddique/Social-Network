from django.contrib.auth import get_user_model
from typing import Optional, Dict, Tuple

User = get_user_model()
class UserNode:
    def __init__(self, user: User = None, prev: 'UserNode' = None, next: 'UserNode' = None):
        self.user = user
        self.prev = prev
        self.next = next

class UserLinkedList:
    def __init__(self):
        self.head_node = None
        self.tail = None

    def prepend(self, user: User):
        new_node = UserNode(user=user)
        if not self.head_node:
            self.head_node = new_node
            self.tail = new_node
        else:
            new_node.next = self.head_node
            self.head_node.prev = new_node
            self.head_node = new_node

    def evict_tail_and_prepend(self, new_user: User):
        if self.head_node is None:
            return
        
        if self.head_node.next is None:
            self.head_node.user = new_user
            return

        # Remove the LRU (tail node)
        temp = self.tail
        if self.head_node != self.tail:
            self.tail = self.tail.prev
            self.tail.next = None
        else:
            self.head_node = None
            self.tail = None

        del temp
        self.prepend(new_user)

    def update_MRU(self, node: UserNode):
        if node == self.head_node:
            return

        if node.prev:
            node.prev.next = node.next
        if node.next:
            node.next.prev = node.prev

        if node == self.tail:
            self.tail = node.prev

        node.next = self.head_node
        node.prev = None
        if self.head_node:
            self.head_node.prev = node
        self.head_node = node

    def get_tail_user(self) -> Optional[User]:
        return self.tail.user if self.tail else None

class UserSearchCache:
    """
    LRU Cache for Django User objects, optimized for search functionality.
    This cache stores User objects and maintains their access order.
    """

    def __init__(self, capacity: int):
        if capacity <= 0:
            raise ValueError("Capacity must be a positive integer")
        self._capacity = capacity
        self.cache_dict: Dict[username, Tuple[UserNode, User]] = {}  # key: username, value: (node, user)
        self.LRU_list = UserLinkedList()

    def get(self, username: str) -> Optional[User]:
        """
        Retrieve a user from the cache by their username.
        Returns None if user is not in cache.
        """
        if username not in self.cache_dict:
            return None

        # Move the accessed user to MRU
        node, user = self.cache_dict[username]
        self.LRU_list.update_MRU(node)
        return user

    def put(self, user: User) -> None:
        """
        Add or update a user in the cache.
        If the user exists, updates to MRU.
        If cache is full, evicts LRU user.
        """
        username = user.username

        # If user already exists, update to MRU
        if username in self.cache_dict:
            node, _ = self.cache_dict[username]
            self.cache_dict[username] = (node, user)
            self.LRU_list.update_MRU(node)
            return

        # Evict LRU user if cache is full
        if len(self.cache_dict) >= self._capacity:
            lru_user = self.LRU_list.get_tail_user()
            if lru_user and lru_user.username in self.cache_dict:
                del self.cache_dict[lru_user.username]
            self.LRU_list.evict_tail_and_prepend(user)
            self.cache_dict[username] = (self.LRU_list.head_node, user)
            return

        # Add new user
        self.LRU_list.prepend(user)
        self.cache_dict[username] = (self.LRU_list.head_node, user)

    def clear(self) -> None:
        """Clear the cache"""
        self.cache_dict.clear()
        self.LRU_list = UserLinkedList()

    @property
    def size(self) -> int:
        """Current number of users in cache"""
        return len(self.cache_dict)
