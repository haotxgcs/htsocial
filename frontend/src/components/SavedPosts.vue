<template>
  <div class="saved-posts-page">
    <!-- Header -->
    <div class="header">
      <button @click="$router.go(-1)" class="back-btn">
        <img src="../assets/back.png" alt="Back" class="back-icon" />
        Back
      </button>
      <h1>Saved Posts</h1>
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

            <!-- Saved indicator -->
            <div class="saved-indicator">
              <img src="../assets/saved.png" class="saved-icon" />
              <span>Saved</span>
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
            <span v-if="post.likes?.length > 0">{{ post.likes.length }} likes</span>
            <span v-if="getPostCommentCount(post) > 0">{{ getPostCommentCount(post) }} comments</span>
            <span v-if="post.sharesCount > 0">{{ post.sharesCount }} shares</span>
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
            <button @click="unsavePost(post)" class="unsave-btn">
              <img src="../assets/saved.png" class="action-icon" />
              <span>Unsave</span>
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

            <!-- Saved indicator -->
            <div class="saved-indicator">
              <img src="../assets/saved.png" class="saved-icon" />
              <span>Saved</span>
            </div>
          </div>

          <p class="post-text" v-if="post.content"><i>{{ post.content }}</i></p>

          <!-- ======= BÀI GỐC (bên trong share) ======= -->
          <div class="shared-box">
            <template v-if="post.post">
              <!-- Nếu viewer không được xem -->
              <template v-if="!canViewSharedPost(post.post)">
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
                  <span v-if="post.post.likes?.length > 0">{{ post.post.likes.length }} likes</span>
                  <span v-if="getPostCommentCount(post) > 0">{{ getPostCommentCount(post) }} comments</span>
                  <span v-if="post.post.sharesCount > 0">{{ post.post.sharesCount }} shares</span>
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

          <!-- Unsave action for shared post -->
          <div class="shared-post-actions">
            <button @click="unsavePost(post)" class="unsave-btn">
              <img src="../assets/saved.png" class="action-icon" />
              <span>Unsave</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <ShareModal
      v-if="showShareModal"
      :post="postToShare"
      :user="user"
      @close="showShareModal = false"
      @shared="handlePostShared"
    />

    <!-- Comment Modal Component -->
    <CommentModal
      :is-visible="commentModalVisible"
      :post="selectedPost"
      :user="user"
      @close="closeCommentModal"
      @commented="handleCommentAdded"
      @comment-deleted="handleCommentDeleted"
      @liked="handlePostLiked"
      @share="handleSharePost"
      @comment-count-updated="onCommentCountUpdated"
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
        if (!savedUser) {
          this.$router.push("/login");
          return;
        }

        this.loading = true;
        const res = await fetch(`http://localhost:3000/posts/saved-posts/${savedUser.id}`);
        
        if (!res.ok) {
          if (res.status === 404) {
            // Nếu user chưa có saved posts nào
            this.savedPosts = [];
            return;
          }
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        // Đảm bảo data là array
        this.savedPosts = Array.isArray(data) ? data : (data.savedPosts || []);
      } catch (err) {
        console.error("Error fetching saved posts:", err);
        // Chỉ hiển thị alert nếu không phải lỗi 404
        if (!err.message.includes('404')) {
          alert("Unable to fetch saved posts");
        }
        this.savedPosts = [];
      } finally {
        this.loading = false;
      }
    },

    async unsavePost(post) {
      const savedUser = JSON.parse(localStorage.getItem("user"));
      if (!savedUser) return alert("Please login");

      try {
        const res = await fetch(`http://localhost:3000/posts/${post._id}/save`, {
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
          // Remove from saved posts list
          this.savedPosts = this.savedPosts.filter(p => p._id !== post._id);
          alert('Post unsaved successfully');
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
      const post = this.savedPosts.find(p => p._id === data.postId || (p.post && p.post._id === data.postId));
      if (post) {
        if (post.post) {
          post.post.likes = data.likes;
        } else {
          post.likes = data.likes;
        }
      }
    },

    // Share methods
    openShareModal(post) {
      this.postToShare = post;
      this.showShareModal = true;
    },

    handleSharePost(post) {
      this.openShareModal(post);
    },

    handlePostShared() {
      // Có thể refresh hoặc hiển thị thông báo
      console.log('Post shared successfully');
    },

    canViewSharedPost(post) {
      if (!post || !post.author || !this.user) return false;

      const authorId = post.author._id || post.author.id;
      const viewerId = this.user._id || this.user.id;

      const isAuthor = authorId === viewerId;
      const isFriend = post.author.friends?.includes(viewerId);

      switch (post.audience) {
        case 'public':
          return true;
        case 'friends':
          return isAuthor || isFriend;
        case 'private':
          return isAuthor;
        default:
          return false;
      }
    },
    
    getPostAccessMessage(post) {
      if (post.audience === 'private') {
        return 'This post is private';
      } else if (post.audience === 'friends') {
        return 'Only friends of this user can see';
      } else {
        return '';
      }
    }
  },

  mounted() {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      this.user = JSON.parse(savedUser);
      this.fetchSavedPosts();
    } else {
      this.$router.push("/login");
    }
  }
};
</script>

