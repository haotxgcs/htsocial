<template>
  <div class="profile-page">
    <!-- Cover Photo Section -->
    <div class="cover-section">
      <div class="cover-photo" :style="{ backgroundImage: `url(${user.coverPhoto || '../assets/default-cover.jpg'})` }">
        <div class="cover-overlay">
          <button class="edit-cover-btn" @click="editCover">
            <i class="camera-icon">📷</i>
            Chỉnh sửa ảnh bìa
          </button>
        </div>
      </div>
      
      <!-- Profile Info Section -->
      <div class="profile-info">
        <div class="profile-header">
          <div class="avatar-section">
            <div class="avatar-container">
              <img :src="user.avatar || '../assets/user.png'" :alt="user.name" class="profile-avatar" />
              <button class="edit-avatar-btn" @click="editAvatar">
                <i class="camera-icon">📷</i>
              </button>
            </div>
          </div>
          
          <div class="user-info">
            <h1 class="user-name">{{ user.name }}</h1>
            <p class="friends-count">{{ user.friendsCount || 0 }} bạn bè</p>
            <div class="mutual-friends" v-if="mutualFriends.length > 0">
              <div class="mutual-avatars">
                <img v-for="friend in mutualFriends.slice(0, 6)" 
                     :key="friend.id" 
                     :src="friend.avatar || '../assets/user.png'" 
                     :alt="friend.name" 
                     class="mutual-avatar" />
              </div>
            </div>
          </div>
          
          <div class="profile-actions">
            <button class="action-btn primary" @click="addStory">
              <i>➕</i>
              Thêm vào tin
            </button>
            <button class="action-btn secondary" @click="editProfile">
              <i>✏️</i>
              Chỉnh sửa trang cá nhân
            </button>
            <button class="action-btn icon-only">
              <i>⋯</i>
            </button>
          </div>
        </div>
        
        <!-- Navigation Tabs -->
        <div class="profile-nav">
          <button 
            v-for="tab in tabs" 
            :key="tab.id"
            :class="['nav-tab', { active: activeTab === tab.id }]"
            @click="activeTab = tab.id"
          >
            {{ tab.name }}
          </button>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="main-content">
      <!-- Left Sidebar -->
      <div class="left-sidebar">
        <!-- Intro Card -->
        <div class="profile-card intro-card">
          <h3>Giới thiệu</h3>
          <div class="intro-items">
            <div class="intro-item" v-if="user.bio">
              <i class="icon">📝</i>
              <span>{{ user.bio }}</span>
            </div>
            <div class="intro-item" v-if="user.workplace">
              <i class="icon">💼</i>
              <span>Làm việc tại <strong>{{ user.workplace }}</strong></span>
            </div>
            <div class="intro-item" v-if="user.education">
              <i class="icon">🎓</i>
              <span>Học tại <strong>{{ user.education }}</strong></span>
            </div>
            <div class="intro-item" v-if="user.location">
              <i class="icon">📍</i>
              <span>Sống tại <strong>{{ user.location }}</strong></span>
            </div>
            <div class="intro-item" v-if="user.hometown">
              <i class="icon">🏠</i>
              <span>Đến từ <strong>{{ user.hometown }}</strong></span>
            </div>
            <div class="intro-item" v-if="user.relationship">
              <i class="icon">❤️</i>
              <span>{{ user.relationship }}</span>
            </div>
            <div class="intro-item">
              <i class="icon">📅</i>
              <span>Tham gia vào {{ formatDate(user.joinedDate) }}</span>
            </div>
          </div>
          <button class="edit-details-btn" @click="editDetails">
            Chỉnh sửa chi tiết
          </button>
        </div>

        <!-- Photos Card -->
        <div class="profile-card photos-card">
          <div class="card-header">
            <h3>Ảnh</h3>
            <a href="#" class="see-all">Xem tất cả ảnh</a>
          </div>
          <div class="photos-grid">
            <div 
              v-for="photo in user.photos?.slice(0, 9)" 
              :key="photo.id"
              class="photo-item"
              @click="viewPhoto(photo)"
            >
              <img :src="photo.url" :alt="photo.alt" />
            </div>
          </div>
        </div>

        <!-- Friends Card -->
        <div class="profile-card friends-card">
          <div class="card-header">
            <h3>Bạn bè</h3>
            <a href="#" class="see-all">Xem tất cả bạn bè</a>
          </div>
          <p class="friends-count-text">{{ user.friendsCount || 0 }} người bạn</p>
          <div class="friends-grid">
            <div 
              v-for="friend in friends.slice(0, 6)" 
              :key="friend.id"
              class="friend-item"
              @click="viewFriend(friend)"
            >
              <img :src="friend.avatar || '../assets/user.png'" :alt="friend.name" />
              <span class="friend-name">{{ friend.name }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Content -->
      <div class="right-content">
        <!-- Create Post -->
        <div class="profile-card create-post-card">
          <div class="create-post-header">
            <img :src="user.avatar || '../assets/user.png'" :alt="user.name" class="post-avatar" />
            <input 
              type="text" 
              placeholder="Bạn đang nghĩ gì?"
              class="post-input"
              @click="openCreatePost"
              readonly
            />
          </div>
          <div class="create-post-actions">
            <button class="post-action" @click="addPhoto">
              <i class="action-icon">🖼️</i>
              Ảnh/video
            </button>
            <button class="post-action" @click="tagFriends">
              <i class="action-icon">👥</i>
              Gắn thẻ bạn bè
            </button>
            <button class="post-action" @click="addFeeling">
              <i class="action-icon">😊</i>
              Cảm xúc
            </button>
          </div>
        </div>

        <!-- Filter Posts -->
        <div class="filter-posts">
          <h3>Bài viết</h3>
          <div class="filter-buttons">
            <button 
              v-for="filter in postFilters" 
              :key="filter.id"
              :class="['filter-btn', { active: activeFilter === filter.id }]"
              @click="activeFilter = filter.id"
            >
              <i>{{ filter.icon }}</i>
              {{ filter.name }}
            </button>
          </div>
        </div>

        <!-- Posts -->
        <div class="posts-container">
          <div 
            v-for="post in filteredPosts" 
            :key="post.id"
            class="profile-card post-card"
          >
            <!-- Post Header -->
            <div class="post-header">
              <div class="post-user-info">
                <img :src="post.author.avatar || '../assets/user.png'" :alt="post.author.name" class="post-user-avatar" />
                <div class="post-meta">
                  <h4 class="post-author">{{ post.author.name }}</h4>
                  <div class="post-details">
                    <span class="post-time">{{ formatPostTime(post.timestamp) }}</span>
                    <span class="post-privacy">
                      <i v-if="post.privacy === 'public'">🌍</i>
                      <i v-else-if="post.privacy === 'friends'">👥</i>
                      <i v-else>🔒</i>
                    </span>
                  </div>
                </div>
              </div>
              <button class="post-menu">⋯</button>
            </div>

            <!-- Post Content -->
            <div class="post-content">
              <p class="post-text">{{ post.content }}</p>
              <div v-if="post.images && post.images.length > 0" class="post-images">
                <img 
                  v-for="image in post.images" 
                  :key="image.id"
                  :src="image.url" 
                  :alt="image.alt"
                  class="post-image"
                  @click="viewImage(image)"
                />
              </div>
            </div>

            <!-- Post Stats -->
            <div class="post-stats" v-if="post.likes > 0 || post.comments > 0 || post.shares > 0">
              <div class="reaction-count" v-if="post.likes > 0">
                <div class="reaction-icons">
                  <span class="reaction like">👍</span>
                  <span class="reaction love">❤️</span>
                  <span class="reaction haha">😆</span>
                </div>
                <span class="count">{{ post.likes }}</span>
              </div>
              <div class="engagement-stats">
                <span v-if="post.comments > 0" class="stat">{{ post.comments }} bình luận</span>
                <span v-if="post.shares > 0" class="stat">{{ post.shares }} lượt chia sẻ</span>
              </div>
            </div>

            <!-- Post Actions -->
            <div class="post-actions">
              <button class="action-button" @click="likePost(post)">
                <i>👍</i>
                Thích
              </button>
              <button class="action-button" @click="commentPost(post)">
                <i>💬</i>
                Bình luận
              </button>
              <button class="action-button" @click="sharePost(post)">
                <i>📤</i>
                Chia sẻ
              </button>
            </div>
          </div>

          <!-- Load More -->
          <div class="load-more" v-if="hasMorePosts">
            <button class="load-more-btn" @click="loadMorePosts">
              Xem thêm bài viết
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "ProfilePage",
  data() {
    return {
      user: {},
      activeTab: 'posts',
      activeFilter: 'all',
      hasMorePosts: true,
      tabs: [
        { id: 'posts', name: 'Bài viết' },
        { id: 'about', name: 'Giới thiệu' },
        { id: 'friends', name: 'Bạn bè' },
        { id: 'photos', name: 'Ảnh' },
        { id: 'videos', name: 'Video' },
        { id: 'more', name: 'Xem thêm' }
      ],
      postFilters: [
        { id: 'all', name: 'Tất cả bài viết', icon: '📝' },
        { id: 'yours', name: 'Bài viết của bạn', icon: '👤' },
        { id: 'others', name: 'Bài viết của người khác', icon: '👥' }
      ],
      mutualFriends: [],
      friends: [],
      posts: []
    };
  },
  computed: {
    filteredPosts() {
      if (this.activeFilter === 'yours') {
        return this.posts.filter(post => post.author.id === this.user.id);
      } else if (this.activeFilter === 'others') {
        return this.posts.filter(post => post.author.id !== this.user.id);
      }
      return this.posts;
    }
  },
  methods: {
    loadUserData() {
      const userData = JSON.parse(localStorage.getItem("user"));
      if (!userData) {
        this.$router.push("/login");
        return;
      }

      // Mock user data - replace with actual API call
      this.user = {
        id: userData.id || '1',
        name: `${userData.firstname || 'User'} ${userData.lastname || ''}`.trim(),
        email: userData.email || 'user@example.com',
        avatar: userData.avatar || '../assets/user.png',
        coverPhoto: userData.coverPhoto || null,
        bio: 'Sống để yêu thương và được yêu thương ❤️',
        workplace: 'Công ty Công nghệ ABC',
        education: 'Đại học Bách khoa Hà Nội',
        location: 'Hà Nội, Việt Nam',
        hometown: 'Nam Định, Việt Nam',
        relationship: 'Đang hẹn hò',
        joinedDate: '2020-01-15',
        friendsCount: 342,
        photos: [
          { id: 1, url: '../assets/photo1.jpg', alt: 'Photo 1' },
          { id: 2, url: '../assets/photo2.jpg', alt: 'Photo 2' },
          { id: 3, url: '../assets/photo3.jpg', alt: 'Photo 3' },
          { id: 4, url: '../assets/photo4.jpg', alt: 'Photo 4' },
          { id: 5, url: '../assets/photo5.jpg', alt: 'Photo 5' },
          { id: 6, url: '../assets/photo6.jpg', alt: 'Photo 6' },
          { id: 7, url: '../assets/photo7.jpg', alt: 'Photo 7' },
          { id: 8, url: '../assets/photo8.jpg', alt: 'Photo 8' },
          { id: 9, url: '../assets/photo9.jpg', alt: 'Photo 9' }
        ]
      };

      this.loadFriends();
      this.loadPosts();
      this.loadMutualFriends();
    },

    loadFriends() {
      // Mock friends data
      this.friends = [
        { id: 1, name: 'Nguyễn Văn An', avatar: '../assets/friend1.jpg' },
        { id: 2, name: 'Trần Thị Bình', avatar: '../assets/friend2.jpg' },
        { id: 3, name: 'Lê Văn Cường', avatar: '../assets/friend3.jpg' },
        { id: 4, name: 'Phạm Thị Dung', avatar: '../assets/friend4.jpg' },
        { id: 5, name: 'Hoàng Văn Em', avatar: '../assets/friend5.jpg' },
        { id: 6, name: 'Đỗ Thị Phương', avatar: '../assets/friend6.jpg' }
      ];
    },

    loadMutualFriends() {
      this.mutualFriends = this.friends.slice(0, 3);
    },

    loadPosts() {
      // Mock posts data
      this.posts = [
        {
          id: 1,
          author: { 
            id: this.user.id, 
            name: this.user.name, 
            avatar: this.user.avatar 
          },
          content: 'Hôm nay thật là một ngày tuyệt vời! Cảm ơn tất cả mọi người đã luôn ủng hộ mình 🥰',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          privacy: 'public',
          likes: 24,
          comments: 5,
          shares: 2,
          images: [
            { id: 1, url: '../assets/post1.jpg', alt: 'Post image 1' }
          ]
        },
        {
          id: 2,
          author: { 
            id: '2', 
            name: 'Nguyễn Văn An', 
            avatar: '../assets/friend1.jpg' 
          },
          content: 'Chúc mừng sinh nhật bạn thân của mình! 🎉🎂',
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          privacy: 'friends',
          likes: 18,
          comments: 3,
          shares: 0
        },
        {
          id: 3,
          author: { 
            id: this.user.id, 
            name: this.user.name, 
            avatar: this.user.avatar 
          },
          content: 'Cuối tuần vui vẻ cùng gia đình tại Hà Nội. Thời tiết thật đẹp! ☀️',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          privacy: 'public',
          likes: 45,
          comments: 12,
          shares: 7,
          images: [
            { id: 2, url: '../assets/post2.jpg', alt: 'Post image 2' },
            { id: 3, url: '../assets/post3.jpg', alt: 'Post image 3' }
          ]
        }
      ];
    },

    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', { 
        year: 'numeric', 
        month: 'long' 
      });
    },

    formatPostTime(timestamp) {
      const now = new Date();
      const diff = now - new Date(timestamp);
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const days = Math.floor(hours / 24);

      if (days > 0) {
        return `${days} ngày trước`;
      } else if (hours > 0) {
        return `${hours} giờ trước`;
      } else {
        const minutes = Math.floor(diff / (1000 * 60));
        return `${minutes} phút trước`;
      }
    },

    // Action methods
    editCover() {
      console.log('Edit cover photo');
    },

    editAvatar() {
      console.log('Edit avatar');
    },

    addStory() {
      console.log('Add story');
    },

    editProfile() {
      console.log('Edit profile');
    },

    editDetails() {
      console.log('Edit details');
    },

    viewPhoto(photo) {
      console.log('View photo:', photo);
    },

    viewFriend(friend) {
      console.log('View friend:', friend);
    },

    openCreatePost() {
      console.log('Open create post modal');
    },

    addPhoto() {
      console.log('Add photo to post');
    },

    tagFriends() {
      console.log('Tag friends');
    },

    addFeeling() {
      console.log('Add feeling');
    },

    likePost(post) {
      post.likes++;
      console.log('Liked post:', post.id);
    },

    commentPost(post) {
      console.log('Comment on post:', post.id);
    },

    sharePost(post) {
      post.shares++;
      console.log('Shared post:', post.id);
    },

    viewImage(image) {
      console.log('View image:', image);
    },

    loadMorePosts() {
      // Simulate loading more posts
      setTimeout(() => {
        this.hasMorePosts = false;
      }, 1000);
    }
  },

  mounted() {
    this.loadUserData();
  }
};
</script>

