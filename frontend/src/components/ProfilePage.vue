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
          <button class="btn btn-primary">Thêm vào tin</button>
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

    <!-- Content -->
    <div class="profile-content">
      <div class="content-left">
        <!-- Giới thiệu -->
        <div class="intro-card card">
          <h3>Giới thiệu</h3>
          <div class="intro-item">
            <i class="icon-calendar"></i>
            <span>Tham gia vào {{ joinDateFormatted }}</span>
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
          <div class="friends-grid">
            <div v-for="friend in user.friends || []" :key="friend._id" class="friend-item">
              <img :src="`http://localhost:3000/${friend.avatar}`" />
              <span>{{ friend.firstname }} {{ friend.lastname }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Bài viết -->
      <div class="content-right">
        <div class="posts-section">
          <div class="create-post">
        <input type="text" @click="$router.push('/posts')" placeholder="Bạn đang nghĩ gì thế?" />

        <div class="post-options">
          <button>🎥 Video</button>
          <button>📷 Ảnh</button>
          <button>🎬 Thước phim</button>
        </div>
      </div>

      <div class="post" v-for="post in posts" :key="post._id">
  <div class="post-header">
  <div class="post-author-info">
    <img :src="`http://localhost:3000/${post.author.avatar || 'user.png'}`" alt="avatar" />
    <div class="author-details">
      <strong>{{ post.author.firstname }} {{ post.author.lastname }}</strong>
      <p class="time">{{ formatTime(post.createdAt) }}</p>
    </div>
  </div>

  <!-- menu icon góc phải -->
  <div class="post-menu-wrapper">
    <img src="../assets/menu.png" class="menu-post-icon" @click="toggleMenu(post._id)" />
    <div v-if="openMenuId === post._id" class="dropdown-menu">
      <button @click="editPost(post)"> Chỉnh sửa bài viết</button>
      <button> Chỉnh sửa đối tượng</button>
      <button v-if="isMyPost(post)" @click="deletePost(post._id)" style="color: red">🗑️ Xoá bài viết</button>
    </div>
  </div>
</div>



  <p class="post-text">{{ post.content }}</p>

  
  <!-- Media (ảnh hoặc video) -->
 <div v-if="post.media" class="post-media">
  <img
    v-if="post.mediaType === 'image'"
    :src="`http://localhost:3000/${post.media}`"
    class="post-image"
  />
  <video
    v-else-if="post.mediaType === 'video'"
    controls
    class="post-video"
  >
    <source :src="`http://localhost:3000/${post.media}`" type="video/mp4" />
    
  </video>
</div>

  <div class="post-actions">
  <button @click="toggleLike(post)">
      <img :src="isLiked(post) ? require('../assets/like.png') : require('../assets/unlike.png')" class="action-icon" />
      <span>Like</span>
    </button>
  <button @click="openCommentModal(post)">
    <img src="../assets/comment.png" alt="Comment" class="action-icon" />
    <span>Comment</span>
  </button>
  <button @click="sharePost(post)">
    <img src="../assets/share.png" alt="Share" class="action-icon" />
    <span>Share</span>
  </button>
</div>
</div>

<!-- Modal chỉnh sửa bài viết -->
<div v-if="editModalVisible" class="modal-overlay">
  <div class="modal-content">
    <h3>Chỉnh sửa bài viết</h3>
    <textarea v-model="editContent" rows="5" style="width:100%"></textarea>
    <div style="margin-top:10px; text-align:right;">
      <button @click="editModalVisible = false">Hủy</button>
      <button @click="submitEditPost" style="margin-left:10px; background:#1877f2; color:white;">Lưu</button>
    </div>
  </div>
</div>

<!-- Modal Comment -->
<div v-if="commentModalVisible" class="comment-modal-overlay" @click="closeCommentModal">
  <div class="comment-modal-content" @click.stop>
    <!-- Header modal -->
    <div class="comment-modal-header">
      <h3>Bài viết của {{ selectedPost?.author.firstname }} {{ selectedPost?.author.lastname }}</h3>
      <button class="close-btn" @click="closeCommentModal">&times;</button>
    </div>

    <!-- Nội dung bài viết -->
    <div class="post-detail">
      <div class="post-author-info">
        <img :src="`http://localhost:3000/${selectedPost?.author.avatar || 'user.png'}`" alt="avatar" class="author-avatar" />
        <div class="author-details">
          <strong>{{ selectedPost?.author.firstname }} {{ selectedPost?.author.lastname }}</strong>
          <p class="time">{{ formatTime(selectedPost?.createdAt) }}</p>
        </div>
      </div>
      
      <p class="post-content">{{ selectedPost?.content }}</p>
      
      <!-- Media trong modal -->
      <div v-if="selectedPost?.media" class="post-media-modal">
        <img
          v-if="selectedPost.mediaType === 'image'"
          :src="`http://localhost:3000/${selectedPost.media}`"
          class="post-image-modal"
        />
        <video
          v-else-if="selectedPost.mediaType === 'video'"
          controls
          class="post-video-modal"
        >
          <source :src="`http://localhost:3000/${selectedPost.media}`" type="video/mp4" />
        </video>
      </div>

      <!-- Thống kê like/comment -->
      <div class="post-stats">
        <span v-if="selectedPost?.likes?.length > 0">{{ selectedPost.likes.length }} lượt thích</span>
        <span v-if="selectedPost?.comments?.length > 0">{{ selectedPost.comments.length }} bình luận</span>
      </div>

      <!-- Action buttons -->
      <div class="post-actions-modal">
        <button @click="toggleLike(selectedPost)" class="action-btn">
          <img :src="isLiked(selectedPost) ? require('../assets/like.png') : require('../assets/unlike.png')" class="action-icon" />
          <span>Thích</span>
        </button>
        <button @click="openCommentModal(post)" class="action-btn">
          <img src="../assets/comment.png" alt="Comment" class="action-icon" />
          <span>Bình luận</span>
        </button>
        <button @click="sharePost(selectedPost)" class="action-btn">
          <img src="../assets/share.png" alt="Share" class="action-icon" />
          <span>Chia sẻ</span>
        </button>
      </div>
    </div>

    <!-- Danh sách comments -->
    <div class="comments-section">
      <div class="comments-list">
        <div v-if="comments.length === 0" class="no-comments">
          <div class="no-comments-icon">💬</div>
          <p>Chưa có bình luận nào</p>
          <p class="sub-text">Hãy là người đầu tiên bình luận.</p>
        </div>
        
        <div v-else>
          <div v-for="comment in comments" :key="comment._id" class="comment-item">
            <img :src="`http://localhost:3000/${comment.author.avatar || 'user.png'}`" alt="avatar" class="comment-avatar" />
            <div class="comment-content">
              <div class="comment-bubble">
                <strong class="comment-author">{{ comment.author.firstname }} {{ comment.author.lastname }}</strong>
                <p class="comment-text">{{ comment.content }}</p>
              </div>
              <div class="comment-actions">
                <span class="comment-time">{{ formatTime(comment.createdAt) }}</span>
                <button class="comment-action-btn">Thích</button>
                <button class="comment-action-btn">Phản hồi</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Form thêm comment -->
      <div class="add-comment-section">
        <img :src="`http://localhost:3000/${user?.avatar || 'user.png'}`" alt="avatar" class="user-avatar" />
        <div class="comment-input-wrapper">
          <input 
            v-model="newComment" 
            @keypress.enter="submitComment"
            placeholder="Viết bình luận..."
            class="comment-input"
          />
          <button @click="submitComment" class="send-comment-btn" :disabled="!newComment.trim()">
            ➤
          </button>
        </div>
      </div>
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
  name: "ProfilePage",
  data() {
    return {
      user: {},
      posts: [],
      newPostContent: "",
      newPostFile: null,
      activeTab: 'posts',
      tabs: [
        { id: 'posts', label: 'Bài viết' },
        { id: 'about', label: 'Giới thiệu' },
        { id: 'friends', label: 'Bạn bè' }
      ],
      defaultAvatar: '../assets/user.png',
      defaultCover: '../assets/user.png',

      openMenuId: null,
      confirmVisible: false,
      confirmMessage: '',
      postToDeleteId: null,
      editModalVisible: false,
      editContent: '',
      editPostId: null,
      commentModalVisible: false,
      selectedPost: null,
      comments: [],
      newComment: '',
    };
  },
  computed: {
    joinDateFormatted() {
      if (!this.user.createdAt) return 'N/A';
      return new Date(this.user.createdAt).toLocaleDateString();
    },
    postsWithImages() {
      return this.posts.filter(p => p.mediaType === 'image');
    }
  },
  methods: {
    formatTime(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleString();
  },
    
   getImageUrl(path) {
    return `http://localhost:3000/${path}`;
  },
  toggleMenu(postId) {
    this.openMenuId = this.openMenuId === postId ? null : postId;
  },
  
  async fetchPosts() {
    try {
      const res = await fetch("http://localhost:3000/posts");
      const data = await res.json();
      this.posts = data;
    } catch (err) {
      console.error("Lỗi khi tải bài viết:", err);
    }
  },

  // Comment modal methods
  async openCommentModal(post) {
    this.selectedPost = post;
    this.commentModalVisible = true;
    await this.fetchComments(post._id);
  },

  closeCommentModal() {
    this.commentModalVisible = false;
    this.selectedPost = null;
    this.comments = [];
    this.newComment = '';
  },

  async fetchComments(postId) {
    try {
      const res = await this.$axios.get(`/posts/${postId}/comments`);
      this.comments = res.data;
    } catch (err) {
      console.error("Lỗi khi tải comments:", err);
      this.comments = []; // Fallback to empty array
    }
  },

  async submitComment() {
    if (!this.newComment.trim()) return;
    
    const savedUser = JSON.parse(localStorage.getItem("user"));
    if (!savedUser) return alert("Vui lòng đăng nhập");

    try {
      const res = await this.$axios.post(`/posts/${this.selectedPost._id}/comments`, {
        content: this.newComment,
        author: savedUser.id
      });

      // Add new comment to list
      this.comments.push(res.data);
      this.newComment = '';
      
      // Update post comments count if needed
      if (this.selectedPost.comments) {
        this.selectedPost.comments.push(res.data);
      }
    } catch (err) {
      console.error("Không thể thêm comment:", err);
      alert("Không thể thêm bình luận");
    }
  },

  async toggleLike(post) {
    const savedUser = JSON.parse(localStorage.getItem("user"));
    if (!savedUser) return alert("Vui lòng đăng nhập");

    try {
      const res = await this.$axios.post(`/posts/${post._id}/like`, {
        username: savedUser.username
      });

      post.likes = res.data.likes; // cập nhật lại mảng likes mới
    } catch (err) {
      console.error("Không thể like:", err.response?.data || err.message);
      alert("Không thể like bài viết");
    }
  },
  editPost(post) {
  this.$router.push(`/posts/${post._id}/edit`);
},
  deletePost(postId) {
  this.confirmMessage = 'Bạn có chắc chắn muốn xoá bài viết này?';
  this.postToDeleteId = postId;
  this.confirmVisible = true;
},
  async handleConfirmedDelete() {
  try {
    await this.$axios.delete(`/posts/${this.postToDeleteId}`);
    this.posts = this.posts.filter(p => p._id !== this.postToDeleteId);
    this.openMenuId = null;
  } catch (err) {
    console.error("Xoá bài viết thất bại:", err);
  }
  this.confirmVisible = false;
},
  isMyPost(post) {
  const savedUser = JSON.parse(localStorage.getItem("user"));
  return savedUser && post.author._id === savedUser.id;
  },
  isLiked(post) {
    const savedUser = JSON.parse(localStorage.getItem("user"));
    return post.likes.includes(savedUser.id); // `savedUser.id` là chuỗi
  },

  isImage(filePath) {
    return /\.(jpg|jpeg|png|gif)$/i.test(filePath);
  },
  
  
  commentPost(post) {
    this.openCommentModal(post);
  },
  sharePost(post) {
    alert(`Bạn đã chia sẻ bài viết: ${post.content}`);
  }
},
  mounted() {
  const savedUser = localStorage.getItem("user");
  if (savedUser) {
    this.user = JSON.parse(savedUser);
    this.fetchPosts(); // Gọi API để lấy bài viết
  } else {
    this.$router.push("/login");
  }
},
};
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.profile-container {
  max-width: 1200px;
  margin: 0 auto;
  background: #f0f2f5;
  min-height: 100vh;
}