<style scoped>
.saved-posts-page {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f0f2f5;
  min-height: 100vh;
}

.header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px 0;
  border-bottom: 1px solid #ddd;
  background: white;
  border-radius: 10px;
  padding: 16px 20px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  color: #1877f2;
  font-weight: 500;
}

.back-btn:hover {
  color: #166fe5;
}

.back-icon {
  width: 20px;
  height: 20px;
}

.header h1 {
  font-size: 24px;
  font-weight: bold;
  color: #1c1e21;
  margin: 0;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 10px;
}

.empty-icon {
  width: 64px;
  height: 64px;
  opacity: 0.5;
  margin-bottom: 16px;
}

.empty-state h2 {
  font-size: 20px;
  color: #1c1e21;
  margin-bottom: 8px;
}

.empty-state p {
  color: #666;
  margin-bottom: 24px;
}

.browse-btn {
  background: #1877f2;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
}

.browse-btn:hover {
  background: #166fe5;
}

.posts-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.post {
  background: white;
  padding: 16px;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.post-author-info {
  display: flex;
  align-items: center;
}

.post-author-info img {
  width: 40px;
  height: 40px;
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
  font-size: 12px;
  color: #65676b;
  margin-top: 2px;
}

.saved-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #e3f2fd;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 12px;
  color: #1877f2;
  font-weight: 500;
}

.saved-icon {
  width: 16px;
  height: 16px;
}

.post-text {
  margin: 12px 0;
  font-size: 15px;
  line-height: 1.4;
  white-space: pre-line;
  word-wrap: break-word;
}

.post-image, .post-video {
  width: 100%;
  border-radius: 8px;
  margin: 12px 0;
}

.post-stats {
  display: flex;
  gap: 16px;
  margin: 12px 0;
  font-size: 14px;
  color: #65676b;
}

.post-actions {
  display: flex;
  justify-content: space-around;
  padding-top: 12px;
  border-top: 1px solid #e4e6ea;
}

.post-actions button {
  background: none;
  border: none;
  color: #65676b;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.post-actions button:hover {
  background-color: #f2f3f4;
}

.unsave-btn {
  color: #f56565 !important;
}

.unsave-btn:hover {
  background-color: #fef2f2 !important;
}

.action-icon {
  width: 18px;
  height: 18px;
}

/* Shared post styles */
.shared-post {
  border: 1px solid #e4e6ea;
  border-radius: 8px;
  overflow: hidden;
}

.shared-box {
  background: #f8f9fa;
  padding: 12px;
  border-left: 3px solid #1877f2;
  margin-top: 12px;
  border-radius: 6px;
}

.shared-post-actions {
  padding: 12px 16px;
  border-top: 1px solid #e4e6ea;
  background: #fafbfc;
  display: flex;
  justify-content: flex-end;
}

.restricted-post-warning {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: #fef2f2;
  border-radius: 8px;
  border: 1px solid #fed7d7;
}

.avatar-small {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.restricted-content {
  flex: 1;
}

.restricted-content strong {
  font-size: 14px;
  font-weight: 600;
  color: #1c1e21;
  display: block;
  margin-bottom: 4px;
}

.restricted-content .time {
  font-size: 12px;
  color: #65676b;
  margin-bottom: 8px;
}

.notice-message {
  color: #e53e3e;
  font-style: italic;
  font-size: 14px;
}
</style>