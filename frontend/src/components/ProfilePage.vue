<template>
  <div class="profile-container">
    <!-- Cover Section -->
    <div class="cover-section">
      <div class="cover-photo">
        <img 
          :src="user.coverPhoto ? `http://localhost:3000/${user.coverPhoto}` : defaultCover" 
          alt="Cover Photo"
          class="cover-image"
        />
        <button class="edit-cover-btn">Chỉnh sửa ảnh bìa</button>
      </div>

      <div class="profile-info-bar">
        <div class="profile-main-info">
          <div class="avatar-container">
            <img 
              :src="user.avatar ? `http://localhost:3000/${user.avatar}` : defaultAvatar" 
              alt="Profile Picture"
              class="profile-avatar"
            />
            <button class="edit-avatar-btn">📷</button>
          </div>

          <div class="user-info">
            <h1 class="user-name">{{ user.firstname }} {{ user.lastname }}</h1>
            <p class="friends-count">{{ user.friends?.length || 0 }} bạn bè</p>
          </div>
        </div>

        <div class="profile-actions">
          <button class="btn btn-secondary">Chỉnh sửa trang cá nhân</button>
          <button class="btn btn-icon">⋯</button>
        </div>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="profile-nav">
      <div class="nav-container">
        <div class="nav-tabs">
          <button 
            v-for="tab in tabs" 
            :key="tab.id"
            :class="['nav-tab', { active: activeTab === tab.id }]"
            @click="activeTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- Profile Content -->
    <div class="profile-content">
      <!-- ========== TAB: BÀI VIẾT ========== -->
      <template v-if="activeTab === 'posts'">
        <!-- Left Column -->
        <div class="content-left">
          <!-- Giới thiệu -->
          <div class="intro-card card">
            <h3>Bio</h3>
            <div class="intro-item">
              <i class="icon-calendar"></i>
              <span>Joined at {{ joinDateFormatted }}</span>
            </div>
          </div>

          <!-- Ảnh -->
          <div class="photos-card card">
            <h3>Ảnh</h3>
            <div class="photos-grid">
              <div 
                v-for="photo in postsWithImages" 
                :key="photo._id"
                class="photo-item"
              >
                <img :src="`http://localhost:3000/${photo.media}`" alt="Post image" />
              </div>
            </div>
          </div>

          <!-- Bạn bè -->
          <div class="friends-card card">
            <h3>Bạn bè</h3>
            <div v-if="user.friends?.length" class="friends-grid">
              <div v-for="friend in user.friends" :key="friend._id" class="friend-item">
                <img :src="`http://localhost:3000/${friend.avatar}`" />
                <span>{{ friend.firstname }} {{ friend.lastname }}</span>
              </div>
            </div>
            <p v-else class="no-friends">Bạn chưa có bạn bè nào</p>
          </div>
        </div>

        <!--  Right Column -->
        <div class="content-right">
          <!-- Create Post -->
          <div class="create-post">
            <h3>Create your post</h3>
            <input type="text" @click="openCreatePostModal" :placeholder="`What's is on your mind, ${user?.firstname} ${user?.lastname}?`"/>
          </div>

          <!-- User Posts -->
          <div v-if="userPosts.length" class="post-list">
            <div v-for="post in userPosts" :key="post._id" class="post-item card">

              <!-- ===== ORIGINAL POST ===== -->
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

                  <!-- menu icon -->
                  <div class="post-menu-wrapper">
                    <img src="../assets/menu.png" class="menu-post-icon" @click="toggleMenu(post._id)" />
                    <div v-if="openMenuId === post._id" class="dropdown-menu">
                      <button v-if="isMyPost(post)" @click="editPost(post)">
                        <img src="../assets/edit.png" class="menu-icon-left"/> Edit Post
                      </button>
                      <button v-if="!isMyPost(post)" @click="hideThisPost(post._id)">
                        <img src="../assets/hide.png" class="menu-icon-left"/> Hide this Post
                      </button>
                      <button v-if="isMyPost(post)" @click="deletePost(post._id)" style="color: red">
                        <img src="../assets/delete.png" class="menu-icon-left"/> Delete Post
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Post Content with Show More/Less -->
                <div v-if="post.content" class="post-content-wrapper">
                  <p class="post-text" :class="{ 'content-collapsed': shouldShowReadMore(post._id) && !expandedPosts[post._id] }">
                    {{ getDisplayedContent(post) }}
                  </p>
                  <button 
                    v-if="shouldShowReadMore(post._id)" 
                    @click="togglePostContent(post._id)" 
                    class="read-more-btn"
                  >
                    {{ expandedPosts[post._id] ? 'Show Less' : 'Show More' }}
                  </button>
                </div>

                <!-- Media -->
                <div v-if="post.media" class="post-media">
                  <img v-if="post.mediaType === 'image'" :src="`http://localhost:3000/${post.media}`" class="post-image" />
                  <video v-else-if="post.mediaType === 'video'" controls class="post-video">
                    <source :src="`http://localhost:3000/${post.media}`" type="video/mp4" />
                  </video>
                </div>

                <!-- Rating Statistics -->
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

                <!-- Post Stats -->
                <div class="post-stats">
                  <span v-if="post.likes?.length > 0">{{ post.likes.length }} liked</span>
                  <span v-if="(post.commentCount || 0) + (post.replyCommentCount || 0) > 0">
                    {{ (post.commentCount || 0) + (post.replyCommentCount || 0) }} commented
                  </span>
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
                  <button @click="toggleSavePost(post)">
                    <img :src="isSaved(post) ? require('../assets/saved.png') : require('../assets/save.png')" class="action-icon" />
                    <span>{{ isSaved(post) ? 'Saved' : 'Save' }}</span>
                  </button>
                </div>
              </div>

              <!-- ===== SHARE POST ===== -->
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

                  <!-- menu share -->
                  <div class="post-menu-wrapper">
                    <img src="../assets/menu.png" class="menu-post-icon" @click="toggleMenu(post._id)" />
                    <div v-if="openMenuId === post._id" class="dropdown-menu">
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

                <!-- Share content with Show More/Less -->
                <div v-if="post.content" class="post-content-wrapper">
                  <p class="post-text" :class="{ 'content-collapsed': shouldShowReadMore(post._id) && !expandedPosts[post._id] }">
                    <i>{{ getDisplayedContent(post) }}</i>
                  </p>
                  <button 
                    v-if="shouldShowReadMore(post._id)" 
                    @click="togglePostContent(post._id)" 
                    class="read-more-btn"
                  >
                    {{ expandedPosts[post._id] ? 'Show Less' : 'Show More' }}
                  </button>
                </div>

                <!-- ======= BÀI GỐC (bên trong share) ======= -->
                <div class="shared-box">
                  <template v-if="post.post">
                    <!-- Nếu viewer không được xem -->
                    <template v-if="post.canViewPost === false || !canViewSharedPost(post.post)">
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
                      
                      <!-- Original post content with Show More/Less -->
                      <div v-if="post.post.content" class="post-content-wrapper">
                        <p :class="{ 'content-collapsed': shouldShowReadMore(post.post._id) && !expandedPosts[post.post._id] }">
                          {{ getDisplayedContent(post.post) }}
                        </p>
                        <button 
                          v-if="shouldShowReadMore(post.post._id)" 
                          @click="togglePostContent(post.post._id)" 
                          class="read-more-btn"
                        >
                          {{ expandedPosts[post.post._id] ? 'Show Less' : 'Show More' }}
                        </button>
                      </div>
                      
                      <div v-if="post.post.media">
                        <img v-if="post.post.mediaType === 'image'" :src="`http://localhost:3000/${post.post.media}`" class="post-image" />
                        <video v-else controls class="post-video">
                          <source :src="`http://localhost:3000/${post.post.media}`" type="video/mp4" />
                        </video>
                      </div>

                      <!-- Actions -->
                      <div class="post-actions">
                        <button @click="openCommentModal(post.post)">
                          <img src="../assets/arrow.png" class="action-icon" />
                          <span>Open Origin Post</span>
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

          <!-- Nếu không có bài -->
          <p v-else class="no-posts">No Posts</p>
        </div>
      </template>

      <!-- ========== TAB: ABOUT ========== -->
    <template v-else-if="activeTab === 'about'">
      <div class="about-page">
        <div class="card">
          <h2>About</h2>
          
          <!-- Basic Information -->
          <div class="info-section">
            <h3>Basic Information</h3>
            <div class="info-item">
              <strong>Full Name:</strong>
              <span>{{ user.firstname }} {{ user.lastname }}</span>
            </div>
            <div class="info-item">
              <strong>Email:</strong>
              <span>{{ user.email || 'Not updated' }}</span>
            </div>
            <div class="info-item">
              <strong>Username:</strong>
              <span>@{{ user.username }}</span>
            </div>
            <div class="info-item">
              <strong>Gender:</strong>
              <span>{{ formatGender(user.gender) || 'Not specified' }}</span>
            </div>
            <div class="info-item">
              <strong>Birthday:</strong>
              <span>{{ user.birthday ? formatBirthday(user.birthday) : 'Not specified' }}</span>
            </div>
            <div class="info-item">
              <strong>Location:</strong>
              <span>{{ user.location || 'Not specified' }}</span>
            </div>
            <div class="info-item">
              <strong>Joined Date:</strong>
              <span>{{ joinDateFormatted }}</span>
            </div>
            <div class="info-item">
              <strong>Friends:</strong>
              <span>{{ user.friends?.length || 0 }} people</span>
            </div>
          </div>

          <!-- About Me / Bio -->
          <div class="info-section">
            <h3>About Me</h3>
            <div class="bio-section">
              <p v-if="user.bio" class="bio-content">{{ user.bio }}</p>
              <p v-else class="bio-content empty">No bio added yet</p>
            </div>
          </div>

          <!-- Activity Statistics -->
          <div class="info-section">
            <h3>Activity</h3>
            <div class="info-item">
              <strong>Total Posts:</strong>
              <span>{{ userPosts.length }} posts</span>
            </div>
            <div class="info-item">
              <strong>Posts with Images:</strong>
              <span>{{ postsWithImages.length }} posts</span>
            </div>
          </div>
        </div>
      </div>
    </template>

      <!-- ========== TAB: BẠN BÈ ========== -->
      <template v-else-if="activeTab === 'friends'">
        <div class="friends-page">
          <div class="card">
            <div class="friends-header">
              <h2>Bạn bè</h2>
              <p class="friends-count-large">{{ user.friends?.length || 0 }} người bạn</p>
            </div>

            <div v-if="user.friends?.length" class="friends-grid-large">
              <div v-for="friend in user.friends" :key="friend._id" class="friend-card">
                <img :src="`http://localhost:3000/${friend.avatar}`" class="friend-avatar-large" />
                <div class="friend-info">
                  <strong>{{ friend.firstname }} {{ friend.lastname }}</strong>
                  <p class="friend-mutual">{{ friend.mutualFriends || 0 }} bạn chung</p>
                </div>
                <button class="btn-message">Nhắn tin</button>
              </div>
            </div>
            
            <div v-else class="no-friends-large">
              <p>Bạn chưa có bạn bè nào</p>
              <button @click="$router.push('/friend')" class="btn btn-primary">
                Tìm bạn bè
              </button>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Modals -->
    <CreatePostModal
      v-if="createPostModalVisible"
      :is-visible="createPostModalVisible"
      :user="user"
      @close="closeCreatePostModal"
      @posted="handlePostCreated"
    />

    <ConfirmDialog
      v-if="confirmVisible"
      :message="confirmMessage"
      @confirm="handleConfirmedDelete"
      @cancel="confirmVisible = false"
    />

    <EditPostModal
      v-if="editModalVisible"
      :is-visible="editModalVisible"
      :post="editPostData"
      :user="user"
      @close="closeEditModal"
      @updated="handlePostUpdated"
    />

    <CommentModal
      v-if="commentModalVisible"
      :is-visible="commentModalVisible"
      :post="selectedPost"
      :user="user"
      @close="closeCommentModal"
      @liked="handlePostLiked"
      @share="openShareModal"
      @comment-count-updated="handleCommentCountUpdated"
      @rating-updated="handleRatingUpdated"
    />

    <ShareModal
      v-if="shareModalVisible"
      :post="sharedPost"
      :user="user"
      @close="closeShareModal"
      @shared="handlePostShared"
    />

    <EditShareModal
      v-if="showEditShareModal"
      :share="editedShare"
      @close="showEditShareModal = false"
      @updated="fetchUserPosts"
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

