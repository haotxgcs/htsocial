<template>
  <div v-if="isVisible" class="comment-modal-overlay" @click="closeModal">
    <div class="comment-modal-content" @click.stop>
      
      <div class="comment-modal-header">
        <h3>{{ post?.author?.firstname }} {{ post?.author?.lastname }}'s post</h3>
        <button class="close-btn" @click="closeModal">&times;</button>
      </div>

      <div class="post-detail">
        <div class="post-author-info">
          <img :src="getAvatarUrl(post?.author)" class="author-avatar" alt="avatar" />
          <div class="author-details">
            <strong>{{ post?.author?.firstname }} {{ post?.author?.lastname }}</strong>
            <p class="time">
              {{ formatTime(post?.createdAt) }}
              <span v-if="post?.audience === 'public'">🌍</span>
              <span v-else-if="post?.audience === 'friends'">👥</span>
              <span v-else-if="post?.audience === 'private'">🔒</span>
            </p>
          </div>
        </div>

        <div class="post-content">
          <h3 class="recipe-title">{{ post?.title }}</h3>
          <span class="recipe-category">{{ post?.category }}</span>

          <div class="recipe-body">
            <div v-if="!isContentExpanded">
              <p class="recipe-section-header">Ingredients:</p>
              <p class="post-text">{{ getTruncatedText(post?.ingredients) }}</p>
              
              <template v-if="!shouldShowReadMore">
                 <p class="recipe-section-header">Instructions:</p>
                 <p class="post-text">{{ post?.instructions }}</p>
              </template>
            </div>

            <div v-else>
              <p class="recipe-section-header">Ingredients:</p>
              <p class="post-text">{{ post?.ingredients }}</p>
              
              <p class="recipe-section-header">Instructions:</p>
              <p class="post-text">{{ post?.instructions }}</p>
            </div>
          </div>

          <button v-if="shouldShowReadMore" @click="toggleContent" class="read-more-btn">
            {{ isContentExpanded ? 'Show Less' : 'Show More' }}
          </button>
        </div>
        <div v-if="post?.media" class="post-media-modal">
          <img v-if="post?.mediaType === 'image'" :src="`http://localhost:3000/${post.media}`" class="post-image-modal" />
          <video v-else-if="post?.mediaType === 'video'" controls class="post-video-modal">
            <source :src="`http://localhost:3000/${post.media}`" type="video/mp4" />
          </video>
        </div>

        <div v-if="totalRatings > 0" class="rating-statistics">
          <div class="rating-summary">
            <div class="average-rating">
              <span class="rating-number">{{ averageRating }}</span>
              <div class="stars-display">
                <span v-for="star in 5" :key="star" class="star-icon" :class="{ filled: star <= Math.round(averageRating) }">★</span>
              </div>
            </div>
            <div class="rating-count">
              <span>{{ totalRatings }} rating{{ totalRatings > 1 ? 's' : '' }}</span>
            </div>
          </div>
        </div>

        <div class="post-stats">
          <span v-if="post?.likes?.length > 0">{{ post.likes.length }} liked</span>
          <span v-if="totalCommentCount > 0">{{ totalCommentCount }} commented</span>
          <span v-if="post?.sharesCount > 0">{{ post.sharesCount }} shared</span>
          <span v-if="postSaveCount > 0" :class="{ updated: saveCountUpdated }">{{ postSaveCount }} saved</span>
        </div>

        <div class="post-actions-modal">
          <button @click="toggleLike" class="action-btn">
            <img :src="isLiked ? require('../assets/like.png') : require('../assets/unlike.png')" class="action-icon" />
            <span>Like</span>
          </button>
          <button class="action-btn">
            <img src="../assets/comment.png" class="action-icon" />
            <span>Comment</span>
          </button>
          <button @click="sharePost" class="action-btn">
            <img src="../assets/share.png" class="action-icon" />
            <span>Share</span>
          </button>
          <button @click="toggleSavePost" class="action-btn">
            <img :src="isSaved ? require('../assets/saved.png') : require('../assets/save.png')" class="action-icon" />
            <span>{{ isSaved ? 'Saved' : 'Save' }}</span>
          </button>
        </div>
      </div>

      <div class="comments-section">
        <div class="comment-filter-bar">
          <button @click="commentFilter = 'newest'" :class="{ active: commentFilter === 'newest' }" class="filter-btn">Newest</button>
          <button @click="commentFilter = 'oldest'" :class="{ active: commentFilter === 'oldest' }" class="filter-btn">Oldest</button>
          <button @click="commentFilter = 'rated'" :class="{ active: commentFilter === 'rated' }" class="filter-btn">With Rating</button>
          <button @click="commentFilter = 'normal'" :class="{ active: commentFilter === 'normal' }" class="filter-btn">Comments Only</button>
        </div>

        <div class="comments-list">
          <div v-if="comments.length === 0" class="no-comments">
            <div class="no-comments-icon">💬</div>
            <p>No comments yet</p>
            <p class="sub-text">Be the first to share what you think!</p>
          </div>

          <div v-for="comment in filteredComments" :key="comment._id" class="comment-item">
            <img :src="getAvatarUrl(comment.author)" class="comment-avatar" alt="avatar" />
            <div class="comment-content">
              <div class="comment-bubble">
                <strong class="comment-author">{{ comment.author?.firstname }} {{ comment.author?.lastname }}</strong>
                <span v-if="isPostAuthor(comment.author)" class="author-label">Author</span>
                
                <div v-if="comment.rating" class="comment-rating">
                  <span v-for="star in 5" :key="star" class="star-display" :class="{ filled: star <= comment.rating }">★</span>
                  <span class="rating-text-display">{{ comment.rating }} stars</span>
                </div>

                <div v-if="editingCommentId === comment._id" class="edit-comment-container">
                  <div v-if="showEditRating" class="edit-rating-section">
                    <span class="edit-rating-label">Edit Rating:</span>
                    <div class="edit-stars">
                      <span v-for="star in 5" :key="star" @click="editingRating = star" @mouseenter="editingHoverRating = star" @mouseleave="editingHoverRating = 0" class="star" :class="{ filled: star <= (editingHoverRating || editingRating) }">★</span>
                      <span class="edit-rating-value">{{ editingRating }} stars</span>
                    </div>
                  </div>
                  
                  <div class="edit-input-wrapper">
                    <textarea 
                      :ref="'editCommentInput-' + comment._id"
                      v-model="editedContent" 
                      class="edit-textarea-with-emoji" 
                      @keyup.enter="saveComment(comment._id)"
                      @focus="trackFocus('editCommentInput-' + comment._id, 'editedContent', null)"
                    ></textarea>
                    
                    <div class="emoji-wrapper-edit">
                        <button @click.stop="toggleEmojiPicker('edit-comment-' + comment._id)" class="emoji-btn-small">
                          <img src="../assets/emoji.png" class="icon-emoji-img"/>
                        </button>
                        <div v-if="activeEmojiPicker === 'edit-comment-' + comment._id" class="emoji-popover-up" @click.stop>
                          <EmojiPicker :native="true" @select="insertEmoji" theme="light" />
                        </div>
                    </div>
                  </div>
                  
                  <div class="edit-actions">
                    <button @click="saveComment(comment._id)" class="save-btn">Save</button>
                    <button @click="cancelEdit" class="cancel-btn">Cancel</button>
                  </div>
                </div>

                <p v-else class="comment-text">
                  <span v-if="comment.replyToUser" class="reply-to-name">
                    @{{ comment.replyToUser.firstname }} {{ comment.replyToUser.lastname }}
                  </span>
                  {{ comment.content }}
                </p>
              </div>

              <div class="comment-actions">
                <span class="comment-time">{{ formatTime(comment.createdAt) }}</span>
                <button @click="toggleCommentLike(comment)" class="comment-action-btn">
                  <img :src="isCommentLiked(comment) ? require('../assets/like.png') : require('../assets/unlike.png')" class="action-icon-small" />
                  <span>{{ comment.likeCount || comment.likes?.length || 0 }}</span>
                </button>
                <button v-if="!isMyComment(comment)" @click="toggleReply(comment._id)" class="comment-action-btn">
                  <img src="../assets/reply.png" class="action-icon-small">Reply
                </button>
                <button v-if="isMyComment(comment)" @click="editComment(comment)" class="comment-action-btn">
                  <img src="../assets/edit.png" class="action-icon-small">Edit
                </button>
                <button v-if="isMyComment(comment)" @click="deleteComment(comment._id)" class="comment-action-btn" style="color: red;">
                  <img src="../assets/delete.png" class="action-icon-small">Delete
                </button>
              </div>

              <div v-if="replyInputs[comment._id] !== undefined" class="reply-section">
                <div class="reply-input-wrapper">
                  <img :src="getAvatarUrl(user)" class="user-avatar-small" alt="avatar" />
                  
                  <div class="input-with-emoji-container">
                    <input
                      :ref="'replyInput-' + comment._id"
                      v-model="replyInputs[comment._id]"
                      @keyup.enter="submitReply(comment._id)"
                      :placeholder="`Reply to ${replyingTo[comment._id]?.firstname} ${replyingTo[comment._id]?.lastname}...`"
                      class="reply-input"
                      @focus="trackFocus('replyInput-' + comment._id, 'replyInputs', comment._id)"
                    />
                    <div class="emoji-wrapper-small">
                       <button @click.stop="toggleEmojiPicker('reply-' + comment._id)" class="emoji-btn-small">
                         <img src="../assets/emoji.png" class="icon-emoji-img"/>
                       </button>
                       <div v-if="activeEmojiPicker === 'reply-' + comment._id" class="emoji-popover-up" @click.stop>
                         <EmojiPicker :native="true" @select="insertEmoji" theme="light" />
                       </div>
                    </div>
                  </div>
                  
                  <button 
                    @click="submitReply(comment._id)" 
                    :disabled="!replyInputs[comment._id]?.trim()"
                    class="send-reply-btn"
                  >➤</button>
                </div>
              </div>

              <div v-if="comment.replies && comment.replies.length > 0" class="replies-section">
                <button @click="toggleRepliesVisibility(comment._id)" class="toggle-replies-btn">
                  {{ showReplies[comment._id] ? 'Hide' : 'View' }} {{ comment.replies.length }} 
                  {{ comment.replies.length === 1 ? 'reply' : 'replies' }}
                </button>

                <div v-if="showReplies[comment._id]" class="replies-list">
                  <div v-for="reply in comment.replies" :key="reply._id" class="reply-item">
                    <img :src="getAvatarUrl(reply.author)" class="user-avatar-small" alt="avatar" />
                    <div class="reply-content">
                      <div v-if="editingReplyId === reply._id" class="edit-reply-container">
                        <div class="edit-input-wrapper">
                          <textarea 
                            :ref="'editReplyInput-' + reply._id"
                            v-model="editedReplyContent" 
                            class="edit-reply-input-with-emoji" 
                            @keyup.enter="saveReply(comment._id, reply._id)"
                            @focus="trackFocus('editReplyInput-' + reply._id, 'editedReplyContent', null)"
                          ></textarea>

                          <div class="emoji-wrapper-edit">
                              <button @click.stop="toggleEmojiPicker('edit-reply-' + reply._id)" class="emoji-btn-small">
                                <img src="../assets/emoji.png" class="icon-emoji-img"/>
                              </button>
                              <div v-if="activeEmojiPicker === 'edit-reply-' + reply._id" class="emoji-popover-up" @click.stop>
                                <EmojiPicker :native="true" @select="insertEmoji" theme="light" />
                              </div>
                          </div>
                        </div>

                        <div class="edit-actions">
                          <button @click="saveReply(comment._id, reply._id)" class="save-btn">Save</button>
                          <button @click="cancelEditReply" class="cancel-btn">Cancel</button>
                        </div>
                      </div>
                      <div v-else class="reply-bubble">
                        <strong>{{ reply.author?.firstname }} {{ reply.author?.lastname }}</strong>
                        <span v-if="isPostAuthor(reply.author)" class="author-label">Author</span>
                        <p>
                          <span v-if="reply?.replyTo" class="reply-to-name">@{{ reply?.replyTo?.firstname }} {{ reply?.replyTo?.lastname }}</span>
                          {{ reply.content }}
                        </p>
                      </div>

                      <div class="reply-actions">
                        <span class="reply-time">{{ formatTime(reply.createdAt) }}</span>
                        <button @click="toggleReplyLike(reply, comment._id)" class="comment-action-btn">
                          <img :src="isReplyLiked(reply) ? require('../assets/like.png') : require('../assets/unlike.png')" class="action-icon-small" />
                          <span>{{ reply.likeCount || reply.likes?.length || 0 }}</span>
                        </button>
                        <button v-if="!isMyReply(reply)" @click="toggleReplyToReply(reply._id, reply.author)" class="comment-action-btn">
                          <img src="../assets/reply.png" class="action-icon-small">Reply
                        </button>
                        <button v-if="isMyReply(reply)" @click="startEditReply(reply)" class="comment-action-btn">
                          <img src="../assets/edit.png" class="action-icon-small">Edit
                        </button>
                        <button v-if="isMyReply(reply)" @click="deleteReply(comment._id, reply._id)" class="comment-action-btn" style="color: red;">
                          <img src="../assets/delete.png" class="action-icon-small">Delete
                        </button>
                      </div>

                      <div v-if="replyInputsReply[reply._id] !== undefined" class="reply-to-reply-input-wrapper">
                        <img :src="`http://localhost:3000/${user?.avatar || 'user.png'}`" class="user-avatar-small" />
                        
                        <div class="input-with-emoji-container">
                          <input
                            :ref="'replyToReplyInput-' + reply._id"
                            v-model="replyInputsReply[reply._id]"
                            :placeholder="`Reply to ${replyingToReply[reply._id]?.firstname} ${replyingToReply[reply._id]?.lastname}...`"
                            class="reply-input"
                            @keypress.enter="submitReplyToReply(comment._id, reply._id)"
                            @focus="trackFocus('replyToReplyInput-' + reply._id, 'replyInputsReply', reply._id)"
                          />
                           <div class="emoji-wrapper-small">
                             <button @click.stop="toggleEmojiPicker('replyToReply-' + reply._id)" class="emoji-btn-small">
                               <img src="../assets/emoji.png" class="icon-emoji-img"/>
                             </button>
                             <div v-if="activeEmojiPicker === 'replyToReply-' + reply._id" class="emoji-popover-up" @click.stop>
                               <EmojiPicker :native="true" @select="insertEmoji" theme="light" />
                             </div>
                          </div>
                        </div>

                        <button @click="submitReplyToReply(comment._id, reply._id)" class="send-reply-btn" :disabled="!replyInputsReply[reply._id]?.trim()">➤</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="add-comment-section">
        <img :src="getAvatarUrl(user)" class="user-avatar" alt="avatar" />
        <div class="comment-input-container">
          <div class="rating-toggle">
            <button @click="showRatingOption = !showRatingOption" :disabled="userHasRated && !showRatingOption" class="toggle-rating-btn" :class="{ disabled: userHasRated && !showRatingOption }">
              <span v-if="!showRatingOption && !userHasRated">⭐ Add Rating</span>
              <span v-else-if="!showRatingOption && userHasRated">✅ Already Rated</span>
              <span v-else>💬 Comment Only</span>
            </button>
          </div>

          <div v-if="showRatingOption" class="star-rating-selector">
            <span v-for="star in 5" :key="star" @click="selectedRating = star" @mouseenter="hoverRating = star" @mouseleave="hoverRating = 0" class="star" :class="{ filled: star <= (hoverRating || selectedRating), selected: star <= selectedRating }">★</span>
            <span v-if="selectedRating > 0" class="rating-text">{{ selectedRating }} star{{ selectedRating > 1 ? 's' : '' }}</span>
          </div>

          <div class="comment-input-wrapper">
            <input
              ref="mainCommentInput"
              v-model="newComment"
              @keyup.enter="submitComment"
              :placeholder="showRatingOption ? 'Write a review...' : 'Write a comment...'"
              class="comment-input"
              @focus="trackFocus('mainCommentInput', 'newComment', null)"
            />
            
            <div class="emoji-wrapper-main">
              <button @click.stop="toggleEmojiPicker('main')" class="emoji-btn-main">
                <img src="../assets/emoji.png" class="icon-emoji-img"/>
              </button>
              <div v-if="activeEmojiPicker === 'main'" class="emoji-popover-main" @click.stop>
                <EmojiPicker :native="true" @select="insertEmoji" theme="light" />
              </div>
            </div>

            <button @click="submitComment" :disabled="!newComment.trim() || (showRatingOption && selectedRating === 0)" class="send-comment-btn">➤</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// Import thư viện Emoji
