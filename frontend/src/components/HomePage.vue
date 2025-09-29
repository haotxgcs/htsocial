<template>
  <div class="homepage">
    <!-- Sidebar trái -->
    <aside class="sidebar-left">
      <h2 class="profile-name"><img src="../assets/user.png" class="menu-icon-left"/>{{ user?.firstname }} {{ user?.lastname }}</h2>
      <ul>
        <li><img src="../assets/sidebar/ai.png" class="menu-icon-left"/>AI</li>
        <li><img src="../assets/sidebar/friend.png" class="menu-icon-left"/>Friend</li>
        <li><img src="../assets/sidebar/group.png" class="menu-icon-left"/>Group</li>
        <li><img src="../assets/sidebar/marketplace.png" class="menu-icon-left"/>Marketplace</li>
        <li><img src="../assets/sidebar/game.png" class="menu-icon-left"/>Game</li>
        <li @click="$router.push('/hidden')"><img src="../assets/sidebar/hide-post.png" class="menu-icon-left"/>Hidden Posts</li>
        <li @click="$router.push('/saved')"><img src="../assets/sidebar/bookmark.png" class="menu-icon-left"/>Saved Posts</li>
      </ul>
    </aside>

    <!-- Feed chính -->
    <main class="feed">
      <div class="create-post">
        <h3>Create your post</h3>
        <input type="text" @click="openCreatePostModal" :placeholder="`What's is on your mind, ${user?.firstname} ${user?.lastname}?`"/>
      </div>

      <div class="post" v-for="post in posts" :key="post._id">
  
        <!-- ======= BÀI VIẾT GỐC ======= -->
        <div v-if="post.type === 'post'">
          <div class="post-header">
            <div class="post-author-info">
              <img :src="getAvatarUrl(post.author)" alt="avatar" />
              <div class="author-details">
                <strong>{{ post.author?.firstname }} {{ post.author?.lastname }}</strong>
                <p class="time">
                  {{ formatTime(post.createdAt) }}
                  <span v-if="post.audience === 'public'">🌍</span>
                  <span v-else-if="post.audience === 'friends'">👥</span>
                  <span v-else-if="post.audience === 'private'">🔒</span>
                </p>
              </div>
            </div>

            <!-- menu icon -->
            <div class="post-menu-wrapper">
              <img src="../assets/menu.png" class="menu-post-icon" @click="toggleMenu(post._id)" />
              <div v-if="openMenuId === post._id" class="dropdown-menu">
                <button v-if="isMyPost(post)" @click="editPost(post)">
                  <img src="../assets/edit.png" class="menu-icon-left"/> Edit Post
                </button>
                <button v-if="!isMyPost(post)" @click="hideThisPost(post._id)">
                  <img src="../assets/hide.png" class="menu-icon-left"/> Hide this Post
                </button>
                <button v-if="isMyPost(post)" @click="deletePost(post._id)" style="color: red">
                  <img src="../assets/delete.png" class="menu-icon-left"/> Delete Post
                </button>
              </div>
            </div>
          </div>

          <p class="post-text">{{ post.content }}</p>

          <!-- Media -->
          <div v-if="post.media" class="post-media">
            <img v-if="post.mediaType === 'image'" :src="`http://localhost:3000/${post.media}`" class="post-image" />
            <video v-else-if="post.mediaType === 'video'" controls class="post-video">
              <source :src="`http://localhost:3000/${post.media}`" type="video/mp4" />
            </video>
          </div>

          <!-- Like/Comment/Share count -->
          <div class="post-stats">
            <span v-if="post.likes?.length > 0">{{ post.likes.length }} liked</span>
            <span v-if="getPostCommentCount(post) > 0">{{ getPostCommentCount(post) }} commented</span>
            <span v-if="post.sharesCount > 0">{{ post.sharesCount }} shared</span>
            <span v-if="getPostSaveCount(post) > 0">{{ getPostSaveCount(post) }} saved</span>
          </div>

          <!-- Actions -->
          <div class="post-actions">
            <button @click="toggleLike(post)">
              <img :src="isLiked(post) ? require('../assets/like.png') : require('../assets/unlike.png')" class="action-icon" />
              <span>Like</span>
            </button>
            <button @click="openCommentModal(post)">
              <img src="../assets/comment.png" class="action-icon" />
              <span>Comment</span>
            </button>
            <button @click="openShareModal(post)">
              <img src="../assets/share.png" class="action-icon" />
              <span>Share</span>
            </button>
            <button @click="toggleSavePost(post)">
              <img :src="isSaved(post) ? require('../assets/saved.png') : require('../assets/save.png')" class="action-icon" />
              <span>{{ isSaved(post) ? 'Saved' : 'Save' }}</span>
          </button>
          </div>
        </div>

        <!-- ======= BÀI CHIA SẺ ======= -->
        <div v-else-if="post.type === 'share'" class="shared-post">

          <!-- Người chia sẻ -->
          <div class="post-header">
            <div class="post-author-info">
              <img :src="getAvatarUrl(post.username)" alt="avatar" />
              <div class="author-details">
                <strong>{{ post.username?.firstname }} {{ post.username?.lastname }}</strong>
                <p class="time">
                {{ formatTime(post.createdAt) }} • Shared a post
                <span v-if="post.audience === 'public'" title="Public">🌍</span>
                <span v-else-if="post.audience === 'friends'" title="Friends">👥</span>
                <span v-else-if="post.audience === 'private'" title="Private">🔒</span>
                </p>
              </div>
            </div>

            <!-- menu share -->
            <div class="post-menu-wrapper">
              <img src="../assets/menu.png" class="menu-post-icon" @click="toggleMenu(post._id)" />
              <div v-if="openMenuId === post._id" class="dropdown-menu">
                <button v-if="isMyShare(post)" @click="editShare(post)">
                  <img src="../assets/edit.png" class="menu-icon-left"/> Edit Share
                </button>
                <button v-if="!isMyShare(post)" @click="hideThisShare(post._id)">
                  <img src="../assets/hide.png" class="menu-icon-left"/> Hide Share
                </button>
                <button v-if="isMyShare(post)" @click="deleteShare(post._id)" style="color: red">
                  <img src="../assets/delete.png" class="menu-icon-left"/> Delete Share
                </button>
              </div>
            </div>
          </div>

          <p class="post-text" v-if="post.content"><i>{{ post.content }}</i></p>

          <!-- ======= BÀI GỐC (bên trong share) ======= -->
          <!-- Shared post content box -->
          <div class="shared-box">
            <template v-if="post.post">
              <!-- Nếu viewer không được xem -->
              <template v-if="post.canViewPost === false">
                <div class="restricted-post-warning">
                  <img :src="getAvatarUrl(post.post.author)" class="avatar-small" />
                  <div class="restricted-content">
                    <strong>{{ post.post.author.firstname }} {{ post.post.author.lastname }}</strong>
                    <p class="time">
                      {{ formatTime(post.post.createdAt) }}
                      <span v-if="post.post.audience === 'public'">🌍</span>
                      <span v-else-if="post.post.audience === 'friends'">👥</span>
                      <span v-else-if="post.post.audience === 'private'">🔒</span>
                    </p>
                    <p class="notice-message">{{ getPostAccessMessage(post.post) }}</p>
                  </div>
                </div>
              </template>

              <!-- Nếu được phép xem -->
              <template v-else>
                <div class="post-header">
                  <img :src="getAvatarUrl(post.post.author)" class="avatar-small" />
                  <div class="author-details">
                    <strong>{{ post.post.author.firstname }} {{ post.post.author.lastname }}</strong>
                    <p class="time">
                      {{ formatTime(post.post.createdAt) }}
                      <span v-if="post.post.audience === 'public'">🌍</span>
                      <span v-else-if="post.post.audience === 'friends'">👥</span>
                      <span v-else-if="post.post.audience === 'private'">🔒</span>
                    </p>
                  </div>
                </div>
                <p>{{ post.post.content }}</p>
                <div v-if="post.post.media">
                  <img v-if="post.post.mediaType === 'image'" :src="`http://localhost:3000/${post.post.media}`" class="post-image" />
                  <video v-else controls class="post-video">
                    <source :src="`http://localhost:3000/${post.post.media}`" type="video/mp4" />
                  </video>
                </div>
                <!-- Like/Comment/Share count -->
                <div class="post-stats">
                  <span v-if="post.post.likes?.length > 0">{{ post.post.likes.length }} liked</span>
                  <span v-if="getPostCommentCount(post) > 0">{{ getPostCommentCount(post) }} commented</span>
                  <span v-if="post.post.sharesCount > 0">{{ post.post.sharesCount }} shared</span>
                   <span v-if="getPostSaveCount(post.post) > 0">{{ getPostSaveCount(post.post) }} saved</span>
                </div>

                <!-- Actions -->
                <div class="post-actions">
                  <button @click="toggleLike(post.post)">
                    <img :src="isLiked(post.post) ? require('../assets/like.png') : require('../assets/unlike.png')" class="action-icon" />
                    <span>Like</span>
                  </button>
                  <button @click="openCommentModal(post.post)">
                    <img src="../assets/comment.png" class="action-icon" />
                    <span>Comment</span>
                  </button>
                  <button @click="openShareModal(post.post)">
                    <img src="../assets/share.png" class="action-icon" />
                    <span>Share</span>
                  </button>
                  <button @click="toggleSavePost(post)">
              <img :src="isSaved(post.post) ? require('../assets/saved.png') : require('../assets/save.png')" class="action-icon" />
              <span>{{ isSaved(post.post) ? 'Saved' : 'Save' }}</span>
          </button>
                </div>
              </template>
            </template>

            <!-- Nếu bài gốc đã xoá -->
            <template v-else>
              <div class="restricted-post-warning">
                <p class="notice-message">This post is deleted</p>
              </div>
            </template>
          </div>
        </div>
      </div>
    </main>

    <!-- Sidebar phải -->
    <aside class="sidebar-right">
      <h3>Contacts</h3>

      <template v-if="friends && friends.length > 0">
        <ul>
          <li v-for="friend in friends" :key="friend._id">
            <img :src="getAvatarUrl(friend)" class="menu-icon-right" />
            <span class="status" :class="{ online: friend.active, offline: !friend.active }"></span>
            {{ friend.firstname }} {{ friend.lastname }}
          </li>
        </ul>
      </template>

      <template v-else>
        <p class="no-contacts">You have no contacts</p>
        <button @click="$router.push('/friend')" class="find-friends-btn">
          Find Friends
        </button>
      </template>
    </aside>
  </div>

  <CreatePostModal
  :is-visible="createPostModalVisible"
  :user="user"
  @close="createPostModalVisible = false"
  @posted="handlePostCreated"
