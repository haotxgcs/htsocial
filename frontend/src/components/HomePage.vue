<template>

  <div class="homepage">
    <!-- Sidebar trái -->
    <aside class="sidebar-left">
      <h2 class="profile-name"><img src="../assets/user.png" class="menu-icon-left"/>{{ user?.firstname }} {{ user?.lastname }}</h2>
      <ul>
        <li><img src="../assets/sidebar/ai.png" class="menu-icon-left"/>AI</li>
        <li><img src="../assets/sidebar/friend.png" class="menu-icon-left"/>Bạn bè</li>
        <li><img src="../assets/sidebar/group.png" class="menu-icon-left"/>Nhóm</li>
        <li><img src="../assets/sidebar/marketplace.png" class="menu-icon-left"/>Marketplace</li>
        <li><img src="../assets/sidebar/game.png" class="menu-icon-left"/>Chơi game</li>
        
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
      <button v-if="isMyPost(post)" @click="editPost(post)"> Chỉnh sửa bài viết</button>
      <button v-if="isMyPost(post)"> Chỉnh sửa đối tượng</button>
      <button>Hide this Post</button>
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

    </main>

    

    <!-- Sidebar phải -->
    <aside class="sidebar-right">
      <h3>Người liên hệ</h3>
      <ul>
        <li><img src="../assets/user.png" class="menu-icon-right"/><span class="status online"></span> Trần Xuân Hào</li>
        <li><img src="../assets/user.png" class="menu-icon-right"/><span class="status online"></span> Tran Hao</li>
        <li><img src="../assets/user.png" class="menu-icon-right"/><span class="status offline"></span> Phi Rùi</li>
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
        <button class="action-btn" disabled>
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

</template>

<script>
import ConfirmDialog from './ConfirmDialog.vue';

export default {
  name: "HomePage",
  components: {
  ConfirmDialog
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
      
      // Comment modal data
      commentModalVisible: false,
      selectedPost: null,
      comments: [],
      newComment: '',
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
      const res = await fetch(`http://localhost:3000/comments/posts/${postId}`);
      const data = await res.json();
      this.comments = data;
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
      const res = await fetch(`http://localhost:3000/comments/posts/${this.selectedPost._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: this.newComment,
          author: savedUser.id
        })
      });

      const newComment = await res.json();

      // Add new comment to list
      this.comments.push(newComment);
      this.newComment = '';
      
      // Update post comments count if needed
      if (this.selectedPost.comments) {
        this.selectedPost.comments.push(newComment);
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
      post.likes = data.likes; // cập nhật lại mảng likes mới
    } catch (err) {
      console.error("Không thể like:", err);
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
    const res = await fetch(`http://localhost:3000/posts/${this.postToDeleteId}`, {
      method: 'DELETE'
    });
    
    if (res.ok) {
      this.posts = this.posts.filter(p => p._id !== this.postToDeleteId);
      this.openMenuId = null;
    }
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
    return post.likes && post.likes.includes(savedUser.id); // `savedUser.id` là chuỗi
  },

  isImage(filePath) {
    return /\.(jpg|jpeg|png|gif)$/i.test(filePath);
  },
  formatTime(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleString();
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

/* Comment Modal Styles - Fixed Layout */
.comment-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  padding: 20px;
  box-sizing: border-box;
}

.comment-modal-content {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 600px;
  height: 85vh; /* Đặt chiều cao cố định cho modal */
  max-height: 800px; /* Giới hạn chiều cao tối đa */
  min-height: 500px; /* Chiều cao tối thiểu */
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* Modal Header - Fixed at top */
.comment-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e4e6eb;
  background: white;
  flex-shrink: 0; /* Không cho phép co lại */
  position: sticky;
  top: 0;
  z-index: 10;
}

.comment-modal-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1c1e21;
}

.close-btn {
  background: #f0f2f5;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 20px;
  color: #606770;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #e4e6ea;
  color: #1c1e21;
}

/* Post Detail Section - Scrollable */
.post-detail {
  padding: 20px 24px;
  border-bottom: 1px solid #e4e6eb;
  flex-shrink: 0; /* Không cho phép co lại */
  overflow-y: auto; /* Thêm cuộn nếu nội dung quá dài */
  max-height: 300px; /* Giới hạn chiều cao để không chiếm hết không gian */
}

.post-author-info {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.author-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 12px;
  object-fit: cover;
  flex-shrink: 0;
}

.author-details strong {
  font-size: 15px;
  font-weight: 600;
  color: #1c1e21;
}

.author-details .time {
  font-size: 13px;
  color: #65676b;
  margin-top: 2px;
}

.post-content {
  font-size: 15px;
  line-height: 1.4;
  color: #1c1e21;
  margin: 12px 0;
  word-wrap: break-word;
}

/* Media in Modal - Fixed sizing */
.post-media-modal {
  margin: 16px 0;
  text-align: center;
}

