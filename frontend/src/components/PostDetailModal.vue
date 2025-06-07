<template>
  <div class="overlay" @click.self="close">
    <div class="modal">
      <!-- Header -->
      <div class="post-header">
        <img :src="getAvatar(post?.author?.avatar)" />
        <div>
          <strong>{{ post?.author?.firstname }} {{ post?.author?.lastname }}</strong>
          <p>{{ formatTime(post?.createdAt) }}</p>
        </div>
      </div>

      <!-- Nội dung -->
      <p class="post-content">{{ post?.content }}</p>

      <!-- Media -->
      <div v-if="post?.media">
        <img v-if="post?.mediaType === 'image'" :src="getMedia(post.media)" />
        <video v-else controls>
          <source :src="getMedia(post.media)" type="video/mp4" />
        </video>
      </div>

      <!-- Comment list -->
      <div class="comments">
        <div v-for="(c, index) in comments" :key="index" class="comment">
          <p><strong>{{ c.author?.username }}:</strong> {{ c.content }}</p>
          <small @click="replyTo(c.author?.username)">↳ Trả lời</small>
        </div>
      </div>

      <!-- Bình luận -->
      <div class="comment-box">
        <input v-model="newComment" placeholder="Viết bình luận..." />
        <button @click="sendComment">Gửi</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: ["post"],
  data() {
    return {
      newComment: "",
      comments: []
    };
  },
  methods: {
    close() {
      this.$emit("close");
    },
    formatTime(dateStr) {
      return new Date(dateStr).toLocaleString();
    },
    getAvatar(path) {
      return path ? `http://localhost:3000/${path}` : "../assets/user.png";
    },
    getMedia(path) {
      return `http://localhost:3000/${path}`;
    },
    async loadComments() {
      try {
        const res = await this.$axios.get(`/comments/posts/${this.post._id}`);
        this.comments = res.data;
      } catch (err) {
        console.error("Lỗi khi tải comments:", err);
      }
    },
    async sendComment() {
  if (!this.newComment.trim()) return;

  const savedUser = JSON.parse(localStorage.getItem("user"));
  if (!savedUser) return alert("Bạn chưa đăng nhập");

  try {
    const res = await this.$axios.post("http://localhost:3000/comments", {
      post: this.post._id,
      author: savedUser.username,
      content: this.newComment
    });

    this.comments.unshift(res.data.comment); // thêm bình luận mới vào đầu danh sách
    this.newComment = "";
  } catch (err) {
    console.error("Lỗi khi gửi bình luận:", err);
    alert("Không thể gửi bình luận");
  }
},
async fetchComments() {
  try {
    const res = await this.$axios.get(`http://localhost:3000/comments/posts/${this.post._id}`);
    this.comments = res.data;
  } catch (err) {
    console.error("Lỗi khi lấy danh sách bình luận:", err);
  }
},


    replyTo(name) {
      this.newComment = `@${name} `;
    }
  },
  mounted() {
    this.loadComments();
  }
};
</script>

<style scoped>
.overlay {
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
.modal {
  background: white;
  padding: 20px;
  border-radius: 10px;
  width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}
.post-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.post-header img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}
.post-content {
  margin-bottom: 10px;
}
img,
video {
  width: 100%;
  max-height: 400px;
  object-fit: contain;
  border-radius: 8px;
  margin-bottom: 15px;
}
.comments {
  background: #f5f5f5;
  padding: 10px;
  border-radius: 6px;
  margin-bottom: 10px;
}
.comment {
  margin-bottom: 8px;
}
.comment small {
  color: #1877f2;
  cursor: pointer;
  font-size: 12px;
}
.comment-box {
  display: flex;
  gap: 10px;
}
input {
  flex: 1;
  padding: 8px;
  border-radius: 6px;
  border: 1px solid #ccc;
}
button {
  background: #1877f2;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
}
</style>
