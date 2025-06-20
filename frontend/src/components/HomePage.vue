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
        <h3>Create your post</h3>
        <input type="text" @click="openCreatePostModal" :placeholder="`What's is on your mind, ${user?.firstname} ${user?.lastname}?`"/>

        <!-- <div class="post-options">
          <button @click="openCreatePostModal">🎥 Video</button>
          <button @click="openCreatePostModal">📷 Ảnh</button>
          <button @click="openCreatePostModal">🎬 Thước phim</button>
        </div> -->
      </div>

      <div class="post" v-for="post in posts" :key="post._id">
  <div class="post-header">
  <div class="post-author-info">
    <img :src="getAvatarUrl(post.author)" alt="avatar" />
    <div class="author-details">
      <strong>{{ post.author?.firstname }} {{ post.author?.lastname }}</strong>
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

<!-- Create Post Modal -->
<div v-if="createPostModalVisible" class="create-post-modal-overlay" @click="closeCreatePostModal">
  <div class="create-post-modal-content" @click.stop>
    <!-- Header modal -->
    <div class="create-post-modal-header">
      <h3>Tạo bài viết</h3>
      <button class="close-btn" @click="closeCreatePostModal">&times;</button>
    </div>

    <!-- User info -->
    <div class="post-creator-info">
      <img :src="`http://localhost:3000/${user?.avatar || 'user.png'}`" alt="avatar" class="creator-avatar" />
      <div class="creator-details">
        <strong>{{ user?.firstname }} {{ user?.lastname }}</strong>
        <div class="privacy-selector">
          <select v-model="postPrivacy">
            <option value="public">🌐 Công khai</option>
            <option value="friends">👥 Bạn bè</option>
            <option value="private">🔒 Chỉ mình tôi</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Post content -->
    <div class="post-content-area">
      <textarea 
        v-model="newPostContent" 
        :placeholder="`${user?.firstname} ${user?.lastname} ơi, bạn đang nghĩ gì thế?`"
        class="post-textarea"
        ref="postTextarea"
        @input="adjustTextareaHeight"
      ></textarea>
      
      <!-- Emoji picker button -->
      <div class="emoji-toolbar">
        <button @click="toggleEmojiPicker" class="emoji-btn" type="button"><img src="../assets/emoji.png"></button>
        <div v-if="showEmojiPicker" class="emoji-picker">
          <div class="emoji-categories">
            <button 
              v-for="category in emojiCategories" 
              :key="category.name"
              @click="selectedEmojiCategory = category.name"
              :class="{ active: selectedEmojiCategory === category.name }"
              class="emoji-category-btn"
            >
              {{ category.icon }}
            </button>
          </div>
          <div class="emoji-grid">
            <button 
              v-for="emoji in getCurrentCategoryEmojis()" 
              :key="emoji"
              @click="insertEmoji(emoji)"
              class="emoji-item"
            >
              {{ emoji }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Media preview -->
    <div v-if="selectedMedia" class="media-preview">
      <div class="media-preview-container">
        <img v-if="isImageFile(selectedMedia)" :src="mediaPreviewUrl" class="preview-image" />
        <video v-else-if="isVideoFile(selectedMedia)" :src="mediaPreviewUrl" class="preview-video" controls></video>
        <button @click="removeMedia" class="remove-media-btn">&times;</button>
      </div>
    </div>

    <!-- Add to post options -->
    <div class="add-to-post">
      <span class="add-to-post-label">Thêm vào bài viết của bạn</span>
      <div class="add-options">
        <label class="add-option">
          <input type="file" @change="handleMediaSelect" accept="image/*,video/*" style="display: none;">
          <span class="option-icon"><img src="../assets/media.png"></span>
          <span>Ảnh/Video</span>
        </label>
        <button class="add-option" @click="insertEmoji('😀')">
          <span class="option-icon"><img src="../assets/emoji.png"></span>
          <span>Cảm xúc</span>
        </button>
        <button class="add-option">
          <span class="option-icon">📍</span>
          <span>Check in</span>
        </button>
      </div>
    </div>

    <!-- Post button -->
    <div class="post-actions-footer">
      <button 
        @click="submitNewPost" 
        :disabled="!canPost"
        class="post-submit-btn"
        :class="{ disabled: !canPost }"
      >
        Đăng
      </button>
    </div>
  </div>
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
        <img :src="getAvatarUrl(selectedPost?.author.avatar)" alt="avatar" class="user-avatar" />
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
            <img :src="`http://localhost:3000/${user?.avatar || 'user.png'}`" alt="avatar" class="user-avatar" />
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
      editPostId: null,
      
      // Comment modal data
      commentModalVisible: false,
      selectedPost: null,
      comments: [],
      newComment: '',

      // Create Post Modal data
      createPostModalVisible: false,
      newPostContent: '',
      postPrivacy: 'public',
      selectedMedia: null,
      mediaPreviewUrl: null,
      
      // Emoji picker data
      showEmojiPicker: false,
      selectedEmojiCategory: 'smileys',
      emojiCategories: [
        { name: 'smileys', icon: '😀' },
        { name: 'people', icon: '👋' },
        { name: 'nature', icon: '🌸' },
        { name: 'food', icon: '🍕' },
        { name: 'activities', icon: '⚽' },
        { name: 'travel', icon: '🏠' },
        { name: 'objects', icon: '💡' },
        { name: 'symbols', icon: '❤️' }
      ],
      emojis: {
        smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳'],
        people: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '👊', '✊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏'],
        nature: ['🌸', '💐', '🌹', '🥀', '🌺', '🌻', '🌼', '🌷', '🌱', '🌲', '🌳', '🌴', '🌵', '🌶️', '🍄', '🌾', '💮', '🏔️', '⛰️', '🌋', '🗻', '🏕️', '🏖️', '🏜️', '🏝️', '🏞️'],
        food: ['🍕', '🍔', '🍟', '🌭', '🥪', '🌮', '🌯', '🥙', '🧆', '🥚', '🍳', '🥘', '🍲', '🥗', '🍿', '🧈', '🧂', '🥯', '🍞', '🥖', '🥨', '🧀', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖'],
        activities: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽'],
        travel: ['🏠', '🏡', '🏘️', '🏚️', '🏗️', '🏭', '🏢', '🏬', '🏣', '🏤', '🏥', '🏦', '🏨', '🏪', '🏫', '🏩', '💒', '🏛️', '⛪', '🕌', '🛕', '🕍', '🕋', '⛩️', '🛤️', '🛣️', '🗾'],
        objects: ['💡', '🔦', '🏮', '🪔', '📱', '💻', '🖥️', '🖨️', '⌨️', '🖱️', '🖲️', '💽', '💾', '💿', '📀', '🧮', '🎥', '🎞️', '📽️', '🎬', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏱️'],
        symbols: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎']
      }
    }
  },

  computed: {
    canPost() {
      return this.newPostContent.trim().length > 0 || this.selectedMedia;
    }
  },

  methods: {
    getAvatarUrl(author) {
  if (!author || !author.avatar) return 'http://localhost:3000/uploads/user.png';
  return `http://localhost:3000/${author.avatar}`;
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
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    this.posts = data;
  } catch (err) {
    console.error("Lỗi khi tải bài viết:", err);
    alert("Không thể tải bài viết");
  }
},

  // Create Post Modal methods
  openCreatePostModal() {
    this.createPostModalVisible = true;
    this.newPostContent = '';
    this.selectedMedia = null;
    this.mediaPreviewUrl = null;
    this.showEmojiPicker = false;
    
    // Focus vào textarea sau khi modal mở
    this.$nextTick(() => {
      if (this.$refs.postTextarea) {
        this.$refs.postTextarea.focus();
      }
    });
  },

  closeCreatePostModal() {
    this.createPostModalVisible = false;
    this.newPostContent = '';
    this.selectedMedia = null;
    this.mediaPreviewUrl = null;
    this.showEmojiPicker = false;
  },

  adjustTextareaHeight() {
    this.$nextTick(() => {
      const textarea = this.$refs.postTextarea;
      if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
      }
    });
  },

  // Emoji picker methods
  toggleEmojiPicker() {
    this.showEmojiPicker = !this.showEmojiPicker;
  },

  getCurrentCategoryEmojis() {
    return this.emojis[this.selectedEmojiCategory] || [];
  },

  insertEmoji(emoji) {
    const textarea = this.$refs.postTextarea;
    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    
    this.newPostContent = this.newPostContent.substring(0, startPos) + 
                         emoji + 
                         this.newPostContent.substring(endPos);
    
    // Đặt con trỏ sau emoji vừa chèn
    this.$nextTick(() => {
      textarea.focus();
      textarea.setSelectionRange(startPos + emoji.length, startPos + emoji.length);
    });
    
    this.adjustTextareaHeight();
  },

  // Media handling methods
  handleMediaSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    this.selectedMedia = file;
    this.mediaPreviewUrl = URL.createObjectURL(file);
  },

  removeMedia() {
    if (this.mediaPreviewUrl) {
      URL.revokeObjectURL(this.mediaPreviewUrl);
    }
    this.selectedMedia = null;
    this.mediaPreviewUrl = null;
  },

  isImageFile(file) {
    return file && file.type.startsWith('image/');
  },

  isVideoFile(file) {
    return file && file.type.startsWith('video/');
  },

  // Submit new post
  async submitNewPost() {
    if (!this.canPost) return;

    const savedUser = JSON.parse(localStorage.getItem("user"));
    if (!savedUser) return alert("Vui lòng đăng nhập");

    try {
      const formData = new FormData();
      formData.append('content', this.newPostContent);
      formData.append('author', savedUser.username);
      formData.append('privacy', this.postPrivacy);
      
      if (this.selectedMedia) {
        formData.append('image', this.selectedMedia);
      }

      // ✅ Sửa: Thêm headers Content-Type
    const res = await fetch('http://localhost:3000/posts', {
      method: 'POST',
      headers: {
        // Không cần set Content-Type khi dùng FormData, browser sẽ tự set
      },
      body: formData
    });

    // ✅ Sửa: Kiểm tra response status
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const newPost = await res.json();
    
    // Thêm bài viết mới vào đầu danh sách
    newPost.createdAt = new Date(newPost.createdAt || Date.now());
    await this.fetchPosts();

    
    // Đóng modal và reset form
    this.closeCreatePostModal();
    
    alert('Đăng bài thành công!');
  } catch (err) {
    console.error("Không thể tạo bài viết:", err);
    alert("Không thể đăng bài viết: " + err.message);
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
      this.comments = [];
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

      this.comments.push(newComment);
      this.newComment = '';
      
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
      post.likes = data.likes;
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
    return post.likes && post.likes.includes(savedUser.id);
  },

  isImage(filePath) {
    return /\.(jpg|jpeg|png|gif)$/i.test(filePath);
  },
  formatTime(dateStr) {
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? '' : date.toLocaleString();
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
    this.fetchPosts();
  } else {
    this.$router.push("/login");
  }
  
  // Đóng emoji picker khi click ra ngoài
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.emoji-toolbar')) {
      this.showEmojiPicker = false;
    }
  });
},

