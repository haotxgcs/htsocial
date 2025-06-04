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
      formData.append("file", this.content);
      if (this.file) formData.append("file", this.file); 

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
  background: #fff;
  padding: 20px;
  border-radius: 12px;
}
textarea {
  width: 100%;
  height: 100px;
  margin-bottom: 12px;
}
</style>