/* Cover Section */
.cover-section {
  background: white;
  border-radius: 0 0 8px 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.cover-photo {
  position: relative;
  height: 400px;
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

/* Profile Info Bar */
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
  font-size: 32px;
  font-weight: bold;
  margin: 0;
  color: #1c1e21;
}

.friends-count {
  color: #65676b;
  margin: 4px 0;
  font-size: 15px;
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
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid white;
  margin-left: -4px;
}

.mutual-text {
  color: #65676b;
  font-size: 15px;
}

.profile-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

/* Navigation */
.profile-nav {
  background: white;
  border-top: 1px solid #dadde1;
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
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

.nav-more-btn {
  background: #e4e6ea;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}

/* Main Content */
.profile-content {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 16px;
  padding: 16px 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.card {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 16px;
}

.card h3 {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 16px;
  color: #1c1e21;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.see-all {
  color: #1877f2;
  text-decoration: none;
  font-weight: 600;
}

/* Intro Card */
.intro-items {
  margin-bottom: 16px;
}

.intro-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  color: #1c1e21;
}

.intro-item i {
  color: #65676b;
  width: 20px;
}

/* Photos Grid */
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

/* Friends Grid */
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

.friend-name {
  font-weight: 600;
  color: #1c1e21;
}

/* Posts Section */
.create-post {
  margin-bottom: 16px;
}

.create-post-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.small-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.post-input {
  flex: 1;
  border: none;
  background: #f0f2f5;
  padding: 12px 16px;
  border-radius: 24px;
  font-size: 16px;
  cursor: pointer;
}

.create-post-actions {
  display: flex;
  justify-content: space-around;
  border-top: 1px solid #dadde1;
  padding-top: 8px;
}

.post-action {
  background: none;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #65676b;
  flex: 1;
  justify-content: center;
}

.post-action:hover {
  background: #f2f2f2;
}

/* Post Cards */
.post-card {
  margin-bottom: 16px;
}

.post-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.post-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.post-info {
  flex: 1;
}

.post-author {
  font-weight: bold;
  margin: 0;
  color: #1c1e21;
}

.post-time {
  color: #65676b;
  font-size: 13px;
}

.post-menu {
  background: none;
  border: none;
  padding: 8px;
  border-radius: 50%;
  cursor: pointer;
}

.post-content {
  margin-bottom: 12px;
}

.post-content p {
  margin: 0 0 12px 0;
  color: #1c1e21;
  line-height: 1.34;
}

.post-image {
  width: 100%;
  border-radius: 8px;
}

.post-stats {
  display: flex;
  justify-content: space-between;
  color: #65676b;
  font-size: 15px;
  padding: 8px 0;
  border-bottom: 1px solid #dadde1;
  margin-bottom: 8px;
}

.post-actions {
  display: flex;
  justify-content: space-around;
}

.action-btn {
  background: none;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #65676b;
  flex: 1;
  justify-content: center;
}

.action-btn:hover {
  background: #f2f2f2;
}

/* Buttons */
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

.btn-secondary {
  background: #e4e6ea;
  color: #1c1e21;
}

.btn-icon {
  background: #e4e6ea;
  padding: 8px;
  width: 36px;
  height: 36px;
  justify-content: center;
}

.btn-full {
  width: 100%;
  justify-content: center;
  margin-bottom: 8px;
}

/* Icons (placeholder - bạn có thể thay thế bằng icon library) */
.icon-camera::before { content: "📷"; }
.icon-plus::before { content: "➕"; }
.icon-edit::before { content: "✏️"; }
.icon-dots::before { content: "⋯"; }
.icon-work::before { content: "💼"; }
.icon-education::before { content: "🎓"; }
.icon-location::before { content: "📍"; }
.icon-home::before { content: "🏠"; }
.icon-heart::before { content: "❤️"; }
.icon-calendar::before { content: "📅"; }
.icon-video::before { content: "📹"; }
.icon-photo::before { content: "🖼️"; }
.icon-smile::before { content: "😊"; }
.icon-like::before { content: "👍"; }
.icon-comment::before { content: "💬"; }
.icon-share::before { content: "📤"; }

/* Responsive */
@media (max-width: 768px) {
  .profile-content {
    grid-template-columns: 1fr;
    padding: 16px;
  }
  
  .profile-info-bar {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 16px;
  }
  
  .profile-main-info {
    flex-direction: column;
    align-items: center;
  }
  
  .nav-tabs {
    overflow-x: auto;
  }
}
</style>