<template>
  <div class="saved-posts-page">
    <div class="saved-content-wrapper">
    
    <div class="header-section">
      <h2>Saved Posts</h2>
      <p class="saved-count">{{ savedPosts.length }} saved {{ savedPosts.length === 1 ? 'post' : 'posts' }}</p>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div> <p>Loading saved posts...</p>
    </div>

    <div v-else-if="savedPosts.length === 0" class="empty-state">
      <img src="../assets/save.png" alt="No saved posts" class="empty-icon" />
      <h2>No Saved Posts</h2>
      <p>Posts you save will appear here</p>
      <button @click="$router.push('/home')" class="browse-btn">Browse Posts</button>
    </div>

    <div v-else class="posts-container">
      <div class="post-item card" v-for="post in savedPosts" :key="post._id">
        
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

          <button @click="unsavePost(post)" class="unsave-btn">
            <img src="../assets/saved.png" class="action-icon" />
            <span>Unsave</span>
          </button>
        </div>

        <div class="post-content-wrapper">
          <h3 class="recipe-title">{{ post.title }}</h3>
          <span class="recipe-category">{{ post.category }}</span>

          <div class="recipe-body">
            <div v-if="!expandedPosts[post._id]">
              <p class="recipe-section-header">Ingredients:</p>
              <p class="post-text">{{ getTruncatedText(post.ingredients) }}</p>
            </div>

            <div v-else>
              <p class="recipe-section-header">Ingredients:</p>
              <p class="post-text">{{ post.ingredients }}</p>
              
              <p class="recipe-section-header">Instructions:</p>
              <p class="post-text">{{ post.instructions }}</p>
            </div>
          </div>

          <button 
            v-if="shouldShowReadMore(post)" 
            @click="togglePostContent(post._id)" 
            class="read-more-btn"
          >
            {{ expandedPosts[post._id] ? 'Show Less' : 'Show More' }}
          </button>
          <div v-if="post.media" class="post-media">
          <img v-if="post.mediaType === 'image'" :src="`http://localhost:3000/${post.media}`" class="post-image" />
          <video v-else-if="post.mediaType === 'video'" controls class="post-video">
            <source :src="`http://localhost:3000/${post.media}`" type="video/mp4" />
          </video>
        </div>
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
              <span>{{ post.totalRatings }} ratings</span>
            </div>
          </div>
        </div>

        <div class="post-stats">
          <span v-if="post.likes?.length > 0">{{ post.likes.length }} liked</span>
          <span v-if="getPostCommentCount(post) > 0">{{ getPostCommentCount(post) }} commented</span>
          <span v-if="post.sharesCount > 0">{{ post.sharesCount }} shared</span>
          <span v-if="post?.savesCount > 0">{{ post?.savesCount }} saved</span>
        </div>

        <div class="post-actions">
          <button @click="toggleLike(post)" :class="{ active: isLiked(post) }">
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

  // [MỚI] Hàm cắt ngắn text cho Ingredients khi chưa Show More
    getTruncatedText(text) {
      if (!text) return '';
      const lines = text.split('\n');
      
      // Lấy 3 dòng đầu tiên
      if (lines.length > 3) {
        return lines.slice(0, 3).join('\n') + '...';
      }
      
      // Hoặc lấy 150 ký tự đầu tiên nếu ít dòng nhưng dài
      if (text.length > 150) {
        return text.substring(0, 150) + '...';
      }
      
      return text;
    },

  // [SỬA] Kiểm tra độ dài dựa trên Ingredients + Instructions
    shouldShowReadMore(post) {
      if (!post) return false;
      // Cộng gộp nội dung recipe để tính toán
      const text = (post.ingredients || '') + (post.instructions || '');
      const lines = text.split('\n');
      
      // Hiện nút nếu dài hơn 5 dòng hoặc 200 ký tự
      return lines.length > 5 || text.length > 200;
    },

    togglePostContent(postId) {
          // Cách viết này đảm bảo Vue nhận diện thay đổi tốt hơn
          const newExpanded = { ...this.expandedPosts };
          newExpanded[postId] = !newExpanded[postId];
          this.expandedPosts = newExpanded;
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
  
/* --- 1. PAGE LAYOUT & RESPONSIVE --- */
.saved-posts-page {
  width: 100%;             /* Chiếm hết chiều rộng */
  min-height: 100vh;
  background-color: #fcf8f5; /* ✅ Đặt màu nền ở đây để phủ kín màn hình */
  
  /* Sidebar spacing */
  padding-left: 320px; 
  padding-top: 30px; 
  padding-right: 20px;
  
  box-sizing: border-box; 
  font-family: 'Segoe UI', system-ui, sans-serif;
}

/* 2. LỚP NỘI DUNG: Căn giữa, giới hạn chiều rộng */
.saved-content-wrapper {
  width: 100%;
  max-width: 750px;
  margin: 0 auto; 
  /* Dùng Flexbox để tạo khoảng cách */
  display: flex;
  flex-direction: column;
  /* Khoảng cách giữa các bài viết */
  gap: 24px; 
  padding-bottom: 60px;
}

/* Tablet & Mobile Responsive */
@media (max-width: 1024px) { 
  .saved-posts-page {
    padding-left: 16px;  
    padding-right: 16px;
    padding-top: 80px; /* Tránh header fixed */
    max-width: 100%;
  }
}

/* --- 2. HEADER & EMPTY STATE --- */
.header-section {
  text-align: center; margin-bottom: 24px; padding: 24px;
  background: white; border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05); border: 1px solid #eee; font-weight: 600;
}
.header-section h2 { margin: 0 0 8px 0; font-size: 24px; font-weight: 800; color: #1c1e21; }
.saved-count { margin: 0; font-size: 14px; color: #FF642F; font-weight: 500; }

.loading { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; padding: 60px 0; color: #65676b; }
.spinner { width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #FF642F; border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

.empty-state { text-align: center; padding: 80px 20px; background: white; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
.empty-icon { width: 80px; height: 80px; opacity: 0.4; margin-bottom: 24px; }
.browse-btn { background: #FF642F; color: white; border: none; padding: 12px 24px; border-radius: 20px; cursor: pointer; font-weight: 600; margin-top: 16px; transition: 0.2s; }
.browse-btn:hover { background: #e04f1d; }

/* --- 3. POST ITEM STYLES --- */
.posts-container { display: flex; flex-direction: column; gap: 20px; }

.post-item { 
  background: white; border-radius: 16px; padding: 0; 
  box-shadow: 0 4px 15px rgba(0,0,0,0.03); border: 1px solid #f0f0f0; 
  overflow: visible; /* Để dropdown menu không bị che nếu có */
  
}

/* Post Header */
.post-header { padding: 16px; display: flex; justify-content: space-between; align-items: center; }
.post-author-info { display: flex; align-items: center; flex: 1; }
.post-author-info img { width: 40px; height: 40px; border-radius: 50%; margin-right: 12px; object-fit: cover; border: 1px solid #eee; }
.author-details strong { font-size: 15px; font-weight: 600; color: #1c1e21; display: block; }
.author-details .time { font-size: 12px; color: #999; margin-top: 2px; }

/* Unsave Button Style */
.unsave-btn { 
  display: flex; align-items: center; gap: 6px; padding: 6px 12px; 
  border-radius: 8px; font-size: 13px; font-weight: 600; border: none; 
  background: #fff5eb; color: #FF642F; cursor: pointer; transition: all 0.2s; 
}
.unsave-btn:hover { background: #ffe0d1; }

/* --- 4. RECIPE CONTENT STYLES (NEW) --- */
.post-content-wrapper { padding: 0 16px 12px 16px; }

.recipe-title { 
  font-size: 18px; font-weight: 700; color: #333; margin: 0 0 6px 0; 
}
.recipe-category { 
  display: inline-block; font-size: 12px; font-weight: 600; 
  color: #FF642F; background-color: #FFF0E6; 
  padding: 4px 10px; border-radius: 20px; margin-bottom: 12px; 
}
.recipe-section-header {
  font-weight: 700;
  margin: 20px 0 10px 0;
  font-size: 13px;
  color: #333;
}
.post-text { font-size: 15px; line-height: 1.5; color: #333; margin: 0; white-space: pre-line; }
.read-more-btn { 
  border: none; background: none; color: #FF642F; 
  font-weight: 600; font-size: 13px; cursor: pointer; 
  padding: 0; margin-top: 5px; 
}
.read-more-btn:hover { text-decoration: underline;}

.post-media,
.post-image {
  width: 100%;
  border-radius: 10px;
  margin-top: 10px;
  
  
}



/* CSS MỚI RIÊNG CHO VIDEO ĐỂ TẠO KHUNG VUÔNG GỌN GÀNG */
.post-video {
  width: 100%;
  height:100%;
  /* aspect-ratio: 1 / 1; giúp tạo khung hình vuông */
  aspect-ratio: 1 / 1; 
  
  /* object-fit: contain; đảm bảo video hiển thị đầy đủ không bị cắt, 
     nếu tỷ lệ video khác vuông sẽ có viền đen trên dưới hoặc 2 bên */
  object-fit: cover;
  
  background-color: black; /* Nền đen cho phần viền thừa (nếu có) */
  border-radius: 10px;
  margin-top: 10px;
  
  /* Đảm bảo chiều cao không vượt quá khung vuông */
  height: auto; 
  max-height: 500px; /* Giới hạn chiều cao tối đa nếu màn hình quá rộng */
}

/* Rating */
.rating-statistics { 
  margin: 0 16px 12px 16px; background: #fff9e6; border: 1px solid #ffe9b8; 
  padding: 8px 12px; border-radius: 10px; 
}
.rating-summary { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.average-rating { display: flex; align-items: center; gap: 8px; }
.rating-number { font-size: 18px; font-weight: bold; color: #f57c00; }
.stars-display { display: flex; gap: 2px; }
.star-icon { font-size: 16px; color: #ddd; }
.star-icon.filled { color: #ffc107; }
.rating-count { font-size: 13px; color: #856404; font-weight: 600; }

/* Stats & Actions */
.post-stats { 
  padding: 0 16px 12px; font-size: 13px; color: #65676b; 
  display: flex; gap: 16px; border-bottom: 1px solid #f0f0f0; 
}
.post-actions { display: flex; justify-content: space-around; padding: 8px 0; }
.post-actions button { 
  background: none; border: none; color: #65676b; cursor: pointer; 
  font-weight: 500; font-size: 14px; display: flex; align-items: center; 
  gap: 8px; padding: 8px 12px; border-radius: 8px; transition: all 0.2s; 
  flex: 1; justify-content: center;
}
.post-actions button:hover { background-color: #f2f3f5; color: #FF642F; }
.action-icon { width: 20px; height: 20px; opacity: 0.7; }
</style>