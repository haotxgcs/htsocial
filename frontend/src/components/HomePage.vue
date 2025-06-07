<template>

  <div class="homepage">
    <!-- Sidebar trái -->
    <aside class="sidebar-left">
      <h2 class="profile-name"><img src="../assets/user.png" class="menu-icon-left"/>{{ user?.firstname }} {{ user?.lastname }}</h2>
      <ul>
        <li><img src="../assets/user.png" class="menu-icon-left"/>Meta AI</li>
        <li><img src="../assets/user.png" class="menu-icon-left"/>Bạn bè</li>
        <li><img src="../assets/user.png" class="menu-icon-left"/>Công cụ chuyên nghiệp</li>
        <li><img src="../assets/user.png" class="menu-icon-left"/>Trang</li>
        <li><img src="../assets/user.png" class="menu-icon-left"/>Bảng feed</li>
        <li><img src="../assets/user.png" class="menu-icon-left"/>Nhóm</li>
        <li><img src="../assets/user.png" class="menu-icon-left"/>Marketplace</li>
        <li><img src="../assets/user.png" class="menu-icon-left"/>Chiến dịch gây quỹ</li>
        <li><img src="../assets/user.png" class="menu-icon-left"/>Chơi game</li>
        <li><img src="../assets/user.png" class="menu-icon-left"/>Đã lưu</li>
        <li><img src="../assets/user.png" class="menu-icon-left"/>Đơn đặt hàng và thanh toán</li>
      </ul>
    </aside>

    <!-- Feed chính -->
    <main class="feed">
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
      <button> Ẩn bài viết</button>
      <button v-if="isMyPost(post)" @click="editPost(post)"> Chỉnh sửa bài viết</button>
      <button v-if="isMyPost(post)"> Chỉnh sửa đối tượng</button>
      <button v-if="isMyPost(post)" @click="deletePost(post._id)" style="color: red"> Xoá bài viết</button>
    </div>
  </div>
</div>



  <p class="post-text" @click="openPostDetail(post)">{{ post.content }}</p>

  
  <!-- Media (ảnh hoặc video) -->
 <div v-if="post.media" class="post-media" @click="openPostDetail(post)">
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
  <button @click="openPostDetail(post)">
    <img src="../assets/comment.png" alt="Comment" class="action-icon" />
    <span>Comment</span>
  </button>
  <button @click="sharePost(post)">
    <img src="../assets/share.png" alt="Share" class="action-icon" />
    <span>Share</span>
  </button>
</div>

</div>

    </main>

    

    <!-- Sidebar phải -->
    <aside class="sidebar-right">
      <h3>Người liên hệ</h3>
      <ul>
        <li><img src="../assets/user.png" class="menu-icon-right"/><span class="status online"></span> Trần Xuân Hào</li>
        <li><img src="../assets/user.png" class="menu-icon-right"/><span class="status online"></span> Tran Hao</li>
        <li><img src="../assets/user.png" class="menu-icon-right"/><span class="status offline"></span> Hao Tran</li>
      </ul>
    </aside>
  </div>
<ConfirmDialog
  v-if="confirmVisible"
  :message="confirmMessage"
  @confirm="handleConfirmedDelete"
  @cancel="confirmVisible = false"
/>

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

<PostDetailModal v-if="selectedPost" :post="selectedPost" @close="closePostDetail" />
</template>

<script>
import ConfirmDialog from './ConfirmDialog.vue';
import PostDetailModal from './PostDetailModal.vue';