.post-image-modal,
.post-video-modal {
  width: 100%;
  max-width: 100%;
  max-height: 200px; /* Giới hạn chiều cao hình ảnh */
  object-fit: contain; /* Thay đổi từ cover thành contain để không bị cắt */
  border-radius: 8px;
  display: block;
}

/* Post Stats */
.post-stats {
  display: flex;
  gap: 16px;
  margin: 16px 0 12px 0;
  font-size: 14px;
  color: #65676b;
}

/* Action Buttons in Modal */
.post-actions-modal {
  display: flex;
  justify-content: space-around;
  padding: 8px 0;
  border-top: 1px solid #e4e6eb;
  margin-top: 12px;
  flex-shrink: 0;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  color: #65676b;
  transition: all 0.2s ease;
  flex: 1;
  justify-content: center;
}

.action-btn:hover {
  background: #f0f2f5;
  color: #1877f2;
}

.action-icon {
  width: 20px;
  height: 20px;
}

/* Comments Section - Flexible height */
.comments-section {
  flex: 1; /* Chiếm toàn bộ không gian còn lại */
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0; /* Quan trọng để flex hoạt động đúng */
}

.comments-list {
  flex: 1; /* Chiếm không gian còn lại */
  overflow-y: auto; /* Bật thanh cuộn dọc */
  overflow-x: hidden; /* Ẩn thanh cuộn ngang */
  padding: 16px 24px;
  min-height: 200px; /* Đặt chiều cao tối thiểu */
}

/* No Comments State */
.no-comments {
  text-align: center;
  padding: 40px 20px;
  color: #65676b;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  min-height: 150px;
}

.no-comments-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.no-comments p {
  margin: 8px 0;
  font-size: 17px;
  font-weight: 600;
}

.sub-text {
  font-size: 14px;
  font-weight: normal !important;
  opacity: 0.8;
}

/* Comment Items */
.comment-item {
  display: flex;
  margin-bottom: 16px;
  padding: 8px 4px;
}

.comment-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  margin-right: 8px;
  object-fit: cover;
  flex-shrink: 0;
}

.comment-content {
  flex: 1;
  min-width: 0; /* Ngăn overflow */
}

.comment-bubble {
  background: #f0f2f5;
  border-radius: 16px;
  padding: 8px 12px;
  display: inline-block;
  max-width: 100%;
  word-wrap: break-word;
}

.comment-author {
  font-size: 13px;
  font-weight: 600;
  color: #1c1e21;
  display: block;
  margin-bottom: 2px;
}

.comment-text {
  font-size: 14px;
  color: #1c1e21;
  margin: 0;
  line-height: 1.4;
  word-wrap: break-word;
}

.comment-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 4px;
  margin-left: 12px;
}

.comment-time {
  font-size: 12px;
  color: #65676b;
}

.comment-action-btn {
  background: none;
  border: none;
  font-size: 12px;
  font-weight: 600;
  color: #65676b;
  cursor: pointer;
  padding: 0;
}

.comment-action-btn:hover {
  text-decoration: underline;
  color: #1877f2;
}

/* Add Comment Section - Fixed at bottom */
.add-comment-section {
  display: flex;
  align-items: center;
  padding: 16px 24px;
  border-top: 1px solid #e4e6eb;
  background: white;
  gap: 8px;
  flex-shrink: 0; /* Không cho phép co lại - luôn hiển thị */
  position: sticky;
  bottom: 0;
  z-index: 10;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.comment-input-wrapper {
  display: flex;
  align-items: center;
  flex: 1;
  background: #f0f2f5;
  border-radius: 20px;
  padding: 8px 12px;
}

.comment-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 14px;
  padding: 0;
  color: #1c1e21;
}

.comment-input::placeholder {
  color: #65676b;
}

.send-comment-btn {
  background: none;
  border: none;
  color: #1877f2;
  font-size: 16px;
  cursor: pointer;
  padding: 0 4px;
  margin-left: 8px;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.send-comment-btn:hover:not(:disabled) {
  transform: scale(1.1);
  color: #166fe5;
}

.send-comment-btn:disabled {
  color: #bcc0c4;
  cursor: not-allowed;
}

/* Scrollbar styling */
.comments-list::-webkit-scrollbar,
.post-detail::-webkit-scrollbar {
  width: 6px;
}

.comments-list::-webkit-scrollbar-track,
.post-detail::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.comments-list::-webkit-scrollbar-thumb,
.post-detail::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.comments-list::-webkit-scrollbar-thumb:hover,
.post-detail::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Responsive Design */
@media (max-width: 768px) {
  .comment-modal-overlay {
    padding: 10px;
  }
  
  .comment-modal-content {
    height: 90vh; /* Chiều cao lớn hơn trên mobile */
    max-height: none;
  }
  
  .post-detail {
    max-height: 250px; /* Giảm chiều cao post detail trên mobile */
  }
  
  .comments-list {
    padding: 0 16px;
  }
  
  .add-comment-section {
    padding: 12px 16px;
  }
}

</style>
