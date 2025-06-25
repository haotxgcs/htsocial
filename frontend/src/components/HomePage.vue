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
        <li @click="$router.push('/hidden-posts')"><img src="../assets/sidebar/hide-post.png" class="menu-icon-left"/>Hidden Posts</li>
      </ul>
    </aside>

    <!-- Feed chính -->
    <main class="feed">
      <div class="create-post">
        <h3>Create your post</h3>
        <input type="text" @click="openCreatePostModal" :placeholder="`What's is on your mind, ${user?.firstname} ${user?.lastname}?`"/>
      </div>

      <div class="post" v-for="post in posts" :key="post._id">
  <div class="post-header">
  <div class="post-author-info">
    <img :src="getAvatarUrl(post.author)" alt="avatar" />
    <div class="author-details">
      <strong>{{ post.author?.firstname }} {{ post.author?.lastname }}</strong>
      <p class="time">
  {{ formatTime(post.createdAt) }}
  <span v-if="post.audience === 'public'">🌐</span>
  <span v-else-if="post.audience === 'friends'">👥</span>
  <span v-else-if="post.audience === 'private'">🔒</span>
</p>

    </div>
  </div>

  <!-- menu icon góc phải -->
  <div class="post-menu-wrapper">
    <img src="../assets/menu.png" class="menu-post-icon" @click="toggleMenu(post._id)" />
    <div v-if="openMenuId === post._id" class="dropdown-menu">
      <button v-if="isMyPost(post)" @click="editPost(post)"> Edit Post</button>
      <button v-if="!isMyPost(post)" @click="hideThisPost(post._id)">Hide this Post</button>
      <button v-if="isMyPost(post)" @click="deletePost(post._id)" style="color: red"> Delete Post</button>
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

  <!-- Thống kê like/comment -->
  <div class="post-stats">
    <span v-if="post.likes?.length > 0">{{ post.likes.length }} likes</span>
    <span v-if="post.commentCount > 0">{{ post.commentCount}} comments</span>
    <span v-if="post.shares?.length > 0">{{ post.shares.length }} shares</span>
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
      <h3>Contacts</h3>
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
            <option value="public">🌐 Public</option>
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
        :placeholder="`${user?.firstname} ${user?.lastname} , what's on your mind?`"
        class="post-textarea"
        ref="postTextarea"
        @input="adjustTextareaHeight"
      ></textarea>
      
      <div class="add-options">
        <button @click="toggleEmojiPicker" class="add-option">
            <span class="option-icon"><img src="../assets/emoji.png"></span>
            <span>Icon</span>
          </button>

        <label class="add-option">
          <input type="file" @change="handleMediaSelect" accept="image/*,video/*" style="display: none;">
          <span class="option-icon"><img src="../assets/media.png"></span>
          <span>Media</span>
        </label>

          
       
      </div>
          
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

<ConfirmDialog
  v-if="confirmVisible"
  :message="confirmMessage"
  @confirm="handleConfirmedDelete"
  @cancel="confirmVisible = false"
/>

<!-- Modal chỉnh sửa bài viết -->
<div v-if="editModalVisible" class="modal-overlay">
  <div class="modal-content" @click.stop>
    <div class="modal-header">
      <h3>Chỉnh sửa bài viết</h3>
      <button class="close-btn" @click="editModalVisible = false">&times;</button>
    </div>

    <!-- Người đăng -->
    <div class="post-creator-info">
      <img :src="getAvatarUrl(user)" class="creator-avatar" />
      <div class="creator-details">
        <strong>{{ user.firstname }} {{ user.lastname }}</strong>

        <div class="privacy-selector">
      <select v-model="editPrivacy">
        <option value="public">🌐 Public</option>
        <option value="friends">👥 Friends</option>
        <option value="private">🔒 Private</option>
      </select>
    </div>
      </div>
    </div>

    <!-- Nội dung -->
    <textarea
      v-model="editContent"
      class="post-textarea"
      placeholder="Bạn đang nghĩ gì?"
      ref="editTextarea"
      @input="adjustTextareaHeightEdit"
    ></textarea>

    <!-- Ảnh/video hiện tại -->
    <div v-if="editMediaPreview" class="media-preview-container">
      <img
        v-if="editMediaType === 'image'"
        :src="editMediaPreview"
        class="preview-image"
      />
      <video
        v-else-if="editMediaType === 'video'"
        controls
        class="preview-video"
      >
        <source :src="editMediaPreview" type="video/mp4" />
      </video>
      <button class="remove-media-btn" @click="removeEditMedia">&times;</button>
    </div>

    <!-- Upload file mới -->
    <input type="file" @change="handleEditFile" accept="image/*,video/*" />

    <!-- Nút lưu -->
    <div style="margin-top: 12px; text-align: right;">
      <button @click="editModalVisible = false" class="btn btn-secondary">Hủy</button>
      <button @click="submitEditPost" class="btn btn-primary" style="margin-left: 8px;">Lưu</button>
    </div>
  </div>