<style>
/* Facebook Profile Page Styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  background-color: #f0f2f5;
  color: #1c1e21;
  line-height: 1.34;
}

.profile-page {
  min-height: 100vh;
  background-color: #f0f2f5;
}

/* Cover Section */
.cover-section {
  background: white;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
}

.cover-photo {
  height: 348px;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-color: #e4e6ea;
  position: relative;
  border-radius: 0 0 8px 8px;
}

.cover-overlay {
  position: absolute;
  bottom: 16px;
  right: 16px;
}

.edit-cover-btn {
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 15px;
  font-weight: 600;
  color: #1c1e21;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.2s;
}

.edit-cover-btn:hover {
  background: rgba(255, 255, 255, 1);
}

.camera-icon {
  font-size: 16px;
}

/* Profile Info Section */
.profile-info {
  padding: 0 16px;
  max-width: 1250px;
  margin: 0 auto;
}

.profile-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  position: relative;
  padding: 16px 0;
  border-bottom: 1px solid #dadde1;
}

.avatar-section {
  margin-right: 16px;
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
  background-color: #e4e6ea;
}

.edit-avatar-btn {
  position: absolute;
  bottom: 8px;
  right: 8px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #e4e6ea;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.edit-avatar-btn:hover {
  background: #d8dadf;
}

