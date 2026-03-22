<template>
  <div class="hidden-items-page">
    <div class="hidden-items-wrapper">
    
    <div class="header-section">
      <h2>Hidden Posts</h2>
      <p class="hidden-count">{{ hiddenItems.length }} hidden {{ hiddenItems.length === 1 ? 'item' : 'items' }}</p>
    </div>

    <div class="nav-wrapper">
      <div class="glass-nav">
        <button 
          :class="['nav-pill', { active: filter === 'all' }]" 
          @click="filter = 'all'"
        >
          All<span class="tab-counter">({{ hiddenItems.length }})</span>
        </button>
        
        <button 
          :class="['nav-pill', { active: filter === 'post' }]" 
          @click="filter = 'post'"
        >
          Posts<span class="tab-counter">({{ getPostsCount() }})</span>
        </button>
        
        <button 
          :class="['nav-pill', { active: filter === 'share' }]" 
          @click="filter = 'share'"
        >
          Shares<span class="tab-counter">({{ getSharesCount() }})</span>
        </button>
      </div>
    </div>

    <div class="content-body">
    <LoadingOverlay v-if="loading" />
    <div v-if="!loading && filteredItems.length === 0" class="empty-state">
      <img src="../assets/hide.png" alt="No hidden items" class="empty-icon" />
      <h2>No Hidden {{ getFilterLabel() }}</h2>
      <p>{{ getEmptyMessage() }}</p>
      <button @click="$router.push('/home')" class="browse-btn">Go to Home</button>
    </div>

    <div v-else class="posts-container">
      <div v-for="item in paginatedItems" :key="item._id" class="post-item card">
        
        <div v-if="item.type === 'post'">
          <div class="post-header">
            <div class="post-author-info">
              <img :src="getAvatarUrl(item.author)" class="avatar" />
              <div class="author-details">
                <strong>{{ item.author.firstname }} {{ item.author.lastname }}</strong>
                <p class="time">
                  {{ formatTime(item.createdAt) }}
                  <span>{{ getAudienceIcon(item.audience) }}</span>
                </p>
              </div>
            </div>
            <button @click="unhidePost(item._id)" class="unhide-btn">
              <img src="../assets/hide.png" class="action-icon" /> <span>Unhide</span>
            </button>
          </div>

          <div class="post-content-wrapper">
            <h3 class="recipe-title">{{ item.title }}</h3>
            <span class="recipe-category">{{ item.category }}</span>

            <div class="recipe-body">
                   <template v-if="!expandedPosts[item._id]">
                <p class="recipe-section-header">Ingredients:</p>
                <p class="post-text">{{ getCollapsedContent(item).ingredients }}</p>
                <template v-if="getCollapsedContent(item).showInstructions">
                  <p class="recipe-section-header">Instructions:</p>
                  <p class="post-text">{{ getCollapsedContent(item).instructions }}</p>
                </template>
              </template>
              <template v-else>
                <p class="recipe-section-header">Ingredients:</p>
                <p class="post-text">{{ item.ingredients }}</p>
                <p class="recipe-section-header">Instructions:</p>
                <p class="post-text">{{ item.instructions }}</p>
              </template>
            </div>

            <button 
              v-if="shouldShowReadMore(item)" 
              @click="togglePostContent(item._id)" 
              class="read-more-btn"
            >
              {{ expandedPosts[item._id] ? 'Show Less' : 'Show More' }}
            </button>
            <div v-if="item.media" class="post-media-container">
            <img v-if="item.mediaType === 'image'" :src="getMediaUrl(item.media)" class="post-media" />
            <video v-else-if="item.mediaType === 'video'" controls class="post-media">
              <source :src="getMediaUrl(item.media)" type="video/mp4" />
            </video>
          </div>
          </div>

          
        </div>

        <div v-else class="post shared-post" >
          <div class="post-header">
            <div class="post-author-info">
              <img :src="getAvatarUrl(item.username)" class="avatar" />
              <div class="author-details">
                <strong>{{ item.username.firstname }} {{ item.username.lastname }}</strong>
                <p class="time">
                  {{ formatTime(item.createdAt) }} • Shared a post
                  <span>{{ getAudienceIcon(item.audience) }}</span>
                </p>
              </div>
            </div>
            <button @click="unhideShare(item._id)" class="unhide-btn">
              <img src="../assets/hide.png" class="action-icon" /> <span>Unhide</span>
            </button>
          </div>

          <div v-if="item.content" class="post-content-wrapper">
             <p class="post-text"><i>{{ item.content }}</i></p>
          </div>

          <div class="shared-content-box">
            <div v-if="!item.post" class="restricted-post-warning">
               <div class="restricted-content">
                  <p class="notice-message " style="margin: 0; font-style: italic; color: #c00;">This content is currently unavailable.</p>
               </div>
            </div>

            <div v-else>
              <div v-if="canViewOriginalPost(item.post)">
                <div class="post-header">
                  <div class="post-author-info">
                    <img :src="getAvatarUrl(item.post.author)" class="avatar-small" />
                    <div class="author-details">
                      <strong>{{ item.post.author.firstname }} {{ item.post.author.lastname }}</strong>
                      <p class="time">{{ formatTime(item.post.createdAt) }}
                        <span v-if="item.post.audience === 'public'" title="Public" style="margin-left: 4px;">🌍</span>
                        <span v-else-if="item.post.audience === 'friends'" title="Friends" style="margin-left: 4px;">👥</span>
                        <span v-else-if="item.post.audience === 'private'" title="Private" style="margin-left: 4px;">🔒</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div class="post-content-wrapper">
                  <h3 class="recipe-title small">{{ item.post.title }}</h3>
                  <span class="recipe-category small">{{ item.post.category }}</span>
                  
                  <div class="recipe-body">
                    <template v-if="!expandedPosts[item._id + '_shared']">
                      <p class="recipe-section-header">Ingredients:</p>
                      <p class="post-text">{{ getCollapsedContent(item.post).ingredients }}</p>
                      <template v-if="getCollapsedContent(item.post).showInstructions">
                        <p class="recipe-section-header">Instructions:</p>
                        <p class="post-text">{{ getCollapsedContent(item.post).instructions }}</p>
                      </template>
                    </template>
                    <template v-else>
                      <p class="recipe-section-header">Ingredients:</p>
                      <p class="post-text">{{ item.post.ingredients }}</p>
                      <p class="recipe-section-header">Instructions:</p>
                      <p class="post-text">{{ item.post.instructions }}</p>
                    </template>
                  </div>

                  <button 
                    v-if="shouldShowReadMore(item.post)" 
                    @click="togglePostContent(item._id + '_shared')" 
                    class="read-more-btn"
                  >
                    {{ expandedPosts[item._id + '_shared'] ? 'Show Less' : 'Show More' }}
                  </button>
                  <div v-if="item.post.media" class="post-media-container small">
                  <img v-if="item.post.mediaType === 'image'" :src="getMediaUrl(item.post.media)" class="post-image" />
                  <video v-else-if="item.post.mediaType === 'video'" controls class="post-media">
                    <source :src="getMediaUrl(item.post.media)" type="video/mp4" />
                  </video>
                </div>

                </div>

                
              </div>

              <div v-else>
                <div class="origin-post-author-info">
                        <img :src="getAvatarUrl(item.post.author)" alt="avatar" />
                        <div class="origin-author-details">
                          <strong>{{ item.post.author.firstname }} {{ item.post.author.lastname }}</strong>
                          
                          <p class="origin-post-time">
                            {{ formatTime(item.post.createdAt) }}
                            
                            <span v-if="item.post.audience === 'friends'">👥</span>
                            <span v-else-if="item.post.audience === 'private'">🔒</span>
                          </p>
                          </div>
                      </div >
                        <p class="notice-message">{{ getPostAccessMessage(item.post) }}</p>
              </div>


            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
  </div>
    <Pagination 
    v-if="totalPages > 1"
    :current-page="currentPage"
    :total-pages="totalPages"
    @update:page="changePage"
  />
  </div>