</div>


<!-- Modal Comment -->
<div v-if="commentModalVisible" class="comment-modal-overlay" @click="closeCommentModal">
  <div class="comment-modal-content" @click.stop>
    <!-- Header modal -->
    <div class="comment-modal-header">
      <h3>{{ selectedPost?.author.firstname }} {{ selectedPost?.author.lastname }}'s Post</h3>
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
        <span v-if="selectedPost?.likes?.length > 0">{{ selectedPost.likes.length }} likes</span>
        <span v-if="selectedPost?.commentCount > 0">{{ selectedPost.commentCount }} comments</span>
        <span v-if="selectedPost?.shares?.length > 0">{{ selectedPost.shares.length }} shares</span>
      </div>

      <!-- Action buttons -->
      <div class="post-actions-modal">
        <button @click="toggleLike(selectedPost)" class="action-btn">
          <img :src="isLiked(selectedPost) ? require('../assets/like.png') : require('../assets/unlike.png')" class="action-icon" />
          <span>Like</span>
        </button>
        <button class="action-btn" disabled>
          <img src="../assets/comment.png" alt="Comment" class="action-icon" />
          <span>Comment</span>
        </button>
        <button @click="sharePost(selectedPost)" class="action-btn">
          <img src="../assets/share.png" alt="Share" class="action-icon" />
          <span>Share</span>
        </button>
      </div>
    </div>

    <!-- Danh sách comments -->