/>
          
  <!-- Modals -->
  <ConfirmDialog
    v-if="confirmVisible"
    :message="confirmMessage"
    @confirm="handleConfirmedDelete"
    @cancel="confirmVisible = false"
  />

  <EditShareModal
    v-if="showEditShareModal"
    :share="editedShare"
    @close="showEditShareModal = false"
    @updated="fetchPosts"
  />

  <ShareModal
    v-if="showShareModal"
    :post="postToShare"
    :user="user"
    @close="showShareModal = false"
    @shared="fetchPosts"
  />

  <EditPostModal
  :is-visible="editModalVisible"
  :post="editedPost"
  :user="user"
  @close="closeEditModal"
  @updated="handlePostUpdated"
/>

  <!-- Comment Modal Component -->
  <CommentModal
    :is-visible="commentModalVisible"
    :post="selectedPost"
    :user="user"
    :initial-save-count="getPostSaveCount(selectedPost)"
    @close="closeCommentModal"
    @commented="handleCommentAdded"
    @comment-deleted="handleCommentDeleted"
    @liked="handlePostLiked"
    @share="handleSharePost"
    @comment-count-updated="onCommentCountUpdated"
    @save-count-updated="handleSaveCountUpdated"
    @save-status-changed="handleSaveStatusChanged"
  />
