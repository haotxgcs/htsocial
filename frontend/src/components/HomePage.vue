<template>
  <div class="homepage">
    <main class="feed">
      
      <div class="top-header-section">
        <div class="search-container" v-click-outside="closeHistory">
          <div class="input-wrapper">
            <input 
              type="text" 
              v-model="searchQuery" 
              placeholder="Search for recipes..." 
              @keyup.enter="handleSearch" 
              @focus="openHistory"
            />
            
            <span v-if="searchQuery" class="clear-icon" @click="clearSearch">
              ✕
            </span>

            <div v-if="showHistory && searchHistory.length > 0" class="history-dropdown">
              <div class="history-header">
                <span>Recent</span>
                <span class="clear-all" @click.stop="clearAllHistory">Clear All</span>
              </div>
              <ul class="history-list">
                <li v-for="(item, index) in searchHistory" :key="index" @click="selectHistory(item)">
                  <div class="history-item-content">
                    <span class="clock-icon">🕒</span>
                    <span class="history-text">{{ item }}</span>
                  </div>
                  <span class="delete-item" @click.stop="removeHistoryItem(index)">✕</span>
                </li>
              </ul>
            </div>
          </div>

          <button class="search-btn" @click="handleSearch">Search</button>
        </div>

        <div class="filter-container" @wheel.prevent="handleFilterScroll">
          <button 
            v-for="cat in categories" 
            :key="cat"
            class="filter-pill"
            :class="{ active: selectedCategory === cat }" 
            @click="selectCategory(cat)"
          >
            {{ cat }}
          </button>
        </div>
      </div>

      <div v-if="!finalSearchQuery" class="create-post">
        <h3>Create your post</h3>
        <input type="text" @click="openCreatePostModal" :placeholder="`What's on your mind, ${user?.firstname } ${user?.lastname}?`"/>
      </div>

      <div v-if="finalSearchQuery && searchedUsers.length > 0" class="search-results-section">
        <h3 class="section-title">People ({{searchedUsers.length }}) </h3>
        <div class="user-results-list">
          <div v-for="u in searchedUsers" :key="u._id" class="user-result-card">
            <div class="user-info-left">
              <img :src="getAvatarUrl(u)" class="avatar" />
              <div class="user-details">
                <span class="user-fullname">{{ u.firstname }} {{ u.lastname }}</span>
                <span class="username">@{{ u.username}}</span>
              </div>
            </div>
            <button class="view-profile-btn" @click="$router.push(`/profile/${u._id}`)">View Profile</button>
          </div>
        </div>
      </div>
      

      <div class="posts-section">
        <h3 v-if="finalSearchQuery && filteredPosts.length > 0" class="section-title">Posts ({{ filteredPosts.length }})</h3>

        <div v-if="finalSearchQuery && filteredPosts.length === 0 && searchedUsers.length === 0" class="no-posts-container">
          <p>No results found for "<strong>{{ finalSearchQuery }}</strong>"</p>
          <button @click="resetFilter" class="clear-filter-btn">Clear Search</button>
        </div>

        <div v-if="finalSearchQuery && filteredPosts.length === 0 && searchedUsers.length > 0" class="no-posts-container" style="margin-top: 10px;">
          <p>No posts found.</p>
        </div>

        <div v-if="!finalSearchQuery && filteredPosts.length === 0" class="no-posts-container">
          <p>No posts found matching "<strong>{{ selectedCategory }}</strong>"</p>
          <button @click="resetFilter" class="clear-filter-btn">View All Posts</button>
        </div>

        <div v-for="post in paginatedPosts" :key="post._id" class="feed-item">
  
          <div v-if="post.type === 'post'" class="post">
            <div class="post-header">
              <div class="post-author-info">
                <img :src="getAvatarUrl(post.author)" alt="avatar" @click="$router.push(`/profile/${post.author._id}`)"