<div class="comments-section">
  <div class="comments-list">
    <div v-if="comments.length === 0" class="no-comments">
      <div class="no-comments-icon">💬</div>
      <p>No comments yet.</p>
      <p class="sub-text">Be the first to comment.</p>
    </div>
    
    <div v-else>
      <div v-for="comment in comments" :key="comment._id" class="comment-item">
        <img :src="`http://localhost:3000/${comment.author?.avatar || 'uploads/user.png'}`" alt="avatar" class="user-avatar" />

        <div class="comment-content">
          <div class="comment-bubble">
            <strong class="comment-author">{{ comment.author?.firstname }} {{ comment.author?.lastname }}</strong>

            <!-- Nếu đang chỉnh sửa comment này -->
            <div v-if="editingCommentId === comment._id">
              <textarea v-model="editedContent" class="edit-textarea"></textarea>
              <div class="edit-actions">
                <button @click="saveComment(comment._id)" class="save-btn">Save</button>
                <button @click="cancelEdit()" class="cancel-btn">Cancel</button>
              </div>
            </div>

            <p v-else class="comment-text">{{ comment.content }}</p>
          </div>

          <div class="comment-actions">
            <span class="comment-time">{{ formatTime(comment.createdAt) }}</span>
            
            <button @click="toggleCommentLike(comment)" class="comment-action-btn">
              <img :src="isCommentLiked(comment) ? require('../assets/like.png') : require('../assets/unlike.png')" class="action-icon-small">
              <span>{{ comment.likes?.length || 0 }}</span>
            </button>
            
            <button @click="toggleReply(comment._id, comment.author)" class="comment-action-btn">
              <img src="../assets/reply.png" class="action-icon-small">Reply
            </button>
            
            <button v-if="isMyComment(comment)" @click="editComment(comment)" class="comment-action-btn">
              <img src="../assets/edit.png" class="action-icon-small">Edit
            </button>
            
            <button v-if="isMyComment(comment)" @click="deleteComment(comment._id)" class="comment-action-btn">
              <img src="../assets/delete.png" class="action-icon-small">Delete
            </button>
          </div>

          <!-- Form reply -->
          <div v-if="replyInputs[comment._id] !== undefined" class="reply-section">
            <div class="reply-input-wrapper">
              <img :src="`http://localhost:3000/${user?.avatar || 'user.png'}`" alt="avatar" class="user-avatar-small" />
              <input 
                v-model="replyInputs[comment._id]" 
                @keypress.enter="submitReply(comment._id)"
                placeholder="Write a reply..."
                class="reply-input"
              />
              <button @click="submitReply(comment._id)" class="send-reply-btn" :disabled="!replyInputs[comment._id]?.trim()">
                ➤
              </button>
              
            </div>
          </div>

          <!-- Hiển thị replies -->
          <div v-if="comment.replies && comment.replies.length > 0" class="replies-section">
            <button @click="toggleRepliesVisibility(comment._id)" class="toggle-replies-btn">
              {{ showReplies[comment._id] ? 'Hide' : 'View' }} {{ comment.replies.length }} replies
            </button>
            
            <div v-if="showReplies[comment._id]" class="replies-list">
              <div v-for="reply in comment.replies" :key="reply?._id" class="reply-item">
                <img :src="`http://localhost:3000/${reply?.author?.avatar || 'uploads/user.png'}`" alt="avatar" class="user-avatar-small" />
                <div class="reply-content">
                  <div class="reply-bubble">
                    <strong>{{ reply?.author?.firstname }} {{ reply?.author?.lastname }}</strong>
                    
                    <div v-if="editingReplyId === reply._id">
                    <input 
                      v-model="editedReplyContent" 
                      class="edit-reply-input"
                      @keypress.enter="startEditReply(comment._id, reply._id)"
                    />
                    <div class="edit-actions">
                      <button @click="startEditReply(comment._id, reply._id)">Save</button>
                      <button @click="cancelEditReply()">Cancel</button>
                    </div>
                  </div>

                  <div v-else>
                    <p class="reply-content">
                      <span v-if="reply?.replyTo?.firstname" class="reply-to-name">
                        @{{ reply?.replyTo?.firstname }} {{ reply?.replyTo?.lastname }}
                      </span>
                      <span v-if="reply?.replyTo?.firstname">&nbsp;</span>{{ reply.content }}
                    </p>
                  </div>

                  </div>
                  <div class="reply-actions">
                    <span class="reply-time">{{ formatTime(reply?.createdAt) }}</span>
                    <button @click="toggleReplyLike(reply, comment._id)" class="comment-action-btn">
                    <img :src="isReplyLiked(reply) ? require('../assets/like.png') : require('../assets/unlike.png')" class="action-icon-small">
                    <span>{{ reply?.likes.length || 0 }}</span>
                  </button>
                  <button v-if="isMyReply(reply)" @click="startEditReply(reply)" class="comment-action-btn"><img src="../assets/edit.png" class="action-icon-small">Edit</button>
                    <button v-if="isMyReply(reply)" @click="deleteReply(comment._id, reply?._id)" class="comment-action-btn">
                      <img src="../assets/delete.png" class="action-icon-small">Delete
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

      <!-- Form thêm comment -->
      <div class="add-comment-section">
        <img :src="`http://localhost:3000/${user?.avatar || 'user.png'}`" alt="avatar" class="user-avatar" />
        <div class="comment-input-wrapper">
          <input 
            v-model="newComment" 
            @keypress.enter="submitComment"
            placeholder="Write a comment..."
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
      editMediaType: '',
      editMediaPreview: '',
      editMediaFile: null,
      editPrivacy: 'public', 

      // Comment modal data
      commentModalVisible: false,
      selectedPost: null,
      comments: [],
      newComment: '',
      
      commentLikes: {}, // Theo dõi số like của từng comment
    replyInputs: {},  // Theo dõi nội dung reply cho từng comment
    editingCommentId: null, // ID của comment đang được sửa
    editedContent: "", // Nội dung đang chỉnh sửa
    showReplies: {}, // Theo dõi việc hiển thị replies
    replyingTo: {},
    editingReplyId: null,
    editedReplyContent: '',

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
      },
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
      return alert("Vui lòng đăng nhập");
    }

    const viewerId = savedUser.id;
    const res = await fetch(`http://localhost:3000/posts/visible/${viewerId}`);
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
      formData.append('audience', this.postPrivacy);
      
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

    // Xoá bài khỏi danh sách
    this.posts = this.posts.filter(p => p._id !== postId);
  } catch (err) {
    console.error("Error hiding post:", err);
    alert("Failed to hide post");
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
    console.log(data); // 👈 kiểm tra author có tồn tại không
    this.comments = data;
  } catch (err) {
    console.error("Lỗi khi tải comments:", err);
    this.comments = [];
  }
},

  async submitComment() {
  if (!this.newComment.trim()) return;

  const user = JSON.parse(localStorage.getItem("user"));
  if (!user || !this.selectedPost) return;

  try {
    const res = await fetch(`http://localhost:3000/comments/posts/${this.selectedPost._id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: this.newComment,
        authorId: user.id   // ✅ Gửi ID thay vì username
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.msg || "Đăng bình luận thất bại");

    this.comments.push(data.comment);  // ✅ Thêm bình luận mới vào danh sách
    this.newComment = "";              // ✅ Reset input
  } catch (err) {
    console.error("Lỗi khi gửi bình luận:", err);
    alert("Không thể gửi bình luận: " + err.message);
  }
},

// Like comment
// Like comment
async toggleCommentLike(comment) {
  const savedUser = JSON.parse(localStorage.getItem("user"));
  if (!savedUser) return alert("Vui lòng đăng nhập");

  try {
    const res = await fetch(`http://localhost:3000/comments/like/${comment._id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: savedUser.id })
    });

    const data = await res.json();
    if (res.ok && data.comment) {
      const commentIndex = this.comments.findIndex(c => c._id === comment._id);
      if (commentIndex !== -1) {
        this.comments.splice(commentIndex, 1, data.comment); // ✅ update full comment
      }
    }
  } catch (err) {
    console.error("Lỗi khi like comment:", err);
  }
}
,