</template>

<script>
import LoadingOverlay from "./LoadingOverlay.vue";
import Pagination from "./Pagination.vue";

export default {
  name: "HiddenItems",
  components: {
    LoadingOverlay,
    Pagination
  },
  data() {
    return {
      userId: null,
      hiddenItems: [],
      filter: 'all',
      expandedPosts: {},
      loading: true,

      currentPage: 1,
      itemsPerPage: 5,
    };
  },
  computed: {
    filteredItems() {
      if (this.filter === 'all') return this.hiddenItems;
      return this.hiddenItems.filter(i => i.type === this.filter);
    },

    totalPages() {
      return Math.ceil(this.filteredItems.length / this.itemsPerPage);
    },

    paginatedItems() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      return this.filteredItems.slice(start, start + this.itemsPerPage);
    }
  }, 

  methods: {
    getPostsCount() {
      return this.hiddenItems.filter(i => i.type === 'post').length;
    },
    getSharesCount() {
      return this.hiddenItems.filter(i => i.type === 'share').length;
    },
    getFilterLabel() {
      switch(this.filter) {
        case 'post': return 'Posts';
        case 'share': return 'Shares';
        default: return 'Items';
      }
    },
    getEmptyMessage() {
      switch(this.filter) {
        case 'post': return 'You haven\'t hidden any posts';
        case 'share': return 'You haven\'t hidden any shared posts';
        default: return 'You haven\'t hidden any content';
      }
    },
    async fetchHiddenItems() {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user) return this.$router.push("/login");
        this.userId = user.id || user._id;
        this.loading = true;

        const [postsRes, sharesRes] = await Promise.all([
          fetch(`http://localhost:3000/feeds/hidden-posts/${this.userId}`),
          fetch(`http://localhost:3000/feeds/hidden-shares/${this.userId}`)
        ]);

        const posts = await postsRes.json();
        const shares = await sharesRes.json();

        const allItems = [
          ...posts.map(p => ({ ...p, type: "post" })),
          ...shares.map(s => ({ ...s, type: "share" }))
        ];

        this.hiddenItems = allItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      } catch (err) {
        console.error("Error loading hidden content:", err);
        alert("Failed to load hidden content");
      }finally{
        this.loading = false;
      }
    },
    async unhidePost(postId) {
      try {
        const res = await fetch(`http://localhost:3000/posts/unhide-post/${postId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: this.userId })
        });
        
        if (res.ok) {
          this.hiddenItems = this.hiddenItems.filter(i => i._id !== postId);
          alert("Post unhidden successfully");
        }
      } catch (err) {
        alert("Failed to unhide post");
      }
    },
    async unhideShare(shareId) {
      try {
        const res = await fetch(`http://localhost:3000/shares/unhide-share/${shareId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: this.userId })
        });
        
        if (res.ok) {
          this.hiddenItems = this.hiddenItems.filter(i => i._id !== shareId);
          alert("Share unhidden successfully");
        }
      } catch (err) {
        alert("Failed to unhide share");
      }
    },
    getAvatarUrl(user) {
      if (!user || !user.avatar) return "http://localhost:3000/uploads/user.png";
      if (user.avatar.startsWith('http')) return user.avatar;
      return `http://localhost:3000/${user.avatar}`;
    },
    getMediaUrl(path) {
      if (!path) return '';
      if (path.startsWith('http')) return path;
      return `http://localhost:3000/${path}`;
    },
    formatTime(dateStr) {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? "" : date.toLocaleString();
    },
    getAudienceIcon(audience) {
      switch (audience) {
        case "public": return "🌍";
        case "friends": return "👥";
        case "private": return "🔒";
        default: return "";
      }
    },
    canViewOriginalPost(post) {
      if (!post) return false;
      if (post.audience === "public") return true;
      if (post.audience === "friends") {
        return post.author.friends?.includes(this.userId) || post.author._id === this.userId;
      }
      if (post.audience === "private") {
        return post.author._id === this.userId;
      }
      return false;
    },

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

    // 2. Kiểm tra xem có cần hiện nút "Show More" không
    shouldShowReadMore(post) {
      if (!post) return false;
      // Cộng gộp độ dài của các trường recipe để kiểm tra
      const text = (post.ingredients || '') + (post.instructions || '');
      const lines = text.split('\n');
      
      // Hiện nút nếu dài hơn 5 dòng hoặc 200 ký tự
      return lines.length > 5 || text.length > 200;
    },

    // 3. Toggle trạng thái mở rộng
    togglePostContent(id) {
      // Dùng spread operator để đảm bảo tính phản ứng (reactivity) của Vue
      const newExpanded = { ...this.expandedPosts };
      newExpanded[id] = !newExpanded[id];
      this.expandedPosts = newExpanded;
    },

    getPostAccessMessage(post) {
      if (!post) return 'Content not available';
      if (post.audience === 'private') return 'This post is private';
      else if (post.audience === 'friends') return 'Only friends of this user can see';
      else return 'Content not available';
    },

    changePage(page) {
      if (page < 1 || page > this.totalPages) return;

      this.currentPage = page;

      // UX: scroll lên đầu
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    }
  },
  mounted() {
    this.fetchHiddenItems();
  }
};
</script>

