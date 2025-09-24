<template>
  <div class="modal-backdrop" @click.self="close">
    <div class="modal-box">
      <h3>Share Post</h3>

      <!-- Thông tin người chia sẻ -->
      <div class="user-info">
        <img :src="getAvatarUrl(user)" class="avatar" />
        <div>
          <strong>{{ user.firstname }} {{ user.lastname }}</strong>
          <p class="timestamp">{{ formatTime(new Date()) }}</p>
        </div>
      </div>

      <!-- Chọn audience -->
      <div class="audience-select">
        <label for="audience">Audience:</label>
        <select v-model="audience" id="audience">
          <option value="public">🌐 Public</option>
          <option value="friends">👥 Friends</option>
          <option value="private">🔒 Private</option>
        </select>
      </div>

      <!-- Nội dung chia sẻ -->
      <textarea
        v-model="content"
        placeholder="Say something about this post..."
      ></textarea>

      <!-- Preview bài viết gốc -->
      <div class="shared-box">
        <div class="post-header">
          <img :src="getAvatarUrl(post.author)" class="avatar-small" />
          <div class="author-details">
            <strong>{{ post.author.firstname }} {{ post.author.lastname }}</strong>
            <p>{{ formatTime(post.createdAt) }}</p>
          </div>
        </div>
        <p>{{ post.content }}</p>
        <div v-if="post.media" class="media-preview">
          <img v-if="post.mediaType === 'image'" :src="`http://localhost:3000/${post.media}`" />
          <video v-else controls :src="`http://localhost:3000/${post.media}`"></video>
        </div>
      </div>

      <!-- Hành động -->
      <div class="modal-actions">
        <button class="btn share" @click="submit">Share</button>
        <button class="btn cancel" @click="close">Cancel</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    post: Object,
    user: Object,
  },
  data() {
    return {
      content: "",
      audience: "public",
    };
  },
  methods: {
    async submit() {
      try {
        await this.$axios.post(`/shares/${this.post._id}`, {
          username: this.user.username,
          content: this.content,
          audience: this.audience,
        });
        this.$emit("shared");
        this.close();
      } catch (err) {
        console.error("Share post failed", err?.response?.data || err.message);
        alert("Failed to share post.");
      }
    },
    close() {
      this.$emit("close");
    },
    formatTime(date) {
      return new Date(date).toLocaleString();
    },
    getAvatarUrl(user) {
      return user?.avatar
        ? `http://localhost:3000/${user.avatar}`
        : require("@/assets/user.png");
    },
  },
};
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 99999;
}
.modal-box {
  background: white;
  padding: 20px;
  width: 100%;
  max-width: 500px;            
  border-radius: 12px;
  max-height: 90vh;
  overflow-y: auto;
  overflow-x: hidden;           
  box-sizing: border-box;      

  /* hide scrollbar  */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE, Edge */

}
 .modal-box::-webkit-scrollbar {
  display: none; /* Chrome, Safari */
}
.user-info {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}
.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 12px;
}
.audience-select {
  margin-bottom: 12px;
}
.audience-select label {
  font-weight: bold;
  margin-right: 8px;
}
.audience-select select {
  padding: 6px;
  border-radius: 6px;
  border: 1px solid #ccc;
}
textarea {
  width: 100%;
  min-height: 80px;
  resize: vertical;             /* ✅ Cho resize chiều dọc */
  padding: 10px;
  border: 1.5px solid #ccc;
  border-radius: 8px;
  margin-bottom: 15px;
  box-sizing: border-box;       /* ✅ Không để vượt khung */
  overflow-x: hidden;           /* ✅ Ngăn kéo ngang */
}
.shared-box {
  border: 1px solid #ddd;
  padding: 10px;
  border-radius: 8px;
  background: #f9f9f9;
}
.post-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}
.avatar-small {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  margin-right: 10px;
}
.media-preview img,
.media-preview video {
  max-width: 100%;
  border-radius: 6px;
  margin-top: 8px;
  aspect-ratio: 1 / 1; /* Luôn giữ hình vuông */
  object-fit: cover;   /* Cắt để lấp đầy khung */
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 15px;
}
.btn {
  padding: 6px 14px;
  border: none;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
}
.btn.share {
  background-color: #0d6efd;
  color: white;
  margin-right: 8px;
}
.btn.cancel {
  background-color: #e0e0e0;
}


</style>
