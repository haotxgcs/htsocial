<template>
  <div class="edit-post-page">
    <h2>Chỉnh sửa bài viết</h2>
    <textarea 
      v-model="content" 
      placeholder="Nội dung mới..."
      rows="4"
    ></textarea>
    <input 
      type="file" 
      @change="handleFileUpload" 
      accept="image/*,video/*" 
    />
    <div class="button-group">
      <button @click="updatePost" :disabled="loading">
        {{ loading ? 'Đang cập nhật...' : 'Cập nhật' }}
      </button>
      <button @click="$router.go(-1)" class="cancel-btn">Hủy</button>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      content: '',
      file: null,
      postId: null,
      loading: false
    };
  },
  methods: {
    handleFileUpload(e) {
      this.file = e.target.files[0];
    },
    
    async fetchPost() {
      try {
        const res = await this.$axios.get(`/posts/${this.postId}`);
        this.content = res.data.content || '';
      } catch (err) {
        console.error("Lỗi tải bài viết:", err);
        alert("Không thể tải bài viết!");
      }
    },
    
    async updatePost() {
      if (!this.content.trim()) {
        alert("Vui lòng nhập nội dung!");
        return;
      }

      this.loading = true;
      const formData = new FormData();
      
      // FIX: Sử dụng key "content" thay vì "file"
      formData.append("content", this.content);
      
      // Chỉ append file nếu có file mới
      if (this.file) {
        formData.append("file", this.file);
      }

      try {
        const response = await this.$axios.put(`/posts/${this.postId}`, formData, {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        });
        
        console.log("Update response:", response.data);
        alert("Cập nhật thành công!");
        this.$router.push("/home");
        
      } catch (err) {
        console.error("Cập nhật lỗi:", err);
        if (err.response) {
          alert(`Lỗi: ${err.response.data.msg || 'Không thể cập nhật!'}`);
        } else {
          alert("Lỗi kết nối! Vui lòng thử lại.");
        }
      } finally {
        this.loading = false;
      }
    }
  },
  
  mounted() {
    this.postId = this.$route.params.id;
    if (this.postId) {
      this.fetchPost();
    } else {
      alert("Không tìm thấy ID bài viết!");
      this.$router.push("/home");
    }
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
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

h2 {
  margin-bottom: 20px;
  color: #333;
}

textarea {
  width: 100%;
  height: 120px;
  margin-bottom: 15px;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-family: inherit;
  resize: vertical;
}

input[type="file"] {
  margin-bottom: 20px;
  padding: 8px;
}

.button-group {
  display: flex;
  gap: 10px;
}

button {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

button:first-child {
  background: #1877f2;
  color: white;
}

button:first-child:hover {
  background: #166fe5;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.cancel-btn {
  background: #f0f2f5;
  color: #333;
}

.cancel-btn:hover {
  background: #e4e6ea;
}
</style>