<style scoped>
/* --- FILTER NAV (STYLE GIỐNG PROFILE) --- */
.nav-wrapper {
  display: flex;
  justify-content: center; /* Căn giữa */
  margin-bottom: 24px;
  position: sticky; /* Nếu muốn dính khi cuộn */
  top: 80px; 
  z-index: 10;
}

.glass-nav {
  backdrop-filter: blur(10px);
  padding: 6px;
  border-radius: 100px; /* Bo tròn hình viên thuốc */
  display: flex;
  gap: 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  border: 1px solid rgba(255,255,255,0.6);
}

.nav-pill {
  padding: 10px 24px;
  border-radius: 40px;
  border: none;
  background: transparent;
  color: #65676b;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.nav-pill:hover {
  background-color: #f2f2f2;
}

.nav-pill.active {
  background: #FF642F; /* Màu đen giống Profile (hoặc #FF642F nếu thích màu cam) */
  color: white;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.tab-counter {
  font-size: 12px;
  font-weight: 400;
  
}

.content-body{
  position: relative; /* Để làm mốc cho LoadingOverlay */
  min-height: 200px;
}

/* Responsive cho mobile */
@media (max-width: 768px) {
  .nav-pill {
    padding: 8px 16px;
    font-size: 13px;
  }
}

.hidden-items-page {
  width: 100%;             /* Chiếm hết chiều rộng */
  min-height: 100vh;
  
  /* Sidebar spacing */
  padding-left: 320px; 
  padding-top: 30px; 
  padding-right: 20px;
  margin-bottom:60px;
  box-sizing: border-box; 
  font-family: 'Segoe UI', system-ui, sans-serif;
}

/* 2. LỚP NỘI DUNG: Căn giữa, giới hạn chiều rộng */
.hidden-items-wrapper {
  width: 100%;
  max-width: 750px;
  margin: 0 auto; 
  /* Dùng Flexbox để tạo khoảng cách */
  display: flex;
  flex-direction: column;
  /* Khoảng cách giữa các bài viết */
  gap: 24px; 
}

/* Responsive Tablet/Mobile */
@media (max-width: 1024px) { 
  .hidden-items-page {
    padding-left: 16px;
    padding-right: 16px;
    padding-top: 80px; /* Tránh header */
    max-width: 100%;
  }
}

/* --- 2. HEADER & TABS --- */
.header-section {
  text-align: center; margin-bottom: 24px; padding: 24px;
  background: white; border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05); border: 1px solid #eee; font-weight: 600;
}
.header-section h2 { margin: 0 0 8px 0; font-size: 24px; font-weight: 800; color: #1c1e21; }
.hidden-count { margin: 0; font-size: 14px; color: #FF642F; }

.filter-tabs {
  display: flex; gap: 8px; margin-bottom: 20px;
  background: white; padding: 8px; border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05); border: 1px solid #eee;
}
.tab-btn {
  flex: 1; padding: 10px; background: #f0f2f5; border: none;
  border-radius: 8px; cursor: pointer; font-weight: 600; color: #65676b;
  transition: all 0.2s;
}
.tab-btn:hover { background: #e4e6ea; }
.tab-btn.active { background: #FF642F; color: white; } /* Màu cam chủ đạo */
.tab-counter { font-size: 12px; margin-left: 4px; opacity: 0.9; }

/* --- 3. EMPTY STATE --- */
.empty-state {
  text-align: center; padding: 80px 20px;
  background: white; border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}
.empty-icon { width: 80px; height: 80px; opacity: 0.4; margin-bottom: 24px; }
.browse-btn { 
  background: #FF642F; color: white; border: none; padding: 12px 24px; 
  border-radius: 20px; cursor: pointer; font-weight: 600; margin-top: 16px; 
  transition: 0.2s;
}
.browse-btn:hover { background: #e04f1d; }

/* --- 4. POST ITEM --- */
.posts-container { display: flex; flex-direction: column; gap: 20px; }

.post-item { 
  background: white; border-radius: 16px; padding: 0; 
  box-shadow: 0 4px 15px rgba(0,0,0,0.03); border: 1px solid #f0f0f0; 
  overflow: visible; 
}

/* Post Header */
.post, .shared-post {
  background: white; border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.03);
  border: 1px solid #f0f0f0; overflow: visible;
  display: flex; flex-direction: column;
}

.post-header { padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; }
.post-author-info { display: flex; align-items: center; gap: 12px;}
.post-author-info img { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 1px solid #eee; }
.author-details strong { display: block; font-size: 14px; color: #333; }
.author-details .time { font-size: 12px; color: #999; margin-top: 2px; }

/* Unhide Button */
.unhide-btn {
  display: flex; align-items: center; gap: 6px; padding: 6px 12px;
  border-radius: 8px; font-size: 13px; font-weight: 600; border: none;
  background: #fdf4f0; color: #FF642F; cursor: pointer; transition: all 0.2s;
}

/* --- 5. RECIPE CONTENT STYLES (NEW) --- */
.post-content-wrapper { padding: 0 16px 16px 16px; }

.recipe-title { font-size: 18px; font-weight: 700; color: #333; margin: 0 0 6px 0; }
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
.post-text { 
  font-size: 15px; line-height: 1.5; color: #333; 
  margin: 0; white-space: pre-line; word-wrap: break-word; 
}
.read-more-btn { 
  border: none; background: none; color: #FF642F; 
  font-weight: 600; font-size: 13px; cursor: pointer; 
  padding: 0; margin-top: 5px; 
}

/* --- 6. MEDIA --- */
.post-media-container, .post-image { 
  width: 100%;
  max-height: 500px;
  object-fit: cover;
  border-radius: 12px;
  margin-top: 10px;
  display: block;
}
.post-media {width: 100%; max-height: 300px; object-fit: contain; border-radius: 8px; background-color:black;}
.action-icon { width: 18px; height: 18px; }

/* --- 7. SHARED POST SPECIFICS (NEW) --- */
.shared-content-box { 
  border: 1px solid #ddd; border-radius: 12px; 
  margin: 0 16px 16px 16px; overflow: hidden; background-color: #fff; 
}

.origin-post-author-info { display: flex; align-items: center; gap: 12px; }
.origin-post-author-info img { margin-left:15px; margin-top:10px; width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 1px solid #eee; }
.origin-author-details strong { margin-top:10px; display: block; font-size: 14px; color: #333; }
.origin-author-details .origin-post-time { font-size: 12px; color: #999; margin-top: 2px; }

/* Header bài gốc (nhỏ hơn) */
.origin-post.post-header.small { 
  padding: 10px 12px; 
  display: flex; align-items: center; 
}
.origin-post .avatar-small { 
  width: 40px !important; min-width: 40px; border-radius: 50%; 
  margin-right: 12px; object-fit: cover; border: 1px solid #ddd; flex-shrink: 0; 
}
.origin-post .post-media-container.small { 
  width: 100%; aspect-ratio: 16/9; background: #000; 
  display: flex; align-items: center; justify-content: center; 
  overflow: hidden; margin-bottom: 0; 
}

/* Restricted / Deleted Style */
.restricted-post-warning { 
  padding: 15px; 
  display: flex; 
  align-items: center; /* Căn giữa dọc */
  gap: 12px; 
  border-bottom: 1px solid #ffebeb;
  
}

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

</style>