import EmojiPicker from 'vue3-emoji-picker';
import 'vue3-emoji-picker/css';

export default {
  name: "CommentModal",
  components: {
    EmojiPicker
  },
  props: {
    post: {
      type: Object,
      default: null
    },
    user: {
      type: Object,
      required: true
    },
    isVisible: {
      type: Boolean,
      default: false
    },
    initialSaveCount: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      comments: [],
      newComment: '',
      commentLikes: {},
      replyInputs: {},
      editingCommentId: null,
      editedContent: "",

      showReplies: {},
      replyingTo: {},
      editingReplyId: null,
      editedReplyContent: '',
      replyingToReply: {},
      replyInputsReply: {},

      savedPosts: [], 
      postSaveCount: 0, 
      saveCountUpdated: false,

      // Rating logic
      showRatingOption: false,
      selectedRating: 0,
      hoverRating: 0,
      userHasRated: false, 
      localTotalRatings: 0, 
      localAverageRating: 0,
      editingRating: 0,
      showEditRating: false,
      editingHoverRating: 0,

      commentFilter: 'newest', 

      isContentExpanded: false,
      

      // --- Emoji Logic Data ---
      activeEmojiPicker: null, // ID của picker đang mở (null = đóng hết)
      // Lưu trữ thông tin ô input cuối cùng được focus
      lastFocusedInput: { 
        refName: 'mainCommentInput', 
        modelType: 'newComment', // 'newComment', 'replyInputs', 'replyInputsReply'
        key: null // ID của comment/reply (nếu có)
      }
    }
  },
  computed: {
    isLiked() {
      const savedUser = JSON.parse(localStorage.getItem("user"));
      return this.post?.likes && this.post.likes.includes(savedUser?.id);
    },

    isSaved() {
      return this.savedPosts.includes(this.post?._id);
    },

    totalCommentCount() {
      let total = this.comments.length;
      this.comments.forEach(comment => {
        if (comment.replies && comment.replies.length > 0) {
          total += comment.replies.length;
        }
      });
      return total;
    },

    totalRatings() {
      return this.localTotalRatings || this.post?.totalRatings || 0;
    },

    averageRating() {
      return this.localAverageRating || this.post?.averageRating || 0;
    },

    filteredComments() {
      let filtered = [...this.comments];
      
      if (this.commentFilter === 'rated') {
        filtered = filtered.filter(c => c.rating && c.rating > 0);
      } else if (this.commentFilter === 'normal') {
        filtered = filtered.filter(c => !c.rating || c.rating === 0);
      }
      
      if (this.commentFilter === 'newest') {
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      } else if (this.commentFilter === 'oldest') {
        filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      } else {
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
      
      return filtered;
    },

    shouldShowReadMore() {
      if (!this.post) return false;
      const text = (this.post.ingredients || '') + (this.post.instructions || '');
      const lines = text.split('\n');
      // Hiện nút nếu dài hơn 5 dòng hoặc 200 ký tự
      return lines.length > 5 || text.length > 200;
    },

    
  },
  watch: {
    post: {
      handler(newPost) {
        if (newPost) {
          this.localTotalRatings = newPost.totalRatings || 0;
          this.localAverageRating = newPost.averageRating || 0;
          this.fetchComments(newPost._id);
          this.fetchPostSaveCount();
          this.checkUserRating();
          
        }
      },
      immediate: true
    },

    isVisible(newVal) {
      if (newVal && this.post) {
        this.localTotalRatings = this.post.totalRatings || 0;
        this.localAverageRating = this.post.averageRating || 0;
        this.fetchComments(this.post._id);
        this.loadSavedPosts();
        this.fetchPostSaveCount();
        this.checkUserRating();
        
        
        // Auto focus vào ô comment chính
        this.$nextTick(() => {
          if (this.$refs.mainCommentInput) {
             this.$refs.mainCommentInput.focus();
          }
        });

        // Lắng nghe sự kiện click để đóng emoji picker
        document.addEventListener('click', this.closeEmojiPickerOnClickOutside);
      } else {
        // Cleanup khi đóng modal
        document.removeEventListener('click', this.closeEmojiPickerOnClickOutside);
        this.activeEmojiPicker = null;
      }
    },

    initialSaveCount(newCount) {
      if (newCount !== undefined && newCount !== this.postSaveCount) {
        this.postSaveCount = newCount;
      }
    }
  },
  methods: {
    // --- EMOJI LOGIC METHODS ---
    
    toggleEmojiPicker(pickerId) {
      // Nếu đang mở đúng cái đó thì đóng, ngược lại mở cái mới
      if (this.activeEmojiPicker === pickerId) {
        this.activeEmojiPicker = null;
      } else {
        this.activeEmojiPicker = pickerId;
      }
    },
    
    closeEmojiPickerOnClickOutside(event) {
      // Nếu click không trúng bất kỳ wrapper emoji nào thì đóng
      if (!event.target.closest('.emoji-wrapper-main') && !event.target.closest('.emoji-wrapper-small')) {
        this.activeEmojiPicker = null;
      }
    },

    // Theo dõi ô input nào đang được focus
    trackFocus(refName, modelType, key) {
      this.lastFocusedInput = { refName, modelType, key };
    },

    insertEmoji(emoji) {
      const { refName, modelType, key } = this.lastFocusedInput;
      const emojiChar = emoji.i;
      
      // Lấy DOM element của input từ $refs
      let inputRef = null;
      if (Array.isArray(this.$refs[refName])) {
        inputRef = this.$refs[refName][0]; // Ref trong v-for trả về mảng
      } else {
        inputRef = this.$refs[refName];
      }

      if (!inputRef) return;

      // Xác định model data cần update
      let currentValue = '';
      if (modelType === 'newComment') {
        currentValue = this.newComment;
      } else if (modelType === 'replyInputs') {
        currentValue = this.replyInputs[key] || '';
      } else if (modelType === 'replyInputsReply') {
        currentValue = this.replyInputsReply[key] || '';
      } else if (modelType === 'editedContent') 
        currentValue = this.editedContent;
        else if (modelType === 'editedReplyContent') 
        currentValue = this.editedReplyContent;

      // Chèn ký tự tại vị trí con trỏ
      const start = inputRef.selectionStart;
      const end = inputRef.selectionEnd;
      const newValue = currentValue.substring(0, start) + emojiChar + currentValue.substring(end);
      
      // Cập nhật lại model
      if (modelType === 'newComment') {
        this.newComment = newValue;
      } else if (modelType === 'replyInputs') {
        this.replyInputs[key] = newValue;
      } else if (modelType === 'replyInputsReply') {
        this.replyInputsReply[key] = newValue;
      } else if (modelType === 'editedContent') 
        this.editedContent = newValue;
        else if (modelType === 'editedReplyContent') 
        this.editedReplyContent = newValue;

      // Đặt lại con trỏ ngay sau emoji vừa chèn
      this.$nextTick(() => {
        inputRef.focus();
        inputRef.setSelectionRange(start + emojiChar.length, start + emojiChar.length);
      });
    },

    // --- END EMOJI LOGIC ---

    closeModal() {
      this.$emit('close');
      this.resetModal();
    },

    resetModal() {
      this.comments = [];
      this.newComment = '';
      this.replyInputs = {};
      this.showReplies = {};
      this.replyingTo = {};
      this.editingCommentId = null;
      this.editedContent = '';
      this.editingReplyId = null;
      this.editedReplyContent = '';
      this.replyingToReply = {};
      this.replyInputsReply = {};
      this.selectedRating = 0;
      this.showRatingOption = false;
      this.localTotalRatings = 0;    
      this.localAverageRating = 0;   
      this.userHasRated = false;  
      this.isContentExpanded = false; 
      this.contentLineCount = 0;
      this.activeEmojiPicker = null; // Reset emoji state
    },

    getAvatarUrl(author) {
      if (!author || !author.avatar) return 'http://localhost:3000/uploads/user.png';
      return `http://localhost:3000/${author.avatar}`;
    },

    formatTime(dateStr) {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? '' : date.toLocaleString();
    },

    isPostAuthor(author) {
      return this.post?.author?._id === author?._id;
    },

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

    async fetchPostSaveCount() {
      if (!this.post || !this.post._id) return;

      try {
        const res = await fetch(`http://localhost:3000/posts/${this.post._id}/saves-count`);
        if (res.ok) {
          const data = await res.json();
          this.postSaveCount = data.savesCount || 0;
        }
      } catch (err) {
        console.error("Cannot fetch save count:", err);
        this.postSaveCount = 0;
      }
    },

    async toggleSavePost() {
      const savedUser = JSON.parse(localStorage.getItem("user"));
      if (!savedUser) return alert("Please login to save posts");

      try {
        const postId = this.post._id;
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
          this.saveCountUpdated = true;
          setTimeout(() => {
            this.saveCountUpdated = false;
          }, 300);

          if (isSaved) {
            this.savedPosts = this.savedPosts.filter(id => id !== postId);
            this.postSaveCount = Math.max(0, this.postSaveCount - 1);
            this.$emit('save-count-updated', { postId: postId, count: this.postSaveCount });
            this.$emit('save-status-changed', { postId: postId, isSaved: false });
            alert(data.msg || 'Item unsaved successfully');
          } else {
            this.savedPosts.push(postId);
            this.postSaveCount++;
            this.$emit('save-count-updated', { postId: postId, count: this.postSaveCount });
            this.$emit('save-status-changed', { postId: postId, isSaved: true });
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

    async fetchComments(postId) {
      try {
        const isShare = this.post.isSharePost || false; 
        const url = `http://localhost:3000/comments/posts/${postId}${isShare ? '?isShare=true' : ''}`;
        
        const res = await fetch(url);
        const data = await res.json();
        this.comments = data;
      } catch (err) {
        console.error("Error to fetch comments:", err);
        this.comments = [];
      }
    },

    async submitComment() {
      if (!this.newComment.trim()) return;
      
      if (this.showRatingOption && this.selectedRating === 0) {
        return alert("Please select a rating");
      }

      if (this.showRatingOption && this.userHasRated) {
        return alert("You have already rated this post. You can only rate once.");
      }

      const user = JSON.parse(localStorage.getItem("user"));
      if (!user || !this.post) return;

      try {
        const res = await fetch(`http://localhost:3000/comments/posts/${this.post._id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: this.newComment,
            authorId: user.id,
            rating: this.showRatingOption ? this.selectedRating : null
          })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.msg || "Submit comment fail");

        this.comments.unshift(data.comment);
        
        if (this.showRatingOption && this.selectedRating > 0) {
          this.userHasRated = true;
          await this.fetchRatingStats();
        }
        
        this.newComment = "";
        this.selectedRating = 0;
        this.showRatingOption = false;
        
        this.$emit('commented', data.comment);
        this.$emit('comment-count-updated', { postId: this.post._id, count: this.totalCommentCount });
        this.$emit('rating-updated', { 
          postId: this.post._id, 
          totalRatings: this.localTotalRatings,
          averageRating: this.localAverageRating
        });
      } catch (err) {
        console.error("Error to send comment:", err);
        alert("Unable to send comment: " + err.message);
      }
    },
      
    async toggleCommentLike(comment) {
      const savedUser = JSON.parse(localStorage.getItem("user"));
      if (!savedUser) return alert("Please log in to like comments");

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
            this.comments[commentIndex].likes = data.comment.likes;
            if (data.comment.likeCount !== undefined) {
              this.comments[commentIndex].likeCount = data.comment.likeCount;
            }
          }
        }
      } catch (err) {
        console.error("Error to like comment:", err);
      }
    },

    isCommentLiked(comment) {
      const savedUser = JSON.parse(localStorage.getItem("user"));
      return comment.likes && comment.likes.includes(savedUser?.id);
    },

    editComment(comment) {
      this.editingCommentId = comment._id;
      this.editedContent = comment.content;

      if (comment.rating && comment.rating > 0) {
        this.editingRating = comment.rating;
        this.showEditRating = true;
      } else {
        this.editingRating = 0;
        this.showEditRating = false;
      }
    },

    async saveComment(commentId) {
      if (!this.editedContent.trim()) return;

      try {
        const updateData = { content: this.editedContent };
        
        if (this.showEditRating && this.editingRating > 0) {
          updateData.rating = this.editingRating;
        }
        
        const res = await fetch(`http://localhost:3000/comments/${commentId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        });

        const data = await res.json();
        
        if (res.ok) {
          const commentIndex = this.comments.findIndex(c => c._id === commentId);
          if (commentIndex !== -1) {
            this.comments[commentIndex].content = this.editedContent;
            
            if (this.showEditRating) {
              this.comments[commentIndex].rating = this.editingRating;
            }
            
            if (data.ratingStats) {
              this.localTotalRatings = data.ratingStats.totalRatings;
              this.localAverageRating = data.ratingStats.averageRating;
              
              this.$emit('rating-updated', { 
                postId: this.post._id,
                totalRatings: data.ratingStats.totalRatings,
                averageRating: data.ratingStats.averageRating
              });
            }
          }
          this.cancelEdit();
        }
      } catch (err) {
        console.error("Error to update comment:", err);
        alert("Unable to update comment");
      }
    },

    cancelEdit() {
      this.editingCommentId = null;
      this.editedContent = '';
      this.editingRating = 0;
      this.showEditRating = false;
      this.editingHoverRating = 0;
    },

    async deleteComment(commentId) {
      if (!confirm("Are you sure to delete this comment")) return;

      try {
        const deletedComment = this.comments.find(c => c._id === commentId);
        const hadRating = deletedComment && deletedComment.rating > 0;

        const res = await fetch(`http://localhost:3000/comments/${commentId}`, {
          method: 'DELETE'
        });

        if (res.ok) {
          this.comments = this.comments.filter(c => c._id !== commentId);
          
          if (hadRating) {
            const savedUser = JSON.parse(localStorage.getItem("user"));
            if (deletedComment.author._id === savedUser.id) {
              this.userHasRated = false;
            }
            await this.fetchRatingStats();
          }
          
          this.$emit('comment-deleted', commentId);
          this.$emit('comment-count-updated', { postId: this.post._id, count: this.totalCommentCount });
          this.$emit('rating-updated', { 
            postId: this.post._id,
            totalRatings: this.localTotalRatings,
            averageRating: this.localAverageRating
          });
        }
      } catch (err) {
        console.error("Error to delete comment:", err);
        alert("Unable to delete comment");
      }
    },

    isMyComment(comment) {
      const savedUser = JSON.parse(localStorage.getItem("user"));
      return savedUser && comment.author._id === savedUser.id;
    },

    // Reply methods
    toggleReply(commentId) {
      if (this.replyInputs[commentId] !== undefined) {
        delete this.replyInputs[commentId];
        delete this.replyingTo[commentId];
      } else {
        const comment = this.comments.find(c => c._id === commentId);
        this.replyInputs[commentId] = '';
        this.replyingTo[commentId] = comment.author;
        
        // Focus vào input sau khi mở
        this.$nextTick(() => {
           const refName = 'replyInput-' + commentId;
           const el = this.$refs[refName];
           // Nếu ref nằm trong v-for nó sẽ là mảng
           if(el && el[0]) el[0].focus();
        });
      }
    },

    // Reply to reply methods
    toggleReplyToReply(replyId, replyAuthor) {
      if (this.replyInputsReply[replyId] !== undefined) {
        delete this.replyInputsReply[replyId];
        delete this.replyingToReply[replyId];
      } else {
        this.replyInputsReply[replyId] = '';
        this.replyingToReply[replyId] = replyAuthor;

        // Focus vào input
        this.$nextTick(() => {
           const refName = 'replyToReplyInput-' + replyId;
           const el = this.$refs[refName];
           if(el && el[0]) el[0].focus();
        });
      }
    },

    async submitReply(commentId) {
      const replyContent = this.replyInputs[commentId];
      const savedUser = JSON.parse(localStorage.getItem("user"));
      const replyTo = this.replyingTo[commentId];
      const replyToReply = this.replyingToReply[commentId];

      if (!replyContent?.trim()) return;

      try {
        const res = await fetch(`http://localhost:3000/comments/reply/${commentId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: replyContent,
            authorId: savedUser.id,
            replyToUserId: replyTo?._id || null,
            replyToReplyId: replyToReply?._id || null
          })
        });

        const data = await res.json();
        if (res.ok && data.reply) {
          const comment = this.comments.find(c => c._id === commentId);
          if (comment) {
            comment.replies.push(data.reply);
            this.showReplies[commentId] = true;
          }
          delete this.replyInputs[commentId];
          delete this.replyingTo[commentId];
          delete this.replyingToReply[commentId];

          this.$emit('comment-count-updated', { postId: this.post._id, count: this.totalCommentCount });
        }
      } catch (err) {
        console.error("Unable to reply:", err);
      }
    },

    async submitReplyToReply(commentId, replyId) {
      const content = this.replyInputsReply[replyId];
      const savedUser = JSON.parse(localStorage.getItem("user"));
      const replyTo = this.replyingToReply[replyId];

      if (!content?.trim()) return;

      try {
        const res = await fetch(`http://localhost:3000/comments/reply/${commentId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content,
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
          delete this.replyInputsReply[replyId];
          delete this.replyingToReply[replyId];

          this.$emit('comment-count-updated', { postId: this.post._id, count: this.totalCommentCount });
        }
      } catch (err) {
        console.error("Error replying to reply:", err);
      }
    },

    toggleRepliesVisibility(commentId) {
      this.showReplies[commentId] = !this.showReplies[commentId];
    },

    async toggleReplyLike(reply, commentId) {
      const savedUser = JSON.parse(localStorage.getItem("user"));
      if (!savedUser) return alert("Please log in to like replies");

      try {
        const res = await fetch(`http://localhost:3000/comments/reply/${commentId}/${reply._id}/like`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: savedUser.id })
        });

        const data = await res.json();
        if (res.ok) {
          const comment = this.comments.find(c => c._id === commentId);
          if (comment) {
            const replyIndex = comment.replies.findIndex(r => r._id === reply._id);
            if (replyIndex !== -1) {
              comment.replies[replyIndex] = data.reply;
            }
          }
        }
      } catch (err) {
        console.error("Error to like reply:", err);
      }
    },

    isReplyLiked(reply) {
      const savedUser = JSON.parse(localStorage.getItem("user"));
      return reply?.likes?.includes(savedUser?.id);
    },

    isMyReply(reply) {
      const savedUser = JSON.parse(localStorage.getItem("user"));
      return reply?.author?._id === savedUser?.id;
    },

    async deleteReply(commentId, replyId) {
      if (!confirm("Do you want to delete this reply?")) return;

      try {
        const res = await fetch(`http://localhost:3000/comments/reply/${commentId}/${replyId}`, {
          method: 'DELETE'
        });

        if (res.ok) {
          const comment = this.comments.find(c => c._id === commentId);
          if (comment) {
            comment.replies = comment.replies.filter(r => r._id !== replyId);
            this.$emit('comment-count-updated', { postId: this.post._id, count: this.totalCommentCount });
          }
        } else {
          const err = await res.json();
          alert(err.msg || "Fail to delete reply");
        }
      } catch (err) {
        console.error("Error to delete reply:", err);
        alert("Unable to delete reply");
      }
    },

    startReplyingTo(commentId, user, reply) {
      this.replyInputs[commentId] = '';
      this.replyingTo[commentId] = user;
      this.replyingToReply[commentId] = reply;
      this.showReplies[commentId] = true;
    },

    startReplyingToReply(commentId, reply) {
      this.replyInputsReply[reply._id] = '';
      this.replyingToReply[reply._id] = reply.author;
      this.showReplies[commentId] = true;
    },

    startEditReply(reply) {
      this.editingReplyId = reply._id;
      this.editedReplyContent = reply.content;
    },

    cancelEditReply() {
      this.editingReplyId = null;
      this.editedReplyContent = '';
    },

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
        console.error("Error to update reply:", err);
      }
    },

    async toggleLike() {
      const savedUser = JSON.parse(localStorage.getItem("user"));
      if (!savedUser) return alert("Please login");

      try {
        const res = await fetch(`http://localhost:3000/posts/${this.post._id}/like`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: savedUser.username
          })
        });

        const data = await res.json();
        // Don't mutate the prop directly, emit event instead
        this.$emit('liked', { postId: this.post._id, likes: data.likes });
      } catch (err) {
        console.error("Cannot like this post:", err);
        alert("Unable to like this post");
      }
    },

    sharePost() {
      this.$emit('share', this.post);
    },

    async checkUserRating() {
      const savedUser = JSON.parse(localStorage.getItem("user"));
      if (!savedUser || !this.post) return;

      try {
        const res = await fetch(`http://localhost:3000/comments/posts/${this.post._id}`);
        const data = await res.json();
        
        // Check if user has already rated (comment with rating)
        this.userHasRated = data.some(comment => 
          comment.author._id === savedUser.id && comment.rating > 0
        );
      } catch (err) {
        console.error("Error checking user rating:", err);
        this.userHasRated = false;
      }
    },

    async fetchRatingStats() {
      if (!this.post || !this.post._id) return;
      
      try {
        const res = await fetch(`http://localhost:3000/comments/posts/${this.post._id}/rating-stats`);
        if (res.ok) {
          const stats = await res.json();
          this.localTotalRatings = stats.totalRatings || 0;
          this.localAverageRating = stats.averageRating || 0;
        }
      } catch (err) {
        console.error("Cannot fetch rating stats:", err);
      }
    },

   

    getTruncatedText(text) {
      if (!text) return '';
      const lines = text.split('\n');
      
      // Lấy 3 dòng đầu tiên
      if (lines.length > 3) {
        return lines.slice(0, 3).join('\n') + '...';
      }
      
      // Hoặc lấy 150 ký tự đầu tiên
      if (text.length > 150) {
        return text.substring(0, 150) + '...';
      }
      
      return text;
    },

    toggleContent() {
      this.isContentExpanded = !this.isContentExpanded;
    }
  },

  beforeUnmount() {
    document.removeEventListener('click', this.closeEmojiPickerOnClickOutside);
  }
};
</script>