</template>

<script>
import ConfirmDialog from './ConfirmDialog.vue';
import EditShareModal from './EditShareModal.vue';
import ShareModal from './ShareModal.vue';
import CommentModal from './CommentModal.vue';
import EditPostModal from './EditPostModal.vue';
import CreatePostModal from './CreatePostModal.vue';

export default {
  name: "HomePage",
  components: {
    ConfirmDialog,
    EditShareModal,
    ShareModal,
    CommentModal,
    EditPostModal,
    CreatePostModal
  },
  data() {
    return {
      user: null,
      posts: [],
      friends: [],
      openMenuId: null,
      confirmVisible: false,
      confirmMessage: '',
      postToDeleteId: null,
      savedPosts: [], // Array of saved item IDs
      postSaveCounts: {},

      // Edit post
       editModalVisible: false,
       editedPost: null, 

      // Comment modal data
      commentModalVisible: false,
      selectedPost: null,
      postCommentCounts: {},
      
      // Create Post Modal data
     createPostModalVisible: false,

      // Create share modal data  
      shareModalVisible: false,
      sharedPost: null,
      shareContent: '',
      shareAudience: 'public', 
      showEditShareModal: false,
      editedShare: null,
      showShareModal: false,
      postToShare: null,
    }
  },

  methods: {
    getAvatarUrl(author) {
      if (!author || !author.avatar) return 'http://localhost:3000/uploads/user.png';
      return `http://localhost:3000/${author.avatar}`;
    },
    
    getImageUrl(path) {
      return `http://localhost:3000/${path}`;
    },
    
    toggleMenu(postId) {
      this.openMenuId = this.openMenuId === postId ? null : postId;
    },
    
    async fetchPosts() {
    try {
      const savedUser = JSON.parse(localStorage.getItem("user"));
      if (!savedUser) {
        return alert("Please login to view posts");
      }

      const viewerId = savedUser.id;
      const res = await fetch(`http://localhost:3000/feeds/${viewerId}`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      this.posts = data;
      
      // Fetch save counts sau khi load posts
      this.fetchAllSaveCounts();
    } catch (err) {
      console.error("Error in fetch posts:", err);
      alert("Unable to fetch posts");
    }
  },

    // NEW: Fetch save count cho một post
  async fetchPostSaveCount(postId) {
    if (this.postSaveCounts[postId] !== undefined) {
      return this.postSaveCounts[postId];
    }

    try {
      const res = await fetch(`http://localhost:3000/posts/${postId}/saves-count`);
      if (res.ok) {
        const data = await res.json();
        this.postSaveCounts[postId] = data.savesCount || 0;
        return this.postSaveCounts[postId];
      }
    } catch (err) {
      console.error("Cannot fetch save count:", err);
    }
    
    this.postSaveCounts[postId] = 0;
    return 0;
  },

  // NEW: Get save count với cache
  getPostSaveCount(post) {
    if (!post || !post._id) return 0;
    
    // Nếu có sẵn từ API response
    if (post.savesCount !== undefined) {
      return post.savesCount;
    }
    
    // Nếu có trong cache
    if (this.postSaveCounts[post._id] !== undefined) {
      return this.postSaveCounts[post._id];
    }
    
    // Fetch và cache
    this.fetchPostSaveCount(post._id);
    return 0;
  },

  // NEW: Update save count khi save/unsave
  updatePostSaveCount(postId, increment = false) {
    if (this.postSaveCounts[postId] === undefined) {
      this.postSaveCounts[postId] = 0;
    }
    
    if (increment) {
      this.postSaveCounts[postId]++;
    } else {
      this.postSaveCounts[postId] = Math.max(0, this.postSaveCounts[postId] - 1);
    }

    // Cập nhật trong posts list
    const postIndex = this.posts.findIndex(p => p._id === postId || (p.post && p.post._id === postId));
    if (postIndex !== -1) {
      const post = this.posts[postIndex];
      if (post.post) {
        post.post.savesCount = this.postSaveCounts[postId];
      } else {
        post.savesCount = this.postSaveCounts[postId];
      }
    }
  },

  // NEW: Fetch all save counts cho posts hiện tại
  async fetchAllSaveCounts() {
    const postIds = [];
    
    this.posts.forEach(post => {
      if (post.type === 'post') {
        postIds.push(post._id);
      } else if (post.type === 'share' && post.post) {
        postIds.push(post.post._id);
      }
    });

    // Fetch save counts
    for (const postId of postIds) {
      if (this.postSaveCounts[postId] === undefined) {
        this.fetchPostSaveCount(postId);
      }
    }
  },

    async toggleSavePost(post) {
    const savedUser = JSON.parse(localStorage.getItem("user"));
    if (!savedUser) return alert("Please login to save posts");

    try {
      const postId = post._id;
      const isSaved = this.savedPosts.includes(postId);
      
      const res = await fetch(`http://localhost:3000/feeds/save/${postId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: savedUser.id,
          action: isSaved ? 'unsave' : 'save'
        })
      });

      const data = await res.json();
      
      if (res.ok) {
        if (isSaved) {
          // Remove from saved posts
          this.savedPosts = this.savedPosts.filter(id => id !== postId);
          this.updatePostSaveCount(postId, false); // Decrease count
          alert(data.msg || 'Item unsaved successfully');
        } else {
          // Add to saved posts
          this.savedPosts.push(postId);
          this.updatePostSaveCount(postId, true); // Increase count
          alert(data.msg || 'Item saved successfully');
        }
      } else {
        alert(data.msg || 'Failed to save/unsave item');
      }
    } catch (err) {
      console.error("Cannot save/unsave item:", err);
      alert("Unable to save/unsave item");
    }
  },

  handleSaveCountUpdated(data) {
  console.log('🔄 Save count updated from CommentModal:', data);
  this.postSaveCounts[data.postId] = data.count;
  
  const postIndex = this.posts.findIndex(p => p._id === data.postId || (p.post && p.post._id === data.postId));
  if (postIndex !== -1) {
    const post = this.posts[postIndex];
    if (post.post) {
      post.post.savesCount = data.count;
    } else {
      post.savesCount = data.count;
    }
  }
},

handleSaveStatusChanged(data) {
  console.log('💾 Save status changed:', data);
  if (data.isSaved) {
    // Add to savedPosts if not already there
    if (!this.savedPosts.includes(data.postId)) {
      this.savedPosts.push(data.postId);
    }
  } else {
    // Remove from savedPosts
    this.savedPosts = this.savedPosts.filter(id => id !== data.postId);
  }
},

    isSaved(post) {
      return this.savedPosts.includes(post._id);
    }, 

    async loadSavedPosts() {
      try {
        const savedUser = JSON.parse(localStorage.getItem("user"));
        if (!savedUser) return;

        // ✅ NEW: Use feed endpoint for getting saved item IDs
        const res = await fetch(`http://localhost:3000/feeds/users/${savedUser.id}/saved-items`);
        if (res.ok) {
          const data = await res.json();
          this.savedPosts = data.savedItems || [];
        }
      } catch (err) {
        console.error("Failed to load saved posts:", err);
      }
    },

    openCreatePostModal() {
      this.createPostModalVisible = true;
    },

    handlePostCreated() {
      this.fetchPosts();
    },

    async hideThisPost(postId) {
      const savedUser = JSON.parse(localStorage.getItem("user"));
      if (!savedUser) return alert("Please log in");

      try {
        const res = await fetch(`http://localhost:3000/posts/hide-post/${postId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ userId: savedUser.id })
        });

        const data = await res.json();
        alert(data.msg);
        this.posts = this.posts.filter(p => p._id !== postId);
      } catch (err) {
        console.error("Error hiding post:", err);
        alert("Failed to hide post");
      }
    },

    // Comment modal methods
    openCommentModal(post) {
      this.selectedPost = post;
      this.commentModalVisible = true;
    },

    closeCommentModal() {
      this.commentModalVisible = false;
      this.selectedPost = null;
    },

    handleCommentAdded(comment) {
      console.log('Comment added:', comment);
    },

    onCommentCountUpdated(data) {
      this.postCommentCounts[data.postId] = data.count;
      
      const postIndex = this.posts.findIndex(p => p._id === data.postId);
      if (postIndex !== -1) {
        this.posts[postIndex].totalComments = data.count;
      }
    },

    getPostCommentCount(post) {
      if (this.postCommentCounts[post._id] !== undefined) {
        return this.postCommentCounts[post._id];
      }
      return (post?.commentCount || 0) + (post?.replyCommentCount || 0);
    },

    handleCommentDeleted(commentId) {
      console.log('Comment deleted:', commentId);
    },

    handlePostLiked(data) {
      const post = this.posts.find(p => p._id === data.postId || (p.post && p.post._id === data.postId));
      if (post) {
        if (post.post) {
          post.post.likes = data.likes;
        } else {
          post.likes = data.likes;
        }
      }
    },

    handleSharePost(post) {
      this.openShareModal(post);
    },

    // Edit post methods
    editPost(post) {
      this.editedPost = post;
      this.editModalVisible = true;
      this.openMenuId = null;
    },

    closeEditModal() {
      this.editModalVisible = false;
      this.editedPost = null;
    },
    
    handlePostUpdated() {
      this.fetchPosts();
    },

    async toggleLike(post) {
      const savedUser = JSON.parse(localStorage.getItem("user"));
      if (!savedUser) return alert("Please login");

      try {
        const res = await fetch(`http://localhost:3000/posts/${post._id}/like`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: savedUser.username
          })
        });

        const data = await res.json();
        post.likes = data.likes;
      } catch (err) {
        console.error("Cannot like this post:", err);
        alert("Unable to like this post");
      }
    },
    
    deletePost(postId) {
      this.confirmMessage = 'Are you sure to delete this post?';
      this.postToDeleteId = postId;
      this.confirmVisible = true;
    },

    async handleConfirmedDelete() {
      try {
        const res = await fetch(`http://localhost:3000/posts/${this.postToDeleteId}`, {
          method: 'DELETE'
        });
        
        if (res.ok) {
          this.posts = this.posts.filter(p => p._id !== this.postToDeleteId);
          this.openMenuId = null;
        }
      } catch (err) {
        console.error("Fail to delete post:", err);
      }
      this.confirmVisible = false;
    },

    isMyPost(post) {
      const savedUser = JSON.parse(localStorage.getItem("user"));
      return savedUser && post.author._id === savedUser.id;
    },

    isLiked(post) {
      const savedUser = JSON.parse(localStorage.getItem("user"));
      return post.likes && post.likes.includes(savedUser.id);
    },

    formatTime(dateStr) {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? '' : date.toLocaleString();
    },

    // Share methods
    isMyShare(share) {
      const savedUser = JSON.parse(localStorage.getItem("user"));
      return savedUser && share.username._id === savedUser.id;
    },

    async deleteShare(shareId) {
      if (confirm("Are you sure you want to delete this shared post?")) {
        try {
          const res = await fetch(`http://localhost:3000/shares/${shareId}`, {
            method: 'DELETE'
          });
          if (res.ok) {
            this.fetchPosts();
          }
        } catch (err) {
          console.error("Error deleting share:", err);
        }
      }
    },

    editShare(share) {
      this.editedShare = share;
      this.showEditShareModal = true;
    },

    openShareModal(post) {
      this.postToShare = post;
      this.showShareModal = true;
    },

    // ✅ REMOVED: canViewSharedPost method - now handled by backend
    // Backend provides canViewPost property directly

    getPostAccessMessage(post) {
      if (!post) return 'Content not available';
      if (post.audience === 'private') {
        return 'This post is private';
      } else if (post.audience === 'friends') {
        return 'Only friends of this user can see';
      } else {
        return 'Content not available';
      }
    },

    async hideThisShare(shareId) {
      const savedUser = JSON.parse(localStorage.getItem("user"));
      if (!savedUser) return alert("Please log in to hide shares");

      try {
        const res = await fetch(`http://localhost:3000/shares/hide-share/${shareId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ userId: savedUser.id })
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.msg || "Hide share failed");
        }

        alert(data.msg || "Hide share successfully!");
        await this.fetchPosts();

      } catch (err) {
        console.error("Error to hide share:", err);
        alert(err.message || "Unable to hide share");
      }
    },

    async loadFriends() {
      try {
        const savedUser = JSON.parse(localStorage.getItem("user"));
        if (!savedUser) return;

        const res = await fetch(`http://localhost:3000/users/${savedUser.id}/friends`);
        const data = await res.json();
        this.friends = data;
      } catch (err) {
        console.error("Failed to load friends", err);
      }
    }
  },

  mounted() {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      this.user = JSON.parse(savedUser);
      this.fetchPosts();
      this.loadFriends();
      this.loadSavedPosts();
    } else {
      this.$router.push("/login");
    }
  },

  beforeUnmount() {
    // Cleanup if needed
  }
};
</script>

