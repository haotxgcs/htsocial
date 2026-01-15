<template>
  <div class="saved-posts-page">
    <div class="saved-content-wrapper">
    
    <div class="header-section">
      <h2>Saved Posts</h2>
      <p class="saved-count">{{ savedPosts.length }} saved {{ savedPosts.length === 1 ? 'post' : 'posts' }}</p>
    </div>

    <div class="search-saved">
      <input
        v-model="searchInput"
        placeholder="Search saved posts..."
        @input="onInputSearch"
      />

      <span v-if="searchInput" class="clear-icon" @click.stop="clearSearch">
      ✕
      </span>

      <button class="search-btn" @click="applySearch">Search</button>


    </div>

    <div class="content-body">
      <LoadingOverlay v-if="loading" />

    <div v-if="!loading && filteredSavedPosts.length === 0" class="empty-state">
      <img src="../assets/save.png" alt="No saved posts" class="empty-icon" />
      <h2>No Saved Posts</h2>
      <p>Posts you save will appear here</p>
      <button @click="$router.push('/home')" class="browse-btn">Browse Posts</button>
    </div>

    <div v-if="!loading && filteredSavedPosts.length" class="posts-container">
      <div class="post-item card" v-for="post in paginatedSavedPosts" :key="post._id">
        
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

        <!-- 🔗 LINKED ITEMS -->
            <div
              v-if="post.linkedItems && post.linkedItems.length"
              class="linked-items-in-post"
            >
              <div class="linked-items-title">
                🛒 Ingredients & Tools
                <span>({{ post.linkedItems.length }})</span>
              </div>

              <div class="linked-item-card carousel">
                <!-- ITEM -->
                <template v-if="currentItem(post)">
                  <img
                    v-if="currentItem(post).images?.length"
                    :src="`http://localhost:3000/${currentItem(post).images[0]}`"
                    class="linked-item-thumb"
                  />

                  <div class="linked-item-info">
                    <div class="linked-item-title" :title="currentItem(post).title">
                      {{ currentItem(post).title }}
                    </div>

                    <div class="linked-item-meta">
                      {{ currentItem(post).type }}

                      <span
                        v-if="currentItem(post).type === 'tool' && currentItem(post).condition"
                      >
                        · {{ currentItem(post).condition }}
                      </span>

                      

                      
                      <span
                        v-if="currentItem(post).seller?._id === (user._id || user.id)"
                        class="own-item-badge"
                      >
                        YOUR ITEM
                      </span>

                      <button
                      class="view-item-btn"
                      @click="openItem(currentItem(post)._id)"
                    >
                      View item
                    </button>
                    </div>

                    
                  </div>
                </template>

                <!-- ARROWS GROUP -->
                <div
                  v-if="post.linkedItems.length > 1"
                  class="carousel-arrows"
                >
                  <button
                    class="carousel-arrow"
                    :disabled="getItemIndex(post._id) === 0"
                    @click="prevItem(post._id)"
                  >
                    ‹
                  </button>

                  <button
                    class="carousel-arrow"
                    :disabled="getItemIndex(post._id) === post.linkedItems.length - 1"
                    @click="nextItem(post._id)"
                  >
                    ›
                  </button>
                </div>
              </div>

              <div class="carousel-indicator">
                {{ getItemIndex(post._id) + 1 }} / {{ post.linkedItems.length }}
              </div>
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

    <Pagination 
      v-if="totalPages > 1" 
      :current-page="currentPage" 
      :total-pages="totalPages" 
      @update:page="changePage"
    />
  </div>
  </div>
</template>

<script>
import ShareModal from './ShareModal.vue';
import CommentModal from './CommentModal.vue';
import LoadingOverlay from './LoadingOverlay.vue';
import Pagination from './Pagination.vue';