<style scoped>
/* --- CÁC STYLE CŨ (Giữ nguyên) --- */

.comment-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(255, 255, 255, 0.8); display: flex; justify-content: center; align-items: center; z-index: 9999; padding: 20px; box-sizing: border-box; }
.comment-modal-content {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 600px;
  height: 85vh;        /* Chiều cao cố định */
  max-height: 800px;
  min-height: 500px;
  
  /* Setup Flexbox dọc */
  display: flex;
  flex-direction: column; 
  
  /* Quan trọng: Ẩn thanh cuộn của khung chính để các phần con tự cuộn */
  overflow: hidden; 
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}
/* 2. Header: Cố định, không bị co lại */
.comment-modal-header {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px 24px;
  background: white;
  border-bottom: 1px solid #eee;
  position: relative;
  
  /* Quan trọng: Không cho phép header bị co nhỏ khi thiếu chỗ */
  flex-shrink: 0; 
  z-index: 10;
}
.comment-modal-header h3 { margin: 0; font-size: 18px; font-weight: 700; color: #1c1e21; text-align: center; }
.close-btn { background: #f0f2f5; border: none; border-radius: 50%; width: 36px; height: 36px; font-size: 20px; color: #606770; display: flex; align-items: center; justify-content: center; cursor: pointer; position: absolute; right: 24px; top: 50%; transform: translateY(-50%); }
.close-btn:hover { background: #e4e6ea; }

.post-detail {
  padding: 20px 24px;
  border-bottom: 1px solid #e4e6eb;
  
  /* Giới hạn chiều cao tối đa (ví dụ 30% màn hình modal) để nhường chỗ cho comment */
  max-height: 30vh; 
  overflow-y: auto; /* Cuộn nếu bài viết dài */
  flex-shrink: 0;   /* Không co lại */
}
.post-author-info { display: flex; align-items: flex-start; margin-bottom: 12px; }
.author-avatar { width: 40px; height: 40px; border-radius: 50%; margin-right: 12px; object-fit: cover; }
.author-details strong { font-size: 15px; font-weight: 600; color: #1c1e21; }
.author-details .time { font-size: 13px; color: #65676b; margin-top: 2px; }

.post-content { font-size: 15px; line-height: 1.4; color: #1c1e21; margin: 12px 0; white-space: pre-line; }
.content-collapsed { max-height: none; overflow: hidden; }
.read-more-btn { background: none; border: none; color: #1877f2; font-weight: 600; font-size: 14px; cursor: pointer; padding: 4px 0; margin-top: 4px; }
.read-more-btn:hover { text-decoration: underline; }

.recipe-content { background: #f8f9fa; border: 1px solid #e3e6ea; border-radius: 12px; padding: 16px; margin-top: 12px; }
.recipe-title { color: #1c1e21; font-size: 16px; font-weight: 600; margin: 0 0 12px 0; border-bottom: 1px solid #e3e6ea; padding-bottom: 8px; }
.recipe-section { margin-bottom: 12px; }
.recipe-section:last-child { margin-bottom: 0; }
.recipe-section strong { color: #1877f2; font-size: 14px; font-weight: 600; display: block; margin-bottom: 6px; }
.recipe-text { font-size: 14px; line-height: 1.5; color: #1c1e21; margin: 0; white-space: pre-line; background: white; padding: 8px 12px; border-radius: 8px; border: 1px solid #e3e6ea; }

.post-media-modal { margin: 16px 0; text-align: center; }
.post-image-modal, .post-video-modal { width: 100%; max-height: 200px; object-fit: contain; border-radius: 8px; }
.post-stats { display: flex; gap: 16px; margin: 16px 0 12px 0; font-size: 14px; color: #65676b; }

.post-actions-modal { display: flex; justify-content: space-around; padding: 8px 0; border-top: 1px solid #e4e6eb; margin-top: 10px; }
.action-btn { display: flex; align-items: center; gap: 8px; background: none; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-weight: 600; color: #65676b; flex: 1; justify-content: center; }
.action-btn:hover { color: #1877f2; background: #f0f2f5; }
.action-icon { width: 20px; height: 20px; }

.comments-section {
  flex-grow: 1;     /* Tự động giãn ra lấp đầy khoảng trống giữa bài viết và footer */
  padding: 10px;
  background-color: #f9f9f9;
  
  overflow-y: auto; /* Bật thanh cuộn cho riêng vùng này */
  min-height: 0;    /* Fix lỗi flexbox trên một số trình duyệt */
}
.comments-list::-webkit-scrollbar { display: none; }
.no-comments { text-align: center; padding: 40px 20px; color: #65676b; }
.no-comments-icon { font-size: 48px; margin-bottom: 16px; }

/* Comment Items */
.comment-item { display: flex; margin-bottom: 16px; padding: 8px 4px; }
.comment-avatar { width: 32px; height: 32px; border-radius: 50%; margin-right: 8px; object-fit: cover; }
.comment-content { flex: 1; min-width: 0; }
.comment-bubble { background: #f0f2f5; border-radius: 16px; padding: 8px 12px; display: inline-block; max-width: 90%; word-wrap: break-word; }
.edit-comment-container { width: 100%; margin-top: 8px; }
.edit-comment-container .edit-textarea { width: 100%; min-height: 80px; padding: 12px 16px; border: 1px solid #ddd; border-radius: 12px; resize: vertical; font-family: inherit; font-size: 14px; line-height: 1.4; box-sizing: border-box; background-color: white; color: #1c1e21; }
.edit-comment-container .edit-textarea:focus { outline: none; border-color: #1877f2; box-shadow: 0 0 0 2px rgba(24, 119, 242, 0.2); }
.edit-rating-value {
  margin-left: 8px;
  font-size: 13px;
  
  /* SỬA Ở ĐÂY: Đổi từ màu cũ sang màu cam #f57c00 */
  color: #856404; 
  
  font-weight: 700; /* Tăng độ đậm một chút cho rõ */
}
.comment-author { font-size: 13px; font-weight: 600; color: #1c1e21; display: inline-flex; margin-bottom: 2px; align-items: center; }
.comment-text { font-size: 14px; color: #1c1e21; margin: 0; line-height: 1.4; word-wrap: break-word; }
.comment-actions { display: flex; align-items: center; gap: 12px; margin-top: 4px; margin-left: 12px; font-size: 12px; color: #65676b; }
.comment-time { font-size: 12px; color: #65676b; }
.comment-action-btn { background: none; border: none; font-size: 12px; font-weight: 600; color: #65676b; cursor: pointer; padding: 0; display: flex; align-items: center; gap: 4px; }
.comment-action-btn:hover { text-decoration: underline; color: #1877f2; }
.action-icon-small { width: 14px; height: 14px; }

/* Add Comment Section (Đã sửa lại cho Emoji) */
.add-comment-section {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-top: 1px solid #e4e6eb;
  background: white;
  gap: 10px;
  
  /* Quan trọng: Không cần position: sticky nữa vì Flexbox đã đẩy nó xuống cuối */
  position: relative; 
  flex-shrink: 0; /* Đảm bảo không bao giờ bị đè bẹp */
  z-index: 20;
}
.user-avatar {
  width: 36px; /* Tăng nhẹ kích thước avatar cho cân đối */
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  margin-top: 0;
}
.comment-input-container {
  flex: 1;
  display: flex;
  flex-direction: row; /* QUAN TRỌNG: Xếp ngang các phần tử */
  align-items: center; /* Căn giữa theo chiều dọc */
  gap: 8px; /* Khoảng cách giữa Nút Rating và Ô Input */
  position: relative; /* Để định vị bảng chọn sao (star selector) */
}

/* Wrapper của comment chính */
.comment-input-wrapper {
  display: flex;
  align-items: center;
  flex: 1; /* Chiếm hết phần không gian còn lại */
  background: #f0f2f5;
  border-radius: 20px;
  padding: 0 12px;
  position: relative;
  height: 36px; /* Chiều cao cố định cho đẹp */
}
.comment-input { flex: 1; border: none; background: transparent; outline: none; font-size: 14px; padding-right: 8px; color: #1c1e21; }
.comment-input::placeholder { color: #65676b; }

/* --- STYLES MỚI CHO EMOJI --- */

/* 1. Wrapper của Reply Input (có icon emoji bên trong) */
.input-with-emoji-container {
  flex: 1;
  display: flex;
  align-items: center;
  background: #f0f2f5;
  border-radius: 18px;
  padding: 4px 8px 4px 12px;
  position: relative;
}

.reply-input { 
  flex: 1; 
  background: transparent; 
  border: none; 
  outline: none; 
  font-size: 13px; 
  padding: 4px 0; 
  color: #1c1e21;
}

/* 2. Nút Emoji (Main & Small) */
.emoji-wrapper-main { position: relative; display: flex; align-items: center; margin-right: 8px; }
.emoji-wrapper-small { position: relative; display: flex; align-items: center; }

.emoji-btn-main, .emoji-btn-small { 
  background: none; 
  border: none; 
  cursor: pointer; 
  padding: 4px; 
  display: flex; 
  align-items: center;
  opacity: 0.6;
  transition: transform 0.1s; 
}
.emoji-btn-main:hover, .emoji-btn-small:hover { transform: scale(1.1); opacity: 1; }

.icon-emoji-img { width: 20px; height: 20px; } /* Icon ảnh mặt cười */

/* 3. Popover bảng Emoji */
/* Cho comment chính (hiện cao hơn) */
.emoji-popover-main { 
  position: absolute; 
  bottom: 45px; 
  right: 0; 
  z-index: 100; 
  box-shadow: 0 5px 15px rgba(0,0,0,0.2); 
  border-radius: 8px; 
  background: white;
}
/* Cho reply (hiện thấp hơn chút) */
.emoji-popover-up { 
  position: absolute; 
  bottom: 35px; 
  right: 0; 
  z-index: 100; 
  box-shadow: 0 5px 15px rgba(0,0,0,0.2); 
  border-radius: 8px; 
  background: white;
}

/* Nút gửi tin nhắn */
.send-comment-btn, .send-reply-btn { 
  background: none; 
  border: none; 
  color: #1877f2; 
  font-size: 16px; 
  cursor: pointer; 
  padding: 0 4px; 
  margin-left: 8px; /* Cách emoji ra một chút */
  transition: transform 0.1s; 
  flex-shrink: 0;
}
.send-comment-btn:hover:not(:disabled), .send-reply-btn:hover:not(:disabled) { transform: scale(1.1); color: #166fe5; }
.send-comment-btn:disabled, .send-reply-btn:disabled { color: #bcc0c4; cursor: default; }

/* --- END EMOJI STYLES --- */

/* Rating Toggle */
.rating-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0; /* Xóa margin cũ */
  flex-shrink: 0; /* Đảm bảo nút không bị co nhỏ */
}
.toggle-rating-btn {
  background: #e7f3ff;
  border: none;
  padding: 0 12px;
  border-radius: 18px; /* Bo tròn kiểu "chip" */
  font-size: 13px;
  cursor: pointer;
  color: #1877f2;
  font-weight: 600;
  transition: all 0.2s;
  white-space: nowrap;
  height: 36px; /* Chiều cao bằng với ô input */
  display: flex;
  align-items: center;
}
.star-rating-selector {
  display: flex;
  position: absolute;
  bottom: 100%; /* Hiện lên trên container */
  left: 0;      /* Căn trái thẳng hàng với nút */
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background: white;
  border-radius: 20px;
  margin-bottom: 12px; /* Cách xa nút một chút */
  box-shadow: 0 4px 12px rgba(0,0,0,0.15); /* Thêm bóng đổ cho đẹp */
  border: 1px solid #e4e6eb;
  z-index: 10;}
.star { font-size: 20px; cursor: pointer; color: #ddd; }
.star.filled { color: #ffc107; }
.star:hover { transform: scale(1.15); }
.rating-text { font-size: 12px; color: #65676b; margin-left: 6px; align-self: center; }

/* Rating Stats */
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
.rating-number { font-size: 24px; font-weight: bold; color: #f57c00; margin-right: 8px; }
/* --- Tìm và thay thế đoạn này trong <style scoped> --- */

/* 1. Ngôi sao trong comment */
.star-display {
  font-size: 14px;
  color: #ddd;      /* Màu xám cho sao rỗng */
  margin-right: 1px;
}

.star-display.filled {
  color: #ffc107;   /* MÀU VÀNG (Gold) cho sao đã chọn */
}

/* 2. Chữ hiển thị số sao (Ví dụ: 5 stars) */
.rating-text-display {
  margin-left: 6px;
  font-size: 13px;
  color: #856404;   /* MÀU CAM (Orange) giống phần tổng hợp ở trên */
  font-weight: 700; /* Chữ đậm */
}
.star-icon { font-size: 16px; color: #ddd; }
.star-icon.filled { color: #ffc107; }
.rating-count { font-size: 13px; color: #856404; font-weight: 600; }
.updated { animation: pulse 0.3s ease-in-out; }
@keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }

/* Reply styles */
.reply-section { margin-top: 8px; padding-left: 20px; }
.reply-input-wrapper, .reply-to-reply-input-wrapper { display: flex; align-items: center; gap: 8px; }
.user-avatar-small { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; }

.replies-section { margin-top: 12px; padding-left: 20px; border-left: 2px solid #f0f2f5; }
.toggle-replies-btn { background: none; border: none; color: #1877f2; cursor: pointer; font-size: 12px; font-weight: 600; margin-bottom: 8px; }
.reply-item { display: flex; gap: 8px; margin-top: 8px; }
.reply-content { flex: 1; }
.reply-bubble { background-color: #f0f2f5; padding: 6px 10px; border-radius: 12px; display: inline-block; max-width: 75%; word-wrap: break-word; }
.reply-bubble strong { font-size: 13px; color: #050505; }
.reply-bubble p { font-size: 13px; margin: 0; }
.reply-to-name { color: #1877f2; font-weight: 500; margin-right: 4px; }
.author-label { background-color: #1876f2; color: white; font-size: 11px; font-weight: bold; padding: 2px 6px; margin-left: 6px; border-radius: 4px; }
.reply-actions { display: flex; gap: 8px; margin-top: 2px; font-size: 11px; color: #65676b; margin-left: 10px; }
.reply-time { color: #65676b; font-size: 11px; }

.edit-input-wrapper {
  display: flex;
  align-items: flex-start; /* Căn trên cùng */
  background: #ffffff;
  border: 1px solid #ddd;
  border-radius: 12px;
  padding: 8px;
  position: relative;
  transition: border-color 0.2s;
}

.edit-input-wrapper:focus-within {
  border-color: #1877f2;
  box-shadow: 0 0 0 2px rgba(24, 119, 242, 0.2);
}

.edit-textarea-with-emoji,
.edit-reply-input-with-emoji {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.4;
  resize: vertical;
  min-height: 60px;
  padding-right: 8px;
  color: #1c1e21;
}

/* Nút Emoji trong Edit (đặt ở góc dưới hoặc phải) */
.emoji-wrapper-edit {
  position: relative;
  display: flex;
  align-items: center;
  align-self: flex-end; /* Nằm ở đáy khung */
  margin-left: 4px;
  margin-bottom: 4px; /* Cách đáy một chút */
}

/* Edit Reply */
.edit-reply-container { width: 100%; margin-top: 8px; }
.edit-reply-container .edit-reply-input { width: calc(100% - 40px) !important; min-height: 80px; padding: 10px 14px; border: 1px solid #ddd; border-radius: 12px; resize: vertical; font-family: inherit; font-size: 13px; line-height: 1.4; box-sizing: border-box; background-color: white; color: #1c1e21; }
.edit-actions { display: flex; gap: 8px; margin-top: 8px; }
.save-btn, .cancel-btn { padding: 6px 12px; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; }
.save-btn { background-color: #1877f2; color: white; }
.cancel-btn { background-color: #e4e6ea; color: #1c1e21; }

/* Filter Bar */
.comment-filter-bar { display: flex; gap: 8px; padding: 12px 16px; background: white; border-bottom: 1px solid #e4e6eb; overflow-x: auto; }
.filter-btn { padding: 8px 16px; border: 1px solid #e4e6eb; background: white; border-radius: 20px; font-size: 13px; font-weight: 600; color: #65676b; cursor: pointer; white-space: nowrap; flex-shrink: 0; }
.filter-btn.active { background: #1877f2; color: white; border-color: #1877f2; }

/* Responsive */
@media (max-width: 768px) {
  .comment-modal-content { height: 90vh; max-height: none; }
  .post-detail { max-height: 250px; }
  .comments-section { padding: 0 16px; }
  .add-comment-section { padding: 12px 16px; }
}
</style>