/>
                <div class="author-details" @click="$router.push(`/profile/${post.author._id}`)">
                  <strong>{{ post.author?.firstname }} {{ post.author?.lastname }}</strong>
                  <p class="time">
                    {{ formatTime(post.createdAt) }}
                    <span v-if="post.audience === 'public'" title="Public">🌍</span>
                    <span v-else-if="post.audience === 'friends'" title="Friends">👥</span>
                    <span v-else title="Private">🔒</span>
                  </p>
                </div>
              </div>
              <div class="post-menu-wrapper" v-click-outside="closeAllMenus">
                <img src="../assets/menu.png" class="menu-post-icon" @click.stop="toggleMenu(post._id)" />
                <div v-if="openMenuId === post._id" class="dropdown-menu" @click.stop>
                  <button v-if="isMyPost(post)" @click="editPost(post)"><img src="../assets/edit.png"/> Edit Post</button>
                  <button v-if="!isMyPost(post)" @click="hideThisPost(post._id)"><img src="../assets/hide.png"/> Hide Post</button>
                  <button v-if="isMyPost(post)" @click="deletePost(post._id)" style="color: red"><img src="../assets/delete.png"/> Delete Post</button>
                </div>
              </div>
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
              <video v-else controls class="post-video"><source :src="`http://localhost:3000/${post.media}`" /></video>
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
                <div class="rating-count"><span>{{ post.totalRatings }} rating{{ post.totalRatings > 1 ? 's' : '' }}</span></div>
              </div>
            </div>

            <div class="post-stats">
              <span v-if="post.likes?.length > 0">{{ post.likes.length }} liked</span>
              <span v-if="getPostCommentCount(post) > 0">{{ getPostCommentCount(post) }} commented</span>
              <span v-if="post.sharesCount > 0">{{ post.sharesCount }} shared</span>
              <span v-if="getPostSaveCount(post) > 0">{{ getPostSaveCount(post) }} saved</span>
            </div>

            <div class="post-actions">
              <button @click="toggleLike(post)" :class="{ active: isLiked(post) }" class="like-btn">
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
              <button @click="toggleSavePost(post)" :class="{ active: isSaved(post) }" class="save-btn">
                <img :src="isSaved(post) ? require('../assets/saved.png') : require('../assets/save.png')" class="action-icon" />
                <span>{{ isSaved(post) ? 'Saved' : 'Save' }}</span>
              </button>
            </div>
          </div>

          <div v-else-if="post.type === 'share'" class="post shared-post">

          <div class="post-header">
            <div class="post-author-info">
              <img :src="getAvatarUrl(post.username)" alt="avatar" @click="$router.push(`/profile/${post.username._id}`)"/>
              <div class="author-details" @click="$router.push(`/profile/${post.username._id}`)">
                <strong>{{ post.username?.firstname }} {{ post.username?.lastname }}</strong>
                
                <p class="time">
                  {{ formatTime(post.createdAt) }} • Shared a post
                  
                  <span v-if="post.audience === 'public'" title="Public" style="margin-left: 4px;">🌍</span>
                  <span v-else-if="post.audience === 'friends'" title="Friends" style="margin-left: 4px;">👥</span>
                  <span v-else-if="post.audience === 'private'" title="Private" style="margin-left: 4px;">🔒</span>
                </p>
                </div>
            </div>

            <div class="post-menu-wrapper" v-click-outside="closeAllMenus">
              <img src="../assets/menu.png" class="menu-post-icon" @click.stop="toggleMenu(post._id)" />
              <div v-if="openMenuId === post._id" class="dropdown-menu" @click.stop>
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

          <div v-if="post.content" class="post-content-wrapper">
            <p class="post-text" :class="{ 'content-collapsed': shouldShowReadMore(post) && !expandedPosts[post._id] }">
              <i>{{ getDisplayedContent(post, post._id) }}</i>
            </p>
            <button 
              v-if="shouldShowReadMore(post)" 
              @click="togglePostContent(post._id)" 
              class="read-more-btn"
            >
              {{ expandedPosts[post._id] ? 'Show Less' : 'Show More' }}
            </button>
          </div>

          
          <div class="shared-content-box">
                <template v-if="post.post">
                   
                   <template v-if="post.canViewPost === false">
                      <div class="origin-post-author-info">
                        <img :src="getAvatarUrl(post.post.author)" alt="avatar" @click="$router.push(`/profile/${post.post.author._id}`)"/>
                        <div class="origin-author-details" @click="$router.push(`/profile/${post.post.author._id}`)">
                          <strong>{{ post.post.author.firstname }} {{ post.post.author.lastname }}</strong>
                          
                          <p class="origin-post-time">
                            {{ formatTime(post.post.createdAt) }}
                            
                            <span v-if="post.post.audience === 'friends'">👥</span>
                            <span v-else-if="post.post.audience === 'private'">🔒</span>
                          </p>
                          </div>
                      </div>
                        <p class="notice-message">{{ getPostAccessMessage(post.post) }}</p>
                   </template>

                   <template v-else>
                      <div class="post-header small origin-post">
                          <div class="post-author-info">
                            <img :src="getAvatarUrl(post.post.author)" class="avatar-small" @click="$router.push(`/profile/${post.post.author._id}`)"/>
                            <div class="author-details" @click="$router.push(`/profile/${post.post.author._id}`)">
                                <strong>{{ post.post.author.firstname }} {{ post.post.author.lastname }}</strong>
                                <p class="time">
                                  {{ formatTime(post.post.createdAt) }}
                                  <span v-if="post.post.audience === 'public'" title="Public">🌍</span>
                                  <span v-else-if="post.post.audience === 'friends'" title="Friends">👥</span>
                                  <span v-else-if="post.post.audience === 'private'" title="Private">🔒</span>
                                </p>
                            </div>
                          </div>
                      </div>

                      <div class="post-content-wrapper">
                          <h3 class="recipe-title small">{{ post.post.title }}</h3>
                          <span class="recipe-category small">{{ post.post.category }}</span>

                          <div class="recipe-body">
                             <div v-if="!expandedPosts[post._id + '_shared']">
                                <p class="recipe-section-header">Ingredients:</p>
                                <p class="post-text">{{ getTruncatedText(post.post.ingredients) }}</p>
                             </div>
                             <div v-else>
                                <p class="recipe-section-header">Ingredients:</p>
                                <p class="post-text">{{ post.post.ingredients }}</p>
                                <p class="recipe-section-header">Instructions:</p>
                                <p class="post-text">{{ post.post.instructions }}</p>
                             </div>
                          </div>

                          <button 
                            v-if="shouldShowReadMore(post.post)" 
                            @click="togglePostContent(post._id + '_shared')" 
                            class="read-more-btn"
                          >
                            {{ expandedPosts[post._id + '_shared'] ? 'Show Less' : 'Show More' }}
                          </button>
                          <div v-if="post.post.media" class="post-media">
                          <img v-if="post.post.mediaType === 'image'" :src="`http://localhost:3000/${post.post.media}`" class="post-image" />
                          <video v-else controls class="post-video"><source :src="`http://localhost:3000/${post.post.media}`" /></video>
                      </div>
                      </div>

                      

                      <div class="post-actions">
                          <button @click="openCommentModal(post.post)">
                              <img src="../assets/arrow.png" class="action-icon"/> Open Origin Post
                          </button>
                      </div>
                      
                   </template>
                </template>
                
                <div v-else class="restricted-post-warning">
                   <div class="restricted-content">
                      <p class="notice-message" style="margin: 0; font-style: italic; color: #c00;">
                        This content is currently unavailable.
                      </p>
                   </div>
                </div>
             </div>
             
        </div>

        </div>
      </div>

      <!-- PAGINATION -->
    <div v-if="totalPages > 1" class="pagination">

      <button 
        class="page-btn"
        :disabled="currentPage === 1"
        @click="changePage(currentPage - 1)"
      >
        ‹ Prev
      </button>

      <button
        v-for="page in totalPages"
        :key="page"
        class="page-btn"
        :class="{ active: page === currentPage }"
        @click="changePage(page)"
      >
        {{ page }}
      </button>

      <button 
        class="page-btn"
        :disabled="currentPage === totalPages"
        @click="changePage(currentPage + 1)"
      >
        Next ›
      </button>

    </div>

    </main>

    <CreatePostModal :is-visible="createPostModalVisible" :user="user" @close="createPostModalVisible = false" @posted="handlePostCreated" />
    <ConfirmDialog v-if="confirmVisible" :message="confirmMessage" @confirm="handleConfirmedAction" @cancel="confirmVisible = false" />
    <EditShareModal v-if="showEditShareModal" :share="editedShare" @close="showEditShareModal = false" @updated="fetchPosts" />
    <ShareModal v-if="showShareModal" :post="postToShare" :user="user" @close="showShareModal = false" @shared="fetchPosts" />
    <EditPostModal :is-visible="editModalVisible" :post="editedPost" :user="user" @close="closeEditModal" @updated="handlePostUpdated" />
    <CommentModal :is-visible="commentModalVisible" :post="selectedPost" :user="user" :initial-save-count="getPostSaveCount(selectedPost)" @close="closeCommentModal" @commented="handleCommentAdded" @comment-deleted="handleCommentDeleted" @liked="handlePostLiked" @share="handleSharePost" @comment-count-updated="onCommentCountUpdated" @save-count-updated="handleSaveCountUpdated" @save-status-changed="handleSaveStatusChanged" @rating-updated="handleRatingUpdated"/>
  </div>