// Kiểm tra đã like comment chưa
isCommentLiked(comment) {
  const savedUser = JSON.parse(localStorage.getItem("user"));
  return comment.likes && comment.likes.includes(savedUser.id);
},

// Edit comment
editComment(comment) {
  this.editingCommentId = comment._id;
  this.editedContent = comment.content;
},

// Save edited comment
async saveComment(commentId) {
  if (!this.editedContent.trim()) return;

  try {
    const res = await fetch(`http://localhost:3000/comments/${commentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: this.editedContent })
    });

    // const data = await res.json();
    if (res.ok) {
      // Cập nhật comment trong danh sách
      const commentIndex = this.comments.findIndex(c => c._id === commentId);
      if (commentIndex !== -1) {
        this.comments[commentIndex].content = this.editedContent;
      }
      this.cancelEdit();
    }
  } catch (err) {
    console.error("Lỗi khi cập nhật comment:", err);
    alert("Không thể cập nhật bình luận");
  }
},

// Cancel edit
cancelEdit() {
  this.editingCommentId = null;
  this.editedContent = '';
},

// Delete comment
async deleteComment(commentId) {
  if (!confirm("Bạn có chắc muốn xóa bình luận này?")) return;

  try {
    const res = await fetch(`http://localhost:3000/comments/${commentId}`, {
      method: 'DELETE'
    });

    if (res.ok) {
      this.comments = this.comments.filter(c => c._id !== commentId);
    }
  } catch (err) {
    console.error("Lỗi khi xóa comment:", err);
    alert("Không thể xóa bình luận");
  }
},

// Kiểm tra comment có phải của mình không
isMyComment(comment) {
  const savedUser = JSON.parse(localStorage.getItem("user"));
  return savedUser && comment.author._id === savedUser.id;
},

// Toggle reply input
toggleReply(commentId) {
  if (this.replyInputs[commentId] !== undefined) {
    // Thay vì this.$delete
    delete this.replyInputs[commentId];
    delete this.replyingTo[commentId];
    // Hoặc dùng:
    // this.replyInputs[commentId] = undefined;
  } else {
    // Thay vì this.$set
    const comment = this.comments.find(c => c._id === commentId);
    this.replyInputs[commentId] = '';
    this.replyingTo[commentId] = comment.author;
  }
},