beforeUnmount() {
  // Cleanup event listener
  document.removeEventListener('click', () => {});
  
  // Cleanup media preview URL
  if (this.mediaPreviewUrl) {
    URL.revokeObjectURL(this.mediaPreviewUrl);
  }
}

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

/* Create Post Modal Overlay */
.create-post-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;
}

.create-post-modal-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  width: 90%;
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease-out;
}

/* Modal Header */
.create-post-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e4e6ea;
  position: relative;
}

.create-post-modal-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #1c1e21;
  text-align: center;
  flex: 1;
}

.close-btn {
  position: absolute;
  right: 16px;
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
  color: #8a8d91;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background: #e4e6ea;
}

/* Post Creator Info */
.post-creator-info {
  display: flex;
  align-items: center;
  padding: 16px 24px;
  gap: 12px;
}

.creator-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.creator-details {
  flex: 1;
}

.creator-details strong {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: #1c1e21;
  margin-bottom: 4px;
}

.privacy-selector select {
  background: #f0f2f5;
  border: none;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 13px;
  color: #65676b;
  cursor: pointer;
}

/* Post Content Area */
.post-content-area {
  padding: 0 24px;
  position: relative;
}

.post-textarea {
  width: 100%;
  min-height: 120px;
  border: none;
  outline: none;
  resize: none;
  font-size: 24px;
  font-family: inherit;
  line-height: 1.2;
  color: #1c1e21;
  background: transparent;
  padding: 0;
  margin-bottom: 16px;
}

