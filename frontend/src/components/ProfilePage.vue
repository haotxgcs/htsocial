<template>
  <div class="profile-wrapper" v-if="user && (user._id || user.id)">
    
    <div class="profile-header">
      <input type="file" ref="coverInput" accept="image/*" style="display: none" @change="handleCoverChange" />
      <input type="file" ref="avatarInput" accept="image/*" style="display: none" @change="handleAvatarChange" />

      <div class="cover-container" @click.stop="toggleCoverMenu">
        <img :src="user.coverPhoto ? `http://localhost:3000/${user.coverPhoto}` : defaultCover" class="cover-image clickable"/>
        <div class="cover-overlay"></div>
        
        <div
  v-if="showCoverMenu"
  class="image-options-menu cover-menu"
  v-click-outside="closeMenus"
  @click.stop
>
  <!-- VIEW: ai cũng thấy -->
  <div class="menu-item" @click="openImageViewer(user.coverPhoto || defaultCover)">
    <img src="../assets/view-image.png" class="menu-icon" /> View Cover
  </div>

  <!-- UPDATE: chỉ chủ profile -->
  <div
    v-if="isMyProfile"
    class="menu-item"
    @click.stop="triggerCoverUpload"
  >
    <img src="../assets/update.png" class="menu-icon" /> Update Cover
  </div>

  <!-- DELETE: chỉ chủ profile & không phải cover mặc định -->
  <div
    v-if="isMyProfile && !isDefaultCover"
    class="menu-item delete"
    @click.stop="deleteCoverPhoto"
  >
    <img src="../assets/delete.png" class="menu-icon" /> Remove
  </div>
</div>

      </div>

      <div class="user-identity-card">
        <div class="avatar-wrapper">
          <img :src="getAvatarUrl(user)" class="profile-avatar clickable" @click.stop="toggleAvatarMenu"/>
          <div
  v-if="showAvatarMenu"
  class="image-options-menu avatar-menu"
  v-click-outside="closeMenus"
>
  <!-- VIEW: ai cũng thấy -->
  <div class="menu-item" @click="openImageViewer(user.avatar || getDefaultAvatarPath(user))">
    <img src="../assets/view-image.png" class="menu-icon" /> View Avatar
  </div>

  <!-- UPDATE: chỉ chủ profile -->
  <div
    v-if="isMyProfile"
    class="menu-item"
    @click.stop="triggerAvatarUpload"
  >
    <img src="../assets/update.png" class="menu-icon" /> Update Avatar
  </div>

  <!-- DELETE: chỉ chủ profile & không phải avatar mặc định -->
  <div
    v-if="isMyProfile && !isDefaultAvatar"
    class="menu-item delete"
    @click.stop="deleteAvatar"
  >
    <img src="../assets/delete.png" class="menu-icon" /> Remove
  </div>
