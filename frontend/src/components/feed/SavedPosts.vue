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
      <img src="@/assets/save.png" alt="No saved posts" class="empty-icon" />
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
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" 
              viewBox="0 0 24 24" :fill=" '#FFFF00'" :stroke="'#FFFF00'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bookmark-icon lucide-bookmark"><path d="M17 3a2 2 0 0 1 2 2v15a1 1 0 0 1-1.496.868l-4.512-2.578a2 2 0 0 0-1.984 0l-4.512 2.578A1 1 0 0 1 5 20V5a2 2 0 0 1 2-2z"/>
            </svg>
            <span>Unsave</span>
          </button>
        </div>

        <div class="post-content-wrapper">
          <h3 class="recipe-title">{{ post.title }}</h3>
          <span class="recipe-category">{{ post.category }}</span>

          <div class="recipe-body">
               <template v-if="!expandedPosts[post._id]">
              <p class="recipe-section-header">Ingredients:</p>
              <p class="post-text">{{ getCollapsedContent(post).ingredients }}</p>
              <template v-if="getCollapsedContent(post).showInstructions">
                <p class="recipe-section-header">Instructions:</p>
                <p class="post-text">{{ getCollapsedContent(post).instructions }}</p>
              </template>
            </template>
            <template v-else>
              <p class="recipe-section-header">Ingredients:</p>
              <p class="post-text">{{ post.ingredients }}</p>
              <p class="recipe-section-header">Instructions:</p>
              <p class="post-text">{{ post.instructions }}</p>
            </template>
          </div>

          <button 
            v-if="shouldShowReadMore(post)" 
            @click="togglePostContent(post._id)" 
            class="read-more-btn"
          >
            {{ expandedPosts[post._id] ? 'Show Less' : 'Show More' }}
          </button>
          <div v-if="post.media" class="post-media">
          <img v-if="post.mediaType === 'image'" :src="resolveMediaUrl(post.media)" class="post-image" />
          <video v-else-if="post.mediaType === 'video'" controls class="post-video">
            <source :src="resolveMediaUrl(post.media)" type="video/mp4" />
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
                    :src="getItemImage(currentItem(post).images)"
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
              <span>{{ post.totalRatings }} {{ post.totalRatings > 1 ? 'ratings' : 'rating' }}</span>
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
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" 
              :fill="isLiked(post) ? '#FF4444' : 'none'" :stroke="isLiked(post) ? '#FF4444' : 'currentColor'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heart-icon lucide-heart"><path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/>
            </svg>
            <span>Like</span>
          </button>
          <button @click="openCommentModal(post)">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-message-circle-more-icon lucide-message-circle-more"><path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"/><path d="M8 12h.01"/><path d="M12 12h.01"/><path d="M16 12h.01"/></svg>
            <span>Comment</span>
          </button>
          <button @click="openShareModal(post)">
             <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-share2-icon lucide-share-2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg>
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

    <NotificationModal 
      :is-visible="notification.visible" 
      :type="notification.type" 
      :title="notification.title" 
      :message="notification.message" 
      @confirm="closeNotify" 
    />

  <ConfirmDialog 
    v-if="confirmVisible" 
    :message="confirmMessage" 
    @confirm="handleConfirmedAction" 
    @cancel="confirmVisible = false" 
  />
  </div>
  </div>
</template>

<script>
import ShareModal from '../feed/ShareModal.vue';
import CommentModal from '../feed/CommentModal.vue';
import LoadingOverlay from '../layout/LoadingOverlay.vue';
import Pagination from '../layout/Pagination.vue';
import NotificationModal from '../notifications/NotificationModal.vue';
import ConfirmDialog from '../common/ConfirmDialog.vue';