</template>

<script>
import ConfirmDialog from './ConfirmDialog.vue';
import EditShareModal from './EditShareModal.vue';
import ShareModal from './ShareModal.vue';
import CommentModal from './CommentModal.vue';
import EditPostModal from './EditPostModal.vue';
import CreatePostModal from './CreatePostModal.vue';

// Custom directive để xử lý click ra ngoài menu (dropdown)
const clickOutside = {
  mounted(el, binding) {
    el.clickOutsideEvent = function(event) {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value(event, el);
      }
    };
    document.body.addEventListener('click', el.clickOutsideEvent);
  },
  unmounted(el) {
    document.body.removeEventListener('click', el.clickOutsideEvent);
  },
};

export default {
  name: "HomePage",
  directives: {
    clickOutside: clickOutside
  },
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
      
      // UI States
      openMenuId: null,
      confirmVisible: false,
      confirmMessage: '',
      
      // Data Cache
      savedPosts: [], 
      postSaveCounts: {},
      postCommentCounts: {},

      // Filter & Search
      searchQuery: '',
      finalSearchQuery: '',
      selectedCategory: 'All',
      categories: [
        "All", "Appetizer", "Main Course", "Side Dish", "Soup", "Salad", "Dessert", 
        "Beverage", "Snack", "Breakfast", "Lunch", "Dinner", "Vegetarian", "Vegan", 
        "Seafood", "Pasta", "Rice Dish", "Noodles", "Bakery", "Grilled", "Fried", 
        "Steamed", "Stir-fry", "Slow-cooked", "Quick Meal", "Traditional", 
        "Fusion", "Healthy", "Comfort Food", "Kid-friendly","Party Food"
      ],

      // Modals State
      editModalVisible: false,
      editedPost: null, 
      commentModalVisible: false,
      selectedPost: null,
      createPostModalVisible: false,
      
      // Share Modal State
      shareModalVisible: false,
      showEditShareModal: false,
      editedShare: null,
      showShareModal: false,
      postToShare: null,

      // Expand/Collapse Logic: Lưu trạng thái mở rộng theo ID (Key duy nhất)
      expandedPosts: {}, 
      
      // Delete Logic
      deleteType: null,
      itemToDeleteId: null,

      // Search History
      showHistory: false,
      searchHistory: [],

      allUsers: [],

      // Pagination
      currentPage: 1,
      postsPerPage: 10,
    }
  },

  computed: {
    searchedUsers() {
      // Nếu không có từ khóa thì trả về rỗng
      if (!this.finalSearchQuery) return [];
      
      const query = this.finalSearchQuery.toLowerCase().trim();
      if (!query) return [];

      // Lọc trong danh sách allUsers (chứa cả người chưa có post)
      return this.allUsers.filter(user => {
        // Bỏ qua chính mình (nếu muốn)
        if (this.currentUser && user._id === this.currentUser.id) return false;

        const fullName = `${user.firstname} ${user.lastname}`.toLowerCase();
        const username = user.username ? user.username.toLowerCase() : '';

        // Kiểm tra tên Hoặc username
        return fullName.includes(query) || username.includes(query);
      });
    },
  
    filteredPosts() {
      let result = this.posts;

      // 1. Filter theo Tab Category (Giữ nguyên logic của bạn)
      if (this.selectedCategory !== 'All') {
        const targetCat = this.selectedCategory.toLowerCase();
        result = result.filter(post => {
          // Lấy category ưu tiên bài gốc, nếu không có thì lấy bài được share
          const cat = post.category || (post.post ? post.post.category : '') || '';
          return cat.toLowerCase() === targetCat;
        });
      }

      // 2. Filter theo thanh Search
      if (this.finalSearchQuery) {
        const query = this.finalSearchQuery.toLowerCase().trim();
        
        if (query) {
          result = result.filter(post => {
            // --- A. Dữ liệu bài viết trực tiếp ---
            const title = post.title?.toLowerCase() || '';
            const ing = post.ingredients?.toLowerCase() || '';
            const inst = post.instructions?.toLowerCase() || '';
            const cat = post.category?.toLowerCase() || ''; // [MỚI] Tìm theo category

            // --- B. Dữ liệu bài gốc (nếu là Share) ---
            const oTitle = post.post?.title?.toLowerCase() || '';
            const oIng = post.post?.ingredients?.toLowerCase() || '';
            const oInst = post.post?.instructions?.toLowerCase() || '';
            const oCat = post.post?.category?.toLowerCase() || ''; // [MỚI]

            // --- C. Dữ liệu con người ---
            // Tác giả gốc
            const authorName = post.author 
              ? `${post.author.firstname} ${post.author.lastname}`.toLowerCase() 
              : '';
            
            // [MỚI] Người chia sẻ (Nếu là bài share)
            const sharerName = (post.type === 'share' && post.username)
              ? `${post.username.firstname} ${post.username.lastname}`.toLowerCase()
              : '';

            // --- D. So khớp ---
            return title.includes(query) || 
                   ing.includes(query) || 
                   inst.includes(query) ||
                   cat.includes(query) || // Search được category
                   oTitle.includes(query) || 
                   oIng.includes(query) || 
                   oInst.includes(query) ||
                   oCat.includes(query) ||
                   authorName.includes(query) || 
                   sharerName.includes(query); // Search được người share
          });
        }
      }
      return result;
    },

    totalPages() {
  return Math.ceil(this.filteredPosts.length / this.postsPerPage);
    },

    paginatedPosts() {
  const start = (this.currentPage - 1) * this.postsPerPage;
  const end = start + this.postsPerPage;
  return this.filteredPosts.slice(start, end);
    },


  },

  methods: {
    // --- UI HELPERS ---

    selectCategory(category) {
      this.selectedCategory = category;
      this.currentPage = 1;
    },

    handleFilterScroll(e) {
      // e.deltaY là độ lăn chuột dọc. Ta cộng nó vào scrollLeft (ngang).
      // .prevent ở template đã chặn trang web bị cuộn xuống.
      const container = e.currentTarget;
      container.scrollLeft += e.deltaY;
    },

    async handleSearch() {
      // 1. Kiểm tra đầu vào
      const query = this.searchQuery.trim();
      if (!query) return;

      // 2. KÍCH HOẠT TÌM KIẾM (Quan trọng nhất)
      // Dòng này sẽ báo cho computed 'filteredPosts' biết để lọc dữ liệu
      this.finalSearchQuery = query;
      this.currentPage = 1; 

      // 3. Cập nhật giao diện Lịch sử (Local State)
      // Xóa nếu trùng để đưa lên đầu
      const index = this.searchHistory.indexOf(query);
      if (index !== -1) {
        this.searchHistory.splice(index, 1);
      }
      // Thêm vào đầu mảng
      this.searchHistory.unshift(query);
      // Giới hạn 10 item
      if (this.searchHistory.length > 10) this.searchHistory.pop();
      
      // Đóng popup history
      this.showHistory = false; 

      // 4. Gửi API lưu ngầm xuống database (Không cần await để tránh chặn UI)
      // Kiểm tra user có tồn tại không trước khi gọi
      if (this.user && this.user.id) {
        try {
          fetch(`http://localhost:3000/users/${this.user.id}/search-history`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: query })
          });
        } catch (e) { 
          console.error("Lỗi lưu lịch sử:", e); 
        }
      }
    },

    getAvatarUrl(author) {
      if (!author || !author.avatar) return 'http://localhost:3000/uploads/user.png';
      return `http://localhost:3000/${author.avatar}`;
    },
    
    getImageUrl(path) {
      return `http://localhost:3000/${path}`;
    },

    formatTime(dateStr) {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? '' : date.toLocaleString();
    },
    
    toggleMenu(postId) {
      this.openMenuId = this.openMenuId === postId ? null : postId;
    },

    closeAllMenus() {
      this.openMenuId = null;
    },

    handleScroll() {
      if (this.openMenuId) {
        this.openMenuId = null;
      }
    },

    resetFilter() {
    this.searchQuery = '';         // 1. Xóa sạch chữ trong ô tìm kiếm
    this.finalSearchQuery = '';   // Cập nhật finalSearchQuery
    this.selectedCategory = 'All'; // 2. Đưa bộ lọc Category về mặc định ("All")
    this.currentPage = 1;
  },

  openHistory() {
      if (this.searchHistory.length > 0) {
        this.showHistory = true;
      }
    },

    // 2. Đóng lịch sử khi click ra ngoài (đã gắn v-click-outside ở template)
    closeHistory() {
      this.showHistory = false;
    },

    // 3. Xóa text nhanh
    clearSearch() {
      this.searchQuery = '';
      this.finalSearchQuery = '';
      // Giữ focus vào ô input sau khi xóa
      // (Tùy chọn: document.querySelector('.search-container input').focus())
    },


    async fetchAllUsers() {
      try {
        const res = await fetch('http://localhost:3000/users'); // API lấy list user
        if (res.ok) {
          this.allUsers = await res.json();
        }
      } catch (err) {
        console.error("Lỗi tải danh sách user:", err);
      }
    },

    async loadSearchHistory() {
      if (!this.user) return;
      try {
        const res = await fetch(`http://localhost:3000/users/${this.user.id}/search-history`);
        if (res.ok) {
          const data = await res.json();
          this.searchHistory = data.history || [];
        }
      } catch (e) {
        console.error("Lỗi tải lịch sử:", e);
      }
    },

    // MỚI: Lưu lên Server
    async saveSearchHistory() {
      const query = this.searchQuery.trim();
      if (!query) return;

      // 1. Cập nhật giao diện ngay lập tức (để người dùng thấy nhanh)
      const index = this.searchHistory.indexOf(query);
      if (index !== -1) {
        this.searchHistory.splice(index, 1);
      }
      this.searchHistory.unshift(query);
      if (this.searchHistory.length > 10) this.searchHistory.pop();
      
      this.showHistory = false; // Đóng popup

      // 2. Gửi API lưu ngầm xuống database
      try {
        await fetch(`http://localhost:3000/users/${this.user.id}/search-history`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: query })
        });
      } catch (e) { 
        console.error(e); 
      }

      // (Tùy chọn) Gọi hàm search bài viết ở đây nếu muốn bấm Enter là tìm luôn
      // this.fetchPosts(); 
    },

    selectHistory(item) {
      this.searchQuery = item;
      this.finalSearchQuery = item;
      this.showHistory = false;
    },

    // MỚI: Xóa item trên Server
    async removeHistoryItem(index) {
      const itemToDelete = this.searchHistory[index];
      
      // 1. Xóa trên giao diện
      this.searchHistory.splice(index, 1);
      if (this.searchHistory.length === 0) this.showHistory = false;

      // 2. Gọi API xóa trong database
      try {
        await fetch(`http://localhost:3000/users/${this.user.id}/search-history`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: itemToDelete })
        });
      } catch (e) { console.error(e); }
    },

    // MỚI: Xóa tất cả trên Server
    async clearAllHistory() {
      // 1. Xóa giao diện
      this.searchHistory = [];
      this.showHistory = false;

      // 2. Gọi API xóa sạch DB
      try {
        await fetch(`http://localhost:3000/users/${this.user.id}/search-history/all`, {
          method: 'DELETE'
        });
      } catch (e) { console.error(e); }
    },

    togglePostContent(postId) {
      // Tạo object mới để Vue nhận diện thay đổi (Reactivity)
      const newExpanded = { ...this.expandedPosts };
      newExpanded[postId] = !newExpanded[postId];
      this.expandedPosts = newExpanded;
    },

    shouldShowReadMore(post) {
      if (!post) return false;
      
      // --- SỬA ĐOẠN NÀY ---
      // Cộng nội dung Ingredients và Instructions lại để kiểm tra độ dài
      const text = (post.ingredients || '') + (post.instructions || '');
      const lines = text.split('\n');
      
      // Nếu tổng cộng quá 5 dòng hoặc quá 200 ký tự thì hiện nút Show More
      return lines.length > 5 || text.length > 200;
    },

    // Thêm hàm này vào methods
    getTruncatedText(text) {
      if (!text) return '';
      
      const lines = text.split('\n');
      
      // Lấy tối đa 3 dòng đầu tiên
      if (lines.length > 3) {
        return lines.slice(0, 3).join('\n') + '...';
      }
      
      // Hoặc lấy tối đa 150 ký tự
      if (text.length > 150) {
        return text.substring(0, 150) + '...';
      }
      
      return text;
    },

    getDisplayedContent(post) {
      if (!post?.content) return '';
      
      const postId = post._id;
      // Nếu đã bấm Show More hoặc nội dung ngắn -> Hiện hết
      if (this.expandedPosts[postId] || !this.shouldShowReadMore(postId)) {
        return post.content;
      }
      
      // Nếu chưa bấm -> Cắt ngắn
      const lines = post.content.split('\n');
      if (lines.length > 3) return lines.slice(0, 3).join('\n') + '...';
      return post.content.substring(0, 200) + '...';
    },

    // Helper tìm post object (dùng để hỗ trợ các logic cũ nếu cần)
    findPostById(id) {
      for (const p of this.posts) {
        if (p._id === id) return p;
        if (p.type === 'share' && p.post && p.post._id === id) return p.post;
      }
      return null;
    },
    
    // --- DATA FETCHING ---

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
        
        // Load các dữ liệu phụ (Save count,...)
        this.fetchAllSaveCounts();
      } catch (err) {
        console.error("Error in fetch posts:", err);
        alert("Unable to fetch posts");
      }
    },

    // --- SAVED POSTS LOGIC ---

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

    getPostSaveCount(post) {
      if (!post || !post._id) return 0;
      if (post.savesCount !== undefined) return post.savesCount;
      if (this.postSaveCounts[post._id] !== undefined) return this.postSaveCounts[post._id];
      
      this.fetchPostSaveCount(post._id);
      return 0;
    },

    updatePostSaveCount(postId, increment = false) {
      if (this.postSaveCounts[postId] === undefined) {
        this.postSaveCounts[postId] = 0;
      }
      
      if (increment) {
        this.postSaveCounts[postId]++;
      } else {
        this.postSaveCounts[postId] = Math.max(0, this.postSaveCounts[postId] - 1);
      }

      // Cập nhật state local ngay lập tức để UI phản hồi nhanh
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

    async fetchAllSaveCounts() {
      const postIds = [];
      this.posts.forEach(post => {
        if (post.type === 'post') {
          postIds.push(post._id);
        } else if (post.type === 'share' && post.post) {
          postIds.push(post.post._id);
        }
      });

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
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: savedUser.id,
            action: isSaved ? 'unsave' : 'save'
          })
        });

        const data = await res.json();
        
        if (res.ok) {
          if (isSaved) {
            this.savedPosts = this.savedPosts.filter(id => id !== postId);
            this.updatePostSaveCount(postId, false); 
            alert(data.msg || 'Item unsaved successfully');
          } else {
            this.savedPosts.push(postId);
            this.updatePostSaveCount(postId, true); 
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
      if (data.isSaved) {
        if (!this.savedPosts.includes(data.postId)) {
          this.savedPosts.push(data.postId);
        }
      } else {
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
        const res = await fetch(`http://localhost:3000/feeds/users/${savedUser.id}/saved-items`);
        if (res.ok) {
          const data = await res.json();
          this.savedPosts = data.savedItems || [];
        }
      } catch (err) {
        console.error("Failed to load saved posts:", err);
      }
    },

    // --- POST & SHARE ACTIONS ---

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
          headers: { "Content-Type": "application/json" },
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

    async hideThisShare(shareId) {
      const savedUser = JSON.parse(localStorage.getItem("user"));
      if (!savedUser) return alert("Please log in to hide shares");

      try {
        const res = await fetch(`http://localhost:3000/shares/hide-share/${shareId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: savedUser.id })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.msg || "Hide share failed");
        
        alert(data.msg || "Hide share successfully!");
        await this.fetchPosts();
      } catch (err) {
        console.error("Error to hide share:", err);
        alert(err.message || "Unable to hide share");
      }
    },

    async toggleLike(post) {
      const savedUser = JSON.parse(localStorage.getItem("user"));
      if (!savedUser) return alert("Please login");

      try {
        const res = await fetch(`http://localhost:3000/posts/${post._id}/like`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: savedUser.username })
        });
        const data = await res.json();
        post.likes = data.likes;
      } catch (err) {
        console.error("Cannot like this post:", err);
        alert("Unable to like this post");
      }
    },
    
    // --- COMMENTS & RATING ---

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
      // Sync like state from modal back to list
      const post = this.posts.find(p => p._id === data.postId || (p.post && p.post._id === data.postId));
      if (post) {
        if (post.post) {
          post.post.likes = data.likes;
        } else {
          post.likes = data.likes;
        }
      }
    },

    handleRatingUpdated(data) {
      // Logic cập nhật rating đồng bộ cho tất cả các bản sao của bài viết trên màn hình
      // data bao gồm: { postId, totalRatings, averageRating }
      
      this.posts.forEach(post => {
        // Trường hợp 1: Bài post gốc
        if (post._id === data.postId) {
          post.totalRatings = data.totalRatings;
          post.averageRating = data.averageRating;
        }

        // Trường hợp 2: Bài share chứa post này
        if (post.type === 'share' && post.post && post.post._id === data.postId) {
          post.post.totalRatings = data.totalRatings;
          post.post.averageRating = data.averageRating;
        }
      });
      
      // Ép Vue vẽ lại giao diện nếu reactivity không tự động bắt được
      this.$forceUpdate(); 
    },

    // --- SHARE ACTIONS ---

    handleSharePost(post) {
      this.openShareModal(post);
    },

    openShareModal(post) {
      this.postToShare = post;
      this.showShareModal = true;
    },

    editShare(share) {
      this.editedShare = share;
      this.showEditShareModal = true;
    },

    isMyShare(share) {
      const savedUser = JSON.parse(localStorage.getItem("user"));
      return savedUser && share.username._id === savedUser.id;
    },

    getPostAccessMessage(post) {
      if (!post) return 'Content not available';
      if (post.audience === 'private') return 'This post is private';
      else if (post.audience === 'friends') return 'Only friends of this user can see';
      else return 'Content not available';
    },

    // --- EDIT & DELETE LOGIC ---

    isMyPost(post) {
      const savedUser = JSON.parse(localStorage.getItem("user"));
      return savedUser && post.author._id === savedUser?.id;
    },

    isLiked(post) {
      const savedUser = JSON.parse(localStorage.getItem("user"));
      return savedUser && post.likes && post.likes.includes(savedUser.id);
    },

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

    deletePost(postId) {
      this.itemToDeleteId = postId;
      this.deleteType = 'post';
      this.confirmMessage = "Are you sure you want to delete this post?";
      this.confirmVisible = true;
    },

    deleteShare(shareId) {
      this.itemToDeleteId = shareId;
      this.deleteType = 'share';
      this.confirmMessage = "Are you sure you want to delete this share?";
      this.confirmVisible = true;
    },

    async handleConfirmedAction() {
       this.confirmVisible = false;
       if(!this.itemToDeleteId) return;

       try {
          // --- TRƯỜNG HỢP 1: XÓA BÀI SHARE (Giữ nguyên logic cũ) ---
          if(this.deleteType === 'share') {
             const res = await fetch(`http://localhost:3000/shares/${this.itemToDeleteId}`, {method:'DELETE'});
             if(res.ok) { 
                this.posts = this.posts.filter(p => p._id !== this.itemToDeleteId);
                
                // Logic giảm share count (Giữ nguyên)
                const shareToDelete = this.posts.find(p => p._id === this.itemToDeleteId);
                const originalPostId = shareToDelete?.post?._id || shareToDelete?.post;
                if (originalPostId) {
                   const orig = this.posts.find(p => p._id === originalPostId);
                   if(orig) orig.sharesCount = Math.max(0, (orig.sharesCount || 0) - 1);
                }
                
                alert("Share deleted"); 
             } else alert("Error deleting share");

          // --- TRƯỜNG HỢP 2: XÓA BÀI GỐC (SỬA Ở ĐÂY) ---
          } else {
             const res = await fetch(`http://localhost:3000/posts/${this.itemToDeleteId}`, {method:'DELETE'});
             
             if(res.ok) { 
                const deletedPostId = this.itemToDeleteId; // Lưu ID bài vừa xóa

                // 1. Xóa bài gốc khỏi danh sách hiển thị
                this.posts = this.posts.filter(p => p._id !== deletedPostId);

                // 2. ⭐ FIX LOGIC: Tìm các bài Share đang chứa bài này và set về null
                this.posts.forEach(p => {
                    // Nếu là bài share VÀ đang chứa bài viết vừa bị xóa
                    if (p.type === 'share' && p.post && p.post._id === deletedPostId) {
                        p.post = null; // Gán null để Template tự động chuyển sang giao diện "This post is deleted"
                    }
                });

                this.openMenuId = null;
                alert("Post deleted");
             } else alert("Error deleting post");
          }
       } catch(e) { 
           console.error(e);
           alert("Server error"); 
       }
       
       this.itemToDeleteId = null; 
       this.deleteType = null;
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
    },

    // Trong methods:
    getPrivacyWarning(post) {
      if (!post) return "This content is currently unavailable.";
      
      if (post.audience === 'private') {
        return "This post is private and cannot be viewed.";
      }
      if (post.audience === 'friends') {
        return "Only friends of this user can view this post.";
      }
      return "This content is restricted.";
    },

    changePage(page) {
      if (page < 1 || page > this.totalPages) return;
      this.currentPage = page;

      // Scroll lên đầu feed cho UX tốt
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    

  },

  mounted() {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      this.user = JSON.parse(savedUser);
      this.fetchPosts();
      this.loadFriends();
      this.loadSavedPosts();
      this.loadSearchHistory();
      this.fetchAllUsers();
    } else {
      this.$router.push("/login");
    }
    

    window.addEventListener('scroll', this.handleScroll, true);
  },

  beforeUnmount() {
    window.removeEventListener('scroll', this.handleScroll, true);
  }
};
</script>