.user-info {
  flex: 1;
  margin-top: 16px;
}

.user-name {
  font-size: 32px;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 4px;
  color: #1c1e21;
}

.friends-count {
  font-size: 15px;
  color: #65676b;
  margin-bottom: 8px;
}

.mutual-friends {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mutual-avatars {
  display: flex;
  margin-left: -4px;
}

.mutual-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid white;
  margin-left: -4px;
  object-fit: cover;
}

.profile-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
}

.action-btn {
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
  height: 36px;
}

.action-btn.primary {
  background: #1877f2;
  color: white;
}

.action-btn.primary:hover {
  background: #166fe5;
}

.action-btn.secondary {
  background: #e4e6ea;
  color: #1c1e21;
}

.action-btn.secondary:hover {
  background: #d8dadf;
}

.action-btn.icon-only {
  width: 36px;
  justify-content: center;
  background: #e4e6ea;
  color: #1c1e21;
}

.action-btn.icon-only:hover {
  background: #d8dadf;
}

/* Navigation Tabs */
.profile-nav {
  display: flex;
  gap: 4px;
  padding: 16px 0 0 0;
}

.nav-tab {
  padding: 16px 16px 12px 16px;
  background: none;
  border: none;
  font-size: 15px;
  font-weight: 600;
  color: #65676b;
  cursor: pointer;
  border-radius: 6px 6px 0 0;
  position: relative;
  transition: all 0.2s;
}

