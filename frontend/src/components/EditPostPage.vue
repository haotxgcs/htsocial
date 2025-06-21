<template>
  <div class="edit-post-page">
    <h2>Chỉnh sửa bài viết</h2>
    <textarea v-model="content" placeholder="Nội dung mới..."></textarea>
    <input type="file" @change="handleFileUpload" accept="image/*,video/*" />
    <button @click="updatePost">Cập nhật</button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      content: '',
      file: null,
      postId: null
    };
  },
  methods: {
    handleFileUpload(e) {
      this.file = e.target.files[0];
    },
    async fetchPost() {
      try {
        const res = await this.$axios.get(`/posts/${this.postId}`);
        this.content = res.data.content;
      } catch (err) {
        console.error("Lỗi tải bài viết:", err);
      }
    },
    async updatePost() {
      const formData = new FormData();
      formData.append("content", this.content);
      if (this.file) formData.append("image", this.file);

      try {
        await this.$axios.put(`/posts/${this.postId}`, formData, {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        });
        alert("Cập nhật thành công!");
        this.$router.push("/home");
      } catch (err) {
        console.error("Cập nhật lỗi:", err);
        alert("Không thể cập nhật bài viết!");
      }
    }
  },
  mounted() {
    this.postId = this.$route.params.id;
    this.fetchPost();
  }
};
</script>

<style scoped>
.edit-post-page {
  max-width: 600px;
  margin: 40px auto;
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}

.edit-post-page h2 {
  font-size: 24px;
  margin-bottom: 20px;
  color: #1c1e21;
}

textarea {
  width: 100%;
  height: 120px;
  padding: 12px;
  border: 1px solid #ccd0d5;
  border-radius: 8px;
  resize: vertical;
  font-size: 15px;
  background: #f0f2f5;
  margin-bottom: 16px;
}

input[type="file"] {
  display: block;
  margin-bottom: 16px;
  font-size: 14px;
}

button {
  background-color: #1877f2;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

button:hover {
  background-color: #166fe5;
}
</style>