<style scoped>
/* ==========================================================================
   0. RESET & CONTAINER
   ========================================================================== */
* { box-sizing: border-box; }

.homepage {
  min-height: 100vh;
  background-color: #fcf8f5;
  font-family: 'Segoe UI', system-ui, sans-serif;
  position: relative;
  /* Padding trái để tránh Sidebar (280px) */
  padding-left: 320px; 
  padding-top: 30px; 
  padding-right: 40px;
}

/* ==========================================================================
   1. FEED LAYOUT
   ========================================================================== */
.feed {
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

/* Thêm lớp bảo vệ này để chắc chắn có khoảng cách */
.feed-item {
  display: block;
  width: 100%;
  /* Fallback nếu gap không chạy trên trình duyệt cũ */
  margin-bottom: 24px; 
  
 
}

/* Đảm bảo bài viết cuối cùng không bị dính đáy */
.feed-item:last-child {
  margin-bottom: 0;
}



/* ==========================================================================
   2. HEADER & SEARCH
   ========================================================================== */
.top-header-section {
  background: white; padding: 16px; border-radius: 16px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.02);
  display: flex; flex-direction: column; gap: 16px;
}

.search-container { 
  display: flex; 
  gap: 10px; 
  align-items: flex-start; /* Để nút Search không bị kéo giãn nếu input wrapper cao lên */
}