export default {
  name: "SavedPosts",
  components: {
    ShareModal,
    CommentModal,
    LoadingOverlay,
    Pagination
  },
  data() {
    return {
      user: null,
      savedPosts: [],
      loading: true,
      postCommentCounts: {},

        // ✅ SEARCH
      searchInput: '',
      searchQuery: '',

      // ✅ PAGINATION
      currentPage: 1,
      itemsPerPage: 5,
      
      // Comment modal data
      commentModalVisible: false,
      selectedPost: null,
      
      // Share modal data
      showShareModal: false,
      postToShare: null,

      expandedPosts: {},

      itemIndexMap: {},

      

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
      this.currentPage = 1;


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

            openItem(itemId) {
      window.open(`/marketplace/${itemId}`, '_blank');
    },

    getItemIndex(postId) {
  return this.itemIndexMap[postId] ?? 0;
},

  currentItem(post) {
    const index = this.getItemIndex(post._id);
    return post.linkedItems[index] || null;
  },

  nextItem(postId) {
    const current = this.getItemIndex(postId);
    this.$set
      ? this.$set(this.itemIndexMap, postId, current + 1)
      : (this.itemIndexMap[postId] = current + 1);
  },

  prevItem(postId) {
    const current = this.getItemIndex(postId);
    this.$set
      ? this.$set(this.itemIndexMap, postId, current - 1)
      : (this.itemIndexMap[postId] = current - 1);
  },

  changePage(page) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  },

  applySearch() {
    this.searchQuery = this.searchInput.trim();
    this.currentPage = 1;
  },

  clearSearch() {
    this.searchQuery = '';
    this.searchInput = '';
    this.currentPage = 1;
  },

  onInputSearch() {
    if (!this.searchInput.trim()) {
      this.clearSearch();
    }
},



},
  computed: {
    filteredSavedPosts(){
      if (!this.searchQuery.trim()) return this.savedPosts;

      const q = this.searchQuery.toLowerCase();

      return this.savedPosts.filter(post =>
        post.title?.toLowerCase().includes(q) ||
        post.category?.toLowerCase().includes(q) ||
        post.ingredients?.toLowerCase().includes(q) ||
        post.instructions?.toLowerCase().includes(q)
      );
    }, 

    totalPages(){
      return Math.ceil(this.filteredSavedPosts.length / this.itemsPerPage);
    },

    paginatedSavedPosts() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      return this.filteredSavedPosts.slice(
        start,
        start + this.itemsPerPage
      );
    },


    
    },

  watch:{
    searchQuery() {
      this.currentPage = 1;
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
  
/* --- 1. PAGE LAYOUT & RESPONSIVE --- */
.saved-posts-page {
  width: 100%;             /* Chiếm hết chiều rộng */
  min-height: 100vh;
  
  
  /* Sidebar spacing */
  padding-left: 320px; 
  padding-top: 30px; 
  padding-right: 20px;
  
  box-sizing: border-box; 
  font-family: 'Segoe UI', system-ui, sans-serif;
}

.content-body{
  position: relative; /* Để làm mốc cho LoadingOverlay */
  min-height: 200px;
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

/* search saved posts */
.search-saved {
  position: relative; /* Làm mốc tọa độ cho dropdown */
  flex: 1;
  display: flex;
  align-items: center;
}

.search-saved input {
  width: 100%;
  margin-right: 12px;
  padding: 10px 36px 10px 16px; /* Chừa chỗ cho nút X */
  border-radius: 20px; 
  border: 1px solid #eee;
  background: #f9f9f9; 
  outline: none; 
  transition: 0.2s; 
  font-size: 14px;
}

.search-saved input:focus { 
  background: white; 
  border-color: #FF642F; 
  box-shadow: 0 0 0 2px rgba(255, 100, 47, 0.1); 
}

.clear-icon {
  position: absolute;
  right: 130px;
  color: #999;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  padding: 4px;
}
.clear-icon:hover { color: #FF642F; }

.search-btn {
  background: #FF642F; color: white; border: none; 
  border-radius: 20px; padding: 10px 24px; font-weight: 600; cursor: pointer;
  height: 40px; /* Cố định chiều cao cho bằng input */
}



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

/* ================= LINKED ITEMS IN POST ================= */

.linked-items-in-post {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px dashed #e5e7eb;
}

.linked-items-title {
  font-size: 13px;
  font-weight: 700;
  color: #333;
  margin-bottom: 8px;
}

/* ===== CAROUSEL ITEM ===== */

.linked-item-card.carousel {
  position: relative;
  display: flex;
  gap: 10px;
  padding: 10px;
  border: 1px solid #e4e6ea;
  border-radius: 12px;
  background: #fafafa;
}

/* GROUP ARROWS */
.carousel-arrows {
  position: absolute;
  top: 50%;
  right: 10px;
  transform: translateY(-50%);
  display: flex;
  gap: 6px;
}

/* SINGLE ARROW */
.carousel-arrow {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid #e5e7eb;
  background: white;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  color: #374151;
  display: flex;
  align-items: center;
  justify-content: center;
}

.carousel-arrow:hover:not(:disabled) {
  background: #fff7ed;
  border-color: #fb923c;
  color: #ea580c;
}

.carousel-arrow:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.carousel-indicator {
  margin-top: 6px;
  align-self: flex-start;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  background: #f3f4f6;
  padding: 3px 10px;
  border-radius: 999px;
  width: fit-content;
}




/* CHỪA CHỖ BÊN PHẢI CHO ARROW */
.linked-item-info {
  padding-right: 70px;
}


.linked-item-card {
  display: flex;
  gap: 10px;
  padding: 8px;
  border: 1px solid #e4e6ea;
  border-radius: 10px;
  background: #fafafa;
}

.linked-item-thumb {
  width: 42px;
  height: 42px;
  object-fit: cover;
  border-radius: 8px;
  flex-shrink: 0;
}

.linked-item-info {
  flex: 1;
  min-width: 0;
}

.linked-item-title {
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.linked-item-meta {
  font-size: 12px;
  color: #FF642F;
  margin-top: 2px;
}

.own-item-badge {
  margin-left: 6px;
  padding: 2px 6px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 999px;
  background: #e6f9ee;
  color: #15803d;
  text-transform: uppercase;
}

.view-item-btn {
  margin-left:10px;
  padding: 4px 10px;
  font-size: 12px;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  background: white;
  cursor: pointer;
}

.view-item-btn:hover {
  background: #fff7ed;
  border-color: #fb923c;
  color: #ea580c;
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

.search-saved {
  background: white;
  padding: 14px;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.search-saved input {
  width: 100%;
  padding: 10px 16px;
  border-radius: 999px;
  border: 1px solid #eee;
}

.search-saved input:focus {
  outline: none;
  border-color: #FF642F;
}






</style>