</div>


          
        </div>
        
        <div class="identity-content">
          <h1 class="user-name">{{ user.firstname }} {{ user.lastname }}</h1>
          <p class="user-bio-short" v-if="user.bio">{{ user.bio }}</p>
          
          <div class="stats-row">
            <div class="stat-item"><span class="stat-val">{{ postStats.totalPosts }}</span><span class="stat-label">Posts</span></div>
            <div class="stat-divider"></div>
            <div class="stat-item"><span class="stat-val">{{ user.friends?.length || 0 }}</span><span class="stat-label">Friends</span></div>
            <div class="stat-divider"></div>
            <div class="stat-item"><span class="stat-val">{{ postStats.totalPhotos }}</span><span class="stat-label">Photos</span></div>
          </div>

          <div class="action-buttons">
            <button v-if="isMyProfile" class="btn-primary-gradient" @click="openEditProfileModal">Edit Profile</button>
            <button v-if="!isMyProfile && friendStatus !== 'self'"
              class="btn-primary-gradient"
              :class="friendStatus"
              @click="handleFriendAction"
              :disabled="loadingFriend"
            >
              {{ friendButtonText }}
            </button>

          </div>

          

        </div>
      </div>
    </div>

    <div class="nav-wrapper">
      <div class="glass-nav">
        <button v-for="tab in tabs" :key="tab.id" :class="['nav-pill', { active: activeTab === tab.id }]" @click="activeTab = tab.id">{{ tab.label }}</button>
      </div>
    </div>

    <div class="main-layout">
      
      <template v-if="activeTab === 'posts'">
        <main class="layout-feed">
          <div v-if="isMyProfile" class="create-post">
            <h3>Create your post</h3>
            <input type="text" @click="openCreatePostModal" :placeholder="`What's on your mind, ${user?.firstname} ${user?.lastname}?`"/>
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
                        <span v-else>🔒</span>
                      </p>
                    </div>
                  </div>
                  <div class="post-menu-wrapper" v-click-outside="closeAllMenus">
                    <img src="../assets/menu.png" class="menu-post-icon" @click.stop="toggleMenu(post._id)" />
                    <div v-if="openMenuId === post._id" class="dropdown-menu">
                      <button v-if="isMyPost(post)" @click="editPost(post)"><img src="../assets/edit.png" class="menu-icon-left"/> Edit Post</button>
                      <button v-if="!isMyPost(post)" @click="hideThisPost(post._id)"><img src="../assets/hide.png" class="menu-icon-left"/> Hide Post</button>
                      <button v-if="isMyPost(post)" @click="deletePost(post._id)" style="color: red"><img src="../assets/delete.png" class="menu-icon-left"/> Delete Post</button>
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
                  <button v-if="shouldShowReadMore(post)" @click="togglePostContent(post._id)" class="read-more-btn">
                    {{ expandedPosts[post._id] ? 'Show Less' : 'Show More' }}
                  </button>
                </div>

                <div v-if="post.media" class="post-media">
                  <img v-if="post.mediaType === 'image'" :src="`http://localhost:3000/${post.media}`" class="post-image" />
                  <video v-else controls class="post-video"><source :src="`http://localhost:3000/${post.media}`" /></video>
                </div>

                <div v-if="post.totalRatings > 0" class="rating-statistics">
                  <div class="rating-summary">
                    <div class="average-rating">
                      <span class="rating-number">{{ post.averageRating }}</span>
                      <div class="stars-display"><span v-for="star in 5" :key="star" class="star-icon" :class="{ filled: star <= Math.round(post.averageRating) }">★</span></div>
                    </div>
                    <div class="rating-count"><span>{{ post.totalRatings }} ratings</span></div>
                  </div>
                </div>

                <div class="post-stats">
                  <span v-if="post.likes?.length > 0">{{ post.likes.length }} liked</span>
                  <span v-if="(post.commentCount || 0) + (post.replyCommentCount || 0) > 0">{{ (post.commentCount || 0) + (post.replyCommentCount || 0) }} commented</span>
                  <span v-if="post.sharesCount > 0">{{ post.sharesCount }} shared</span>
                  <span v-if="getPostSaveCount(post) > 0">{{ getPostSaveCount(post) }} saved</span>
                </div>

                <div class="post-actions">
                  <button @click="toggleLike(post)" :class="{ active: isLiked(post) }"><img :src="isLiked(post) ? require('../assets/like.png') : require('../assets/unlike.png')" class="action-icon" /> <span>Like</span></button>
                  <button @click="openCommentModal(post)"><img src="../assets/comment.png" class="action-icon" /> <span>Comment</span></button>
                  <button @click="openShareModal(post)"><img src="../assets/share.png" class="action-icon" /> <span>Share</span></button>
                  <button @click="toggleSavePost(post)" :class="{ active: isSaved(post) }"><img :src="isSaved(post) ? require('../assets/saved.png') : require('../assets/save.png')" class="action-icon" /> <span>{{ isSaved(post) ? 'Saved' : 'Save' }}</span></button>
                </div>
              </div>

              <div v-else-if="post.type === 'share'" class="post shared-post">

          <div class="post-header">
            <div class="post-author-info">
              <img :src="getAvatarUrl(post.username)" alt="avatar" />
              <div class="author-details">
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
                        <img :src="getAvatarUrl(post.post.author)" alt="avatar" />
                        <div class="origin-author-details">
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
                      <div class="share-post-header small origin-post">
                          <div class="post-author-info">
                            <img :src="getAvatarUrl(post.post.author)" class="avatar-small" />
                            <div class="author-details">
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

                      <div class="share-post-content-wrapper">
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
          
          <div v-else class="empty-feed">
             <p>No posts available.</p>
          </div>
        </main>

        <div
          v-if="pagination.totalPages > 1"
          class="pagination"
        >
          <button
            class="page-btn"
            :disabled="pagination.currentPage === 1"
            @click="changePage(pagination.currentPage - 1)"
          >
            Prev
          </button>

          <button
            v-for="page in pagination.totalPages"
            :key="page"
            class="page-btn"
            :class="{ active: page === pagination.currentPage }"
            @click="changePage(page)"
          >
            {{ page }}
          </button>

          <button
            class="page-btn"
            :disabled="pagination.currentPage === pagination.totalPages"
            @click="changePage(pagination.currentPage + 1)"
          >
            Next
          </button>
        </div>

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
        <div class="photos-container-modern">

          <!-- HEADER -->
          <div class="photos-header-card">
            <h2>Media</h2>
            <span class="photo-count">{{ mediaCount }}
          {{ mediaTab === 'videos'
              ? 'Videos'
              : mediaTab === 'photos'
                ? 'Photos'
                : 'Media'
          }}</span>
          </div>

          <!-- MEDIA TAB -->
           <div class="media-nav-wrapper">
          <div class="glass-nav" style="margin-bottom:16px">
            <button
              class="nav-pill"
              :class="{ active: mediaTab === 'all' }"
              @click="mediaTab = 'all'"
            >
              All
            </button>

            <button
              class="nav-pill"
              :class="{ active: mediaTab === 'photos' }"
              @click="mediaTab = 'photos'"
            >
              Photos
            </button>

            <button
              class="nav-pill"
              :class="{ active: mediaTab === 'videos' }"
              @click="mediaTab = 'videos'"
            >
              Videos
            </button>
          </div>
        </div>

          <!-- GRID -->
          <div v-if="displayedMedia.length" class="photos-grid-large">
            <div
              v-for="item in displayedMedia"
              :key="item._id"
              class="photo-card"
              @click="item.mediaType === 'image' && openMediaPost(item)" 
            >
              <img
                v-if="item.mediaType === 'image'"
                :src="`http://localhost:3000/${item.media}`"
                class="photo-large"
              />

              <video
                v-else
                controls
                class="photo-large"
                @click="item.mediaType === 'video' && openMediaPost(item)"
              >
                <source :src="`http://localhost:3000/${item.media}`" />
              </video>
            </div>
          </div>

          <div v-else class="empty-state">
            <p>No media to show.</p>
          </div>

        </div>
      </template>



      <template v-else-if="activeTab === 'friends'">
        <div class="friends-tab-wrapper">
          <div class="friends-header-card">
            <h2>Friends</h2>
            <span class="friend-count">{{ friendsList.length }} Friends</span>
          </div>
          <div v-if="friendsList.length === 0" class="empty-state"><p>No friends yet.</p></div>
          <div v-else class="modern-grid">
            <div v-for="friend in friendsList" :key="friend._id" class="modern-card">
              <div class="card-image-wrapper"><img :src="getAvatarUrl(friend)" class="card-img" /></div>
              <div class="card-body">
                <h4>{{ friend.firstname }} {{ friend.lastname }}</h4>
                <p class="username">@{{ friend.username }}</p>
                <button class="btn-secondary full-width">Message</button>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <CreatePostModal :is-visible="createPostModalVisible" :user="user" @close="closeCreatePostModal" @posted="handlePostCreated" />
    <ConfirmDialog v-if="confirmVisible" :message="confirmMessage" @confirm="handleConfirmedDelete" @cancel="confirmVisible = false" />
    <EditPostModal :is-visible="editModalVisible" :post="editPostData" :user="user" @close="closeEditModal" @updated="handlePostUpdated" />
    <CommentModal :is-visible="commentModalVisible" :post="selectedPost" :user="user" @close="closeCommentModal" @liked="handlePostLiked" @share="openShareModal" @comment-count-updated="handleCommentCountUpdated" @rating-updated="handleRatingUpdated" />
    <ShareModal v-if="shareModalVisible" :post="sharedPost" :user="user" @close="closeShareModal" @shared="handlePostShared" />
    <EditShareModal v-if="showEditShareModal" :share="editedShare" @close="showEditShareModal = false" @updated="fetchUserPosts" />
    <EditProfileModal :is-visible="editProfileModalVisible" :user="user" @close="closeEditProfileModal" @save="handleProfileSave" />
    <ImagePreviewModal :is-visible="imagePreviewVisible" :image-url="previewImageUrl" @close="closeImagePreview" />
    <NotificationModal :is-visible="notification.visible" :type="notification.type" :title="notification.title" :message="notification.message" @confirm="closeNotify" />
    <ConfirmDialog v-if="confirmFriendVisible" :message="confirmFriendMessage" @confirm="confirmFriendAction" @cancel="confirmFriendVisible = false"
/>

  </div>
</template>

<script>
import ConfirmDialog from './ConfirmDialog.vue';
import EditShareModal from './EditShareModal.vue';
import CommentModal from './CommentModal.vue';
import ShareModal from './ShareModal.vue';
import EditPostModal from './EditPostModal.vue';
import CreatePostModal from './CreatePostModal.vue';
import EditProfileModal from './EditProfileModal.vue';
import ImagePreviewModal from './ImagePreviewModal.vue';
import NotificationModal from './NotificationModal.vue';