export default {
  name: "SavedPosts",
  components: {
    ShareModal,
    CommentModal,
    LoadingOverlay,
    Pagination,
    NotificationModal,
    ConfirmDialog
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

      notification: {
        visible: false,
        type: 'success', // 'success', 'error', 'warning'
        title: '',
        message: ''
      },

      // confirm modal
      openMenuId: null,
      confirmVisible: false,
      confirmMessage: '',
      pendingConfirmMsg: null,
      pendingConfirmAction: null,
      pendingPost: null
      

    }
  },

  methods: {
    getItemImage(images) {
      if (!images?.length) return "";
      const img = images[0];
      return img.startsWith("http") ? img : `http://localhost:3000/${img}`;
    },

    getAvatarUrl(author) {
      if (!author || !author.avatar) return 'http://localhost:3000/uploads/user.png';
      if (author.avatar.startsWith('http')) return author.avatar;
      return `http://localhost:3000/${author.avatar}`;
    },

    resolveMediaUrl(media) {
      if (!media) return '';
      if (media.startsWith('http')) return media;
      return `http://localhost:3000/${media}`;
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
          this.showNotify("error", "Error", `Unable to fetch saved posts: ${err.message}`);
        }
        this.savedPosts = [];
      } finally {
        this.loading = false;
      }
    },

    async unsavePost(post) {
      this.pendingConfirmAction = 'unsave';
      this.pendingPost = post;
      this.confirmMessage = "Remove this post from saved?";
      this.confirmVisible = true;
    },

    async _unsavePost(post) {
      const savedUser = JSON.parse(localStorage.getItem("user"));
      if (!savedUser) return alert("Please login");
      this.currentPage = 1;

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
          
          this.showNotify("success", "Success", message);
        } else {
          this.showNotify("error", "Error", data.msg || 'Failed to unsave post');
        }
      } catch (err) {
        console.error("Cannot unsave post:", err);
        this.showNotify("error", "Error", "Unable to unsave post");
      }
    },

    handleConfirmedAction() {
      this.confirmVisible = false;
      const action = this.pendingConfirmAction;
      const post = this.pendingPost;
      this.pendingConfirmAction = null;
      this.pendingConfirmMsg    = null;
      this.pendingPost = null;
 
      if (action === 'unsave')         this._unsavePost(post);
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
        this.showNotify("error", "Error", "Unable to like this post");
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
      
      this.showNotify("success", "Success", message);
    }
  },

  // Hàm cắt ngắn text
    getTruncatedText(text) {
      if (!text) return '';
      const lines = text.split('\n');
      if (lines.length > 3) return lines.slice(0, 3).join('\n') + '...';
      if (text.length > 150) return text.substring(0, 150) + '...';
      return text;
    },

    getCollapsedContent(post) {
      if (!post) return { ingredients: '', instructions: '', showInstructions: false };
      const MAX_LINES = 3;
      const MAX_CHARS = 150;
      const ingLines = (post.ingredients || '').split('\n');
      let ingredients = post.ingredients || '';
      let truncated = false;
      if (ingLines.length > MAX_LINES) {
        ingredients = ingLines.slice(0, MAX_LINES).join('\n') + '...';
        truncated = true;
      } else if (ingredients.length > MAX_CHARS) {
        ingredients = ingredients.substring(0, MAX_CHARS) + '...';
        truncated = true;
      }
      const hasInstructions = !!(post.instructions?.trim());
      let instructions = post.instructions || '';
      if (hasInstructions && truncated) {
        const instLines = instructions.split('\n');
        instructions = instLines.slice(0, 2).join('\n');
        if (instLines.length > 2 || instructions.length > 100)
          instructions = instructions.substring(0, 100) + '...';
      }
      return { ingredients, instructions, showInstructions: hasInstructions };
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

  showNotify(type, title, message) {
      this.notification.type = type;
      this.notification.title = title;
      this.notification.message = message;
      this.notification.visible = true;
    },

    closeNotify() {
      this.notification.visible = false;
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

/* ── PAGE LAYOUT ── */
.saved-posts-page {
  width: 100%;
  min-height: 100vh;
  padding-left: 320px;
  padding-top: 30px;
  padding-right: 20px;
  box-sizing: border-box;
  font-family: 'Segoe UI', system-ui, sans-serif;
  background: var(--bg-body);
  transition: background-color 0.3s;
  margin-bottom: 20px;
}

.content-body {
  position: relative;
  min-height: 200px;
}

.saved-content-wrapper {
  width: 100%;
  max-width: 750px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

@media (max-width: 1024px) {
  .saved-posts-page {
    padding-left: 16px;
    padding-right: 16px;
    padding-top: 80px;
    max-width: 100%;
  }
}

/* ── HEADER ── */
.header-section {
  text-align: center; margin-bottom: 24px; padding: 24px;
  background: var(--bg-card); border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  border: 1px solid var(--border-color);
  font-weight: 600;
  transition: background-color 0.3s;
}
.header-section h2 {
  margin: 0 0 8px 0; font-size: 24px; font-weight: 800;
  color: var(--text-main);
}
.saved-count { margin: 0; font-size: 14px; color: #FF642F; font-weight: 500; }

/* ── SEARCH ── */
.search-saved {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  background: var(--bg-card);
  padding: 14px;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  border: 1px solid var(--border-color);
  transition: background-color 0.3s;
}

.search-saved input {
  width: 100%;
  margin-right: 12px;
  padding: 10px 36px 10px 16px;
  border-radius: 20px;
  border: 1px solid var(--border-color);
  background: var(--bg-input);
  color: var(--text-main);
  outline: none;
  transition: 0.2s;
  font-size: 14px;
}
.search-saved input:focus {
  background: var(--bg-card);
  border-color: #FF642F;
  box-shadow: 0 0 0 2px rgba(255,100,47,0.1);
}
.search-saved input::placeholder { color: var(--text-sub); }

.clear-icon {
  position: absolute; right: 130px;
  color: var(--text-sub); cursor: pointer;
  font-size: 14px; font-weight: bold; padding: 4px;
}
.clear-icon:hover { color: #FF642F; }

.search-btn {
  background: #FF642F; color: white; border: none;
  border-radius: 20px; padding: 10px 24px;
  font-weight: 600; cursor: pointer; height: 40px;
  transition: 0.2s;
}
.search-btn:hover { background: #e05522; }

/* ── EMPTY STATE ── */
.empty-state {
  text-align: center; padding: 80px 20px;
  background: var(--bg-card); border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  border: 1px solid var(--border-color);
}
.empty-icon { width: 80px; height: 80px; opacity: 0.4; margin-bottom: 24px; }
.browse-btn {
  background: #FF642F; color: white; border: none;
  padding: 12px 24px; border-radius: 20px;
  cursor: pointer; font-weight: 600; margin-top: 16px; transition: 0.2s;
}
.browse-btn:hover { background: #e04f1d; }

/* ── POSTS ── */
.posts-container { display: flex; flex-direction: column; gap: 20px; }

.post-item {
  background: var(--bg-card); border-radius: 16px; padding: 0;
  box-shadow: 0 4px 15px rgba(0,0,0,0.04);
  border: 1px solid var(--border-color);
  overflow: visible;
  transition: background-color 0.3s;
}

/* Post Header */
.post-header {
  padding: 16px; display: flex;
  justify-content: space-between; align-items: center;
}
.post-author-info { display: flex; align-items: center; flex: 1; }
.post-author-info img {
  width: 40px; height: 40px; border-radius: 50%;
  margin-right: 12px; object-fit: cover;
  border: 1px solid var(--border-color);
}
.author-details strong {
  font-size: 15px; font-weight: 600;
  color: var(--text-main); display: block;
}
.author-details .time { font-size: 12px; color: var(--text-sub); margin-top: 2px; }

.unsave-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 12px; border-radius: 8px;
  font-size: 13px; font-weight: 600; border: none;
  background: var(--hover-primary); color: #FF642F;
  cursor: pointer; transition: all 0.2s;
}
.unsave-btn:hover { filter: brightness(0.95); }

/* ── RECIPE CONTENT ── */
.post-content-wrapper { padding: 0 16px 12px 16px; }

.recipe-title { font-size: 18px; font-weight: 700; color: var(--text-main); margin: 0 0 6px 0; }
.recipe-category {
  display: inline-block; font-size: 12px; font-weight: 600;
  color: #FF642F; background-color: var(--hover-primary);
  padding: 4px 10px; border-radius: 20px; margin-bottom: 12px;
}
.recipe-section-header { font-weight: 700; margin: 20px 0 10px 0; font-size: 13px; color: var(--text-main); }
.post-text { font-size: 15px; line-height: 1.5; color: var(--text-main); margin: 0; white-space: pre-line; }

.read-more-btn {
  border: none; background: none; color: #FF642F;
  font-weight: 600; font-size: 13px; cursor: pointer;
  padding: 0; margin-top: 5px;
}
.read-more-btn:hover { text-decoration: underline; }

.post-media, .post-image {
  width: 100%; max-height: 500px; object-fit: cover;
  border-radius: 12px; margin-top: 10px; display: block;
}
.post-video {
  width: 100%; max-height: 300px; object-fit: contain;
  border-radius: 8px; background-color: black;
}

/* ── LINKED ITEMS ── */
.linked-items-in-post {
  margin-top: 14px; padding-top: 12px;
  border-top: 1px dashed var(--border-color);
}
.linked-items-title { font-size: 13px; font-weight: 700; color: var(--text-main); margin-bottom: 8px; }

.linked-item-card.carousel {
  position: relative; display: flex; gap: 10px;
  padding: 10px; border: 1px solid var(--border-color);
  border-radius: 12px; background: var(--bg-input);
}
.carousel-arrows {
  position: absolute; top: 50%; right: 10px;
  transform: translateY(-50%); display: flex; gap: 6px;
}
.carousel-arrow {
  width: 28px; height: 28px; border-radius: 50%;
  border: 1px solid var(--border-color);
  background: var(--bg-card); cursor: pointer;
  font-size: 16px; font-weight: bold; color: var(--text-main);
  display: flex; align-items: center; justify-content: center;
  transition: 0.2s;
}
.carousel-arrow:hover:not(:disabled) {
  background: var(--hover-primary); border-color: #fb923c; color: #ea580c;
}
.carousel-arrow:disabled { opacity: 0.3; cursor: not-allowed; }

.carousel-indicator {
  margin-top: 6px; align-self: flex-start;
  font-size: 12px; font-weight: 600; color: var(--text-sub);
  background: var(--bg-input); padding: 3px 10px;
  border-radius: 999px; width: fit-content;
}

.linked-item-info { padding-right: 70px; flex: 1; min-width: 0; }
.linked-item-card {
  display: flex; gap: 10px; padding: 8px;
  border: 1px solid var(--border-color);
  border-radius: 10px; background: var(--bg-input);
}
.linked-item-thumb {
  width: 42px; height: 42px; object-fit: cover;
  border-radius: 8px; flex-shrink: 0;
}
.linked-item-title {
  font-size: 14px; font-weight: 600; color: var(--text-main);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.linked-item-meta { font-size: 12px; color: #FF642F; margin-top: 2px; }

.own-item-badge {
  margin-left: 6px; padding: 2px 6px; font-size: 11px;
  font-weight: 600; border-radius: 999px;
  background: #e6f9ee; color: #15803d; text-transform: uppercase;
}

.view-item-btn {
  margin-left: 10px; padding: 4px 10px; font-size: 12px;
  border-radius: 999px; border: 1px solid var(--border-color);
  background: var(--bg-card); color: var(--text-main); cursor: pointer;
  transition: 0.2s;
}
.view-item-btn:hover { background: var(--hover-primary); border-color: #fb923c; color: #ea580c; }

/* ── RATING ── */
.rating-statistics {
  margin: 0 16px 12px 16px;
  background: var(--hover-primary);
  border: 1px solid var(--border-color);
  padding: 8px 12px; border-radius: 10px;
}
.rating-summary { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.average-rating { display: flex; align-items: center; gap: 8px; }
.rating-number { font-size: 18px; font-weight: bold; color: #f57c00; }
.stars-display { display: flex; gap: 2px; }
.star-icon { font-size: 16px; color: var(--border-color); }
.star-icon.filled { color: #ffc107; }
.rating-count { font-size: 13px; color: var(--text-sub); font-weight: 600; }

/* ── STATS & ACTIONS ── */
.post-stats {
  padding: 0 16px 12px; font-size: 13px; color: var(--text-sub);
  display: flex; gap: 16px; border-bottom: 1px solid var(--border-color);
}
.post-actions { display: flex; justify-content: space-around; padding: 8px 0; }
.post-actions button {
  background: none; border: none; color: var(--text-sub); cursor: pointer;
  font-weight: 500; font-size: 14px; display: flex; align-items: center;
  gap: 8px; padding: 8px 12px; border-radius: 8px; transition: all 0.2s;
  flex: 1; justify-content: center;
}
.post-actions button:hover { background-color: var(--hover-bg); color: #FF642F; }
.action-icon { width: 20px; height: 20px; opacity: 0.7; }

@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
</style>