<template>
  <div class="saved-posts-page">
    <!-- Header -->
    <div class="header-section">
      <h2>Saved Posts</h2>
      <p class="saved-count">{{ savedPosts.length }} saved {{ savedPosts.length === 1 ? 'post' : 'posts' }}</p>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="loading">
      <p>Loading saved posts...</p>
    </div>

    <!-- Empty state -->
    <div v-else-if="savedPosts.length === 0" class="empty-state">
      <img src="../assets/save.png" alt="No saved posts" class="empty-icon" />
      <h2>No Saved Posts</h2>
      <p>Posts you save will appear here</p>
      <button @click="$router.push('/home')" class="browse-btn">Browse Posts</button>
    </div>

    <!-- Saved posts list -->
    <div v-else class="posts-container">
      <div class="post" v-for="post in savedPosts" :key="post._id">
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

          <!-- Unsave button -->
          <button @click="unsavePost(post)" class="unsave-btn">
            <img src="../assets/saved.png" class="action-icon" />
            <span>Unsave</span>
          </button>
        </div>

        <p class="post-text">{{ post.content }}</p>

        <!-- Media -->
        <div v-if="post.media" class="post-media">
          <img v-if="post.mediaType === 'image'" :src="`http://localhost:3000/${post.media}`" class="post-image" />
          <video v-else-if="post.mediaType === 'video'" controls class="post-video">
            <source :src="`http://localhost:3000/${post.media}`" type="video/mp4" />
          </video>
        </div>

        <!-- Post stats -->
        <div class="post-stats">
          <span v-if="post.likes?.length > 0">{{ post.likes.length }} liked</span>
          <span v-if="getPostCommentCount(post) > 0">{{ getPostCommentCount(post) }} commented</span>
          <span v-if="post.sharesCount > 0">{{ post.sharesCount }} shared</span>
          <span v-if="post?.savesCount > 0">{{ post?.savesCount }} saved</span>
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
        </div>
      </div>
    </div>

    <!-- Modals -->
    <ShareModal
      v-if="showShareModal && user"
      :post="postToShare"
      :user="user"
      @close="showShareModal = false"
      @shared="handlePostShared"
    />

    <CommentModal
      v-if="user"
      :is-visible="commentModalVisible"
      :post="selectedPost"
      :user="user"
      :initial-save-count="selectedPost?.savesCount || 0"
      @close="closeCommentModal"
      @commented="handleCommentAdded"
      @comment-deleted="handleCommentDeleted"
      @liked="handlePostLiked"
      @share="handleSharePost"
      @comment-count-updated="onCommentCountUpdated"
      @save-count-updated="handleSaveCountUpdated"
    />
  </div>
</template>

<script>
import ShareModal from './ShareModal.vue';
import CommentModal from './CommentModal.vue';

