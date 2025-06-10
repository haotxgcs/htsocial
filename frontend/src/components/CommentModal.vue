<template>
  <div v-if="visible" class="comment-modal-overlay" @click.self="close">
    <div class="comment-modal-content">
      <div class="comment-modal-header">
        <h3>Bài viết của {{ post?.author?.firstname }} {{ post?.author?.lastname }}</h3>
        <button class="close-btn" @click="close">&times;</button>
      </div>

      <div class="post-detail">
        <div class="post-author-info">
          <img :src="getAvatar(post?.author?.avatar)" alt="avatar" class="author-avatar" />
          <div class="author-details">
            <strong>{{ post?.author?.firstname }} {{ post?.author?.lastname }}</strong>
            <p class="time">{{ formatTime(post?.createdAt) }}</p>
          </div>
        </div>
        <p class="post-content">{{ post?.content }}</p>

        <div v-if="post?.media" class="post-media-modal">
          <img v-if="post.mediaType === 'image'" :src="getMedia(post.media)" class="post-image-modal" />
          <video v-else-if="post.mediaType === 'video'" controls class="post-video-modal">
            <source :src="getMedia(post.media)" type="video/mp4" />
          </video>
        </div>
      </div>

      <div class="comments-section">
        <div v-if="comments.length === 0" class="no-comments">
          <p>Chưa có bình luận nào</p>
        </div>

        <div v-else>
          <div v-for="comment in comments" :key="comment._id" class="comment-item">
            <img :src="getAvatar(comment.author.avatar)" class="comment-avatar" />
            <div class="comment-content">
              <strong>{{ comment.author.firstname }} {{ comment.author.lastname }}</strong>
              <p>{{ comment.content }}</p>
            </div>
          </div>
        </div>

        <div class="add-comment">
          <img :src="getAvatar(user.avatar)" class="user-avatar" />
          <input 
            v-model="newComment" 
            placeholder="Viết bình luận..." 
            @keyup.enter="submitComment"
          />
          <button @click="submitComment" :disabled="!newComment.trim()">Gửi</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CommentModal',
  props: ['visible', 'post'],
  data() {
    return {
      comments: [],
      newComment: '',
      user: JSON.parse(localStorage.getItem('user'))
    };
  },
  methods: {
    close() {
      this.$emit('close');
    },
    getAvatar(path) {
      return path ? `http://localhost:3000/${path}` : require('../assets/user.png');
    },
    getMedia(path) {
      return `http://localhost:3000/${path}`;
    },
    formatTime(dateStr) {
      return new Date(dateStr).toLocaleString();
    },
    async fetchComments() {
      try {
        const res = await this.$axios.get(`/comments/posts/${this.post._id}`);
        this.comments = res.data;
      } catch (err) {
        console.error('Lỗi khi tải comment:', err);
      }
    },
    async submitComment() {
      if (!this.newComment.trim()) return;
      try {
        const res = await this.$axios.post('/comments', {
          content: this.newComment,
          author: this.user.username,
          post: this.post._id
        });
        this.comments.push(res.data.comment);
        this.newComment = '';
      } catch (err) {
        console.error('Lỗi gửi comment:', err);
        alert('Không thể gửi bình luận');
      }
    }
  },
  watch: {
    visible(val) {
      if (val && this.post?._id) {
        this.fetchComments();
      }
    }
  }
};
</script>

<style scoped>
.comment-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.comment-modal-content {
  background: white;
  width: 600px;
  max-height: 90vh;
  border-radius: 10px;
  padding: 20px;
  overflow-y: auto;
}

.comment-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
}

.post-author-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.author-avatar, .comment-avatar, .user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.comment-item {
  display: flex;
  align-items: flex-start;
  margin-top: 10px;
  gap: 10px;
}

.add-comment {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 15px;
}

.add-comment input {
  flex: 1;
  padding: 8px;
  border-radius: 6px;
  border: 1px solid #ccc;
}
</style>