.nav-tab:hover {
  background: #f2f3f5;
}

.nav-tab.active {
  color: #1877f2;
}

.nav-tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: #1877f2;
  border-radius: 2px 2px 0 0;
}

/* Main Content */
.main-content {
  max-width: 1250px;
  margin: 0 auto;
  padding: 0 16px;
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 16px;
  align-items: start;
}

/* Profile Cards */
.profile-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
  overflow: hidden;
}

/* Left Sidebar */
.left-sidebar {
  position: sticky;
  top: 16px;
}

/* Intro Card */
.intro-card {
  padding: 20px;
}

.intro-card h3 {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 16px;
  color: #1c1e21;
}

.intro-items {
  margin-bottom: 16px;
}

.intro-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  font-size: 15px;
  color: #1c1e21;
}

.intro-item .icon {
  font-size: 16px;
  width: 20px;
  flex-shrink: 0;
}

.edit-details-btn {
  width: 100%;
  padding: 8px 16px;
  background: #e4e6ea;
  border: none;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 600;
  color: #1c1e21;
  cursor: pointer;
  transition: background-color 0.2s;
}

.edit-details-btn:hover {
  background: #d8dadf;
}

/* Photos Card */
.photos-card {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-header h3 {
  font-size: 20px;
  font-weight: 700;
  color: #1c1e21;
}

.see-all {
  color: #1877f2;
  text-decoration: none;
  font-size: 15px;
  font-weight: 600;
}

.see-all:hover {
  text-decoration: underline;
}

.photos-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2px;
  border-radius: 8px;
  overflow: hidden;
}