export default {
  name: "ProfilePage",
  components: {
    ConfirmDialog,
    EditShareModal,
    CommentModal,
    ShareModal,
    EditPostModal,
    CreatePostModal // ✅ REGISTER CreatePostModal
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
        { id: "friends", label: "Friends" }
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
      postLineCounts: {}
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
/* ===== General Profile Layout ===== */
.profile-container {
  max-width: 1200px;
  margin: 0 auto;
  background: #f0f2f5;
  min-height: 100vh;
  font-family: Arial, sans-serif;
}

/* ===== Cover Section ===== */
.cover-section {
  background: white;
  border-radius: 0 0 8px 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 16px;
}

.cover-photo {
  position: relative;
  height: 360px;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.edit-cover-btn {
  position: absolute;
  bottom: 16px;
  right: 16px;
  background: rgba(255,255,255,0.9);
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}

/* ===== Profile Info ===== */
.profile-info-bar {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding: 16px 24px;
  position: relative;
}

.profile-main-info {
  display: flex;
  align-items: flex-end;
  gap: 16px;
}

.avatar-container {
  position: relative;
  margin-top: -50px;
}

.profile-avatar {
  width: 168px;
  height: 168px;
  border-radius: 50%;
  border: 4px solid white;
  object-fit: cover;
}

.edit-avatar-btn {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: #e4e6ea;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-info {
  padding-bottom: 8px;
}

.user-name {
  font-size: 28px;
  font-weight: bold;
  margin: 0;
  color: #1c1e21;
}

.friends-count {
  color: #65676b;
  margin: 4px 0;
  font-size: 15px;
}

/* ===== Profile Actions ===== */
.profile-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-primary {
  background: #1877f2;
  color: white;
}

.btn-secondary,
.btn-icon {
  background: #e4e6ea;
  color: #1c1e21;
}

.btn-icon {
  padding: 8px;
  width: 36px;
  height: 36px;
  justify-content: center;
}

/* ===== Navigation Tabs ===== */
.profile-nav {
  background: white;
  border-top: 1px solid #dadde1;
  border-bottom: 1px solid #dadde1;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
}

.nav-tabs {
  display: flex;
}

.nav-tab {
  background: none;
  border: none;
  padding: 16px 24px;
  font-weight: 600;
  color: #65676b;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  transition: all 0.2s;
}

.nav-tab.active {
  color: #1877f2;
  border-bottom-color: #1877f2;
}

.nav-tab:hover {
  background: #f2f2f2;
}

/* ===== Main Content Layout ===== */
.profile-content {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 16px;
  padding: 16px 24px;
}

/* Single column layout for About and Friends tabs */
.about-page,
.friends-page {
  grid-column: 1 / -1;
}

.card {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 16px;
}

/* ===== Photos Section ===== */
.photos-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  border-radius: 8px;
  overflow: hidden;
}

.photo-item img {
  width: 100%;
  height: 100px;
  object-fit: cover;
  cursor: pointer;
}

/* ===== Friends Section ===== */
.friends-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.friend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
}

.friend-item:hover {
  background: #f2f2f2;
}

.friend-item img {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  object-fit: cover;
}

/* ===== Create Post ===== */
.create-post {
  background: white;
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 20px;
}

.create-post input {
  width: 95%;
  padding: 12px;
  font-size: 15px;
  border: 1px solid #ccc;
  border-radius: 8px;
}

/* ===== Post Item ===== */
.post-item {
  background: white;
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 20px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  position: relative;
  margin-bottom: 12px;
}

.post-author-info {
  display: flex;
  align-items: flex-start;
  flex: 1;
  gap: 10px;
}

.post-author-info img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 0px;
  object-fit: cover;
  flex-shrink: 0;
}