// 1. ĐỊNH NGHĨA DIRECTIVE CLICK OUTSIDE (MỚI)
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
  name: "ProfilePage",
  // Đăng ký directive
  directives: {
    clickOutside: clickOutside
  },
  components: {
    ConfirmDialog,
    EditShareModal,
    CommentModal,
    ShareModal,
    EditPostModal,
    CreatePostModal,
    EditProfileModal,
    ImagePreviewModal,
    NotificationModal
  },
  data() {
    return {
      user: {},
      userPosts: [],
      friendsList: [],
      openMenuId: null,
      confirmVisible: false,
      confirmMessage: '',
      postToDeleteId: null,
      deleteType: null,

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

      editProfileModalVisible: false,

      // 2. THÊM DATA QUẢN LÝ MENU ẢNH (MỚI)
      showAvatarMenu: false,
      showCoverMenu: false,

      imagePreviewVisible: false, // Biến bật tắt modal
      previewImageUrl: "",

      notification: {
        visible: false,
        type: 'success', // 'success', 'error', 'warning'
        title: '',
        message: ''
      },

      profileUser: null,
      friendStatus: 'none', // 'none' | 'sent' | 'received' | 'friends'
      loadingFriend: false,

      confirmFriendVisible: false,
      confirmFriendMessage: '',
      pendingFriendAction: null, // 'cancel' | 'unfriend'

      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        limit: 10
      },

      postStats: {
        totalPosts: 0,
        totalPhotos: 0
      },

      mediaTab: "all", // 'all' | 'photos' | 'videos'

      media: {
        all: [],
        photos: [],
        videos: []
      },

      mediaStats: {
        totalMedia: 0,
        totalPhotos: 0,
        totalVideos: 0
      }

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
    },

    isDefaultAvatar() {
      // Nếu chưa có user hoặc avatar rỗng -> Là mặc định -> Ẩn nút xóa
      if (!this.user || !this.user.avatar) return true;

      // Danh sách các tên file ĐƯỢC COI LÀ MẶC ĐỊNH
      // QUAN TRỌNG: Phải có 'user.png' vì database cũ của bạn đang lưu cái này
      const defaultFiles = [           
        'male_avatar.png',
        'female_avatar.png',
        'generic_avatar.png',
        'admin_avatar.png', 
        
      ];

      // Nếu link avatar có chứa bất kỳ từ nào trong list trên -> Trả về TRUE
      return defaultFiles.some(def => this.user.avatar.includes(def));
    },

    // 2. Logic kiểm tra Cover mặc định
    isDefaultCover() {
      if (!this.user || !this.user.coverPhoto) return true;
      return this.user.coverPhoto.includes('cover.png');
    },

    isMyProfile() {
  const viewer = JSON.parse(localStorage.getItem("user"));
  const viewerId = viewer?._id || viewer?.id;
  return viewerId && viewerId === this.profileUser?._id;
},

