<template>
  <div class="profile-wrapper" v-if="user && (user._id || user.id)">
    
    <div class="profile-header">
      <div class="cover-container">
        <img 
          :src="user.coverPhoto ? `http://localhost:3000/${user.coverPhoto}` : defaultCover" 
          class="cover-image"
        />
        <div class="cover-overlay"></div>
        <button class="btn-glass edit-cover">
          📷 Chỉnh sửa ảnh bìa
        </button>
      </div>

      <div class="user-identity-card">
        <div class="avatar-wrapper">
          <img 
            :src="getAvatarUrl(user)" 
            class="profile-avatar"
          />
          <button class="edit-avatar">📷</button>
        </div>
        
        <div class="identity-content">
          <h1 class="user-name">{{ user.firstname }} {{ user.lastname }}</h1>
          <p class="user-bio-short" v-if="user.bio">{{ user.bio }}</p>
          
          <div class="stats-row">
            <div class="stat-item">
              <span class="stat-val">{{ userPosts.length }}</span>
              <span class="stat-label">Posts</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-val">{{ user.friends?.length || 0 }}</span>
              <span class="stat-label">Friends</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-val">{{ postsWithImages.length }}</span>
              <span class="stat-label">Photos</span>
            </div>
          </div>

          <div class="action-buttons">
          <button class="btn-primary-gradient" @click="openEditProfileModal">
            Edit Profile
          </button>
          <button class="btn-glass-dark">⋯</button>
        </div>
        </div>
      </div>
    </div>

    <div class="nav-wrapper">
      <div class="glass-nav">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          :class="['nav-pill', { active: activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <div class="main-layout">
      
      <template v-if="activeTab === 'posts'">
        
        <aside class="layout-sidebar">
          <div class="widget-card intro-widget">
            <div class="widget-header"><h3>Intro</h3><span class="see-all" @click="switchTab('about')">See all</span></div>
            <div class="info-list">
              <div class="info-row"><span class="icon">Joined date: </span><span>{{ joinDateFormatted }}</span></div>
              <div class="info-row" v-if="user.location"><span class="icon">Location: </span><span>{{ user.location }}</span></div>
            </div>
          </div>
          
          <div class="widget-card photos-widget">
            <div class="widget-header"><h3>Photos</h3><span class="see-all" @click="switchTab('photos')">See all</span></div>
            <div class="mini-grid">
              <div v-for="photo in postsWithImages.slice(0, 9)" :key="photo._id" class="mini-photo">
                <img :src="`http://localhost:3000/${photo.media}`" />
              </div>
            </div>
          </div>

          <div class="widget-card friends-widget">
            <div class="widget-header"><h3>Friends</h3><span class="see-all">See all</span></div>
            <div v-if="user.friends?.length" class="mini-grid-friends">
              <div v-for="friend in user.friends.slice(0, 9)" :key="friend._id" class="mini-friend">
                <img :src="getAvatarUrl(friend)" />
                <span class="friend-name-mini">{{ friend.firstname }}</span>
              </div>
            </div>
          </div>
        </aside>

        <main class="layout-feed">
          
          <div class="create-post">
            <h3>Create your post</h3>
            <input type="text" @click="openCreatePostModal" :placeholder="`What's is on your mind, ${user?.firstname} ${user?.lastname}?`"/>
          </div>

          <div v-if="userPosts.length" class="post-list">
            <div v-for="post in userPosts" :key="post._id" class="post-item card">

              <div v-if="post.type === 'post' || post.type === 'original'">
                <div class="post-header">
                  <div class="post-author-info">
                    <img :src="getAvatarUrl(post.author)" class="avatar-small" />
                    <div class="author-details">
                      <strong>{{ post.author.firstname }} {{ post.author.lastname }}</strong>
                      <p class="time">
                        {{ formatTime(post.createdAt) }}
                        <span v-if="post.audience === 'public'">🌍</span>
                        <span v-else-if="post.audience === 'friends'">👥</span>
                        <span v-else-if="post.audience === 'private'">🔒</span>
                      </p>
                    </div>
                  </div>

                  <div class="post-menu-wrapper">
                    <img src="../assets/menu.png" class="menu-post-icon" @click="toggleMenu(post._id)" />
                    <div v-if="openMenuId === post._id" class="dropdown-menu">
                      <button v-if="isMyPost(post)" @click="editPost(post)"><img src="../assets/edit.png" class="menu-icon-left"/> Edit Post</button>
                      <button v-if="!isMyPost(post)" @click="hideThisPost(post._id)"><img src="../assets/hide.png" class="menu-icon-left"/> Hide Post</button>
                      <button v-if="isMyPost(post)" @click="deletePost(post._id)" style="color: red"><img src="../assets/delete.png" class="menu-icon-left"/> Delete Post</button>
                    </div>
                  </div>
                </div>

                <div v-if="post.content" class="post-content-wrapper">
                  <p class="post-text" :class="{ 'content-collapsed': shouldShowReadMore(post._id) && !expandedPosts[post._id] }">
                    {{ getDisplayedContent(post) }}
                  </p>
                  <button v-if="shouldShowReadMore(post._id)" @click="togglePostContent(post._id)" class="read-more-btn">
                    {{ expandedPosts[post._id] ? 'Show Less' : 'Show More' }}
                  </button>
                </div>

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

                <div class="post-stats">
                  <span v-if="post.likes?.length > 0">{{ post.likes.length }} liked</span>
                  <span v-if="(post.commentCount || 0) + (post.replyCommentCount || 0) > 0">
                    {{ (post.commentCount || 0) + (post.replyCommentCount || 0) }} commented
                  </span>
                  <span v-if="post.sharesCount > 0">{{ post.sharesCount }} shared</span>
                  <span v-if="getPostSaveCount(post) > 0">{{ getPostSaveCount(post) }} saved</span>
                </div>

                <div class="post-actions">
                  <button @click="toggleLike(post)">
                    <img :src="isLiked(post) ? require('../assets/like.png') : require('../assets/unlike.png')" class="action-icon" /> <span>Like</span>
                  </button>
                  <button @click="openCommentModal(post)">
                    <img src="../assets/comment.png" class="action-icon" /> <span>Comment</span>
                  </button>
                  <button @click="openShareModal(post)">
                    <img src="../assets/share.png" class="action-icon" /> <span>Share</span>
                  </button>
                  <button @click="toggleSavePost(post)">
                    <img :src="isSaved(post) ? require('../assets/saved.png') : require('../assets/save.png')" class="action-icon" /> <span>{{ isSaved(post) ? 'Saved' : 'Save' }}</span>
                  </button>
                </div>
              </div>

              <div v-else-if="post.type === 'share'" class="shared-post">
                <div class="post-header">
                  <div class="post-author-info">
                    <img :src="getAvatarUrl(post.username)" alt="avatar" />
                    <div class="author-details">
                      <strong>{{ post.username?.firstname }} {{ post.username?.lastname }}</strong>
                      <p class="time">
                        {{ formatTime(post.createdAt) }} • Shared
                        <span v-if="post.audience === 'public'">🌍</span>
                        <span v-else-if="post.audience === 'friends'">👥</span>
                        <span v-else-if="post.audience === 'private'">🔒</span>
                      </p>
                    </div>
                  </div>
                  <div class="post-menu-wrapper">
                    <img src="../assets/menu.png" class="menu-post-icon" @click="toggleMenu(post._id)" />
                    <div v-if="openMenuId === post._id" class="dropdown-menu">
                      <button v-if="isMyShare(post)" @click="editShare(post)"><img src="../assets/edit.png" class="menu-icon-left"/> Edit Share</button>
                      <button v-if="!isMyShare(post)" @click="hideThisShare(post._id)"><img src="../assets/hide.png" class="menu-icon-left"/> Hide Share</button>
                      <button v-if="isMyShare(post)" @click="deleteShare(post._id)" style="color: red"><img src="../assets/delete.png" class="menu-icon-left"/> Delete Share</button>
                    </div>
                  </div>
                </div>

                <div v-if="post.content" class="post-content-wrapper">
                  <p class="post-text" :class="{ 'content-collapsed': shouldShowReadMore(post._id) && !expandedPosts[post._id] }">
                    <i>{{ getDisplayedContent(post) }}</i>
                  </p>
                  <button v-if="shouldShowReadMore(post._id)" @click="togglePostContent(post._id)" class="read-more-btn">
                    {{ expandedPosts[post._id] ? 'Show Less' : 'Show More' }}
                  </button>
                </div>

                <div class="shared-box">
                  <template v-if="post.post">
                    <template v-if="post.canViewPost === false || !canViewSharedPost(post.post)">
                      <div class="restricted-post-warning">
                        <img :src="getAvatarUrl(post.post.author)" class="avatar-small" />
                        <div class="restricted-content">
                          <strong>{{ post.post.author.firstname }} {{ post.post.author.lastname }}</strong>
                          <p class="notice-message">{{ getPostAccessMessage(post.post) }}</p>
                        </div>
                      </div>
                    </template>
                    <template v-else>
                      <div class="post-header">
                        <img :src="getAvatarUrl(post.post.author)" class="avatar-small" />
                        <div class="author-details">
                          <strong>{{ post.post.author.firstname }} {{ post.post.author.lastname }}</strong>
                          <p class="time">{{ formatTime(post.post.createdAt) }}</p>
                        </div>
                      </div>
                      <div v-if="post.post.content" class="post-content-wrapper">
                        <p :class="{ 'content-collapsed': shouldShowReadMore(post.post._id) && !expandedPosts[post.post._id] }">
                          {{ getDisplayedContent(post.post) }}
                        </p>
                        <button v-if="shouldShowReadMore(post.post._id)" @click="togglePostContent(post.post._id)" class="read-more-btn">
                          {{ expandedPosts[post.post._id] ? 'Show Less' : 'Show More' }}
                        </button>
                      </div>
                      <div v-if="post.post.media">
                        <img v-if="post.post.mediaType === 'image'" :src="`http://localhost:3000/${post.post.media}`" class="post-image" />
                        <video v-else controls class="post-video"><source :src="`http://localhost:3000/${post.post.media}`" type="video/mp4" /></video>
                      </div>
                      <div class="post-actions">
                        <button @click="openCommentModal(post.post)"><img src="../assets/arrow.png" class="action-icon" /> <span>Open Origin Post</span></button>
                      </div>
                    </template>
                  </template>
                  <template v-else>
                    <div class="restricted-post-warning"><p class="notice-message">This post is deleted</p></div>
                  </template>
                </div>
              </div>

            </div>
          </div>
          
          <p v-else class="no-posts">No Posts</p>
        </main>
      </template>

      <template v-else-if="activeTab === 'about'">
        <div class="about-container-modern">
          <div class="about-card">
            <h2>About Me</h2>
            <div class="bio-large">{{ user.bio || "No bio yet." }}</div>
            <div class="details-grid">
              <div class="detail-box"><span class="label">Email</span><span class="value">{{ user.email }}</span></div>
              <div class="detail-box"><span class="label">Username</span><span class="value">@{{ user.username }}</span></div>
              <div class="detail-box"><span class="label">Gender</span><span class="value">{{ formatGender(user.gender) }}</span></div>
              <div class="detail-box"><span class="label">Birthday</span><span class="value">{{ formatBirthday(user.birthday) }}</span></div>
              <div class="detail-box"><span class="label">Joined date</span><span class="value">{{ joinDateFormatted }}</span></div>
              <div class="detail-box"><span class="label">Location</span><span class="value">{{ user.location }}</span></div>
            </div>
          </div>
        </div>
      </template>

      <template v-else-if="activeTab === 'photos'">
        <div class="photos-container-modern" style="grid-column: 1 / -1;">
          <div class="card">
            <h2>Photos</h2>
            
            <div v-if="postsWithImages.length > 0" class="photos-grid-large">
              <div 
                v-for="post in postsWithImages" 
                :key="post._id" 
                class="photo-card"
                @click="openCommentModal(post)"
              >
                <img :src="`http://localhost:3000/${post.media}`" class="photo-large"/>
                
                <div class="photo-overlay">
                  <div class="overlay-stat">
                    <span>❤️</span> {{ post.likes?.length || 0 }}
                  </div>
                  <div class="overlay-stat">
                    <span>💬</span> {{ (post.commentCount || 0) + (post.replyCommentCount || 0) }}
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="empty-state">
              <p>No photos to show.</p>
            </div>
          </div>
        </div>
      </template>

      <template v-else-if="activeTab === 'friends'">
        <div class="friends-container-modern">
          <div v-for="friend in user.friends" :key="friend._id" class="friend-card-modern">
            <img :src="getAvatarUrl(friend)" />
            <div class="info"><h4>{{ friend.firstname }} {{ friend.lastname }}</h4><button>Message</button></div>
          </div>
        </div>
      </template>
    </div>

    <CreatePostModal v-if="createPostModalVisible" :is-visible="createPostModalVisible" :user="user" @close="closeCreatePostModal" @posted="handlePostCreated" />
    <ConfirmDialog v-if="confirmVisible" :message="confirmMessage" @confirm="handleConfirmedDelete" @cancel="confirmVisible = false" />
    <EditPostModal v-if="editModalVisible" :is-visible="editModalVisible" :post="editPostData" :user="user" @close="closeEditModal" @updated="handlePostUpdated" />
    <CommentModal v-if="commentModalVisible" :is-visible="commentModalVisible" :post="selectedPost" :user="user" @close="closeCommentModal" @liked="handlePostLiked" @share="openShareModal" @comment-count-updated="handleCommentCountUpdated" @rating-updated="handleRatingUpdated" />
    <ShareModal v-if="shareModalVisible" :post="sharedPost" :user="user" @close="closeShareModal" @shared="handlePostShared" />
    <EditShareModal v-if="showEditShareModal" :share="editedShare" @close="showEditShareModal = false" @updated="fetchUserPosts" />
    <EditProfileModal
  v-if="editProfileModalVisible"
  :is-visible="editProfileModalVisible"
  :user="user"
  @close="closeEditProfileModal"
  @save="handleProfileSave"
