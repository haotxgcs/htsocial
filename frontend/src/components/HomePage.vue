<template>
  <div class="homepage">
    <!-- Sidebar trái -->
    <aside class="sidebar-left">
      <h2 class="profile-name"><img src="../assets/user.png" class="menu-icon-left"/>{{ user?.firstname }} {{ user?.lastname }}</h2>
      <ul>
        <li><img src="../assets/sidebar/ai.png" class="menu-icon-left"/>AI</li>
        <li><img src="../assets/sidebar/friend.png" class="menu-icon-left"/>Friend</li>
        <li><img src="../assets/sidebar/group.png" class="menu-icon-left"/>Group</li>
        <li><img src="../assets/sidebar/marketplace.png" class="menu-icon-left"/>Marketplace</li>
        <li><img src="../assets/sidebar/game.png" class="menu-icon-left"/>Game</li>
        <li @click="$router.push('/hidden')"><img src="../assets/sidebar/hide-post.png" class="menu-icon-left"/>Hidden Posts</li>
      </ul>
    </aside>

    <!-- Feed chính -->
    <main class="feed">
      <div class="create-post">
        <h3>Create your post</h3>
        <input type="text" @click="openCreatePostModal" :placeholder="`What's is on your mind, ${user?.firstname} ${user?.lastname}?`"/>
      </div>

      <div class="post" v-for="post in posts" :key="post._id">
  
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
            <span v-if="post.likes?.length > 0">{{ post.likes.length }} likes</span>
            <span v-if="getPostCommentCount(post) > 0">{{ getPostCommentCount(post) }} comments</span>
            <span v-if="post.sharesCount > 0">{{ post.sharesCount }} shares</span>
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

          <p class="post-text" v-if="post.content"><i>{{ post.content }}</i></p>

          <!-- ======= BÀI GỐC (bên trong share) ======= -->
          <!-- Shared post content box -->
          <div class="shared-box">
            <template v-if="post.post">
              <!-- Nếu viewer không được xem -->
              <template v-if="!canViewSharedPost(post.post)">
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
                <p>{{ post.post.content }}</p>
                <div v-if="post.post.media">
                  <img v-if="post.post.mediaType === 'image'" :src="`http://localhost:3000/${post.post.media}`" class="post-image" />
                  <video v-else controls class="post-video">
                    <source :src="`http://localhost:3000/${post.post.media}`" type="video/mp4" />
                  </video>
                </div>
                <!-- Like/Comment/Share count -->
                <div class="post-stats">
                  <span v-if="post.post.likes?.length > 0">{{ post.post.likes.length }} likes</span>
                  <span v-if="getPostCommentCount(post) > 0">{{ getPostCommentCount(post) }} comments</span>
                  <span v-if="post.post.sharesCount > 0">{{ post.post.sharesCount }} shares</span>
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
    </main>

    <!-- Sidebar phải -->
    <aside class="sidebar-right">
      <h3>Contacts</h3>

      <template v-if="friends && friends.length > 0">
        <ul>
          <li v-for="friend in friends" :key="friend._id">
            <img :src="getAvatarUrl(friend)" class="menu-icon-right" />
            <span class="status" :class="{ online: friend.active, offline: !friend.active }"></span>
            {{ friend.firstname }} {{ friend.lastname }}
          </li>
        </ul>
      </template>

      <template v-else>
        <p class="no-contacts">You have no contacts</p>
        <button @click="$router.push('/friend')" class="find-friends-btn">
          Find Friends
        </button>
      </template>
    </aside>
  </div>

  <!-- Create Post Modal -->
  <div v-if="createPostModalVisible" class="create-post-modal-overlay" @click="closeCreatePostModal">
    <div class="create-post-modal-content" @click.stop>
      <!-- Header modal -->
      <div class="create-post-modal-header">
        <h3>Create a post</h3>
        <button class="close-btn" @click="closeCreatePostModal">&times;</button>
      </div>

      <!-- User info -->
      <div class="post-creator-info">
        <img :src="`http://localhost:3000/${user?.avatar || 'user.png'}`" alt="avatar" class="creator-avatar" />
        <div class="creator-details">
          <strong>{{ user?.firstname }} {{ user?.lastname }}</strong>
          <div class="privacy-selector">
            <select v-model="postPrivacy">
              <option value="public">🌍 Public</option>
              <option value="friends">👥 Friends</option>
              <option value="private">🔒 Private</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Post content -->
      <div class="post-content-area">
        <textarea 
          v-model="newPostContent" 
          :placeholder="`${user?.firstname} ${user?.lastname}, what's on your mind?`"
          class="post-textarea"
          ref="postTextarea"
          @input="adjustTextareaHeight"
        ></textarea>
        
        <div class="add-options">
          <!-- Nút mở Emoji Picker -->
          <button 
            @click="showEmojiPicker = !showEmojiPicker" 
            class="add-option"
          >
            <span class="option-icon"><img src="../assets/emoji.png" /></span>
            <span>Icon</span>
          </button>

          <!-- Nút chọn media -->
          <label class="add-option">
            <input type="file" @change="handleMediaSelect" accept="image/*,video/*" style="display: none;" />
            <span class="option-icon"><img src="../assets/media.png" /></span>
            <span>Media</span>
          </label>
          
          <!-- Emoji Picker component -->
          <EmojiPicker 
            v-if="showEmojiPicker" 
            @select="insertEmoji"
          />
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

      <!-- Post button -->
      <div class="post-actions-footer">
        <button 
          @click="submitNewPost" 
          :disabled="!canPost"
          class="post-submit-btn"
          :class="{ disabled: !canPost }"
        >
          Post
        </button>
      </div>
    </div>
  </div>

  <!-- Modals -->
  <ConfirmDialog
    v-if="confirmVisible"
    :message="confirmMessage"
    @confirm="handleConfirmedDelete"
    @cancel="confirmVisible = false"
  />

  <EditShareModal
    v-if="showEditShareModal"
    :share="editedShare"
    @close="showEditShareModal = false"
    @updated="fetchPosts"
  />

  <ShareModal
    v-if="showShareModal"
    :post="postToShare"
    :user="user"
    @close="showShareModal = false"
    @shared="fetchPosts"
  />

  <EditPostModal
  :is-visible="editModalVisible"
  :post="editedPost"
  :user="user"
  @close="closeEditModal"
  @updated="handlePostUpdated"