.input-wrapper {
  position: relative; /* Làm mốc tọa độ cho dropdown */
  flex: 1;
  display: flex;
  align-items: center;
}

.input-wrapper input {
  width: 100%;
  padding: 10px 36px 10px 16px; /* Chừa chỗ cho nút X */
  border-radius: 20px; 
  border: 1px solid #eee;
  background: #f9f9f9; 
  outline: none; 
  transition: 0.2s; 
  font-size: 14px;
}

.input-wrapper input:focus { 
  background: white; 
  border-color: #FF642F; 
  box-shadow: 0 0 0 2px rgba(255, 100, 47, 0.1); 
}

.search-container input {
  width: 100%;
  padding: 10px 36px 10px 16px; /* Padding phải rộng hơn để chừa chỗ cho nút X */
  border-radius: 20px; 
  border: 1px solid #eee;
  background: #f9f9f9; 
  outline: none; 
  transition: 0.2s; 
  font-size: 14px;
}
.search-container input:focus { 
  background: white; 
  border-color: #FF642F; 
  box-shadow: 0 0 0 2px rgba(255, 100, 47, 0.1); 
}

.clear-icon {
  position: absolute;
  right: 12px;
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

/* --- HISTORY DROPDOWN (Giao diện mới) --- */
.history-dropdown {
  position: absolute;
  top: 100%; /* Nằm ngay dưới input */
  left: 0;
  width: 100%; /* Rộng bằng input */
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  border: 1px solid #eee;
  z-index: 100;
  margin-top: 6px;
  overflow: hidden;
  animation: fadeIn 0.15s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}

.history-header {
  display: flex; justify-content: space-between;
  padding: 8px 16px;
  background: #f8f9fa;
  font-size: 12px;
  font-weight: 600;
  color: #888;
  border-bottom: 1px solid #eee;
}
.clear-all { cursor: pointer; color: #FF642F; font-size: 11px;}
.clear-all:hover { text-decoration: underline; }

.history-list {
  list-style: none; padding: 0; margin: 0;
  max-height: 250px; overflow-y: auto;
}
.history-list li {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 16px;
  cursor: pointer;
  transition: 0.1s;
}
.history-list li:hover { background: #fdf4f0; } /* Màu cam nhạt khi hover */

.history-item-content {
  display: flex; align-items: center; gap: 10px;
  font-size: 14px; color: #333;
}
.clock-icon { font-size: 12px; opacity: 0.6; }

.delete-item {
  font-size: 14px; color: #ddd; padding: 4px; border-radius: 50%;
}
.delete-item:hover { color: #FF4444;}

/* Filter Scroll */
.filter-container { 
  display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none;
}
.filter-container::-webkit-scrollbar { display: none; }
.filter-pill {
  white-space: nowrap; padding: 6px 16px; border-radius: 20px; border: 1px solid #eee;
  background: white; color: #555; font-size: 13px; font-weight: 500; cursor: pointer; transition: 0.2s;
}
.filter-pill.active, .filter-pill:hover { background: #FF642F; color: white; border-color: #FF642F; }

/* Create Post */
.create-post {
  background: white; padding: 16px; border-radius: 16px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.02);
}
.create-post h3 { margin: 0 0 10px 0; font-size: 15px; color: #444; }
.create-post input {
  width: 100%; padding: 12px; border: 1px solid #eee; border-radius: 12px;
  background: #f8f9fa; cursor: pointer; transition: 0.2s;
}
.create-post input:hover { background: #f0f0f0; }

/* ==========================================================================
   ⭐ NEW: SEARCH RESULTS STYLING (User & Section Title) ⭐
   ========================================================================== */
.section-title {
  font-size: 18px;
  font-weight: 700;
  color: #333;
  margin: 10px 0 12px 4px; /* Căn chỉnh lề */
}

.search-results-section {
  margin-bottom: 10px;
}

.user-results-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.user-result-card {
  display: flex;
  justify-content: space-between; /* Đẩy tên sang trái, nút sang phải */
  align-items: center;
  background: white;
  padding: 12px 16px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
  border: 1px solid #f0f0f0;
  transition: all 0.2s ease;
}

.user-result-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  border-color: #FF642F; /* Highlight viền cam khi hover */
}

.user-info-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-info-left .avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid #eee;
}



.user-details .user-fullname { display:flex; font-weight: 700; font-size: 14px; margin: 0; color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 140px; }
 .user-details .username { font-size: 12px; color: #999; margin: 0; }

.view-profile-btn {
  background-color: #f0f2f5;
  color: #333;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
}

.view-profile-btn:hover {
  background-color: #FF642F;
  color: white;
}

.no-posts-container {
  text-align: center;
  padding: 40px;
  background: white;
  border-radius: 16px;
  color: #888;
  border: 1px dashed #ddd;
}
.clear-filter-btn {
  margin-top: 10px;
  background: white;
  border: 1px solid #FF642F;
  color: #FF642F;
  padding: 6px 20px;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 600;
}
.clear-filter-btn:hover { background: #FF642F; color: white; }

/* ==========================================================================
   3. POST CARDS
   ========================================================================== */
.post, .shared-post {
  background: white; border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.03);
  border: 1px solid #f0f0f0; overflow: visible;
  display: flex; flex-direction: column;
}

.post-header { padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; }
.post-author-info { display: flex; align-items: center; gap: 12px; }
.post-author-info img { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 1px solid #eee; }
.author-details strong { display: block; font-size: 14px; color: #333; }
.author-details .time { font-size: 12px; color: #999; margin-top: 2px; }

.post-content-wrapper { padding: 4px 16px 12px 16px; }
.post-text { font-size: 15px; line-height: 1.5; color: #333; margin: 0; white-space: pre-line; }
.read-more-btn { border: none; background: none; color: #FF642F; font-weight: 600; font-size: 13px; cursor: pointer; padding: 0; margin-top: 5px; }
.read-more-btn:hover { text-decoration: underline; }

.recipe-category {
  display: inline-block;
  font-size: 13px;
  background: #FFF0E6; /* Nền cam nhạt */
  color: #FF642F;       /* Chữ cam đậm */
  padding: 2px 8px;
  border-radius: 12px;
  margin-bottom: 12px;
  font-weight: 600;
}

.recipe-section-header {
  font-weight: 700;
  margin: 0 0 10px 0;
  font-size: 13px;
  color: #333;
}

.recipe-title {
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 5px 0;
  color: #333;
}
/* Media */
.post-media-container { width: 100%; aspect-ratio: 1 / 1; background: white; display: flex; align-items: center; justify-content: center; overflow: hidden; }


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
.rating-statistics { margin: 12px 16px 10px 16px; background: #fff9e6; border: 1px solid #ffe9b8; padding: 10px 14px; border-radius: 10px; }
.rating-summary { display: flex; justify-content: space-between; align-items: center; }
.average-rating { display: flex; align-items: center; gap: 8px; }
.rating-number { font-weight: bold; color: #f57c00; font-size: 18px; }
.stars-display { display: flex; gap: 2px; }
.star-icon { color: #ddd; font-size: 16px; }
.star-icon.filled { color: #ffc107; }
.rating-count { font-size: 12px; color: #856404; font-weight: 500; }

.post-stats { padding: 0 16px 10px; font-size: 12px; color: #999; display: flex; gap: 12px; }

/* Actions */
.post-actions { padding: 8px 0; border-top: 1px solid #f5f5f5; display: flex; justify-content: space-around; }
.post-actions button {
  background: none; border: none; display: flex; align-items: center; gap: 6px;
  padding: 8px 12px; border-radius: 8px; cursor: pointer; color: #666; font-size: 13px; font-weight: 500; transition: 0.2s;
}
.post-actions button:hover { background: #fff5eb; color: #FF642F; }
.post-actions button img { width: 18px; height: 18px; opacity: 0.7; }
.post-actions button.like-btn.active { color: #F44336; }
.post-actions button.save-btn.active { color: #FFC107; }
.post-actions button.active img { filter: none; opacity: 1; }

/* Menus */
.post-menu-wrapper { position: relative; }
.menu-post-icon { width: 24px; cursor: pointer; opacity: 0.5; padding: 4px; }
.dropdown-menu {
  position: absolute; right: 0; top: 100%; background: white; border: 1px solid #eee;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden; z-index: 100; width: 140px; font-weight: 500;
}
.dropdown-menu button {
  width: 100%; padding: 10px 12px; text-align: left; background: white; border: none;
  display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer;
}
.dropdown-menu button:hover { background: #f9f9f9; }
.dropdown-menu button img { width: 16px; opacity: 0.7; }

/* Shared Specifics */
/* ==========================================================================
   5. SHARED POST SPECIFICS (ĐÃ FIX LỖI VỠ LAYOUT)
   ========================================================================== */

/* Khung bao ngoài bài gốc */
.shared-content-box { 
  border: 1px solid #ddd; 
  border-radius: 12px; 
  margin: 0 16px 12px; 
  overflow: hidden; 
  background-color: #fff;
  
}





.origin-post-author-info { display: flex; align-items: center; gap: 12px; }
.origin-post-author-info img { margin-left:15px; margin-top:10px; width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 1px solid #eee; }
.origin-author-details strong { margin-top:10px; display: block; font-size: 14px; color: #333; }
.origin-author-details .origin-post-time { font-size: 12px; color: #999; margin-top: 2px; }




/* Cảnh báo bài viết bị ẩn/xóa */
.restricted-post-warning { 
  padding: 15px; 
  display: flex; 
  align-items: center; /* Căn giữa dọc */
  gap: 12px; 
  border-bottom: 1px solid #ffebeb;
  
}

/* Nội dung cảnh báo */
.restricted-content {

  display: block; font-size: 14px; color: #333;
}

.notice-message { 
  font-size: 13px; 
  color: #c00; 
  font-style: italic; 
  margin: 4px 0 0 0; 
  padding:10px;
  margin-left:15px;
}

/* ==========================================================================
   6. PAGINATION STYLES
   ========================================================================== */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  margin: 30px 0 10px;
}

.page-btn {
  min-width: 36px;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid #eee;
  background: white;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: #555;
  transition: 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: #FF642F;
  color: white;
  border-color: #FF642F;
}

.page-btn.active {
  background: #FF642F;
  color: white;
  border-color: #FF642F;
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}



/* RESPONSIVE */
@media (max-width: 1024px) {
  .homepage { padding-left: 0; padding-right: 0; padding-top: 60px; }
  .feed { margin: 0; padding: 0 16px 80px 16px; max-width: 100%; }
  .post-actions button span { display: none; } 
  .post-actions button { padding: 8px; }
}
</style>