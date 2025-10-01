<template>
  <div class="hidden-items-page">
    <!-- Header -->
    <div class="header-section">
      <h2>Hidden Posts</h2>
      <p class="hidden-count">{{ hiddenItems.length }} hidden {{ hiddenItems.length === 1 ? 'item' : 'items' }}</p>
    </div>

    <!-- Filter Controls -->
    <div class="filter-tabs">
      <button :class="{ active: filter === 'all' }" @click="filter = 'all'" class="tab-btn">
        All
        <span class="tab-counter">({{ hiddenItems.length }})</span>
      </button>
      <button :class="{ active: filter === 'post' }" @click="filter = 'post'" class="tab-btn">
        Posts
        <span class="tab-counter">({{ getPostsCount() }})</span>
      </button>
      <button :class="{ active: filter === 'share' }" @click="filter = 'share'" class="tab-btn">
        Shares
        <span class="tab-counter">({{ getSharesCount() }})</span>
      </button>
    </div>

    <!-- Empty State -->
    <div v-if="filteredItems.length === 0" class="empty-state">
      <img src="../assets/hide.png" alt="No hidden items" class="empty-icon" />
      <h2>No Hidden {{ getFilterLabel() }}</h2>
      <p>{{ getEmptyMessage() }}</p>
      <button @click="$router.push('/home')" class="browse-btn">Go to Home</button>
    </div>

    <!-- Hidden Items List -->
    <div v-else class="posts-container">
      <div v-for="item in filteredItems" :key="item._id" class="post">
        
        <!-- Hidden Original Post -->
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
              <img src="../assets/hide.png" class="action-icon" />
              <span>Unhide</span>
            </button>
          </div>

          <p class="post-text">{{ item.content }}</p>

          <div v-if="item.media" class="post-media">
            <img v-if="item.mediaType === 'image'" :src="getMediaUrl(item.media)" class="post-image" />
            <video v-else-if="item.mediaType === 'video'" controls class="post-video">
              <source :src="getMediaUrl(item.media)" type="video/mp4" />
            </video>
          </div>
        </div>

        <!-- Hidden Shared Post -->
        <div v-else class="shared-post">
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
              <img src="../assets/hide.png" class="action-icon" />
              <span>Unhide</span>
            </button>
          </div>

          <p class="post-text" v-if="item.content"><i>{{ item.content }}</i></p>

          <!-- Original Post Box -->
          <div class="shared-box">
            <!-- If post deleted -->
            <div v-if="!item.post" class="restricted-post-warning">
              <p class="notice-message">This post has been deleted</p>
            </div>

            <!-- If post exists -->
            <div v-else>
              <div class="post-header">
                <img :src="getAvatarUrl(item.post.author)" class="avatar-small" />
                <div class="author-details">
                  <strong>{{ item.post.author.firstname }} {{ item.post.author.lastname }}</strong>
                  <p class="time">
                    {{ formatTime(item.post.createdAt) }}
                    <span>{{ getAudienceIcon(item.post.audience) }}</span>
                  </p>
                </div>
              </div>

              <!-- Can view original post -->
              <div v-if="canViewOriginalPost(item.post)">
                <p>{{ item.post.content }}</p>
                <div v-if="item.post.media">
                  <img v-if="item.post.mediaType === 'image'" :src="getMediaUrl(item.post.media)" class="post-image" />
                  <video v-else-if="item.post.mediaType === 'video'" controls class="post-video">
                    <source :src="getMediaUrl(item.post.media)" type="video/mp4" />
                  </video>
                </div>
              </div>

              <!-- Restricted view -->
              <div v-else class="restricted-post-warning">
                <p class="notice-message" v-if="item.post.audience === 'friends'">
                  Only friends of this user can see this post
                </p>
                <p class="notice-message" v-else-if="item.post.audience === 'private'">
                  This post is private
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "HiddenItems",
  data() {
    return {
      userId: null,
      hiddenItems: [],
      filter: 'all'
    };
  },
  computed: {
    filteredItems() {
      if (this.filter === 'all') return this.hiddenItems;
      return this.hiddenItems.filter(i => i.type === this.filter);
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
      return `http://localhost:3000/${user.avatar}`;
    },
    getMediaUrl(path) {
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
    }
  },
  mounted() {
    this.fetchHiddenItems();
  }
};
</script>

<style scoped>
.hidden-items-page {
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

.hidden-count {
  margin: 0;
  font-size: 15px;
  color: #65676b;
  font-weight: 500;
}

.filter-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  background: white;
  padding: 12px;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.tab-btn {
  flex: 1;
  padding: 12px 16px;
  background: #f0f2f5;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  color: #65676b;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  background: #e4e6ea;
}

.tab-btn.active {
  background: #1877f2;
  color: white;
}

.tab-counter {
  font-size: 12px;
  margin-left: 4px;
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

.avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  margin-right: 12px;
  object-fit: cover;
}

.avatar-small {
  width: 36px;
  height: 36px;
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

.unhide-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  border: none;
  background: #e7f3ff;
  color: #1877f2;
  cursor: pointer;
  transition: all 0.2s;
}

.unhide-btn:hover {
  background: #d0e7ff;
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

.action-icon {
  width: 20px;
  height: 20px;
}

/* Shared post styles */
.shared-post {
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  padding: 10px;
  border-radius: 10px;
}

.shared-box {
  background: white;
  padding: 12px;
  border-left: 3px solid #ccc;
  margin-top: 12px;
  border-radius: 8px;
}

.restricted-post-warning {
  padding: 16px;
  background: #fef2f2;
  border-radius: 8px;
  border: 1px solid #fecaca;
}

.notice-message {
  color: #991b1b;
  font-style: italic;
  font-size: 14px;
  margin: 0;
}

@media (max-width: 768px) {
  .hidden-items-page {
    padding: 12px;
  }
  
  .header-section {
    padding: 20px;
  }
  
  .filter-tabs {
    gap: 4px;
    padding: 8px;
  }
  
  .tab-btn {
    padding: 8px 12px;
    font-size: 14px;
  }
  
  .post {
    padding: 16px;
  }
  
  .avatar {
    width: 36px;
    height: 36px;
  }
}
</style>