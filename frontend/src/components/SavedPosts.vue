<template>
  <div class="saved-posts-page">
    <!-- Header với counter -->
    <div class="header-section">
      <h2>Saved Posts</h2>
    </div>

    <!-- Filter Tabs với counter -->
    <div class="filter-tabs">
      <button 
        :class="{ active: currentFilter === 'all' }" 
        @click="setFilter('all')"
        class="tab-btn"
      >
        All
        <span class="tab-counter">({{ savedPosts.length }})</span>
      </button>
      <button 
        :class="{ active: currentFilter === 'posts' }" 
        @click="setFilter('posts')"
        class="tab-btn"
      >
        Posts
        <span class="tab-counter">({{ getPostsCount() }})</span>
      </button>
      <button 
        :class="{ active: currentFilter === 'shares' }" 
        @click="setFilter('shares')"
        class="tab-btn"
      >
        Shares
        <span class="tab-counter">({{ getSharesCount() }})</span>
      </button>
    </div>

    <!-- Counter summary cho filtered posts -->
    <div v-if="!loading && filteredPosts.length > 0 && currentFilter !== 'all'" class="posts-counter-summary">
      Showing <span class="highlight">{{ filteredPosts.length }}</span> of <span class="highlight">{{ savedPosts.length }}</span> saved items
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="loading">
      <p>Loading saved posts...</p>
    </div>

    <!-- Empty state -->
    <div v-else-if="filteredPosts.length === 0" class="empty-state">
      <img src="../assets/save.png" alt="No saved posts" class="empty-icon" />
      <h2>No Saved {{ currentFilter === 'all' ? 'Posts' : currentFilter === 'posts' ? 'Posts' : 'Shares' }}</h2>
      <p>{{ getEmptyMessage() }}</p>
      <button @click="$router.push('/home')" class="browse-btn">Browse Posts</button>
    </div>

    <!-- Saved posts list -->
    <div v-else class="posts-container">
      <div class="post" v-for="post in filteredPosts" :key="post._id">
        
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
              <button @click="unsavePost(post)" class="unsave-btn">
              <img src="../assets/saved.png" class="action-icon" />
              <span>Unsave</span>
            </button>
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
              <button @click="unsavePost(post)" class="unsave-btn">
              <img src="../assets/saved.png" class="action-icon" />
              <span>Unsave</span>
            </button>
            </div>
          </div>

          <p class="post-text" v-if="post.content"><i>{{ post.content }}</i></p>

          <!-- ======= BÀI GỐC (bên trong share) ======= -->
          <div class="shared-box">
            <template v-if="post.post">
              <!-- Nếu viewer không được xem -->
              <template v-if="post.canViewPost === false">
                <div class="restricted-post-warning">
                  <img :src="getAvatarUrl(post.post?.author)" class="avatar-small" />
                  <div class="restricted-content">
                    <strong>{{ post.post?.author?.firstname }} {{ post.post?.author?.lastname }}</strong>
                    <p class="time">
                      {{ formatTime(post.post?.createdAt) }}
                      <span v-if="post.post?.audience === 'public'">🌍</span>
                      <span v-else-if="post.post?.audience === 'friends'">👥</span>
                      <span v-else-if="post.post?.audience === 'private'">🔒</span>
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
                  <span v-if="getPostCommentCount(post.post) > 0">{{ getPostCommentCount(post.post) }} commented</span>
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
    </div>

    <!-- Modals -->
    <ShareModal
      v-if="showShareModal && user"
      :post="postToShare"
      :user="user"
      @close="showShareModal = false"
      @shared="handlePostShared"
    />

    <!-- Comment Modal Component -->
    <CommentModal
      v-if="user"
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
      postSaveCounts: {},
      currentFilter: 'all', // 'all', 'posts', 'shares'
      
      // Comment modal data
      commentModalVisible: false,
      selectedPost: null,
      
      // Share modal data
      showShareModal: false,
      postToShare: null,
    }
  },

  computed: {
    filteredPosts() {
      if (this.currentFilter === 'all') {
        return this.savedPosts;
      } else if (this.currentFilter === 'posts') {
        return this.savedPosts.filter(post => post.type === 'post');
      } else if (this.currentFilter === 'shares') {
        return this.savedPosts.filter(post => post.type === 'share');
      }
      return this.savedPosts;
    }
  },

  methods: {
    setFilter(filter) {
      this.currentFilter = filter;
    },

    getAvatarUrl(author) {
      if (!author || !author.avatar) return 'http://localhost:3000/uploads/user.png';
      return `http://localhost:3000/${author.avatar}`;
    },

    async fetchSavedPosts() {
      try {
        const savedUser = JSON.parse(localStorage.getItem("user"));
        console.log("🔍 Saved user:", savedUser);
        
        if (!savedUser || !savedUser.id) {
          console.error("❌ No valid user data");
          this.$router.push("/login");
          return;
        }

        this.loading = true;
        const url = `http://localhost:3000/feeds/saved-items/${savedUser.id}`;
        console.log("🌐 API URL:", url);
        
        const res = await fetch(url);
        console.log("📡 Response status:", res.status);
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error("❌ Response error:", errorText);
          
          if (res.status === 404) {
            console.log("❌ 404 - User or saved items not found");
            this.savedPosts = [];
            return;
          }
          throw new Error(`HTTP error! status: ${res.status} - ${errorText}`);
        }

        const data = await res.json();
        console.log("📦 Raw API data:", data);
        
        // Debug each post's available data
        if (Array.isArray(data) && data.length > 0) {
          console.log("🔍 First post data structure:", data[0]);
          console.log("🔍 Available keys:", Object.keys(data[0]));
        }
        
        this.savedPosts = Array.isArray(data) ? data : [];
        console.log("✅ Final savedPosts count:", this.savedPosts.length);
        
        // Initialize save counts for immediate display
        this.initializeSaveCounts();
        
      } catch (err) {
        console.error("❌ Error fetching saved posts:", err);
        if (!err.message.includes('404')) {
          alert(`Unable to fetch saved posts: ${err.message}`);
        }
        this.savedPosts = [];
      } finally {
        this.loading = false;
      }
    },

    // Initialize save counts from API response
    initializeSaveCounts() {
      this.savedPosts.forEach(post => {
        if (post.type === 'post' && post.savesCount !== undefined) {
          this.postSaveCounts[post._id] = post.savesCount;
          console.log(`📊 Initialized save count for post ${post._id}: ${post.savesCount}`);
        } else if (post.type === 'share' && post.post && post.post.savesCount !== undefined) {
          this.postSaveCounts[post.post._id] = post.post.savesCount;
          console.log(`📊 Initialized save count for shared post ${post.post._id}: ${post.post.savesCount}`);
        }
      });
    },

    // Đếm số lượng posts gốc
    getPostsCount() {
      return this.savedPosts.filter(post => post.type === 'post').length;
    },

    // Đếm số lượng shares
    getSharesCount() {
      return this.savedPosts.filter(post => post.type === 'share').length;
    },

    // Cập nhật empty message để include counter info
    getEmptyMessage() {
      const totalCount = this.savedPosts.length;
      switch (this.currentFilter) {
        case 'posts':
          return `You have ${totalCount} saved items, but no regular posts. Regular posts you save will appear here.`;
        case 'shares':
          return `You have ${totalCount} saved items, but no shared posts. Shared posts you save will appear here.`;
        default:
          return 'Posts you save will appear here';
      }
    },

    // Fetch save count cho một post với improved error handling
    async fetchPostSaveCount(postId) {
      if (this.postSaveCounts[postId] !== undefined) {
        return this.postSaveCounts[postId];
      }

      try {
        console.log(`🔍 Fetching save count for post: ${postId}`);
        const res = await fetch(`http://localhost:3000/posts/${postId}/saves-count`);
        
        if (res.ok) {
          const data = await res.json();
          const count = data.savesCount || 0;
          this.postSaveCounts[postId] = count;
          console.log(`✅ Save count for ${postId}: ${count}`);
          return count;
        } else {
          console.warn(`⚠️ Failed to fetch save count for ${postId}: ${res.status}`);
        }
      } catch (err) {
        console.error(`❌ Error fetching save count for ${postId}:`, err);
      }
      
      this.postSaveCounts[postId] = 0;
      return 0;
    },

    // Get save count với cache và improved debugging
    getPostSaveCount(post) {
      if (!post || !post._id) {
        console.warn("⚠️ Post or post ID is missing");
        return 0;
      }
      
      // Check if save count is directly available in post object
      if (post.savesCount !== undefined) {
        console.log(`📊 Save count from post object for ${post._id}: ${post.savesCount}`);
        return post.savesCount;
      }
      
      // Debug logging
      console.log(`🔍 Debugging save count for post ${post._id}:`, {
        postSavesCount: post.savesCount,
        cachedCount: this.postSaveCounts[post._id],
        allCachedCounts: this.postSaveCounts
      });
      
      // Check cache
      if (this.postSaveCounts[post._id] !== undefined) {
        console.log(`📊 Save count from cache for ${post._id}: ${this.postSaveCounts[post._id]}`);
        return this.postSaveCounts[post._id];
      }
      
      // Trigger fetch if not available
      console.log(`🔄 Triggering fetch for save count of ${post._id}`);
      this.fetchPostSaveCount(post._id);
      return 0; // Return 0 while fetching
    },

    // Update save count khi unsave
    updatePostSaveCount(postId, increment = false) {
      if (this.postSaveCounts[postId] === undefined) {
        this.postSaveCounts[postId] = 0;
      }
      
      if (increment) {
        this.postSaveCounts[postId]++;
      } else {
        this.postSaveCounts[postId] = Math.max(0, this.postSaveCounts[postId] - 1);
      }

      // Cập nhật trong saved posts list nếu có
      const savedPost = this.savedPosts.find(p => p._id === postId || (p.post && p.post._id === postId));
      if (savedPost) {
        if (savedPost.post) {
          savedPost.post.savesCount = this.postSaveCounts[postId];
        } else {
          savedPost.savesCount = this.postSaveCounts[postId];
        }
      }
    },

    // Enhanced unsave method
    async unsavePost(post) {
      const savedUser = JSON.parse(localStorage.getItem("user"));
      if (!savedUser) return alert("Please login");

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
          // Remove from saved posts list
          this.savedPosts = this.savedPosts.filter(p => p._id !== post._id);
          
          // Update save count
          this.updatePostSaveCount(post._id, false);
          
          // Update count cho original post nếu đây là shared post
          if (post.type === 'share' && post.post) {
            this.updatePostSaveCount(post.post._id, false);
          }
          
          const remainingCount = this.savedPosts.length;
          const message = remainingCount > 0 
            ? `Item unsaved successfully. ${remainingCount} items remaining.`
            : 'Item unsaved successfully. No saved items remaining.';
          
          alert(message);
        } else {
          alert(data.msg || 'Failed to unsave item');
        }
      } catch (err) {
        console.error("Cannot unsave item:", err);
        alert("Unable to unsave item");
      }
    },

    // Fetch all save counts for loaded posts
    async fetchAllSaveCounts() {
      const postIds = new Set(); // Use Set to avoid duplicates
      
      this.savedPosts.forEach(post => {
        if (post.type === 'post') {
          postIds.add(post._id);
        } else if (post.type === 'share' && post.post) {
          postIds.add(post.post._id);
        }
      });

      console.log("🔢 Fetching save counts for posts:", Array.from(postIds));

      // Fetch save counts for posts that don't have cached counts
      for (const postId of postIds) {
        if (this.postSaveCounts[postId] === undefined) {
          await this.fetchPostSaveCount(postId);
        }
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
      console.log('Post shared successfully');
    },

    getPostAccessMessage(post) {
      if (!post) return 'Content not available';
      if (post.audience === 'private') {
        return 'This post is private';
      } else if (post.audience === 'friends') {
        return 'Only friends of this user can see';
      } else {
        return 'Content not available';
      }
    }
  },

  created() {
    // Initialize user data early
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      this.user = JSON.parse(savedUser);
    } else {
      this.$router.push("/login");
    }
  },

  mounted() {
    if (this.user) {
      this.fetchSavedPosts().then(() => {
        // 🔥 Fetch save counts after posts are loaded
        this.fetchAllSaveCounts();
      });
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

.header h1 {
  font-size: 24px;
  font-weight: bold;
  color: #1c1e21;
  margin: 0;
}

/* Filter Tabs Styles */
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

.saved-indicator, .unsave-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 12px;
  color: #1877f2;
  font-weight: 500;
  border: none;
  background: transparent;
  cursor: pointer;
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
  background-color: #fed7d7 !important;
}

.action-icon {
  width: 18px;
  height: 18px;
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
  color: #e53e3e;
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

.posts-counter-summary {
  text-align: center;
  padding: 10px;
  background: #f0f2f5;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 14px;
  color: #65676b;
}

.posts-counter-summary .highlight {
  font-weight: 600;
  color: #1877f2;
}

.tab-counter {
  font-size: 12px;
  margin-left: 4px;
}

.header-section {
  text-align: center;
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.header-section h2 {
  margin: 0;
  font-size: 24px;
  font-weight: bold;
  color: #1c1e21;
}

/* Responsive Design */
@media (max-width: 768px) {
  .saved-posts-page {
    padding: 10px;
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
    padding: 12px;
  }
  
  .post-author-info img {
    width: 36px;
    height: 36px;
  }
  
  .author-details strong {
    font-size: 14px;
  }
  
  .post-actions {
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .post-actions button {
    flex: 1;
    min-width: 120px;
    justify-content: center;
  }
}

/* Loading Animation */
.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.loading::after {
  content: '';
  width: 32px;
  height: 32px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #1877f2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Hover Effects */
.post:hover {
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
  transform: translateY(-2px);
  transition: all 0.3s ease;
}

.tab-btn:active {
  transform: scale(0.98);
}

.browse-btn:active {
  transform: scale(0.98);
}

/* Save Count Highlight */
.post-stats span:last-child {
  color: #1877f2;
  font-weight: 600;
}

/* Empty State Animation */
.empty-state {
  animation: fadeIn 0.5s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Post Animation */
.post {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
}
</style>