// Submit reply
async submitReply(commentId) {
    const replyContent = this.replyInputs[commentId];
    const savedUser = JSON.parse(localStorage.getItem("user"));
    const replyTo = this.replyingTo[commentId];

    if (!replyContent?.trim()) return;

    try {
      const res = await fetch(`http://localhost:3000/comments/reply/${commentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyContent,
          authorId: savedUser.id,
          replyToUserId: replyTo?._id || null
        })
      });

      const data = await res.json();
      if (res.ok && data.reply) {
        const comment = this.comments.find(c => c._id === commentId);
        if (comment) {
          comment.replies.push(data.reply);
        }
        delete this.replyInputs[commentId];
        delete this.replyingTo[commentId];
      }
    } catch (err) {
      console.error("Lỗi khi reply:", err);
    }
  },

// Toggle replies visibility
toggleRepliesVisibility(commentId) {
  // Thay vì this.$set
  this.showReplies[commentId] = !this.showReplies[commentId];
},

// Like reply
async toggleReplyLike(reply, commentId) {
  const savedUser = JSON.parse(localStorage.getItem("user"));
  if (!savedUser) return alert("Vui lòng đăng nhập");

  try {
    const res = await fetch(`http://localhost:3000/comments/reply/${commentId}/${reply._id}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: savedUser.id })
    });

    const data = await res.json();
    if (res.ok) {
      // Tìm comment chứa reply
      const comment = this.comments.find(c => c._id === commentId);
      if (comment) {
        const replyIndex = comment.replies.findIndex(r => r._id === reply._id);
        if (replyIndex !== -1) {
          // Cập nhật reply tại vị trí cũ
          comment.replies[replyIndex] = data.reply;
        }
      }
    }
  } catch (err) {
    console.error("Lỗi khi like reply:", err);
  }
}

,

// Kiểm tra đã like reply chưa
isReplyLiked(reply) {
  const savedUser = JSON.parse(localStorage.getItem("user"));
  return reply?.likes?.includes(savedUser.id);
}
,

// Kiểm tra reply có phải của mình không
isMyReply(reply) {
  const savedUser = JSON.parse(localStorage.getItem("user"));
  return reply?.author?._id === savedUser?.id;
},

// Delete reply
async deleteReply(commentId, replyId) {
  if (!confirm("Do you want to delete this reply?")) return;

  try {
    const res = await fetch(`http://localhost:3000/comments/reply/${commentId}/${replyId}`, {
      method: 'DELETE'
    });

    if (res.ok) {
      // Xóa reply khỏi danh sách reply của comment tương ứng
      const comment = this.comments.find(c => c._id === commentId);
      if (comment) {
        comment.replies = comment.replies.filter(r => r._id !== replyId);
      }
    } else {
      const err = await res.json();
      alert(err.msg || "Xoá phản hồi thất bại");
    }
  } catch (err) {
    console.error("Lỗi khi xóa reply:", err);
    alert("Không thể xóa phản hồi");
  }
}
,
startReplyingTo(commentId, user) {
  this.replyInputs[commentId] = '';
  this.replyingTo[commentId] = user; // user chính là reply.author
  this.showReplies[commentId] = true;
},

startEditReply(reply) {
  this.editingReplyId = reply._id;
  this.editedReplyContent = reply.content;
},