friendButtonText() {
  switch (this.friendStatus) {
    case 'self': return '';
    case 'friends': return 'Unfriend';
    case 'sent': return 'Cancel Request';
    case 'received': return 'Accept Friend';
    default: return 'Add Friend';
  }
},

    displayedMedia() {
    switch (this.mediaTab) {
      case "photos":
        return this.media.photos;
      case "videos":
        return this.media.videos;
      default:
        return this.media.all;
    }
  },

    mediaCount() {
      if (!this.media) return 0;

      switch (this.mediaTab) {
        case 'photos':
          return this.media.photos?.length || 0;
        case 'videos':
          return this.media.videos?.length || 0;
        default:
          return this.media.all?.length || 0;
      }
    },
    

  },
  methods: {
    // === CÁC METHOD CŨ GIỮ NGUYÊN ===
    getDefaultAvatarPath(user) {
      if (!user) return "uploads/generic_avatar.png";

      if (user.role === "admin") {
        return "uploads/admin_avatar.png";
      }

      const g = user.gender ? user.gender.toLowerCase() : "";
      if (g === "male" || g === "nam") return "uploads/male_avatar.png";
      if (g === "female" || g === "nữ") return "uploads/female_avatar.png";
      
      return "uploads/generic_avatar.png";
    },

    // 2. Sửa hàm getAvatarUrl để dùng logic động
    getAvatarUrl(user) {
      // Nếu user có avatar riêng -> dùng nó
      if (user && user.avatar) {
        return `http://localhost:3000/${user.avatar}`;
      }
      // Nếu không -> Tính toán ảnh mặc định dựa trên giới tính/role
      const defaultPath = this.getDefaultAvatarPath(user);
      return `http://localhost:3000/${defaultPath}`;
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

    closeAllMenus() {
      this.openMenuId = null;
    },

    // 2. [MỚI] Hàm xử lý khi lướt (scroll) -> Đóng menu ngay lập tức
    handleScroll() {
      if (this.openMenuId) {
        this.openMenuId = null;
      }
    },

    // ... (Giữ nguyên các hàm fetchFriends, fetchUserProfile, fetchUserPosts, isMyPost) ...
    async fetchFriends() {
      try {
        const userId = this.getProfileUserId();
        if (!userId) return;

        const res = await fetch(`http://localhost:3000/users/${userId}/friends`);
        const data = await res.json();

        this.friendsList = Array.isArray(data) ? data : [];
      } catch (err) {
        console.error("Get friends error:", err);
      }
    }, 

    async fetchUserProfile() {
      try {
        const userId = this.getProfileUserId();
        if (!userId) return;

        const viewer = JSON.parse(localStorage.getItem("user"));
        const viewerId = viewer?._id || viewer?.id;
        const res = await fetch(
          `http://localhost:3000/users/${userId}?viewerId=${viewerId}`
        );
        if (!res.ok) throw new Error("User not found");

        const data = await res.json();
        this.user = data;
        this.profileUser = data; // ⭐ BẮT BUỘC
        this.friendStatus = data.friendStatus;
      } catch (err) {
        console.error("Get user error:", err);
        this.user = null;
      }
    }, 

    async fetchUserPosts(page = 1) {
  try {
    const profileUserId = this.getProfileUserId();
    if (!profileUserId) return;

    const viewer = JSON.parse(localStorage.getItem("user"));
    const viewerId = viewer?._id || viewer?.id;

    const res = await fetch(
      `http://localhost:3000/feeds/users/${profileUserId}` +
      `?page=${page}&limit=${this.pagination.limit}&viewerId=${viewerId}`
    );

    const data = await res.json();

    this.userPosts = data.items || [];
    this.pagination.currentPage = data.currentPage;
    this.pagination.totalPages = data.totalPages;
    this.pagination.totalItems = data.totalItems;

    if (data.stats) {
      this.postStats.totalPosts = data.stats.totalPosts;
      this.postStats.totalPhotos = data.stats.totalPhotos;
    }
  } catch (err) {
    console.error("User feed error:", err);
    this.userPosts = [];
  }
    }, 



    isMyPost(post) {
  const savedUser = JSON.parse(localStorage.getItem("user"));
  if (!savedUser || !post?.author) return false;

  const savedUserId = savedUser._id || savedUser.id;
  return post.author._id === savedUserId;
    },
    
    // --- Điều khiển Menu ---
    toggleAvatarMenu() {
      this.showAvatarMenu = !this.showAvatarMenu;
      this.showCoverMenu = false; // Đóng menu kia nếu đang mở
    },
    toggleCoverMenu() {
      this.showCoverMenu = !this.showCoverMenu;
      this.showAvatarMenu = false;
    },
    closeMenus() {
      this.showAvatarMenu = false;
      this.showCoverMenu = false;
    },

    // --- Xem ảnh ---
    openImageViewer(imagePath) {
      this.closeMenus();
      if (!imagePath) {
        alert("Chưa có ảnh để xem!");
        return;
      }
      
      // Gán link ảnh và bật Modal
      this.previewImageUrl = `http://localhost:3000/${imagePath}`;
      this.imagePreviewVisible = true;
    },

    closeImagePreview() {
      this.imagePreviewVisible = false;
      this.previewImageUrl = "";
    },

    // --- Upload ảnh (Kích hoạt Input ẩn) ---
    triggerAvatarUpload() {
      if (!this.isMyProfile) return;
      // Cần có ref="avatarInput" ở thẻ input trong template
      if(this.$refs.avatarInput) this.$refs.avatarInput.click();
      this.closeMenus();
    },

    triggerCoverUpload() {
      if (!this.isMyProfile) return;
      // Cần có ref="coverInput" ở thẻ input trong template
      if(this.$refs.coverInput) this.$refs.coverInput.click();
      this.closeMenus();
    },

    // --- Xử lý sự kiện Change của Input File ---
    async handleAvatarChange(event) {
      const file = event.target.files[0];
      if (!file) return;
      const formData = new FormData();
      formData.append("avatar", file);

      try {
        const savedUser = JSON.parse(localStorage.getItem("user"));
        const res = await fetch(`http://localhost:3000/users/${savedUser.id}/avatar`, {
          method: "POST",
          body: formData,
        });
        
        if (res.ok) {
          const updatedUser = await res.json();
          
          // === [SỬA ĐOẠN NÀY] ===
          // Gọi hàm đồng bộ để cập nhật avatar ở mọi nơi
          this.updateLocalAvatar(updatedUser.avatar); 
          
          this.showNotify("success", "Thành công!", "Ảnh đại diện đã được cập nhật.");
        } else {
           this.showNotify("error", "Thất bại", "Không thể tải ảnh lên. Vui lòng thử lại.");
        }
      } catch (err) {
        console.error(err);
        this.showNotify("error", "Lỗi mạng", "Không thể kết nối đến máy chủ.");
      }
      event.target.value = null; 
    },

    async handleCoverChange(event) {
      const file = event.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append("coverPhoto", file);

      try {
        const savedUser = JSON.parse(localStorage.getItem("user"));
        const res = await fetch(`http://localhost:3000/users/${savedUser.id}/cover`, {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const updatedUser = await res.json();
          this.user.coverPhoto = updatedUser.coverPhoto;
          this.showNotify("success", "Thành công!", "Ảnh bìa đã được cập nhật.");
        } else {
           this.showNotify("error", "Thất bại", "Lỗi khi tải ảnh bìa.");
        }
      } catch (err) {
        console.error(err);
      }
      event.target.value = null;
    },

    // --- Xóa ảnh ---
    async deleteAvatar() {
      if (!this.isMyProfile) return;
      if (!confirm("Bạn có chắc muốn gỡ ảnh đại diện?")) return;
      this.closeMenus();
      
      try {
         const savedUser = JSON.parse(localStorage.getItem("user"));
         const res = await fetch(`http://localhost:3000/users/${savedUser.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ avatar: "" }) 
         });
         
         if(res.ok) {
             const data = await res.json(); // Nhận data từ backend (chứa ảnh mặc định mới)
             
             // === [SỬA ĐOẠN NÀY] ===
             // Đồng bộ avatar mới (hoặc avatar mặc định) vào list post
             this.updateLocalAvatar(data.user.avatar);
             
             this.showNotify("success", "Đã gỡ ảnh", "Ảnh đại diện đã trở về mặc định.");
         }
      } catch(err) {
          console.error(err);
      }
    },

    async deleteCoverPhoto() {
      if (!this.isMyProfile) return;
      if (!confirm("Bạn có chắc muốn gỡ ảnh bìa?")) return;
      this.closeMenus();

      try {
         const savedUser = JSON.parse(localStorage.getItem("user"));
         const res = await fetch(`http://localhost:3000/users/${savedUser.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ coverPhoto: "" }) 
         });
         
         if(res.ok) {
             this.user.coverPhoto = ""; 
             this.showNotify("success", "Đã gỡ ảnh", "Ảnh bìa đã được gỡ bỏ.");
         }
      } catch(err) {
          console.error(err);
      }
    },

    // --- HÀM ĐỒNG BỘ AVATAR TRÊN GIAO DIỆN ---
    updateLocalAvatar(newAvatarUrl) {
      const currentUserId = this.user._id || this.user.id;

      // 1. Cập nhật Avatar chính trên Profile
      this.user.avatar = newAvatarUrl;

      // 2. Cập nhật LocalStorage (để Header nhận diện)
      const savedUser = JSON.parse(localStorage.getItem("user"));
      if (savedUser) {
        savedUser.avatar = newAvatarUrl;
        localStorage.setItem("user", JSON.stringify(savedUser));
      }

      // 3. Quét và cập nhật Avatar trong danh sách bài viết (userPosts)
      this.userPosts.forEach(post => {
        // Trường hợp A: Bài viết thường (Type: post/original)
        if (post.author && (post.author._id === currentUserId || post.author.id === currentUserId)) {
          post.author.avatar = newAvatarUrl;
        }

        // Trường hợp B: Bài viết chia sẻ (Type: share)
        // Cập nhật avatar người chia sẻ (là mình)
        if (post.type === 'share' && post.username && (post.username._id === currentUserId || post.username.id === currentUserId)) {
          post.username.avatar = newAvatarUrl;
        }
        
        // Cập nhật avatar trong bài gốc (nếu bài gốc cũng là của mình)
        if (post.post && post.post.author && (post.post.author._id === currentUserId || post.post.author.id === currentUserId)) {
          post.post.author.avatar = newAvatarUrl;
        }
      });

      window.dispatchEvent(new Event('user-profile-updated'));
      
      // (Tùy chọn) Force update nếu Vue không tự nhận diện thay đổi sâu trong object
      // this.$forceUpdate(); 
    },

    // ... (Các method còn lại của Post, Like, Share giữ nguyên bên dưới) ...
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
      this.postToDeleteId = postId;
      this.deleteType = 'post'; // Đánh dấu là xóa bài viết gốc
      this.confirmMessage = 'Bạn có chắc chắn muốn xóa bài viết này không?';
      this.confirmVisible = true;
    },

    async handleConfirmedDelete() {
      this.confirmVisible = false; // Đóng modal trước

      if (!this.postToDeleteId) return;

      try {
        // TRƯỜNG HỢP 1: XÓA SHARE
        if (this.deleteType === 'share') {
          const res = await fetch(`http://localhost:3000/shares/${this.postToDeleteId}`, {
            method: 'DELETE'
          });
          
          if (res.ok) {
            // Cập nhật lại danh sách bài viết (Load lại hoặc filter bỏ đi)
            await this.fetchUserPosts(); 
            this.showNotify("success", "Thành công", "Đã xóa bài chia sẻ.");
          } else {
            this.showNotify("error", "Lỗi", "Không thể xóa bài chia sẻ.");
          }
        } 
        
        // TRƯỜNG HỢP 2: XÓA POST GỐC
        else if (this.deleteType === 'post') {
          const res = await fetch(`http://localhost:3000/posts/${this.postToDeleteId}`, {
            method: 'DELETE'
          });

          if (res.ok) {
            this.userPosts = this.userPosts.filter(p => p._id !== this.postToDeleteId);
            this.openMenuId = null;
            this.showNotify("success", "Thành công", "Đã xóa bài viết.");
          } else {
            this.showNotify("error", "Lỗi", "Không thể xóa bài viết.");
          }
        }

      } catch (err) {
        console.error("Lỗi khi xóa:", err);
        this.showNotify("error", "Lỗi", "Lỗi kết nối server.");
      }

      // Reset biến tạm
      this.postToDeleteId = null;
      this.deleteType = null;
    },

    // ===== COMMENT MODAL =====
    openCommentModal(post) {
      this.selectedPost = post;
      this.commentModalVisible = true;
    },

    closeCommentModal() {
      this.commentModalVisible = false;
      this.selectedPost = null;
    },

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
      await this.fetchUserPosts(); 
      alert('Post shared successfully!');
    },

    isMyShare(share) {
      const savedUser = JSON.parse(localStorage.getItem("user"));
      const userId = savedUser?._id || savedUser?.id;
      return userId && share.username?._id === userId;
    },

    deleteShare(shareId) {
      // Bỏ confirm mặc định, dùng Modal Confirm
      this.postToDeleteId = shareId;
      this.deleteType = 'share'; // Đánh dấu là xóa bài chia sẻ
      this.confirmMessage = "Bạn có chắc chắn muốn xóa bài chia sẻ này không?";
      this.confirmVisible = true;
    },

    editShare(share) {
      this.editedShare = share;
      this.showEditShareModal = true;
    },

    async hideThisPost(postId) {
  const viewer = JSON.parse(localStorage.getItem("user"));
  if (!viewer) return;

  try {
    await fetch(`http://localhost:3000/posts/hide-post/${postId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: viewer.id })
    });

    // ✅ cập nhật UI ngay, KHÔNG reload
    this.userPosts = this.userPosts.filter(p => p._id !== postId);
  } catch (err) {
    console.error("Hide post error:", err);
  }
    },

    async hideThisShare(shareId) {
      const viewer = JSON.parse(localStorage.getItem("user"));
      if (!viewer) return;

      try {
        await fetch(`http://localhost:3000/shares/hide-share/${shareId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: viewer.id })
        });

        this.userPosts = this.userPosts.filter(p => p._id !== shareId);
      } catch (err) {
        console.error("Hide share error:", err);
      }
    },


    canViewSharedPost(post) {
      if (!post || !post.author || !this.user) return false;
      const authorId = post.author._id || post.author.id;
      const viewerId = this.user._id || this.user.id;
      const isAuthor = authorId === viewerId;
      const isFriend = post.author.friends?.includes(viewerId);
      switch (post.audience) {
        case 'public': return true;
        case 'friends': return isAuthor || isFriend;
        case 'private': return isAuthor;
        default: return false;
      }
    },

    getPostAccessMessage(post) {
      if (post.audience === 'private') return 'This post is private';
      else if (post.audience === 'friends') return 'Only friends of this user can see';
      else return '';
    },

    // ===== LIKE POST =====
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

    isLiked(post) {
      const savedUser = JSON.parse(localStorage.getItem("user"));
      const userId = savedUser?._id || savedUser?.id;
      return userId && post.likes?.includes(userId);
    },

    // ===== SAVE POST =====
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
      if (this.postSaveCounts[postId] !== undefined) return this.postSaveCounts[postId];
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
      if (this.postSaveCounts[postId] === undefined) this.postSaveCounts[postId] = 0;
      if (increment) this.postSaveCounts[postId]++;
      else this.postSaveCounts[postId] = Math.max(0, this.postSaveCounts[postId] - 1);
      
      const postIndex = this.userPosts.findIndex(p => p._id === postId || (p.post && p.post._id === postId));
      if (postIndex !== -1) {
        const post = this.userPosts[postIndex];
        if (post.post) post.post.savesCount = this.postSaveCounts[postId];
        else post.savesCount = this.postSaveCounts[postId];
      }
    },

    async fetchAllSaveCounts() {
      const postIds = [];
      this.userPosts.forEach(post => {
        if (post.type === 'original') postIds.push(post._id);
        else if (post.type === 'share' && post.post) postIds.push(post.post._id);
      });
      for (const postId of postIds) {
        if (this.postSaveCounts[postId] === undefined) this.fetchPostSaveCount(postId);
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
          body: JSON.stringify({ userId: savedUser.id, action: isSaved ? 'unsave' : 'save' })
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

    
    
    // ===== EXPAND POST (LOGIC MỚI CHO 4 TRƯỜNG) =====
    
    // 1. Hàm cắt ngắn text (Dùng cho Ingredients khi chưa mở rộng)
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

    // 2. Kiểm tra xem có cần hiện nút "Show More" không
    shouldShowReadMore(post) {
      if (!post) return false;
      
      // --- SỬA ĐOẠN NÀY ---
      // Cộng nội dung Ingredients và Instructions lại để kiểm tra độ dài
      const text = (post.ingredients || '') + (post.instructions || '');
      const lines = text.split('\n');
      
      // Nếu tổng cộng quá 5 dòng hoặc quá 200 ký tự thì hiện nút Show More
      return lines.length > 5 || text.length > 200;
    },

    // 3. Toggle trạng thái Mở/Đóng
    togglePostContent(postId) {
      // Tạo object mới để Vue nhận diện thay đổi (Reactivity)
      const newExpanded = { ...this.expandedPosts };
      newExpanded[postId] = !newExpanded[postId];
      this.expandedPosts = newExpanded;
    },

    // 4. Hiển thị nội dung Caption (Cho bài share)
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

    switchTab(tabId) {
      this.activeTab = tabId;
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
        const res = await fetch(`http://localhost:3000/users/${savedUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedData)
        });

        if (res.ok) {
          const newUser = await res.json();
          this.user = newUser; 
          localStorage.setItem("user", JSON.stringify({ ...savedUser, ...newUser }));
          this.closeEditProfileModal();
          this.showNotify("success", "Đã lưu", "Cập nhật thông tin cá nhân thành công!");
        } else {
          this.showNotify("error", "Lỗi", "Không thể cập nhật thông tin.");
        }
      } catch (err) {
        console.error(err);
        this.showNotify("error", "Lỗi mạng", "Không thể kết nối đến máy chủ.");
      }
    },

    showNotify(type, title, message) {
      this.notification.type = type;
      this.notification.title = title;
      this.notification.message = message;
      this.notification.visible = true;
    },

    // Hàm đóng thông báo
    closeNotify() {
      this.notification.visible = false;
    },

    getProfileUserId() {
  const routeId = this.$route.params.id;
  if (routeId && routeId !== 'undefined') return routeId;

  const savedUser = JSON.parse(localStorage.getItem("user"));
  return savedUser?._id || savedUser?.id || null;
    },


 

    addFriendToList(friend) {
      // Tránh thêm trùng
      const exists = this.friendsList.some(f => f._id === friend._id);
      if (!exists) {
        this.friendsList.unshift(friend);
      }

      
    },

    removeFriendFromList(friendId) {
      this.friendsList = this.friendsList.filter(f => f._id !== friendId);
    },

async handleFriendAction() {
  const viewer = JSON.parse(localStorage.getItem("user"));
  if (!viewer || !this.profileUser?._id) return;

  const viewerId = viewer._id || viewer.id;
  if (this.friendStatus === 'self') return;

  if (this.friendStatus === 'sent') {
    this.confirmFriendMessage = 'Do you want to cancel this friend request?';
    this.pendingFriendAction = 'cancel';
    this.confirmFriendVisible = true;
    return;
  }

  if (this.friendStatus === 'friends') {
    this.confirmFriendMessage = 'Do you want to unfriend this user?';
    this.pendingFriendAction = 'unfriend';
    this.confirmFriendVisible = true;
    return;
  }

  this.loadingFriend = true;

  try {
    // ADD FRIEND
    if (this.friendStatus === 'none') {
      await fetch("http://localhost:3000/users/friend-request/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromUserId: viewerId,
          toUserId: this.profileUser._id
        })
      });
    }

    // ACCEPT FRIEND
    else if (this.friendStatus === 'received') {
      await fetch("http://localhost:3000/users/friend-request/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: viewerId,
          requesterId: this.profileUser._id
        })
      });
    }

    await this.fetchUserProfile();
    await this.fetchFriends();
    window.dispatchEvent(new Event('friend-status-changed'));

  } catch (err) {
    console.error("Friend action error:", err);
  } finally {
    this.loadingFriend = false;
  }
}, 

async confirmFriendAction() {
  const viewer = JSON.parse(localStorage.getItem("user"));
  if (!viewer || !this.profileUser?._id) return;

  const viewerId = viewer._id || viewer.id;
  this.loadingFriend = true;

  try {
    if (this.pendingFriendAction === 'cancel') {
      await fetch("http://localhost:3000/users/friend-request/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromUserId: viewerId,
          toUserId: this.profileUser._id
        })
      });
    }

    else if (this.pendingFriendAction === 'unfriend') {
      await fetch("http://localhost:3000/users/unfriend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: viewerId,
          friendId: this.profileUser._id
        })
      });
    }

    await this.fetchUserProfile();
    await this.fetchFriends();
    window.dispatchEvent(new Event('friend-status-changed'));

  } catch (err) {
    console.error("Confirm friend action error:", err);
  } finally {
    this.loadingFriend = false;
    this.confirmFriendVisible = false;
    this.pendingFriendAction = null;
  }
}
,
 
    async initProfile() {
        await this.fetchUserProfile();
        await this.fetchUserPosts();
        await this.fetchFriends();
        await this.fetchUserMedia();


    },

    changePage(page) {
    if (
      page < 1 ||
      page > this.pagination.totalPages ||
      page === this.pagination.currentPage
    ) return;

    this.fetchUserPosts(page);

    window.scrollTo({ top: 0, behavior: "smooth" });
    },

    async fetchUserMedia() {
      try {
        const userId = this.getProfileUserId();
        if (!userId) return;

        const res = await fetch(
          `http://localhost:3000/feeds/users/${userId}/media`
        );
        const data = await res.json();

        // ✅ BACKEND ĐÃ PHÂN LOẠI SẴN
        this.media.all = data.all || [];
        this.media.photos = data.photos || [];
        this.media.videos = data.videos || [];

        this.mediaStats = data.stats || {
          totalMedia: 0,
          totalPhotos: 0,
          totalVideos: 0
        };

      } catch (err) {
        console.error("Fetch user media error:", err);
      }
    },

    async openMediaPost(mediaItem) {
    try {
      const res = await fetch(
        `http://localhost:3000/posts/${mediaItem._id}`
      );

      if (!res.ok) throw new Error("Cannot load post");

      const fullPost = await res.json();

      this.selectedPost = fullPost;
      this.commentModalVisible = true;
    } catch (err) {
      console.error("Open media post error:", err);
      alert("Cannot open this post");
    }
    }








  


  },

  mounted() {
  this.initProfile();
  this.loadSavedPosts();
  window.addEventListener('scroll', this.handleScroll, true);
},
  beforeUnmount() {
    // 4. [MỚI] Dọn dẹp sự kiện khi rời trang
    window.removeEventListener('scroll', this.handleScroll, true);
  },
  watch: {
  '$route.params.id': {
    async handler() {
      this.pagination.currentPage = 1;
      await this.fetchUserProfile();
      await this.fetchUserPosts(1);
      await this.fetchFriends();
      await this.fetchUserMedia(); // ⭐ BẮT BUỘC

    }
  }



}




};
</script>