.photo-item {
  aspect-ratio: 1;
  cursor: pointer;
  overflow: hidden;
}

.photo-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s;
}

.photo-item:hover img {
  transform: scale(1.05);
}

/* Friends Card */
.friends-card {
  padding: 20px;
}

.friends-count-text {
  color: #65676b;
  font-size: 15px;
  margin-bottom: 16px;
}

.friends-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.friend-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.friend-item:hover {
  background: #f2f3f5;
}

.friend-item img {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  object-fit: cover;
  margin-bottom: 8px;
}

.friend-name {
  font-size: 13px;
  font-weight: 600;
  text-align: center;
  color: #1c1e21;
  line-height: 1.2;
}

/* Right Content */
.right-content {
  min-height: 100vh;
}

/* Create Post Card */
.create-post-card {
  padding: 12px 16px 8px 16px;
}

.create-post-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.post-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.post-input {
  flex: 1;
  padding: 12px 16px;
  border: none;
  border-radius: 24px;
  background: #f0f2f5;
  font-size: 16px;
  cursor: pointer;
  outline: none;
}

.post-input::placeholder {
  color: #65676b;
}

.create-post-actions {
  display: flex;
  justify-content: space-around;
  border-top: 1px solid #dadde1;
  padding-top: 8px;
}

.post-action {
  flex: 1;
  padding: 8px;
  background: none;
  border: none;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 600;
  color: #65676b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background-color 0.2s;
}