cancelEditReply() {
  this.editingReplyId = null;
  this.editedReplyContent = '';
}
,
async saveReply(commentId, replyId) {
  try {
    const res = await fetch(`http://localhost:3000/comments/reply/${commentId}/${replyId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: this.editedReplyContent })
    });

    const data = await res.json();
    if (res.ok) {
      const comment = this.comments.find(c => c._id === commentId);
      if (comment) {
        const idx = comment.replies.findIndex(r => r._id === replyId);
        if (idx !== -1) {
          comment.replies[idx] = data.reply;
        }
      }
      this.cancelEditReply();
    }
  } catch (err) {
    console.error("Lỗi khi cập nhật reply:", err);
  }
},

  editPost(post) {
  this.editModalVisible = true;
  this.editPostId = post._id;
  this.editContent = post.content;
  this.editMediaType = post.mediaType;
  this.editMediaPreview = `http://localhost:3000/${post.media}`;
  this.editMediaFile = null;
  this.editPrivacy = post.privacy || 'public';


  this.$nextTick(() => {
    if (this.$refs.editTextarea) {
      this.adjustTextareaHeightEdit();
      this.$refs.editTextarea.focus();
    }
  });
},

adjustTextareaHeightEdit() {
  const textarea = this.$refs.editTextarea;
  if (textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
  }
},

handleEditFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  this.editMediaFile = file;
  this.editMediaType = file.type.startsWith('video') ? 'video' : 'image';
  this.editMediaPreview = URL.createObjectURL(file);
},

removeEditMedia() {
  this.editMediaPreview = '';
  this.editMediaFile = null;
  this.editMediaType = '';
},

async submitEditPost() {
  try {
    const formData = new FormData();
    formData.append('content', this.editContent);
    formData.append('audience', this.editPrivacy);
    if (this.editMediaFile) {
      formData.append('image', this.editMediaFile);
    }

    await this.$axios.put(`/posts/${this.editPostId}`, formData);
    alert('Cập nhật thành công!');
    this.editModalVisible = false;
    this.fetchPosts(); // reload lại danh sách bài viết
  } catch (err) {
    console.error("Lỗi cập nhật bài viết:", err);
    alert("Không thể cập nhật bài viết!");
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

  isImage(filePath) {
    return /\.(jpg|jpeg|png|gif)$/i.test(filePath);
  },
  formatTime(dateStr) {
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? '' : date.toLocaleString();
},

  
  commentPost(post) {
    this.openCommentModal(post);
    this.fetchComments(post._id);
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
  background-color: rgba(255, 255, 255, 0.8);
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
  height: 85vh;
  max-height: 800px;
  min-height: 500px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
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
  font-size: 20px;
  color: #606770;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #e4e6ea;
  color: #1c1e21;
}

.comments-section {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  background-color: #f9f9f9;
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
  z-index: 20;
  margin-bottom: 8px;

  
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
  position: absolute;
  bottom: 110%;
  left: 0;
  width: 320px;
  background: white;
  border-radius: 10px;
  border: 1px solid #ddd;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  padding: 8px;
  z-index: 999;
  animation: slideDown 0.2s ease-out;
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

/* Edit post modal */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  max-width: 500px;
  width: 100%;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #ddd;
  position: relative;
}

.modal-header h3 {
  font-size: 18px;
  font-weight: bold;
  margin: 0;
  flex: 1;
}

.creator-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.media-preview-container {
  position: relative;
  margin-top: 12px;
}

.preview-image, .preview-video {
  max-width: 100%;
  border-radius: 8px;
}

.remove-media-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  background: rgba(170, 167, 167, 0.5);
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  cursor: pointer;
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

textarea.post-textarea {
  width: 100%;
  padding: 10px;
  border-radius: 8px;
  border: none;
  resize: none;
  background: #f0f2f5;
  font-size: 15px;
  min-height: 80px;
}

.post-textarea {
  width: 100%;
  min-height: 100px;
  padding: 12px 16px;
  margin-top: 12px;
  font-size: 15px;
  border-radius: 10px;
  background: #f0f2f5;
  border: none;
  resize: none;
  box-sizing: border-box;
}

/* Comment actions styling */
.comment-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
  font-size: 12px;
}

.comment-action-btn {
  background: none;
  border: none;
  color: #65676b;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.comment-action-btn:hover {
  background-color: #f0f2f5;
}

.action-icon-small {
  width: 14px;
  height: 14px;
}

/* Edit comment styling */
.edit-textarea {
  width: 100%;
  min-height: 60px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 8px;
  resize: vertical;
  font-family: inherit;
}

.edit-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.save-btn, .cancel-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.save-btn {
  background-color: #1877f2;
  color: white;
}

.cancel-btn {
  background-color: #e4e6ea;
  color: #1c1e21;
}

/* Reply section styling */
.reply-section {
  margin-top: 8px;
  padding-left: 20px;
}

.reply-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-avatar-small {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
}

.reply-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 20px;
  outline: none;
  font-size: 14px;
}

.send-reply-btn {
  background-color: #1877f2;
  color: white;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.send-reply-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

/* Replies section styling */
.replies-section {
  margin-top: 12px;
  padding-left: 20px;
}

.toggle-replies-btn {
  background: none;
  border: none;
  color: #1877f2;
  cursor: pointer;
  font-size: 12px;
  margin-bottom: 8px;
}

.replies-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reply-item {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.reply-content {
  flex: 1;
}

.reply-bubble {
  background-color: #f0f2f5;
  padding: 8px 12px;
  border-radius: 16px;
  display: inline-block;
  max-width: 100%;
}

.reply-bubble strong {
  font-size: 13px;
  color: #050505;
  margin-bottom: 2px;
  display: block;
}

.reply-bubble p {
  margin: 0;
  font-size: 13px;
  color: #050505;
}

.reply-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  font-size: 11px;
}

.reply-time {
  color: #65676b;
  font-size: 11px;
}

/* reply to name */
.reply-to-name {
  color: #1876f2;
  font-weight: 500;
  margin-right: 4px;
}
</style>