<style scoped>
/* --- 1. GLOBAL & HEADER NEW STYLE --- */
:root {
  --primary-color: #FF642F;
  --bg-color: #f3f4f6;
}

.profile-wrapper {
  background-color: #fdf4f0;
  min-height: 100vh;
  font-family: 'Inter', sans-serif;
  padding-bottom: 60px;
  
  padding-left: 320px; /* Tạo khoảng trống 320px cho Sidebar bên trái */
  padding-right: 20px; /* Khoảng hở bên phải cho cân đối */
  padding-top: 20px;
}

/* HEADER GLASSMORPHISM */
.profile-header {
  background: white;
  padding-bottom: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.03); /* Shadow nhẹ giống post */
  position: relative;
  
  /* ⭐ THAY ĐỔI QUAN TRỌNG ⭐ */
  max-width: 750px;       /* Giới hạn chiều rộng bằng Feed */
  margin: 0 auto 24px;    /* Căn giữa màn hình và cách dưới 24px */
  border-radius: 0 0 20px 20px; /* Bo tròn 2 góc dưới (hoặc bo cả 4 nếu muốn tách biệt hẳn) */
  /* Nếu muốn nó tách hẳn lề trên như một cái Card riêng biệt thì dùng dòng dưới: */
  border-radius: 16px; 
  overflow: hidden;       /* Đảm bảo ảnh bìa không bị tràn ra ngoài góc bo */
}