export default {
  name: "HomePage",
  components: {
  ConfirmDialog,
  PostDetailModal
  },
  data() {
    return {
      user: null,
      posts: [],
      openMenuId: null,
      confirmVisible: false,
      confirmMessage: '',
      postToDeleteId: null,
      editModalVisible: false,
      editContent: '',
      editPostId: null, // ID của bài viết đang được chỉnh sửa
      selectedPost: null
    }
  },

  methods: {
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
    openPostDetail(post) {
      this.selectedPost = post;
    },
    closePostDetail() {
      this.selectedPost = null;
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
  formatTime(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleString();
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
.homepage {
  display: flex;
  min-height: 100vh;
  background-color: #f0f2f5;
  font-family: Arial, sans-serif;
}

.sidebar-left {
  position: fixed;
  top: 56px; /* chiều cao header */
  left: 0;
  width: 250px;
  height: calc(100vh - 56px);
  /* background: white; */
  padding: 20px;
  border-right: 1px solid #ddd;
  overflow-y: auto;
  z-index: 2;
}

.sidebar-left ul {
  list-style: none;
  padding: 0;
}

.sidebar-left li {
  padding: 10px 0;
  border-bottom: 1px solid #eee;
  cursor: pointer;
}

.profile-name {
  font-weight: bold;
  font-size: 18px;
  margin-bottom: 20px;
}

.feed {
  width: 600px;
  margin: 0 auto;
  padding: 20px;
  margin-left: 500px;  
  /* margin-right: 230px; */
}

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

.post-options {
  display: flex;
  justify-content: space-around;
  margin-top: 10px;
}

.post-options button {
  background: #eee;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
}

.post {
  background: white;
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 20px;
   margin-top: 10px;
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
}

.post-header img {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  margin-right: 10px;
}

.post-header .time {
  font-size: 12px;
  color: gray;
  margin-top: 2px;
}

.post-text {
  margin: 10px 0;
  font-size: 14px;
}

.post-image {
  width: 100%;
  border-radius: 10px;
  margin-top: 10px;
}

.sidebar-right {
  position: fixed;
  top: 56px;
  right: 0;
  width: 220px;
  height: calc(100vh - 56px);
  /* background: white; */
  padding: 20px;
  border-left: 1px solid #ddd;
  overflow-y: auto;
  z-index: 2;
}

.sidebar-right ul {
  list-style: none;
  padding: 0;
}

.sidebar-right li {
  display: flex;
  align-items: center;
  margin: 10px 0;
}

.status {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  margin-right: 8px;
}

.online {
  background-color: green;
}

.offline {
  background-color: gray; 
}

/* Header Style */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  height: 56px;
  padding: 0 16px;
  border-bottom: 1px solid #ccc;
  position: sticky;
  top: 0;
  z-index: 10;
}


.left {
  display: flex;
  align-items: center;
}

.logo {
  height: 36px;
  margin-right: 12px;
}

.search {
  background: #f0f2f5;
  border: none;
  padding: 8px 12px;
  border-radius: 999px;
  font-size: 14px;
  width: 220px;
}


.center i {
  font-size: 20px;
  color: #606770;
  cursor: pointer;
  position: relative;
}

.center i.active {
  color: #1877f2;
  border-bottom: 3px solid #1877f2;
  padding-bottom: 3px;
}

.right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.icon-circle {
  background: #e4e6eb;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  position: relative;
}

.badge {
  position: absolute;
  top: -2px;
  right: -2px;
  background: red;
  color: white;
  font-size: 10px;
  border-radius: 999px;
  padding: 2px 5px;
}

.icon-img {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.avatar-image {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  object-fit: cover;
}

/* Post actions  */
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
}

.post-actions button:hover {
  color: #1877f2;
}

.post-image,
.post-video {
  width: 100%;
  border-radius: 10px;
  margin-top: 10px;
  max-height: 500px;
  object-fit: cover;
}

/* Center navigation  */
.center {
  flex: 2;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 40px;
}

.nav-icon {
  width: 45px;
  height: 45px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.nav-icon:hover {
  background-color: #f0f2f5;
}

.nav-icon.active {
  border-bottom: 3px solid #1877f2;
  background-color: #f0f2f5;
}

.icon-img {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.menu-icon-left {
  width: 30px;
  height: 30px;
  margin-right: 10px;
  vertical-align: middle;
}

.menu-icon-right {
  width: 40px;
  height: 40px;
  margin-right: 10px;
  vertical-align: middle;
}

.sidebar-left li {
  display: flex;
  align-items: center;
}

.contact-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  margin-right: 8px;
}

/* Post action icon */
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
}

.post-actions button:hover {
  color: #1877f2;
}

.action-icon {
  width: 20px;
  height: 20px;
}

/* post menu dropdown  */

.menu-post-icon {
  width: 15px;
  height: 15px;
  cursor: pointer;
}

.post-menu-wrapper {
  position: relative;
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

.post-author-info {
  display: flex;
  align-items: center;
}

.post-author-info img {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  margin-right: 10px;
  object-fit: cover;
}

.author-details {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.author-details strong {
  font-size: 15px;
  font-weight: bold;
}

.author-details .time {
  font-size: 12px;
  color: gray;
  margin-top: 2px;
}

</style>