/>

  <!-- Comment Modal Component -->
  <CommentModal
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
</template>

<script>
import ConfirmDialog from './ConfirmDialog.vue';
import EditShareModal from './EditShareModal.vue';
import ShareModal from './ShareModal.vue';
import EmojiPicker from './Emoji.vue';
import CommentModal from './CommentModal.vue';
import EditPostModal from './EditPostModal.vue';

export default {
  name: "HomePage",
  components: {
    ConfirmDialog,
    EditShareModal,
    ShareModal,
    EmojiPicker,
    CommentModal,
    EditPostModal
  },
  data() {
    return {
      user: null,
      posts: [],
      friends: [],
      openMenuId: null,
      confirmVisible: false,
      confirmMessage: '',
      postToDeleteId: null,

      // Edit post
       editModalVisible: false,
       editedPost: null, 

      // Comment modal data
      commentModalVisible: false,
      selectedPost: null,
      postCommentCounts: {},
      
      // Create Post Modal data
      createPostModalVisible: false,
      newPostContent: '',
      postPrivacy: 'public',
      selectedMedia: null,
      mediaPreviewUrl: null,

      // Create share modal data  
      shareModalVisible: false,
      sharedPost: null,
      shareContent: '',
      shareAudience: 'public', 
      showEditShareModal: false,
      editedShare: null,
      showShareModal: false,
      postToShare: null,
      
      // Emoji picker data
      showEmojiPicker: false,
      
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
        const savedUser = JSON.parse(localStorage.getItem("user"));
        if (!savedUser) {
          return alert("Please login to view posts");
        }

        const viewerId = savedUser.id;
        const res = await fetch(`http://localhost:3000/feeds/${viewerId}`);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        this.posts = data;
      } catch (err) {
        console.error("Error in fetch posts:", err);
        alert("Unable to fetch posts");
      }
    },

    // Create Post Modal methods
    openCreatePostModal() {
      this.createPostModalVisible = true;
      this.newPostContent = '';
      this.selectedMedia = null;
      this.mediaPreviewUrl = null;
      this.showEmojiPicker = false;
      
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
    insertEmoji(emoji) {
      const textarea = this.$refs.postTextarea;
      const startPos = textarea.selectionStart;
      const endPos = textarea.selectionEnd;
      
      this.newPostContent = this.newPostContent.substring(0, startPos) + 
                           emoji + 
                           this.newPostContent.substring(endPos);
      
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
        formData.append('audience', this.postPrivacy);
        
        if (this.selectedMedia) {
          formData.append('image', this.selectedMedia);
        }

        const res = await fetch('http://localhost:3000/posts', {
          method: 'POST',
          body: formData
        });

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const newPost = await res.json();
        newPost.createdAt = new Date(newPost.createdAt || Date.now());
        await this.fetchPosts();
        
        this.closeCreatePostModal();
        alert('Đăng bài thành công!');
      } catch (err) {
        console.error("Không thể tạo bài viết:", err);
        alert("Không thể đăng bài viết: " + err.message);
      }
    },

    async hideThisPost(postId) {
      const savedUser = JSON.parse(localStorage.getItem("user"));
      if (!savedUser) return alert("Please log in");

      try {
        const res = await fetch(`http://localhost:3000/posts/hide-post/${postId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ userId: savedUser.id })
        });

        const data = await res.json();
        alert(data.msg);
        this.posts = this.posts.filter(p => p._id !== postId);
      } catch (err) {
        console.error("Error hiding post:", err);
        alert("Failed to hide post");
      }
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
      // Handle comment added event if needed
      console.log('Comment added:', comment);
    },

     onCommentCountUpdated(data) {
    // Update local comment count
     this.postCommentCounts[data.postId] = data.count;
    
    // Cập nhật trong posts array nếu cần
    const postIndex = this.posts.findIndex(p => p._id === data.postId);
    if (postIndex !== -1) {
      // Có thể update tổng count trong post object
      this.posts[postIndex].totalComments = data.count;
    }
  },

  // THÊM MỚI: Get comment count cho hiển thị
  getPostCommentCount(post) {
    // Ưu tiên dùng realtime count nếu có
    if (this.postCommentCounts[post._id] !== undefined) {
      return this.postCommentCounts[post._id];
    }
    // Fallback về backend data
    return (post?.commentCount || 0) + (post?.replyCommentCount || 0);
  },


    handleCommentDeleted(commentId) {
      // Handle comment deleted event if needed
      console.log('Comment deleted:', commentId);
    },

    handlePostLiked(data) {
      // Update post likes in the feed
      const post = this.posts.find(p => p._id === data.postId || (p.post && p.post._id === data.postId));
      if (post) {
        if (post.post) {
          post.post.likes = data.likes;
        } else {
          post.likes = data.likes;
        }
      }
    },

    handleSharePost(post) {
      this.openShareModal(post);
    },

    // Edit post methods
    editPost(post) {
    this.editedPost = post;
    this.editModalVisible = true;
    this.openMenuId = null; // Close dropdown menu
  },

  closeEditModal() {
    this.editModalVisible = false;
    this.editedPost = null;
  },
  
  handlePostUpdated() {
    // Refresh posts after edit
    this.fetchPosts();
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
          this.posts = this.posts.filter(p => p._id !== this.postToDeleteId);
          this.openMenuId = null;
        }
      } catch (err) {
        console.error("Fail to delete post:", err);
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

    formatTime(dateStr) {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? '' : date.toLocaleString();
    },

    // Share methods
    isMyShare(share) {
      const savedUser = JSON.parse(localStorage.getItem("user"));
      return savedUser && share.username._id === savedUser.id;
    },

    async deleteShare(shareId) {
      if (confirm("Are you sure you want to delete this shared post?")) {
        try {
          const res = await fetch(`http://localhost:3000/shares/${shareId}`, {
            method: 'DELETE'
          });
          if (res.ok) {
            this.fetchPosts();
          }
        } catch (err) {
          console.error("Error deleting share:", err);
        }
      }
    },

    editShare(share) {
      this.editedShare = share;
      this.showEditShareModal = true;
    },

    openShareModal(post) {
      this.postToShare = post;
      this.showShareModal = true;
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

    async hideThisShare(shareId) {
      const savedUser = JSON.parse(localStorage.getItem("user"));
      if (!savedUser) return alert("Please log in to hide shares");

      try {
        const res = await fetch(`http://localhost:3000/shares/hide-share/${shareId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ userId: savedUser.id })
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.msg || "Hide share failed");
        }

        alert(data.msg || "Hide share successfully!");
        await this.fetchPosts();

      } catch (err) {
        console.error("Error to hide share:", err);
        alert(err.message || "Unable to hide share");
      }
    },

    async loadFriends() {
      try {
        const savedUser = JSON.parse(localStorage.getItem("user"));
        if (!savedUser) return;

        const res = await fetch(`http://localhost:3000/users/${savedUser.id}/friends`);
        const data = await res.json();
        this.friends = data;
      } catch (err) {
        console.error("Failed to load friends", err);
      }
    }
  },

  mounted() {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      this.user = JSON.parse(savedUser);
      this.fetchPosts();
      this.loadFriends();
    } else {
      this.$router.push("/login");
    }
    
    // Close emoji picker when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.emoji-picker')) {
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
/* [All the existing styles from the original HomePage.vue, excluding comment modal related styles] */
.homepage {
  display: flex;
  min-height: 100vh;
  background-color: #f0f2f5;
  font-family: Arial, sans-serif;
}

.sidebar-left {
  position: fixed;
  top: 56px; 
  left: 0;
  width: 250px;
  height: calc(100vh - 56px);
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

.post-image, .post-video {
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

.status.online {
  background-color: green;
}

.status.offline {
  background-color: gray;
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

.post-stats {
  display: flex;
  gap: 16px;
  margin: 16px 0 12px 0;
  font-size: 14px;
  color: #65676b;
}

/* Create Post Modal Styles */
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

.create-post-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
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
  box-sizing: border-box;
}

.post-textarea::placeholder {
  color: #8a8d91;
  font-weight: 400;
}

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

.add-options {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 0 24px;
  margin-bottom: 16px;
  width: 100%;
  box-sizing: border-box;
}

.add-option {
  flex: 1;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 10px;
  background: #f0f2f5;
  border: 1px solid #ccc;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 14px;
  white-space: nowrap;
}

.add-option:hover {
  background: #e4e6ea;
}

.option-icon img {
  width: 20px;
  height: 20px;
}

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

.btn-primary {
  background: #1877f2;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
}

.btn-secondary {
  background: #e4e6eb;
  color: #050505;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
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
  color: #555;
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

/* Right sidebar */
.no-contacts {
  color: #666;
  font-style: italic;
  margin-top: 8px;
}

.find-friends-btn {
  margin-top: 10px;
  padding: 6px 12px;
  background: #1877f2;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.find-friends-btn:hover {
  background: #166fe5;
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
  
  .add-options {
    flex-direction: column;
    align-items: stretch;
  }
  
  .add-option {
    justify-content: flex-start;
  }
}

/* Scrollbar Styling */
.create-post-modal-content::-webkit-scrollbar {
  width: 6px;
}

.create-post-modal-content::-webkit-scrollbar-track {
  background: #f8f9fa;
  border-radius: 3px;
}

.create-post-modal-content::-webkit-scrollbar-thumb {
  background: #bcc0c4;
  border-radius: 3px;
}

.create-post-modal-content::-webkit-scrollbar-thumb:hover {
  background: #8a8d91;
}

</style>