<style scoped>
.homepage {
  display: flex;
  min-height: 100vh;
  background-color: #f0f2f5;
  font-family: Arial, sans-serif;
}

.sidebar-left {
  position: fixed;
  top: 56px; 
  left: 0;
  width: 250px;
  height: calc(100vh - 56px);
  padding: 20px;
  border-right: 1px solid #ddd;
  overflow-y: auto;
  z-index: 2;
}

.sidebar-left ul {
  list-style: none;
  padding: 0;
}

.sidebar-left li {
  padding: 10px 0;
  border-bottom: 1px solid #eee;
  cursor: pointer;
}

.profile-name {
  font-weight: bold;
  font-size: 18px;
  margin-bottom: 20px;
}

.feed {
  width: 600px;
  margin: 0 auto;
  padding: 20px;
  margin-left: 500px;  
}

.create-post {
  background: white;
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 20px;
}

.create-post input {
  width: 95%;
  padding: 12px;
  font-size: 15px;
  border: 1px solid #ccc;
  border-radius: 8px;
}

.post {
  background: white;
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 20px;
  margin-top: 10px;
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
}

.post-header img {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  margin-right: 10px;
}

.post-header .time {
  font-size: 12px;
  color: gray;
  margin-top: 2px;
}

.post-text {
  margin: 10px 0;
  font-size: 14px;
  white-space: pre-line; /* Thêm dòng này */
  word-wrap: break-word; 
}