.cover-container {
  height: 250px; /* ⭐ Giảm chiều cao xuống chút cho cân đối với chiều rộng 750px */
  position: relative;
  overflow: hidden;
}
.cover-image { width: 100%; height: 100%; object-fit: cover; }
.cover-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(to bottom, transparent 70%, rgba(0,0,0,0.5)); pointer-events: none;}
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
.user-bio-short { color: #FF642F; font-style:italic; margin: 0 auto 20px; font-size: 16px; }

.stats-row {
  display: inline-flex; justify-content: center; align-items: center; gap: 24px;
  margin-bottom: 24px; background: white; padding: 12px 32px;
  border-radius: 20px;  border: 1px solid #f3f4f6;
}
.stat-item { text-align: center; display: flex; flex-direction: column; }
.stat-val { font-weight: 800; font-size: 20px; color: #111827; }
.stat-label { font-size: 12px; color: #FF642F; text-transform: uppercase; font-weight: 600; }
.stat-divider { width: 1px; height: 30px;  }
.action-buttons { display: flex; gap: 12px; justify-content: center; }

.edit-profile-btn {
  background: #FF642F; color: white; border: none; 
  border-radius: 20px;  font-weight: 600; cursor: pointer;
  height: 40px; /* Cố định chiều cao cho bằng input */
  align-items: center; justify-content: center;
  padding: 10px 24px;
}

/* BUTTONS NEW */
.btn-glass { background: rgba(255, 255, 255, 0.25); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.4); color: white; padding: 10px 20px; border-radius: 12px; cursor: pointer; font-weight: 600; }
.btn-primary-gradient { background: #FF642F; color: white; border: none; padding: 10px 28px; border-radius: 24px; font-weight: 600; cursor: pointer; }
.btn-glass-dark {  color: #374151; border: 1px solid #e5e7eb; padding: 10px 24px; border-radius: 24px; font-weight: 600; cursor: pointer; }

/* NAV NEW */
.nav-wrapper { display: flex; justify-content: center; margin-bottom: 32px; position: sticky; top: 60px; z-index: 90; padding: 10px 0; }
.media-nav-wrapper {
  display: flex;
  justify-content: center;
  width: 100%;
  margin-bottom: 20px;
}
.glass-nav {  backdrop-filter: blur(16px); padding: 6px; border-radius: 100px; display: flex; gap: 6px; box-shadow: 0 10px 30px rgba(0,0,0,0.08);  }
.nav-pill { text-align: center; justify-content: center; display:flex; padding: 10px 28px; border-radius: 40px; border: none; background: transparent; color: #6b7280; font-weight: 600; cursor: pointer; transition: all 0.3s; }
.nav-pill.active { background: #FF642F; color: white; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }

/* MAIN LAYOUT */
/* --- MAIN LAYOUT (ĐÃ SỬA: CĂN GIỮA, 1 CỘT) --- */
.main-layout {
  max-width: 750px; /* Giống Homepage */
  margin: 0 auto;   /* Căn giữa */
  display: flex;    /* Flex 1 cột */
  flex-direction: column;
  padding: 0 16px;
  gap: 24px;
}
/* Tìm và thay thế đoạn này */
.layout-sidebar { display: none; }

/* Ẩn thanh cuộn trên Chrome/Safari */
.layout-sidebar::-webkit-scrollbar {
  display: none;
}

/* WIDGETS NEW */
.widget-card { background: white; border-radius: 20px; padding: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); border: 1px solid rgba(243, 244, 246, 0.8); }
.widget-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.widget-header h3 { 
  font-size: 18px; 
  font-weight: 800; 
  margin: 0; 
  color: #111827; 
  display: flex;      /* Để căn chỉnh text và số */
  align-items: center;
  gap: 6px;
}

.see-all { color: #FF642F; font-size: 14px; font-weight: 600; cursor: pointer; }
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

/* --- RECIPE CONTENT STYLES (MỚI) --- */
.recipe-title {
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 5px 0;
  color: #333;
}

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

.recipe-body {
  margin-top: 12px;
}

.recipe-section-header {
  font-weight: 700;
  margin: 0 0 10px 0;
  font-size: 13px;
  color: #333;
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
.share-post-header { padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; }
.post-author-info { display: flex; align-items: flex-start; flex: 1; gap: 10px; }
.post-author-info img, .avatar-small { width: 40px; height: 40px; border-radius: 50%; margin-right: 0px; object-fit: cover; flex-shrink: 0; }
.author-details { display: flex; flex-direction: column; justify-content: center; min-width: 0; }
.author-details strong { font-size: 15px; font-weight: 600; color: #1c1e21; line-height: 1.2; }
.author-details .time { font-size: 12px; color: #65676b; margin-top: 2px; line-height: 1.2; }

/* Menu Dropdown */
/* --- MENU POST STYLES (Dùng chung cho cả HomePage và ProfilePage) --- */

/* Wrapper cho menu */
.post-menu-wrapper { 
  position: relative; 
  display: flex;
  align-items: center;
}

/* Icon Menu (3 chấm) */
.menu-post-icon {
  width: 20px;  /* Đặt cứng kích thước */
  height: 20px;
  cursor: pointer;
  padding: 8px; /* Vùng bấm rộng */
  border-radius: 50%;
  transition: background 0.2s;
  object-fit: contain; /* Giữ tỉ lệ icon */
  opacity: 0.6; /* Làm mờ nhẹ */
}

.menu-post-icon:hover {
  background: #f0f2f5;
  opacity: 1;
}

/* Dropdown Menu */
.dropdown-menu {
  position: absolute;
  top: 100%; /* Hiện ngay dưới */
  right: 0;
  background: white;
  border: 1px solid #eee;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 100; /* Đủ cao để đè lên post */
  min-width: 200px;
  overflow: hidden;
  padding: 4px 0;
  margin-top: 4px; /* Cách icon một chút */
}

/* Dropdown Item */
.dropdown-menu button {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 10px 16px;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  font-size: 13px; /* Cỡ chữ chuẩn */
  font-weight: 500;
  color: #050505;
  gap: 12px; /* Khoảng cách giữa icon và chữ */
  transition: background 0.1s;
}

.dropdown-menu button:hover { 
  background-color: #f2f2f2; 
}

/* Icon nhỏ bên trong menu (Edit, Hide, Delete) */
.menu-icon-left {
  width: 18px;  /* Icon nhỏ hơn chữ một chút */
  height: 18px;
  object-fit: contain;
  margin: 0;
  opacity: 0.7;
}

/* Content */
.post-content-wrapper { margin: 10px 0; }
.share-post-content-wrapper { padding: 4px 16px 12px 16px; }
.post-text { margin: 10px 0; font-size: 14px; white-space: pre-line; word-wrap: break-word; color: #1c1e21; line-height: 1.4; }
.read-more-btn { border: none; background: none; color: #FF642F; font-weight: 600; font-size: 13px; cursor: pointer; padding: 0; margin-top: 5px; }
.read-more-btn:hover { text-decoration: underline; }

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
.post-actions {  display: flex; justify-content: space-around; margin-top: 10px; border-top: 1px solid #ddd; padding-top: 10px; }
.post-actions button { background: none; border: none; color: #555; cursor: pointer; font-weight: 500; display: flex; align-items: center; gap: 6px; flex: 1; justify-content: center; padding: 8px; border-radius: 6px; transition: all 0.2s; }
.post-actions button:hover { background: #fdf4f0; color: #FF642F; }
.action-icon { width: 20px; height: 20px; }

/* Shared Post */
/* --- SHARED POST SPECIFICS (CẬP NHẬT) --- */

/* Khung bao ngoài bài gốc */
.shared-content-box { 
  border: 1px solid #ddd; 
  border-radius: 12px; 
  margin: 0 0px 0px; 
  overflow: hidden; 
  background-color: #fff;
  
  
}








.origin-post-author-info { display: flex; align-items: center; gap: 12px; }
.origin-post-author-info img { margin-left:20px; margin-top:10px; width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 1px solid #eee; }
.origin-author-details strong { margin-top:10px; display: block; font-size: 14px; color: #333; }
.origin-author-details .origin-post-time { font-size: 12px; color: #999; margin-top: 2px; }

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

.empty-feed{
  text-align: center; 
  color: #FF642F; 
  font-size: 16px; 
  margin-top: 40px;
}

.empty-state{
  text-align: center; 
  color: #FF642F; 
  font-size: 16px; 
  margin-top: 40px;
}



/* Media bài gốc */
 .post-media-container { width: 100%; aspect-ratio: 1 / 1; background: white; display: flex; align-items: center; justify-content: center; overflow: hidden; }

/* Other Tabs (About/Friends) - NEW STYLE */
.about-container-modern { grid-column: 1 / -1; }
.about-card { background: white; border-radius: 24px; padding: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.03);}
.about-card h2 { font-size: 20px; font-weight: 800; margin-bottom: 32px; }
.bio-large { font-size: 20px; color: #FF642F; font-style:italic; margin-bottom: 40px; background: #fdf4f0; padding: 24px; border-radius: 16px; border: 1px solid #e5e7eb }
.details-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }
.detail-box { background: #fdf4f0; border: 1px solid #e5e7eb; padding: 20px; border-radius: 16px; }
.detail-box .label { display: block; font-size: 12px; color: #FF642F; margin-bottom: 6px; font-weight: 700; text-transform: uppercase; }
.detail-box .value { font-size: 16px; font-weight: 600; color: #111827; }

.friends-container-modern { grid-column: 1 / -1; display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px; }
.friend-card-modern { background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.03); text-align: center; padding-bottom: 20px; border: 1px solid rgba(243, 244, 246, 0.8); }
.friend-card-modern img { width: 100%; height: 220px; object-fit: cover; }
.friend-card-modern .info { padding: 16px; }
.friend-card-modern h4 { margin: 0 0 12px; font-size: 18px; font-weight: 700; }
.friend-card-modern button { background: #e0e7ff; color: #FF642F; border: none; padding: 8px 24px; border-radius: 30px; font-weight: 600; cursor: pointer; }

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

.avatar-wrapper {
  position: relative;
  display: inline-block; /* Đảm bảo wrapper ôm sát ảnh */
}

/* Thêm hiệu ứng hover vào ảnh để người dùng biết có thể bấm */
.profile-avatar.clickable {
  cursor: pointer;
  transition: all 0.2s ease;
}

.profile-avatar.clickable:hover {
  filter: brightness(0.9); /* Làm tối nhẹ khi di chuột vào */
  transform: scale(1.02);  /* Phóng to cực nhẹ */
}

/* Menu Dropdown chung (Giữ nguyên hoặc chỉnh lại chút width) */
.image-options-menu {
  position: absolute;
  background: white;
  border-radius: 12px; /* Bo góc mềm mại hơn */
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15); /* Shadow đậm hơn chút cho nổi */
  padding: 8px;
  width: 220px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  border: 1px solid #f0f2f5;
}

/* Vị trí Menu Avatar: Căn giữa bên dưới ảnh */
.avatar-menu {
  top: 110%; /* Nằm dưới ảnh một khoảng nhỏ */
  left: 50%; 
  transform: translateX(-50%); /* Căn giữa menu so với avatar */
}

/* Mũi tên nhỏ trỏ lên trên (Optional - cho đẹp giống tooltip) */
.avatar-menu::before {
  content: "";
  position: absolute;
  top: -6px;
  left: 50%;
  transform: translateX(-50%);
  border-width: 0 6px 6px 6px;
  border-style: solid;
  border-color: transparent transparent white transparent;
}

/* Style cho từng dòng menu */
.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 500;
  color: #050505;
  transition: background 0.2s;
}

.menu-item:hover {
  background-color: #f2f2f5;
}

.menu-item span {
  font-size: 18px; /* Icon nhỏ lại chút cho tinh tế */
}

.menu-item.delete {
  color: #dc3545;
}
.menu-item.delete:hover {
  background-color: #ffebee;
}

.cover-image.clickable {
  cursor: pointer;
}

/* Định vị Container để làm chuẩn cho absolute */
.cover-container {
  position: relative; 
  /* ... các thuộc tính cũ giữ nguyên */
}

/* SỬA LẠI VỊ TRÍ MENU ẢNH BÌA */
.cover-menu {
  /* Cách 1: Hiện ở chính giữa ảnh bìa */
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.menu-icon {
  width: 20px;  /* Kích thước icon */
  height: 20px;
  object-fit: contain; /* Giữ tỉ lệ ảnh không bị méo */
  opacity: 0.8; /* Làm mờ nhẹ cho đỡ gắt (tuỳ chọn) */
}

.menu-item:hover {
  background-color: #f2f2f5;
}

/* Hiệu ứng khi hover vào dòng menu thì icon đậm lên */
.menu-item:hover .menu-icon {
  opacity: 1;
}

/* --- CSS CHO THẺ BẠN BÈ (COPY TỪ FRIEND PAGE) --- */

.friends-tab-wrapper {
  grid-column: 1 / -1; /* Chiếm toàn bộ chiều ngang */
}

.photos-container-modern {
  grid-column: 1 / -1; /* Chiếm toàn bộ chiều ngang */
}


/* Grid Layout */
.modern-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); /* Kích thước thẻ tự động */
  gap: 20px;
}

/* Card Style */
.modern-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  border: 1px solid #f0f2f5;
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  flex-direction: column;
}

.modern-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.1);
}

/* Phần ảnh Card */
.card-image-wrapper {
  position: relative;
  width: 100%;
  padding-top: 100%; /* Tạo khung vuông tỉ lệ 1:1 */
}

.card-img {
  position: absolute;
  top: 0; left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  background-color: #f3f4f6;
}

/* Badge Online */
.status-badge {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: #10b981;
  color: white;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* Phần Body Card */
.card-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  flex-grow: 1; /* Để căn đều chiều cao */
}

.card-body h4 {
  margin: 0 0 4px;
  font-size: 16px;
  font-weight: 700;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.username {
  color: #6b7280;
  font-size: 13px;
  margin: 0 0 16px;
  font-weight: 500;
}

/* Buttons */
.btn-secondary {
  background: #fdf4f0; 
  color: #FF642F;      
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: auto; /* Đẩy nút xuống đáy thẻ */
}



.full-width {
  width: 100%;
}

/* --- CSS CHO HEADER TAB BẠN BÈ --- */

.friends-header-card {
  background: white;
  padding: 20px 24px;
  border-radius: 16px;
  margin-bottom: 24px; /* Khoảng cách với lưới bạn bè */
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  display: flex;
  align-items: center;
  justify-content: space-between; /* Đẩy tiêu đề sang trái, số lượng sang phải */
  border: 1px solid #f3f4f6;
}

.friends-header-card h2 {
  font-size: 20px;
  font-weight: 800;
  color: #111827;
  margin: 0;
}

.photos-header-card {
  display: flex;
  align-items: center;
  justify-content: space-between;

  background: white;
  padding: 20px 24px;
  border-radius: 16px;
  margin-bottom: 20px;

  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  border: 1px solid #f3f4f6;
}

.photos-header-card h2 {
  font-size: 20px;
  font-weight: 800;
  color: #111827;
  margin: 0;
}

.photo-count {
  background: #fdf4f0;
  color: #ff642f;
  padding: 6px 16px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
}

.glass-nav {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 24px;

  
  backdrop-filter: blur(16px);

  padding: 6px;
  border-radius: 999px;

  box-shadow: 0 8px 24px rgba(0,0,0,0.06);
  border: 1px solid rgba(255,255,255,0.6);
}

/* .nav-pill {
  padding: 10px 26px;
  border-radius: 999px;
  border: none;
  background: transparent;

  font-weight: 600;
  font-size: 14px;
  color: #6b7280;

  cursor: pointer;
  transition: all 0.25s ease;
} */

.nav-pill:hover {
  background: #fdf4f0;
  color: #ff642f;
}

.nav-pill.active {
  background: #ff642f;
  color: white;
  box-shadow: 0 4px 12px rgba(255,100,47,0.35);
}


.friend-count {
  background: #fdf4f0;
  color: #FF642F;
  padding: 6px 16px;
  border-radius: 30px;
  font-size: 14px;
  font-weight: 700;
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



/* Responsive */
@media (max-width: 1024px) { 
  .main-layout { grid-template-columns: 300px 1fr; gap: 20px; } 
  .profile-wrapper {
    padding-left: 0;  /* Trên màn hình nhỏ/mobile thì bỏ khoảng trống này đi */
    padding-right: 0;
    padding-top: 60px; /* Đẩy xuống một chút nếu có header fixed trên mobile */
  }
}

@media (max-width: 900px) {
  .main-layout { grid-template-columns: 1fr; }
  .layout-sidebar { display: none; }
  .profile-avatar { width: 120px; height: 120px; }
  .user-identity-card { margin-top: -60px; }
}
</style>



