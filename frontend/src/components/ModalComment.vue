<!-- src/components/ModalComment.vue -->
<template>
  <div class="overlay" @click.self="close">
    <div class="modal">
      <h3>Bình luận bài viết</h3>
      <p class="post-content">{{ post?.content }}</p>

      <!-- Danh sách bình luận (giả lập hoặc lấy từ API) -->
      <div class="comment-list">
        <p v-for="(c, index) in comments" :key="index"><strong>{{ c.user }}:</strong> {{ c.text }}</p>
      </div>

      <!-- Nhập bình luận -->
      <input v-model="newComment" placeholder="Viết bình luận..." />
      <button @click="submitComment">Gửi</button>
    </div>
  </div>
</template>

<script>
export default {
  props: ['post'],
  data() {
    return {
      newComment: '',
      comments: [
      ]
    };
  },
  methods: {
    close() {
      this.$emit('close');
    },
    submitComment() {
      if (this.newComment.trim()) {
        this.comments.push({ user: 'Bạn', text: this.newComment });
        this.newComment = '';
      }
    }
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
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.modal {
  background: white;
  padding: 20px;
  border-radius: 12px;
  width: 400px;
  max-height: 80vh;
  overflow-y: auto;
}

input {
  width: 100%;
  padding: 8px;
  margin-top: 10px;
  border-radius: 6px;
  border: 1px solid #ccc;
}

button {
  margin-top: 10px;
  background: #1877f2;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
}
</style>