.post-image, .post-video {
  width: 100%;
  border-radius: 10px;
  margin-top: 10px;
}

.sidebar-right {
  position: fixed;
  top: 56px;
  right: 0;
  width: 220px;
  height: calc(100vh - 56px);
  padding: 20px;
  border-left: 1px solid #ddd;
  overflow-y: auto;
  z-index: 2;
}

.sidebar-right ul {
  list-style: none;
  padding: 0;
}

.sidebar-right li {
  display: flex;
  align-items: center;
  margin: 10px 0;
}

.status {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  margin-right: 8px;
}

.status.online {
  background-color: green;
}

.status.offline {
  background-color: gray;
}

.menu-icon-left {
  width: 30px;
  height: 30px;
  margin-right: 10px;
  vertical-align: middle;
}

.menu-icon-right {
  width: 40px;
  height: 40px;
  margin-right: 10px;
  vertical-align: middle;
}

.sidebar-left li {
  display: flex;
  align-items: center;
}

.post-actions {
  display: flex;
  justify-content: space-around;
  margin-top: 10px;
  border-top: 1px solid #ddd;
  padding-top: 10px;
}

.post-actions button {
  background: none;
  border: none;
  color: #555;
  cursor: pointer;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 6px;
}

.post-actions button:hover {
  color: #1877f2;
}

