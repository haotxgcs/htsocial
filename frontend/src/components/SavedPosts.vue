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

        <!-- Post Content with Show More/Less -->
<div class="post-text-container">
  <div :class="{ 'content-collapsed': shouldShowReadMore(post) && !expandedPosts[post._id] }" class="post-text">
    {{ getDisplayedContent(post) }}
  </div>
  <button 
    v-if="shouldShowReadMore(post)" 
    @click="togglePostContent(post._id)" 
    class="read-more-btn"
  >
    {{ expandedPosts[post._id] ? 'Show Less' : 'Show More' }}
  </button>

  <!-- Recipe content if exists -->
  <div v-if="post.recipeName" class="recipe-content">
    <h4 class="recipe-title">{{ post.recipeName }}</h4>
    <div v-if="post.ingredients" class="recipe-section">
      <strong>Ingredients:</strong>
      <p class="recipe-text">{{ post.ingredients }}</p>
    </div>
    <div v-if="post.instructions" class="recipe-section">
      <strong>Instructions:</strong>
      <p class="recipe-text">{{ post.instructions }}</p>
    </div>
  </div>
</div>

        <!-- Media -->
        <div v-if="post.media" class="post-media">
          <img v-if="post.mediaType === 'image'" :src="`http://localhost:3000/${post.media}`" class="post-image" />
          <video v-else-if="post.mediaType === 'video'" controls class="post-video">
            <source :src="`http://localhost:3000/${post.media}`" type="video/mp4" />
          </video>
        </div>

        <div v-if="post.totalRatings > 0" class="rating-statistics">
          <div class="rating-summary">
            <div class="average-rating">
              <span class="rating-number">{{ post.averageRating }}</span>
              <div class="stars-display">
                <span v-for="star in 5" :key="star" class="star-icon" :class="{ filled: star <= Math.round(post.averageRating) }">★</span>
              </div>
            </div>
            <div class="rating-count">
              <span>{{ post.totalRatings }} rating{{ post.totalRatings > 1 ? 's' : '' }}</span>
            </div>
          </div>
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
      @save-status-changed="handleSaveStatusChanged"
      @rating-updated="handleRatingUpdated"
      
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

      expandedPosts: {},
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

    handleRatingUpdated(data) {
    console.log('Rating updated:', data);
    
    // Tìm post trong savedPosts và cập nhật rating
    const postIndex = this.savedPosts.findIndex(p => p._id === data.postId);
    if (postIndex !== -1) {
      this.savedPosts[postIndex].totalRatings = data.totalRatings;
      this.savedPosts[postIndex].averageRating = data.averageRating;
      
      // Force Vue to re-render bằng cách tạo new array reference
      this.savedPosts = [...this.savedPosts];
    }
    
    // Cập nhật selectedPost nếu đang mở modal
    if (this.selectedPost && this.selectedPost._id === data.postId) {
      this.selectedPost.totalRatings = data.totalRatings;
      this.selectedPost.averageRating = data.averageRating;
    }
  },

  handleCommentAdded(comment) {
    console.log('Comment added:', comment);
    
    // Nếu comment có rating, fetch lại data để cập nhật
    if (comment.rating && comment.rating > 0) {
      this.fetchSavedPosts();
    }
  },

  handleCommentDeleted(commentId) {
    console.log('Comment deleted:', commentId);
    
    // Fetch lại để cập nhật rating nếu comment bị xóa có rating
    this.fetchSavedPosts();
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
    },

    handleSaveStatusChanged(data) {
    console.log('Save status changed:', data);
    if (!data.isSaved) {
      // User đã unsave, xóa khỏi danh sách
      this.savedPosts = this.savedPosts.filter(p => p._id !== data.postId);
      
      const message = this.savedPosts.length > 0
        ? `Unsaved successfully. ${this.savedPosts.length} posts remaining.`
        : 'Unsaved successfully. No saved posts remaining.';
      
      alert(message);
    }
  },

  shouldShowReadMore(post) {
  if (!post || !post.content) return false;
  const lineCount = post.content.split('\n').length;
  return lineCount > 10;
},

getDisplayedContent(post) {
  if (!post || !post.content) return '';
  if (!this.shouldShowReadMore(post) || this.expandedPosts[post._id]) {
    return post.content;
  }
  const lines = post.content.split('\n');
  return lines.slice(0, 10).join('\n');
},

togglePostContent(postId) {
  this.expandedPosts[postId] = !this.expandedPosts[postId];
},
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
  padding-left: 320px; 
  padding-top: 30px; 
  padding-right: 40px;
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
  border-top: 4px solid #FF642F; /* Màu chính */
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
  background: #FF642F;
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
  background: #FF642F;
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
  background: #ffe6e6;
  color: #FF642F;
  cursor: pointer;
  transition: all 0.2s;
}

.unsave-btn:hover {
  background: #fdd;
}

/* Thay thế .post-text cũ */
.post-text-container {
  margin: 16px 0;
}

.post-text {
  font-size: 15px;
  line-height: 1.5;
  white-space: pre-line;
  word-wrap: break-word;
  color: #1c1e21;
}

.content-collapsed {
  position: relative;
  max-height: none;
  overflow: hidden;
}

.read-more-btn {
  background: none;
  border: none;
  color: #FF642F;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  padding: 4px 0;
  margin-top: 4px;
  display: inline-block;
  transition: all 0.2s ease;
  font-style: italic;
  font-weight: lighter;
}

.read-more-btn:hover {
  color: #FF642F;
  text-decoration: underline;
}

/* Recipe Content Styles */
.recipe-content {
  background: #f8f9fa;
  border: 1px solid #e3e6ea;
  border-radius: 12px;
  padding: 16px;
  margin-top: 12px;
}

.recipe-title {
  color: #1c1e21;
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 12px 0;
  border-bottom: 1px solid #e3e6ea;
  padding-bottom: 8px;
}

.recipe-section {
  margin-bottom: 12px;
}

.recipe-section:last-child {
  margin-bottom: 0;
}

.recipe-section strong {
  color: #FF642F;
  font-size: 14px;
  font-weight: 600;
  display: block;
  margin-bottom: 6px;
}

.recipe-text {
  font-size: 14px;
  line-height: 1.5;
  color: #1c1e21;
  margin: 0;
  white-space: pre-line;
  word-wrap: break-word;
  background: white;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #e3e6ea;
}

/* Rating Statistics */
.rating-statistics {
  background: linear-gradient(135deg, #fff9e6 0%, #ffe9b8 100%);
  border: 1px solid #ffd966;
  border-radius: 12px;
  padding: 12px 16px;
  margin: 12px 0;
}

.rating-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.average-rating {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rating-number {
  font-size: 28px;
  font-weight: bold;
  color: #f57c00;
}

.stars-display {
  display: flex;
  gap: 2px;
}

.star-icon {
  font-size: 18px;
  color: #ddd;
}

.star-icon.filled {
  color: #ffc107;
}

.rating-count {
  font-size: 14px;
  color: #856404;
  font-weight: 600;
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

@media (max-width: 1024px) { 
  
  .saved-posts-page {
    padding-left: 0;  /* Trên màn hình nhỏ/mobile thì bỏ khoảng trống này đi */
    padding-right: 0;
    padding-top: 60px; /* Đẩy xuống một chút nếu có header fixed trên mobile */
  }
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