export default {
  name: "SavedPosts",
  components: {
    ShareModal,
    CommentModal
  },
  data() {
    return {
      user: null,
      savedPosts: [],
      loading: true,
      postCommentCounts: {},
      
      // Comment modal data
      commentModalVisible: false,
      selectedPost: null,
      
      // Share modal data
      showShareModal: false,
      postToShare: null,
    }
  },

  methods: {
    getAvatarUrl(author) {
      if (!author || !author.avatar) return 'http://localhost:3000/uploads/user.png';
      return `http://localhost:3000/${author.avatar}`;
    },

    async fetchSavedPosts() {
      try {
        const savedUser = JSON.parse(localStorage.getItem("user"));
        
        if (!savedUser || !savedUser.id) {
          this.$router.push("/login");
          return;
        }

        this.loading = true;
        const res = await fetch(`http://localhost:3000/feeds/saved-items/${savedUser.id}`);
        
        if (!res.ok) {
          if (res.status === 404) {
            this.savedPosts = [];
            return;
          }
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        this.savedPosts = Array.isArray(data) ? data : [];
        
        console.log('Saved posts loaded:', this.savedPosts.length);
        
      } catch (err) {
        console.error("Error fetching saved posts:", err);
        if (!err.message.includes('404')) {
          alert(`Unable to fetch saved posts: ${err.message}`);
        }
        this.savedPosts = [];
      } finally {
        this.loading = false;
      }
    },

    async unsavePost(post) {
      const savedUser = JSON.parse(localStorage.getItem("user"));
      if (!savedUser) return alert("Please login");

      if (!confirm("Remove this post from saved?")) return;

      try {
        const res = await fetch(`http://localhost:3000/feeds/save/${post._id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: savedUser.id,
            action: 'unsave'
          })
        });

        const data = await res.json();
        
        if (res.ok) {
          // Xóa post khỏi danh sách
          this.savedPosts = this.savedPosts.filter(p => p._id !== post._id);
          
          const message = this.savedPosts.length > 0 
            ? `Unsaved successfully. ${this.savedPosts.length} posts remaining.`
            : 'Unsaved successfully. No saved posts remaining.';
          
          alert(message);
        } else {
          alert(data.msg || 'Failed to unsave post');
        }
      } catch (err) {
        console.error("Cannot unsave post:", err);
        alert("Unable to unsave post");
      }
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

    isLiked(post) {
      const savedUser = JSON.parse(localStorage.getItem("user"));
      return post.likes && post.likes.includes(savedUser.id);
    },

    formatTime(dateStr) {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? '' : date.toLocaleString();
    },

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
      
      const postIndex = this.savedPosts.findIndex(p => p._id === data.postId);
      if (postIndex !== -1) {
        this.savedPosts[postIndex].totalComments = data.count;
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
      const post = this.savedPosts.find(p => p._id === data.postId);
      if (post) {
        post.likes = data.likes;
      }
    },

    openShareModal(post) {
      this.postToShare = post;
      this.showShareModal = true;
    },

    handleSharePost(post) {
      this.openShareModal(post);
    },

    handlePostShared() {
      console.log('Post shared successfully');
    }
  },

  created() {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      this.user = JSON.parse(savedUser);
    } else {
      this.$router.push("/login");
    }
  },

  mounted() {
    if (this.user) {
      this.fetchSavedPosts();
    }
  }
};
</script>

<style scoped>
.saved-posts-page {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  min-height: 100vh;
}

.header-section {
  text-align: center;
  margin-bottom: 24px;
  padding: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.header-section h2 {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: bold;
  color: #1c1e21;
}

.saved-count {
  margin: 0;
  font-size: 15px;
  color: #65676b;
  font-weight: 500;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 60px 20px;
  text-align: center;
  color: #65676b;
}

.loading::after {
  content: '';
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #1877f2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.empty-icon {
  width: 80px;
  height: 80px;
  opacity: 0.4;
  margin-bottom: 24px;
}

.empty-state h2 {
  font-size: 24px;
  color: #1c1e21;
  margin-bottom: 12px;
}

.empty-state p {
  color: #65676b;
  font-size: 15px;
  margin-bottom: 32px;
}

.browse-btn {
  background: #1877f2;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  transition: background 0.2s;
}

.browse-btn:hover {
  background: #166fe5;
}

.browse-btn:active {
  transform: scale(0.98);
}

.posts-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.post {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
}

.post:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  transform: translateY(-2px);
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.post-author-info {
  display: flex;
  align-items: center;
  flex: 1;
}

.post-author-info img {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  margin-right: 12px;
  object-fit: cover;
}

.author-details strong {
  font-size: 15px;
  font-weight: 600;
  color: #1c1e21;
  display: block;
}

.author-details .time {
  font-size: 13px;
  color: #65676b;
  margin-top: 4px;
}

.unsave-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  border: none;
  background: #fee;
  color: #d93025;
  cursor: pointer;
  transition: all 0.2s;
}

.unsave-btn:hover {
  background: #fdd;
}

.post-text {
  margin: 16px 0;
  font-size: 15px;
  line-height: 1.5;
  white-space: pre-line;
  word-wrap: break-word;
  color: #1c1e21;
}

.post-media {
  margin: 16px 0;
}

.post-image, .post-video {
  width: 100%;
  border-radius: 10px;
  max-height: 500px;
  object-fit: cover;
}

.post-stats {
  display: flex;
  gap: 16px;
  margin: 16px 0;
  padding-top: 12px;
  border-top: 1px solid #e4e6eb;
  font-size: 14px;
  color: #65676b;
}

.post-actions {
  display: flex;
  justify-content: space-around;
  padding-top: 12px;
  border-top: 1px solid #e4e6eb;
}

.post-actions button {
  background: none;
  border: none;
  color: #65676b;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 8px;
  transition: all 0.2s;
  flex: 1;
  justify-content: center;
}

.post-actions button:hover {
  background-color: #f2f3f5;
}

.action-icon {
  width: 20px;
  height: 20px;
}

@media (max-width: 768px) {
  .saved-posts-page {
    padding: 12px;
  }
  
  .header-section {
    padding: 20px;
  }
  
  .header-section h2 {
    font-size: 24px;
  }
  
  .post {
    padding: 16px;
  }
  
  .post-author-info img {
    width: 36px;
    height: 36px;
  }
  
  .post-actions {
    flex-wrap: wrap;
  }
  
  .post-actions button {
    flex: 1 1 45%;
    min-width: 120px;
  }
}
</style>