/>
  </div>
</template>

<script>
import ConfirmDialog from './ConfirmDialog.vue';
import EditShareModal from './EditShareModal.vue';
import CommentModal from './CommentModal.vue';
import ShareModal from './ShareModal.vue';
import EditPostModal from './EditPostModal.vue';
import CreatePostModal from './CreatePostModal.vue'; // ✅ IMPORT CreatePostModal
import EditProfileModal from './EditProfileModal.vue';

export default {
  name: "ProfilePage",
  components: {
    ConfirmDialog,
    EditShareModal,
    CommentModal,
    ShareModal,
    EditPostModal,
    CreatePostModal,
    EditProfileModal 
  },
  data() {
    return {
      user: {},
      userPosts: [],
      openMenuId: null,
      confirmVisible: false,
      confirmMessage: '',
      postToDeleteId: null,

      // Edit post
      editModalVisible: false,
      editPostData: null,

      createPostModalVisible: false,
      activeTab: "posts",
      tabs: [
        { id: "posts", label: "Posts" },
        { id: "about", label: "About" },
        { id: "friends", label: "Friends" },
        { id: "photos", label: "Photos" }
      ],
      defaultAvatar: "uploads/user.png",
      defaultCover: "uploads/cover.png",
   

      // ===== Modal Comment =====
      commentModalVisible: false,
      selectedPost: null,

      // ===== Modal Share =====
      shareModalVisible: false,
      sharedPost: null,
      showEditShareModal: false,
      editedShare: null,

      // Save posts functionality
      savedPosts: [],
      postSaveCounts: {},

      // Expand posts functionality
      expandedPosts: {},
      postLineCounts: {},

      editProfileModalVisible: false,
    };
  },
  computed: {
    joinDateFormatted() {
      return this.user.createdAt
        ? new Date(this.user.createdAt).toLocaleDateString()
        : "N/A";
    },
    postsWithImages() {
      return this.userPosts.filter(p => p.mediaType === "image");
    }
  },
  methods: {
    getAvatarUrl(author) {
      return author.avatar
        ? `http://localhost:3000/${author.avatar}`
        : `http://localhost:3000/${this.defaultAvatar}`;
    },
    formatTime(dateStr) {
      return new Date(dateStr).toLocaleString();
    },

    formatBirthday(dateStr) {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    },
    
    formatGender(gender) {
      if (!gender) return '';
      const genderMap = {
        'male': 'Male',
        'female': 'Female',
        'other': 'Other'
      };
      return genderMap[gender] || gender;
    },

    toggleMenu(postId) {
      this.openMenuId = this.openMenuId === postId ? null : postId;
    },

    async fetchUserProfile() {
      try {
        const savedUser = JSON.parse(localStorage.getItem("user"));
        if (!savedUser) return this.$router.push("/login");
        const res = await fetch(`http://localhost:3000/users/${savedUser.id}`);
        this.user = await res.json();
      } catch (err) {
        console.error("Lỗi tải thông tin user:", err);
      }
    },

    async fetchUserPosts() {
      try {
        const savedUser = JSON.parse(localStorage.getItem("user"));
        if (!savedUser) return;
        const res = await fetch(`http://localhost:3000/feeds/users/${savedUser.id}`);
        const data = await res.json();
        this.userPosts = Array.isArray(data) ? data : [];
        
        // Fetch save counts và calculate line counts
        this.fetchAllSaveCounts();
        this.$nextTick(() => {
          this.calculateAllPostLineCounts();
        });
      } catch (err) {
        console.error("Lỗi tải bài viết:", err);
        this.userPosts = [];
      }
    },

    isMyPost(post) {
      const savedUser = JSON.parse(localStorage.getItem("user"));
      return savedUser && post.author._id === savedUser.id;
    },

    // ===== CREATE POST =====
    openCreatePostModal() {
      this.createPostModalVisible = true;
    },
    
    closeCreatePostModal() {
      this.createPostModalVisible = false;
    },
    
    async handlePostCreated() {
      this.closeCreatePostModal();
      await this.fetchUserPosts();
    },

    // Edit Post
    editPost(post) {
      this.editPostData = post;
      this.editModalVisible = true;
      this.openMenuId = null;
    },

    closeEditModal() {
      this.editModalVisible = false;
      this.editPostData = null;
    },

    async handlePostUpdated() {
      this.closeEditModal();
      await this.fetchUserPosts();
    },

    // Delete Post
    deletePost(postId) {
      this.confirmMessage = 'Are you sure to delete this post?';
      this.postToDeleteId = postId;
      this.confirmVisible = true;
    },

    async handleConfirmedDelete() {
      try {
        const res = await fetch(`http://localhost:3000/posts/${this.postToDeleteId}`, {
          method: 'DELETE'
        });

        if (res.ok) {
          this.userPosts = this.userPosts.filter(p => p._id !== this.postToDeleteId);
          this.openMenuId = null;
        }
      } catch (err) {
        console.error("Fail to delete post:", err);
      }
      this.confirmVisible = false;
    },

    // ===== COMMENT MODAL - Use Component =====
    openCommentModal(post) {
      this.selectedPost = post;
      this.commentModalVisible = true;
    },

    closeCommentModal() {
      this.commentModalVisible = false;
      this.selectedPost = null;
    },

    // ✅ Handle events from CommentModal
    handlePostLiked({ postId, likes }) {
      const post = this.userPosts.find(p => p._id === postId);
      if (post) {
        post.likes = likes;
      }
    },

    handleCommentCountUpdated({ postId, count }) {
      const post = this.userPosts.find(p => p._id === postId);
      if (post) {
        post.commentCount = count;
      }
    },

    handleRatingUpdated({ postId, totalRatings, averageRating }) {
      const post = this.userPosts.find(p => p._id === postId);
      if (post) {
        post.totalRatings = totalRatings;
        post.averageRating = averageRating;
      }
    },

    // ===== SHARE MODAL =====
    openShareModal(post) {
      this.shareModalVisible = true;
      this.sharedPost = post;
    },
    
    closeShareModal() {
      this.shareModalVisible = false;
      this.sharedPost = null;
    },
    
    async handlePostShared() {
      this.closeShareModal();
      await this.fetchUserPosts(); // Reload posts to show new share
      alert('Post shared successfully!');
    },

    isMyShare(share) {
      const savedUser = JSON.parse(localStorage.getItem("user"));
      return savedUser && share.username._id === savedUser.id;
    },

    async deleteShare(shareId) {
      if (confirm("Are you sure you want to delete this shared post?")) {
        await this.$axios.delete(`/shares/${shareId}`);
        this.fetchUserPosts();
      }
    },

    editShare(share) {
      this.editedShare = share;
      this.showEditShareModal = true;
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
    },

    // ===== LIKE POST =====
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

    // ===== SAVE POST METHODS =====
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
      
      if (post.savesCount !== undefined) {
        return post.savesCount;
      }
      
      if (this.postSaveCounts[post._id] !== undefined) {
        return this.postSaveCounts[post._id];
      }
      
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

      const postIndex = this.userPosts.findIndex(p => p._id === postId || (p.post && p.post._id === postId));
      if (postIndex !== -1) {
        const post = this.userPosts[postIndex];
        if (post.post) {
          post.post.savesCount = this.postSaveCounts[postId];
        } else {
          post.savesCount = this.postSaveCounts[postId];
        }
      }
    },

    async fetchAllSaveCounts() {
      const postIds = [];
      
      this.userPosts.forEach(post => {
        if (post.type === 'original') {
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
          headers: {
            'Content-Type': 'application/json',
          },
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

    isSaved(post) {
      return this.savedPosts.includes(post._id);
    },

    // ===== EXPAND POST CONTENT =====
    calculatePostLineCount(post) {
      if (post?.content) {
        const content = post.content.trim();
        const lines = content.split('\n').filter(line => line.trim().length > 0);
        this.postLineCounts[post._id] = {
          lineCount: lines.length,
          charCount: content.length
        };
      }
    },
    
    calculateAllPostLineCounts() {
      this.userPosts.forEach(post => {
        if (post.type === 'original') {
          this.calculatePostLineCount(post);
        } else if (post.type === 'share' && post.post) {
          this.calculatePostLineCount(post.post);
        }
      });
    },
    
    togglePostContent(postId) {
      this.expandedPosts[postId] = !this.expandedPosts[postId];
    },

    shouldShowReadMore(postId) {
      const counts = this.postLineCounts[postId];
      if (!counts) return false;
      return counts.lineCount > 10 || counts.charCount > 300;
    },

    getDisplayedContent(post) {
      if (!post?.content) return '';
      const postId = post._id;
      
      if (!this.shouldShowReadMore(postId) || this.expandedPosts[postId]) {
        return post.content;
      }
      
      const counts = this.postLineCounts[postId];
      
      if (counts.lineCount > 10) {
        const lines = post.content.split('\n');
        return lines.slice(0, 10).join('\n') + '...';
      }
      
      if (counts.charCount > 300) {
        return post.content.substring(0, 300) + '...';
      }
      
      return post.content;
    },

    switchTab(tabId) {
    this.activeTab = tabId;
    // Cuộn nhẹ lên phần menu nav để người dùng biết đã chuyển tab
    const navElement = this.$el.querySelector('.profile-nav') || this.$el.querySelector('.nav-wrapper');
    if (navElement) {
      navElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  },

  openEditProfileModal() {
    this.editProfileModalVisible = true;
  },

  closeEditProfileModal() {
    this.editProfileModalVisible = false;
  },

  async handleProfileSave(updatedData) {
    try {
      const savedUser = JSON.parse(localStorage.getItem("user"));
      
      // Gọi API Update User (Lưu ý: Backend cần có route PUT /users/:id)
      const res = await fetch(`http://localhost:3000/users/${savedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });

      if (res.ok) {
        const newUser = await res.json();
        this.user = newUser; // Cập nhật lại giao diện
        // Cập nhật localStorage nếu cần thiết để đồng bộ header
        localStorage.setItem("user", JSON.stringify({ ...savedUser, ...newUser }));
        
        this.closeEditProfileModal();
        alert("Cập nhật thông tin thành công!");
      } else {
        alert("Lỗi khi cập nhật thông tin");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi server");
    }
  }

  },
  mounted() {
    this.fetchUserProfile();
    this.fetchUserPosts();
    this.loadSavedPosts();
  }
};
</script>

<style scoped>
/* --- 1. GLOBAL & HEADER NEW STYLE --- */
:root {
  --primary-color: #6366f1;
  --bg-color: #f3f4f6;
}

.profile-wrapper {
  background-color: #f3f4f6;
  min-height: 100vh;
  font-family: 'Inter', sans-serif;
  padding-bottom: 60px;
}

/* HEADER GLASSMORPHISM */
.profile-header {
  background: white;
  padding-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  position: relative;
  margin-bottom: 20px;
}

.cover-container {
  height: 350px;
  position: relative;
  overflow: hidden;
}
.cover-image { width: 100%; height: 100%; object-fit: cover; }
.cover-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(to bottom, transparent 70%, rgba(0,0,0,0.5)); }
.edit-cover { position: absolute; bottom: 20px; right: 30px; z-index: 5; }

.user-identity-card {
  display: flex; flex-direction: column; align-items: center;
  margin-top: -75px; position: relative; z-index: 10; padding: 0 20px;
}
.avatar-wrapper { position: relative; }
.profile-avatar {
  width: 160px; height: 160px; border-radius: 50%; border: 5px solid white;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15); object-fit: cover; background: white;
}
.edit-avatar {
  position: absolute; bottom: 10px; right: 10px; background: #f3f4f6; border: 2px solid white;
  width: 36px; height: 36px; border-radius: 50%; cursor: pointer;
  display: flex; align-items: center; justify-content: center; font-size: 18px;
}

.identity-content { text-align: center; margin-top: 12px; max-width: 700px; }
.user-name { font-size: 32px; font-weight: 800; color: #111827; margin: 0 0 4px 0; }
.user-bio-short { color: #6b7280; margin: 0 auto 20px; font-size: 16px; }

.stats-row {
  display: inline-flex; justify-content: center; align-items: center; gap: 24px;
  margin-bottom: 24px; background: white; padding: 12px 32px;
  border-radius: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #f3f4f6;
}
.stat-item { text-align: center; display: flex; flex-direction: column; }
.stat-val { font-weight: 800; font-size: 20px; color: #111827; }
.stat-label { font-size: 12px; color: #9ca3af; text-transform: uppercase; font-weight: 600; }
.stat-divider { width: 1px; height: 30px; background: #e5e7eb; }
.action-buttons { display: flex; gap: 12px; justify-content: center; }

/* BUTTONS NEW */
.btn-glass { background: rgba(255, 255, 255, 0.25); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.4); color: white; padding: 10px 20px; border-radius: 12px; cursor: pointer; font-weight: 600; }
.btn-primary-gradient { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; border: none; padding: 10px 28px; border-radius: 24px; font-weight: 600; cursor: pointer; }
.btn-glass-dark { background: white; color: #374151; border: 1px solid #e5e7eb; padding: 10px 24px; border-radius: 24px; font-weight: 600; cursor: pointer; }

/* NAV NEW */
.nav-wrapper { display: flex; justify-content: center; margin-bottom: 32px; position: sticky; top: 60px; z-index: 90; padding: 10px 0; }
.glass-nav { background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(16px); padding: 6px; border-radius: 100px; display: flex; gap: 6px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border: 1px solid rgba(255,255,255,0.6); }
.nav-pill { padding: 10px 28px; border-radius: 40px; border: none; background: transparent; color: #6b7280; font-weight: 600; cursor: pointer; transition: all 0.3s; }
.nav-pill.active { background: #111827; color: white; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }

/* MAIN LAYOUT */
.main-layout { display: grid; grid-template-columns: 360px 1fr; gap: 28px; max-width: 1120px; margin: 0 auto; padding: 0 20px; }
.layout-sidebar { position: sticky; top: 130px; height: fit-content; display: flex; flex-direction: column; gap: 24px; }

/* WIDGETS NEW */
.widget-card { background: white; border-radius: 20px; padding: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); border: 1px solid rgba(243, 244, 246, 0.8); }
.widget-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.widget-header h3 { font-size: 18px; font-weight: 800; margin: 0; color: #111827; }
.see-all { color: #6366f1; font-size: 14px; font-weight: 600; cursor: pointer; }
.info-row { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; color: #4b5563; font-size: 15px; }
.mini-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; border-radius: 12px; overflow: hidden; }
.mini-photo img { width: 100%; aspect-ratio: 1; object-fit: cover; cursor: pointer; }
.mini-grid-friends { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.mini-friend { text-align: center; cursor: pointer; }
.mini-friend img { width: 100%; aspect-ratio: 1; border-radius: 12px; object-fit: cover; margin-bottom: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.friend-name-mini { font-size: 12px; font-weight: 600; display: block; color: #374151; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* --- 2. CLASSIC FEED STYLES (RESTORED FROM OLD CODE) --- */

/* Create Post Box */
.create-post {
  background: white; padding: 15px; border-radius: 10px; margin-bottom: 20px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1); /* Thêm shadow nhẹ cho hợp với nền mới */
}
.create-post input {
  width: 100%; padding: 12px; font-size: 15px; border: 1px solid #ccc; border-radius: 8px; box-sizing: border-box;
  background: #f9fafb; /* Nền input hơi xám nhẹ */
}

/* Post Item */
.post-item {
  background: white; padding: 15px; border-radius: 10px; margin-bottom: 20px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

/* Post Header */
/* Tìm đoạn này trong <style scoped> */
.post-header {
  display: flex;
  align-items: center;
  
  /* SỬA DÒNG NÀY: Chuyển từ space-between (hoặc mặc định) thành flex-start */
  justify-content: flex-start !important; 
  
  /* Thêm khoảng cách giữa Avatar và Tên */
  gap: 12px; 
  
  margin-bottom: 12px;
}
.post-author-info { display: flex; align-items: flex-start; flex: 1; gap: 10px; }
.post-author-info img, .avatar-small { width: 40px; height: 40px; border-radius: 50%; margin-right: 0px; object-fit: cover; flex-shrink: 0; }
.author-details { display: flex; flex-direction: column; justify-content: center; min-width: 0; }
.author-details strong { font-size: 15px; font-weight: 600; color: #1c1e21; line-height: 1.2; }
.author-details .time { font-size: 12px; color: #65676b; margin-top: 2px; line-height: 1.2; }

/* Menu Dropdown */
.post-menu-wrapper { position: relative; display: flex; align-items: center; }
.menu-post-icon { width: 24px; height: 24px; cursor: pointer; padding: 8px; border-radius: 50%; transition: background 0.2s; }
.menu-post-icon:hover { background: #f0f2f5; }
.dropdown-menu { position: absolute; top: 40px; right: 0; background: white; border: 1px solid #ccc; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.2); z-index: 1000; min-width: 240px; }
.dropdown-menu button { display: block; width: 100%; padding: 12px 16px; background: none; border: none; text-align: left; cursor: pointer; font-size: 15px; }
.dropdown-menu button:hover { background-color: #f0f2f5; }
.menu-icon-left { width: 20px; height: 20px; margin-right: 10px; vertical-align: middle; }

/* Content */
.post-content-wrapper { margin: 10px 0; }
.post-text { margin: 10px 0; font-size: 14px; white-space: pre-line; word-wrap: break-word; color: #1c1e21; line-height: 1.4; }
.read-more-btn { background: none; border: none; color: #1877f2; font-weight: 600; font-size: 14px; cursor: pointer; padding: 4px 0; }
/* ===== Post Media ===== */
/* Giữ nguyên cho container và ảnh */
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
.rating-statistics { background: linear-gradient(135deg, #fff9e6 0%, #ffe9b8 100%); border: 1px solid #ffd966; border-radius: 12px; padding: 12px 16px; margin: 12px 0; }
.rating-summary { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.average-rating { display: flex; align-items: center; gap: 8px; }
.rating-number { font-size: 28px; font-weight: bold; color: #f57c00; }
.stars-display { display: flex; gap: 2px; }
.star-icon { font-size: 18px; color: #ddd; }
.star-icon.filled { color: #ffc107; }
.rating-count { font-size: 14px; color: #856404; font-weight: 600; }

/* Stats & Actions */
.post-stats { display: flex; gap: 16px; margin: 16px 0 12px 0; font-size: 14px; color: #65676b; }
.post-actions { display: flex; justify-content: space-around; margin-top: 10px; border-top: 1px solid #ddd; padding-top: 10px; }
.post-actions button { background: none; border: none; color: #555; cursor: pointer; font-weight: bold; display: flex; align-items: center; gap: 6px; flex: 1; justify-content: center; padding: 8px; border-radius: 6px; transition: all 0.2s; }
.post-actions button:hover { background: #f2f2f2; }
.action-icon { width: 20px; height: 20px; }

/* Shared Post */
.shared-post { background-color: #f5f5f5; border: 1px solid #ddd; padding: 10px; border-radius: 10px; }
.shared-box { background: white; padding: 10px; border-left: 3px solid #ccc; margin-top: 10px; border-radius: 6px; white-space: pre-line; }
.restricted-post-warning { display: flex; align-items: flex-start; gap: 8px; padding: 16px; background: #fef2f2; border-radius: 12px; margin-top: 16px; }
.notice-message { color: #555; font-style: italic; margin-top: 4px; }

/* Other Tabs (About/Friends) - NEW STYLE */
.about-container-modern { grid-column: 1 / -1; }
.about-card { background: white; border-radius: 24px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); }
.about-card h2 { font-size: 24px; font-weight: 800; margin-bottom: 32px; }
.bio-large { font-size: 20px; color: #374151; margin-bottom: 40px; background: #f9fafb; padding: 24px; border-radius: 16px; border-left: 4px solid #6366f1; }
.details-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }
.detail-box { background: #ffffff; border: 1px solid #e5e7eb; padding: 20px; border-radius: 16px; }
.detail-box .label { display: block; font-size: 12px; color: #9ca3af; margin-bottom: 6px; font-weight: 700; text-transform: uppercase; }
.detail-box .value { font-size: 16px; font-weight: 600; color: #111827; }

.friends-container-modern { grid-column: 1 / -1; display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px; }
.friend-card-modern { background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.03); text-align: center; padding-bottom: 20px; border: 1px solid rgba(243, 244, 246, 0.8); }
.friend-card-modern img { width: 100%; height: 220px; object-fit: cover; }
.friend-card-modern .info { padding: 16px; }
.friend-card-modern h4 { margin: 0 0 12px; font-size: 18px; font-weight: 700; }
.friend-card-modern button { background: #e0e7ff; color: #4f46e5; border: none; padding: 8px 24px; border-radius: 30px; font-weight: 600; cursor: pointer; }

.photos-grid-large {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.photo-card {
  border-radius: 12px;
  overflow: hidden;
  aspect-ratio: 1 / 1;
  cursor: pointer;
  transition: transform 0.2s;
}

.photo-card:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.photo-large {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Responsive */
@media (max-width: 1024px) { .main-layout { grid-template-columns: 300px 1fr; gap: 20px; } }
@media (max-width: 900px) {
  .main-layout { grid-template-columns: 1fr; }
  .layout-sidebar { display: none; }
  .profile-avatar { width: 120px; height: 120px; }
  .user-identity-card { margin-top: -60px; }
}
</style>