.author-details {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.author-details strong {
  font-size: 15px;
  font-weight: 600;
  color: #1c1e21;
  line-height: 1.2;
}

.author-details .time {
  font-size: 12px;
  color: #65676b;
  margin-top: 2px;
  line-height: 1.2;
}

/* ===== Post Content ===== */
.post-content-wrapper {
  margin: 10px 0;
}

.post-text {
  margin: 10px 0;
  font-size: 14px;
  white-space: pre-line;
  word-wrap: break-word;
  color: #1c1e21;
  line-height: 1.4;
}

.content-collapsed {
  position: relative;
  max-height: none;
  overflow: hidden;
}

.read-more-btn {
  background: none;
  border: none;
  color: #1877f2;
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
  color: #166fe5;
  text-decoration: underline;
}

/* ===== Post Media ===== */
.post-media,
.post-image,
.post-video {
  width: 100%;
  border-radius: 10px;
  margin-top: 10px;
}

/* ===== Rating Statistics ===== */
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

/* ===== Post Stats ===== */
.post-stats {
  display: flex;
  gap: 16px;
  margin: 16px 0 12px 0;
  font-size: 14px;
  color: #65676b;
}

/* ===== Post Actions ===== */
.post-actions {
  display: flex;
  justify-content: space-around;
  margin-top: 10px;
  border-top: 1px solid #ddd;
  padding-top: 10px;
}

.post-actions button {
  background: none;
  border: none;
  color: #555;
  cursor: pointer;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  justify-content: center;
  padding: 8px;
  border-radius: 6px;
  transition: all 0.2s;
}

.post-actions button:hover {
  color: #1877f2;
}

.action-icon {
  width: 20px;
  height: 20px;
}

/* ===== Shared Post ===== */
.shared-post {
  background-color: #f5f5f5;
  border: 1px solid #ddd;
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

.shared-box .post-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  justify-content: flex-start;
}

.shared-box .post-author-info img,
.shared-box img.avatar-small {
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

/* ===== Restricted Warning ===== */
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

.restricted-post-warning .avatar-small,
.restricted-post-warning img {
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
  color: #555;
  font-style: italic;
  font-size: 14px;
  margin-top: 4px;
}

/* ===== Menu Dropdown ===== */
.post-menu-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.menu-post-icon {
  width: 24px;
  height: 24px;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: background 0.2s;
}

.menu-post-icon:hover {
  background: #f0f2f5;
}

.dropdown-menu {
  position: absolute;
  top: 40px;
  right: 0;
  background: white;
  border: 1px solid #ccc;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  z-index: 1000;
  min-width: 240px;
}

.dropdown-menu button {
  display: block;
  width: 100%;
  padding: 12px 16px;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  font-size: 15px;
}

.dropdown-menu button:hover {
  background-color: #f0f2f5;
}

.menu-icon-left {
  width: 20px;
  height: 20px;
  margin-right: 10px;
  vertical-align: middle;
}

/* ===== Empty States ===== */
.no-posts,
.no-friends {
  text-align: center;
  color: #65676b;
  padding: 40px 20px;
  font-style: italic;
}

/* ===== About Page ===== */
.about-page {
  width: 100%;
  max-width: 100%;
  margin: 0;
  padding: 0;
}

.about-page .card {
  padding: 24px;
  margin: 0 auto;
  max-width: 1100px;
}

.about-page .card h2 {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e4e6eb;
  color: #1c1e21;
}

.info-section {
  margin: 32px 0;
  padding: 0;
}

.info-section:first-of-type {
  margin-top: 0;
}

.info-section h3 {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 20px;
  color: #1c1e21;
  background: #f7f8fa;
  padding: 12px 16px;
  border-radius: 8px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  font-size: 15px;
  border-bottom: 1px solid #e4e6eb;
}

.info-item:last-child {
  border-bottom: none;
}

.info-item strong {
  color: #65676b;
  font-weight: 600;
  font-size: 15px;
}

.info-item span {
  color: #1c1e21;
  text-align: right;
  font-weight: 500;
  font-size: 15px;
}

/* Bio Section in About Page */
.bio-section {
  padding: 16px 0;
}

.bio-content {
  color: #1c1e21;
  font-size: 15px;
  line-height: 1.6;
  white-space: pre-line;
  word-wrap: break-word;
}

.bio-content.empty {
  color: #65676b;
  font-style: italic;
}
/* ===== Friends Page ===== */
.friends-page {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding: 0 16px;
}

.friends-page .card {
  padding: 24px;
}

.friends-header {
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e4e6eb;
}

.friends-header h2 {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 8px;
  color: #1c1e21;
}

.friends-count-large {
  font-size: 15px;
  color: #65676b;
  margin: 0;
  font-weight: 500;
}

.friends-grid-large {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-top: 20px;
}

.friend-card {
  display: flex;
  align-items: center;
  padding: 16px;
  background: white;
  border: 1px solid #e4e6eb;
  border-radius: 8px;
  gap: 12px;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.friend-card:hover {
  background: #f7f8fa;
  border-color: #d0d4da;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transform: translateY(-2px);
}

.friend-avatar-large {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
}

.friend-info {
  flex: 1;
  min-width: 0;
}

.friend-info strong {
  font-size: 15px;
  font-weight: 600;
  display: block;
  margin-bottom: 6px;
  color: #1c1e21;
}

.friend-mutual {
  font-size: 13px;
  color: #65676b;
  margin: 0;
}

.btn-message {
  background: #e4e6eb;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  font-size: 14px;
  color: #1c1e21;
  transition: all 0.2s;
}

.btn-message:hover {
  background: #d8dadf;
}

.no-friends-large {
  text-align: center;
  padding: 80px 20px;
  background: #f7f8fa;
  border-radius: 8px;
  margin-top: 20px;
}

.no-friends-large p {
  font-size: 17px;
  color: #65676b;
  margin-bottom: 20px;
  font-weight: 500;
}

.no-friends-large .btn {
  padding: 10px 24px;
  font-size: 15px;
}

/* Responsive */
@media (max-width: 768px) {
  .friends-grid-large {
    grid-template-columns: 1fr;
  }
}
</style>