.post-textarea::placeholder {
  color: #8a8d91;
  font-weight: 400;
}

/* Emoji Toolbar */
.emoji-toolbar {
  position: relative;
  margin-bottom: 16px;
}

.emoji-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.emoji-btn:hover {
  background: #f0f2f5;
}

/* Emoji Picker */
.emoji-picker {
  position: absolute;
  top: 100%;
  left: 0;
  background: white;
  border: 1px solid #e4e6ea;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  width: 320px;
  max-height: 300px;
  overflow: hidden;
  z-index: 1001;
  animation: slideDown 0.2s ease-out;
}

.emoji-categories {
  display: flex;
  padding: 8px;
  border-bottom: 1px solid #e4e6ea;
  background: #f8f9fa;
}

.emoji-category-btn {
  background: none;
  border: none;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.2s;
}

.emoji-category-btn:hover,
.emoji-category-btn.active {
  background: #e4e6ea;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 4px;
  padding: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.emoji-item {
  background: none;
  border: none;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 18px;
  transition: background-color 0.2s;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.emoji-item:hover {
  background: #f0f2f5;
}

/* Media Preview */
.media-preview {
  padding: 0 24px 16px;
}

.media-preview-container {
  position: relative;
  border: 1px solid #e4e6ea;
  border-radius: 12px;
  overflow: hidden;
  background: #f8f9fa;
}

.preview-image,
.preview-video {
  width: 100%;
  max-height: 300px;
  object-fit: cover;
  display: block;
}

.remove-media-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 18px;
  transition: background-color 0.2s;
}

.remove-media-btn:hover {
  background: rgba(0, 0, 0, 0.8);
}

/* Add to Post Options */
.add-to-post {
  padding: 16px 24px;
  border: 1px solid #e4e6ea;
  border-radius: 12px;
  margin: 0 24px 16px;
}

.add-to-post-label {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: #1c1e21;
  margin-bottom: 12px;
}

.add-options {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.add-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: none;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 14px;
  color: #65676b;
  flex: 1;
  justify-content: center;
}

.add-option:hover {
  background: #f0f2f5;
}

.option-icon {
  font-size: 20px;
}

/* Post Actions Footer */
.post-actions-footer {
  padding: 16px 24px;
  border-top: 1px solid #e4e6ea;
}

.post-submit-btn {
  width: 100%;
  padding: 12px;
  background: #1877f2;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.post-submit-btn:hover:not(.disabled) {
  background: #166fe5;
}

.post-submit-btn.disabled {
  background: #e4e6ea;
  color: #bcc0c4;
  cursor: not-allowed;
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes slideDown {
  from {
    transform: translateY(-10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .create-post-modal-content {
    width: 95%;
    margin: 20px;
    max-height: calc(100vh - 40px);
  }
  
  .post-textarea {
    font-size: 18px;
  }
  
  .emoji-picker {
    width: calc(100vw - 80px);
    max-width: 320px;
  }
  
  .add-options {
    flex-direction: column;
  }
  
  .add-option {
    justify-content: flex-start;
  }
}

/* Scrollbar Styling */
.create-post-modal-content::-webkit-scrollbar,
.emoji-grid::-webkit-scrollbar {
  width: 6px;
}

.create-post-modal-content::-webkit-scrollbar-track,
.emoji-grid::-webkit-scrollbar-track {
  background: #f8f9fa;
  border-radius: 3px;
}

.create-post-modal-content::-webkit-scrollbar-thumb,
.emoji-grid::-webkit-scrollbar-thumb {
  background: #bcc0c4;
  border-radius: 3px;
}

.create-post-modal-content::-webkit-scrollbar-thumb:hover,
.emoji-grid::-webkit-scrollbar-thumb:hover {
  background: #8a8d91;
}

</style>
