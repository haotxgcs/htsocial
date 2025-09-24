<template>
  <!-- Comment Modal -->
  <div v-if="isVisible" class="comment-modal-overlay" @click="closeModal">
    <div class="comment-modal-content" @click.stop>
      <!-- Modal Header -->
      <div class="comment-modal-header">
        <h3>{{ post?.author?.firstname }} {{ post?.author?.lastname }}'s post</h3>
        <button class="close-btn" @click="closeModal">&times;</button>
      </div>

      <!-- Post Detail Section -->
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

        <div class="post-content">{{ post?.content }}</div>

        <!-- Media in Modal -->
        <div v-if="post?.media" class="post-media-modal">
          <img v-if="post?.mediaType === 'image'" :src="`http://localhost:3000/${post.media}`" class="post-image-modal" />
          <video v-else-if="post?.mediaType === 'video'" controls class="post-video-modal">
            <source :src="`http://localhost:3000/${post.media}`" type="video/mp4" />
          </video>
        </div>

        <!-- Post Stats -->
        <div class="post-stats">
          <span v-if="post?.likes?.length > 0">{{ post.likes.length }} likes</span>
          <span v-if="totalCommentCount > 0">{{ totalCommentCount }} comments</span>
          <span v-if="post?.sharesCount > 0">{{ post.sharesCount }} shares</span>
        </div>

        <!-- Action Buttons in Modal -->
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
        </div>
      </div>

      <!-- Comments Section -->
      <div class="comments-section">
        <div class="comments-list">
          <div v-if="comments.length === 0" class="no-comments">
            <div class="no-comments-icon">💬</div>
            <p>No comments yet</p>
            <p class="sub-text">Be the first to share what you think!</p>
          </div>

          <!-- Comment Items -->
          <div v-for="comment in comments" :key="comment._id" class="comment-item">
            <img :src="getAvatarUrl(comment.author)" class="comment-avatar" alt="avatar" />
            <div class="comment-content">
              <!-- Comment bubble -->
              <div class="comment-bubble">
                <strong class="comment-author">{{ comment.author?.firstname }} {{ comment.author?.lastname }}</strong>
                <span v-if="isPostAuthor(comment.author)" class="author-label">Author</span>
                
                <!-- Edit mode -->
                <div v-if="editingCommentId === comment._id" class="edit-comment-container">
                  <textarea v-model="editedContent" class="edit-textarea" @keyup.enter="saveComment(comment._id)"></textarea>
                  <div class="edit-actions">
                    <button @click="saveComment(comment._id)" class="save-btn">Save</button>
                    <button @click="cancelEdit" class="cancel-btn">Cancel</button>
                  </div>
                </div>

                 <!-- View mode -->
                <p v-else class="comment-text">
                  <!-- Debug: Hiển thị tên người được reply cho mọi trường hợp reply comment -->
                  <span v-if="comment.replyToUser" class="reply-to-name">
                    @{{ comment.replyToUser.firstname }} {{ comment.replyToUser.lastname }}
                  </span>
                  {{ comment.content }}
                </p>
              </div>

              <!-- Comment actions -->
              <div class="comment-actions">
                <span class="comment-time">{{ formatTime(comment.createdAt) }}</span>
                
                <button @click="toggleCommentLike(comment)" class="comment-action-btn">
                  <img :src="isCommentLiked(comment) ? require('../assets/like.png') : require('../assets/unlike.png')" class="action-icon-small" />
                  <span>{{ comment.likeCount || comment.likes?.length || 0 }}</span>
                </button>

                <!-- Only show Reply button if comment is not from current user -->
                <button v-if="!isMyComment(comment)" @click="toggleReply(comment._id)" class="comment-action-btn">
                  <img src="../assets/reply.png" class="action-icon-small">Reply</button>

                <button v-if="isMyComment(comment)" @click="editComment(comment)" img src="../assets/edit.png" class="comment-action-btn">
                  <img src="../assets/edit.png" class="action-icon-small">Edit</button>
                <button v-if="isMyComment(comment)" @click="deleteComment(comment._id)" img src="../assets/delete.png" class="comment-action-btn" style="color: red;">
                  <img src="../assets/delete.png" class="action-icon-small">Delete</button>
              </div>

              <!-- Reply input -->
              <div v-if="replyInputs[comment._id] !== undefined" class="reply-section">
                <div class="reply-input-wrapper">
                  <img :src="getAvatarUrl(user)" class="user-avatar-small" alt="avatar" />
                  <input
                    v-model="replyInputs[comment._id]"
                    @keyup.enter="submitReply(comment._id)"
                    :placeholder="`Reply to ${replyingTo[comment._id]?.firstname} ${replyingTo[comment._id]?.lastname}...`"
                    class="reply-input"
                  />
                  <button 
                    @click="submitReply(comment._id)" 
                    :disabled="!replyInputs[comment._id]?.trim()"
                    class="send-reply-btn"
                  >
                    ➤
                  </button>
                </div>
              </div>

              <!-- Replies section -->
              <div v-if="comment.replies && comment.replies.length > 0" class="replies-section">
                <button @click="toggleRepliesVisibility(comment._id)" class="toggle-replies-btn">
                  {{ showReplies[comment._id] ? 'Hide' : 'View' }} {{ comment.replies.length }} 
                  {{ comment.replies.length === 1 ? 'reply' : 'replies' }}
                </button>

                <div v-if="showReplies[comment._id]" class="replies-list">
                  <div v-for="reply in comment.replies" :key="reply._id" class="reply-item">
                    <img :src="getAvatarUrl(reply.author)" class="user-avatar-small" alt="avatar" />
                    <div class="reply-content">
                      <!-- Edit reply mode -->
                      <div v-if="editingReplyId === reply._id" class="edit-reply-container">
                        <textarea v-model="editedReplyContent" class="edit-reply-input" @keyup.enter="saveReply(comment._id, reply._id)"></textarea>
                        <div class="edit-actions">
                          <button @click="saveReply(comment._id, reply._id)" class="save-btn">Save</button>
                          <button @click="cancelEditReply" class="cancel-btn">Cancel</button>
                        </div>
                      </div>

                      <!-- View reply mode -->
                      <div v-else class="reply-bubble">
                        <strong>{{ reply.author?.firstname }} {{ reply.author?.lastname }}</strong>
                        <span v-if="isPostAuthor(reply.author)" class="author-label">Author</span>
                        <p>
                          <span v-if="reply?.replyTo && reply?.replyTo._id " class="reply-to-name">
                            @{{ reply?.replyTo?.firstname }} {{ reply?.replyTo?.lastname }}
                          </span>
                          {{ reply.content }}
                        </p>
                      </div>

                      <!-- Reply actions -->
                      <div class="reply-actions">
                        <span class="reply-time">{{ formatTime(reply.createdAt) }}</span>
                        
                        <button @click="toggleReplyLike(reply, comment._id)" class="comment-action-btn">
                          <img :src="isReplyLiked(reply) ? require('../assets/like.png') : require('../assets/unlike.png')" class="action-icon-small" />
                          <span>{{ reply.likeCount || reply.likes?.length || 0 }}</span>
                        </button>

                        <!-- Only show Reply button if reply is not from current user -->
                        <button v-if="!isMyReply(reply)" @click="toggleReplyToReply(reply._id, reply.author)" class="comment-action-btn">
                          <img src="../assets/reply.png" class="action-icon-small">Reply</button>

                        <button v-if="isMyReply(reply)" @click="startEditReply(reply)" class="comment-action-btn">
                          <img src="../assets/edit.png" class="action-icon-small">Edit</button>
                        <button v-if="isMyReply(reply)" @click="deleteReply(comment._id, reply._id)" class="comment-action-btn" style="color: red;">
                          <img src="../assets/delete.png" class="action-icon-small">Delete</button>
                      </div>

                      <!-- Reply to a reply form -->
                  <div v-if="replyInputsReply[reply._id] !== undefined" class="reply-to-reply-input-wrapper">
                    <img :src="`http://localhost:3000/${user?.avatar || 'user.png'}`" class="user-avatar-small" />
                    <input
                      v-model="replyInputsReply[reply._id]"
                      :placeholder="`Reply to ${replyingToReply[reply._id]?.firstname} ${replyingToReply[reply._id]?.lastname}...`"
                      class="reply-input"
                      @keypress.enter="submitReplyToReply(comment._id, reply._id)"
                    />
                    <button
                      @click="submitReplyToReply(comment._id, reply._id)"
                      class="send-reply-btn"
                      :disabled="!replyInputsReply[reply._id]?.trim()"
                    >➤
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

      <!-- Add Comment Section -->
      <div class="add-comment-section">
        <img :src="getAvatarUrl(user)" class="user-avatar" alt="avatar" />
        <div class="comment-input-wrapper">
          <input
            v-model="newComment"
            @keyup.enter="submitComment"
            placeholder="Write a comment..."
            class="comment-input"
          />
          <button 
            @click="submitComment" 
            :disabled="!newComment.trim()"
            class="send-comment-btn"
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "CommentModal",
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
    }
  },
  computed: {
    isLiked() {
      const savedUser = JSON.parse(localStorage.getItem("user"));
      return this.post?.likes && this.post.likes.includes(savedUser?.id);
    },

    totalCommentCount() {
    let total = this.comments.length; // Số comment chính
    this.comments.forEach(comment => {
      if (comment.replies && comment.replies.length > 0) {
        total += comment.replies.length; // Cộng thêm số reply
      }
    });
    return total;
  }
  },
  watch: {
    post: {
      handler(newPost) {
        if (newPost) {
          this.fetchComments(newPost._id);
        }
      },
      immediate: true
    },
    isVisible(newVal) {
      if (newVal && this.post) {
        this.fetchComments(this.post._id);
      }
    }
  },
  methods: {
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

    async fetchComments(postId) {
      try {
        const res = await fetch(`http://localhost:3000/comments/posts/${postId}`);
        const data = await res.json();
        this.comments = data;
      } catch (err) {
        console.error("Error to fetch comments:", err);
        this.comments = [];
      }
    },

    async submitComment() {
      if (!this.newComment.trim()) return;

      const user = JSON.parse(localStorage.getItem("user"));
      if (!user || !this.post) return;

      try {
        const res = await fetch(`http://localhost:3000/comments/posts/${this.post._id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: this.newComment,
            authorId: user.id
          })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.msg || "Submit comment fail");

        this.comments.push(data.comment);
        this.newComment = "";
        this.$emit('commented', data.comment);
        this.$emit('comment-count-updated', { postId: this.post._id, count: this.totalCommentCount });
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
    },

    async saveComment(commentId) {
      if (!this.editedContent.trim()) return;

      try {
        const res = await fetch(`http://localhost:3000/comments/${commentId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: this.editedContent })
        });

        if (res.ok) {
          const commentIndex = this.comments.findIndex(c => c._id === commentId);
          if (commentIndex !== -1) {
            this.comments[commentIndex].content = this.editedContent;
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
    },

    async deleteComment(commentId) {
      if (!confirm("Are you sure to delete this comment")) return;

      try {
        const res = await fetch(`http://localhost:3000/comments/${commentId}`, {
          method: 'DELETE'
        });

        if (res.ok) {
          this.comments = this.comments.filter(c => c._id !== commentId);
          this.$emit('comment-deleted', commentId);
          this.$emit('comment-count-updated', { postId: this.post._id, count: this.totalCommentCount });
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
    console.error("Lỗi khi reply trong reply:", err);
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
    }
  }
};
</script>

<style scoped>
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
  overflow-y: auto; 
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.comment-modal-content::-webkit-scrollbar {
  display: none;
}

/* Modal Header */
.comment-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e4e6eb;
  background: white;
  flex-shrink: 0;
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

/* Post Detail Section */
.post-detail {
  padding: 20px 24px;
  border-bottom: 1px solid #e4e6eb;
  flex-shrink: 0;
  overflow-y: auto;
  max-height: 300px;
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

/* Media in Modal */
.post-media-modal {
  margin: 16px 0;
  text-align: center;
}

.post-image-modal,
.post-video-modal {
  width: 100%;
  max-width: 100%;
  max-height: 200px;
  object-fit: contain;
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
  margin-top: 10px;
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
  font-weight: 600;
  color: #65676b;
  transition: all 0.2s ease;
  flex: 1;
  justify-content: center;
}

.action-btn:hover {
  
  color: #1877f2;
}

.action-icon {
  width: 20px;
  height: 20px;
}

/* Comments Section */
.comments-section {
  flex: 1;
  padding: 10px;
  background-color: #f9f9f9;
}

.comments-list {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.comments-list::-webkit-scrollbar {
  display: none;
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
  min-width: 0;
}

.comment-bubble {
  background: #f0f2f5;
  border-radius: 16px;
  padding: 8px 12px;
  display: inline-block;  /* Đổi lại thành inline-block */
  max-width: 80%;  /* Giới hạn chiều rộng tối đa */
  word-wrap: break-word;
}

.edit-comment-container {
  width: 100%;
  margin-top: 8px;
}

.edit-comment-container .edit-textarea {
  width: 100%;
  min-height: 80px;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 12px;
  resize: vertical;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.4;
  box-sizing: border-box;
  background-color: white;
  color: #1c1e21;
  transition: border-color 0.2s ease;
}

.edit-comment-container .edit-textarea:focus {
  outline: none;
  border-color: #1877f2;
  box-shadow: 0 0 0 2px rgba(24, 119, 242, 0.2);
}

.comment-author {
  font-size: 13px;
  font-weight: 600;
  color: #1c1e21;
  display: inline-flex;
  margin-bottom: 2px;
  align-items: center;
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
  display: flex;
  align-items: center;
  gap: 4px;
}

.comment-action-btn:hover {
  text-decoration: underline;
  color: #1877f2;
}

.action-icon-small {
  width: 14px;
  height: 14px;
}

/* Add Comment Section */
.add-comment-section {
  display: flex;
  align-items: center;
  padding: 16px 24px;
  border-top: 1px solid #e4e6eb;
  background: white;
  gap: 8px;
  flex-shrink: 0;
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

.edit-reply-container {
  width: 100%;
  margin-top: 8px;
}

.edit-reply-container .edit-reply-input {
  width: calc(100% - 40px) !important;  /* Trừ đi margin của avatar */
  min-height: 80px;
  padding: 10px 14px;
  border: 1px solid #ddd;
  border-radius: 12px;
  resize: vertical;
  font-family: inherit;
  font-size: 13px;
  line-height: 1.4;
  box-sizing: border-box;
  background-color: white;
  color: #1c1e21;
  transition: border-color 0.2s ease;
}

.edit-reply-container .edit-reply-input:focus {
  outline: none;
  border-color: #1877f2;
  box-shadow: 0 0 0 2px rgba(24, 119, 242, 0.2);
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

.reply-input-wrapper, .reply-to-reply-input-wrapper {
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
  max-width: 75%;  /* Giới hạn chiều rộng để vừa đủ nội dung */
  word-wrap: break-word;
}

.reply-bubble strong {
  font-size: 13px;
  color: #050505;
  margin-bottom: 2px;
  display: inline-flex;
  align-items: center;
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

/* Reply to name */
.reply-to-name {
  color: #1876f2;
  font-weight: 500;
  margin-right: 4px;
}

/* Author label */
.author-label {
  background-color: #1876f2;
  color: white;
  font-size: 11px;
  font-weight: bold;
  padding: 2px 6px;
  margin-left: 6px;
  border-radius: 4px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .comment-modal-overlay {
    padding: 10px;
  }
  
  .comment-modal-content {
    height: 90vh; 
    max-height: none;
  }
  
  .post-detail {
    max-height: 250px; 
  }
  
  .comments-section {
    padding: 0 16px;
  }
  
  .add-comment-section {
    padding: 12px 16px;
  }
}
</style>