.post-action:hover {
  background: #f2f3f5;
}

.action-icon {
  font-size: 20px;
}

/* Filter Posts */
.filter-posts {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  padding: 16px;
  margin-bottom: 16px;
}

.filter-posts h3 {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 16px;
  color: #1c1e21;
}

.filter-buttons {
  display: flex;
  gap: 8px;
}

.filter-btn {
  padding: 8px 16px;
  background: #e4e6ea;
  border: none;
  border-radius: 20px;
  font-size: 15px;
  font-weight: 600;
  color: #1c1e21;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.filter-btn:hover {
  background: #d8dadf;
}

.filter-btn.active {
  background: #1877f2;
  color: white;
}

/* Posts */
.posts-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.post-card {
  padding: 16px;
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.post-user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.post-user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.post-meta {
  flex: 1;
}

.post-author {
  font-size: 15px;
  font-weight: 600;
  color: #1c1e21;
  margin-bottom: 2px;
}

.post-details {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #65676b;
}

.post-menu {
  background: none;
  border: none;
  font-size: 20px;
  color: #65676b;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.post-menu:hover {
  background: #f2f3f5;
}

.post-content {
  margin-bottom: 12px;
}

.post-text {
  font-size: 15px;
  line-height: 1.33;
  color: #1c1e21;
  margin-bottom: 12px;
}

.post-images {
  display: grid;
  gap: 2px;
  border-radius: 8px;
  overflow: hidden;
}

.post-images.single {
  grid-template-columns: 1fr;
}

.post-images.double {
  grid-template-columns: 1fr 1fr;
}

.post-images.multiple {
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
}

.post-image {
  width: 100%;
  height: 300px;
  object-fit: cover;
  cursor: pointer;
  transition: opacity 0.2s;
}

.post-image:hover {
  opacity: 0.9;
}

.post-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #dadde1;
  margin-bottom: 4px;
}

.reaction-count {
  display: flex;
  align-items: center;
  gap: 8px;
}

.reaction-icons {
  display: flex;
  align-items: center;
  gap: -2px;
}

