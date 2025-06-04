<template>
  <div class="create-post-page">
    <h2>Tạo bài viết mới</h2>
    <textarea v-model="content" placeholder="Bạn đang nghĩ gì thế?"></textarea>
    <input type="file" @change="handleImageUpload" accept="image/*,video/*" />
    <button @click="submitPost">Đăng bài</button>
  </div>
</template>


<script>
export default {
  data() {
    return {
      content: "",
      image: null
    };
  },
  methods: {
    handleImageUpload(e) {
      this.image = e.target.files[0];
    },
    async submitPost() {
      const savedUser = JSON.parse(localStorage.getItem("user"));
      if (!savedUser) return alert("Bạn chưa đăng nhập");

      const formData = new FormData();
      formData.append("content", this.content);
      formData.append("author", savedUser.username);
      if (this.image) {
        formData.append("image", this.image); // key phải là 'image'
      }

      try {
        await this.$axios.post("/posts", formData, {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        });
        alert("Đăng bài thành công!");
        this.$router.push("/home");
      } catch (err) {
        console.error("Lỗi khi đăng bài:", err);
        alert("Lỗi khi đăng bài!");
      }
    }
  }
};
</script>


<style scoped>
.create-post-page {
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