.action-icon {
  width: 20px;
  height: 20px;
}

.menu-post-icon {
  width: 15px;
  height: 15px;
  cursor: pointer;
}

.post-menu-wrapper {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: 40px;
  right: 0;
  background: white;
  border: 1px solid #ccc;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  z-index: 1000;
  min-width: 240px;
}

.dropdown-menu button {
  display: block;
  width: 100%;
  padding: 12px 16px;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  font-size: 15px;
}

.dropdown-menu button:hover {
  background-color: #f0f2f5;
}

.post-author-info {
  display: flex;
  align-items: center;
}

.post-author-info img {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  margin-right: 10px;
  object-fit: cover;
}

.author-details {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.author-details strong {
  font-size: 15px;
  font-weight: bold;
}

.author-details .time {
  font-size: 12px;
  color: gray;
  margin-top: 2px;
}

.post-stats {
  display: flex;
  gap: 16px;
  margin: 16px 0 12px 0;
  font-size: 14px;
  color: #65676b;
}

/* Shared post styles */
.shared-post {
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  margin-bottom: 1rem;
  padding: 10px;
  border-radius: 10px;
}

.shared-box {
  background: white;
  padding: 10px;
  border-left: 3px solid #ccc;
  margin-top: 10px;
  border-radius: 6px;
  white-space: pre-line;
}

.restricted-post-warning {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 16px;
  background: #fef2f2;
  border-radius: 12px;
  border: 1px solid #fef2f2;
  margin-top: 16px;
  box-shadow: 0 2px 6px rgba(255, 193, 7, 0.1);
}

.restricted-post-warning .avatar-small {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  border: 2px solid #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.restricted-content {
  flex: 1;
  min-width: 0;
}

.restricted-content strong {
  font-size: 14px;
  font-weight: 600;
  color: #1c1e21;
  margin: 0 0 4px 0;
  display: block;
}

.restricted-content .time {
  font-size: 12px;
  color: #6c757d;
  margin: 0 0 8px 0;
  font-weight: 500;
}

.notice-message {
  color: #555;
  font-style: italic;
  font-size: 14px;
  margin-top: 4px;
}

.shared-box .post-header {
  display: flex;
  align-items: center;
  gap: 8px; 
  margin-bottom: 12px;
  justify-content: flex-start; 
}

.shared-box .avatar-small {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0; 
  margin-right: 0; 
}

.shared-box .author-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
  justify-content: center;
  min-width: 0;
}

.shared-box .author-details strong {
  font-size: 14px;
  font-weight: 600;
  color: #1c1e21;
  margin: 0;
  line-height: 1.2;
}

.shared-box .author-details .time {
  font-size: 12px;
  color: #65676b;
  margin: 0;
  line-height: 1.2;
}

/* Right sidebar */
.no-contacts {
  color: #666;
  font-style: italic;
  margin-top: 8px;
}

.find-friends-btn {
  margin-top: 10px;
  padding: 6px 12px;
  background: #1877f2;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.find-friends-btn:hover {
  background: #166fe5;
}

</style>