.reaction {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  margin-left: -2px;
  border: 1px solid white;
}

.reaction.like {
  background: #1877f2;
}

.reaction.love {
  background: #e41e3f;
}

.reaction.haha {
  background: #ffdd44;
}

.count {
  font-size: 15px;
  color: #65676b;
  cursor: pointer;
}

.count:hover {
  text-decoration: underline;
}

.engagement-stats {
  display: flex;
  gap: 16px;
}

.stat {
  font-size: 15px;
  color: #65676b;
  cursor: pointer;
}

.stat:hover {
  text-decoration: underline;
}

.post-actions {
  display: flex;
  justify-content: space-around;
  padding-top: 4px;
}

.action-button {
  flex: 1;
  padding: 8px;
  background: none;
  border: none;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 600;
  color: #65676b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background-color 0.2s;
}

.action-button:hover {
  background: #f2f3f5;
}

.action-button.liked {
  color: #1877f2;
}

/* Load More */
.load-more {
  text-align: center;
  padding: 20px;
}

.load-more-btn {
  padding: 8px 24px;
  background: #e4e6ea;
  border: none;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 600;
  color: #1c1e21;
  cursor: pointer;
  transition: background-color 0.2s;
}

.load-more-btn:hover {
  background: #d8dadf;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .main-content {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .left-sidebar {
    position: static;
    order: 2;
  }
  
  .right-content {
    order: 1;
  }
}

@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .avatar-container {
    margin-top: -30px;
  }
  
  .profile-avatar {
    width: 120px;
    height: 120px;
  }
  
  .user-name {
    font-size: 24px;
  }
  
  .profile-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .action-btn {
    flex: 1;
    justify-content: center;
  }
  
  .profile-nav {
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  
  .profile-nav::-webkit-scrollbar {
    display: none;
  }
  
  .nav-tab {
    white-space: nowrap;
    flex-shrink: 0;
  }
  
  .main-content {
    padding: 0 8px;
  }
  
  .photos-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .friends-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .friend-item img {
    width: 48px;
    height: 48px;
  }
  
  .friend-name {
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .cover-photo {
    height: 200px;
  }
  
  .profile-info {
    padding: 0 8px;
  }
  
  .profile-avatar {
    width: 100px;
    height: 100px;
  }
  
  .user-name {
    font-size: 20px;
  }
  
  .profile-actions {
    flex-direction: column;
    gap: 8px;
  }
  
  .action-btn {
    width: 100%;
  }
  
  .filter-buttons {
    flex-wrap: wrap;
  }
  
  .post-images {
    grid-template-columns: 1fr;
  }
  
  .post-image {
    height: 200px;
  }
}

/* Dark mode support (optional) */
@media (prefers-color-scheme: dark) {
  body {
    background-color: #18191a;
    color: #e4e6ea;
  }
  
  .profile-page {
    background-color: #18191a;
  }
  
  .cover-section,
  .profile-card {
    background: #242526;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  }
  
  .user-name {
    color: #e4e6ea;
  }
  
  .friends-count,
  .post-details,
  .count,
  .stat {
    color: #b0b3b8;
  }
  
  .nav-tab {
    color: #b0b3b8;
  }
  
  .nav-tab.active {
    color: #1877f2;
  }
  
  .post-input {
    background: #3a3b3c;
    color: #e4e6ea;
  }
  
  .post-input::placeholder {
    color: #b0b3b8;
  }
  
  .edit-details-btn,
  .action-btn.secondary,
  .filter-btn,
  .load-more-btn {
    background: #3a3b3c;
    color: #e4e6ea;
  }
  
  .edit-details-btn:hover,
  .action-btn.secondary:hover,
  .filter-btn:hover,
  .load-more-btn:hover {
    background: #4e4f50;
  }
  
  .post-action:hover,
  .action-button:hover,
  .friend-item:hover {
    background: #3a3b3c;
  }
}
</style >
