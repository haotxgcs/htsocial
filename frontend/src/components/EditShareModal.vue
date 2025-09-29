<template>
  <div class="modal-backdrop" @click.self="close">
    <div class="modal-box">
      <!-- Header -->
      <div class="modal-header">
        <h3>Edit Shared Post</h3>
        <button class="close-btn" @click="close">&times;</button>
      </div>

      <!-- Content -->
      <div class="share-content">
        <div class="user-info">
          <img :src="getAvatarUrl(share?.username)" class="avatar" />
          <div class="user-details">
            <strong>{{ share?.username?.firstname }} {{ share?.username?.lastname }}</strong>
            <div class="audience-inline">
              <select v-model="audience" id="audience">
                <option value="public">🌍 Public</option>
                <option value="friends">👥 Friends</option>
                <option value="private">🔒 Private</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Nội dung -->
        <textarea
          v-model="editedContent"
          placeholder="Say something about the shared post..."
          class="share-textarea"
        ></textarea>

        <!-- Preview bài viết gốc (nếu cần) -->
        <div v-if="share?.post" class="shared-box">
          <div class="post-header">
            <img :src="getAvatarUrl(share.post.author)" class="avatar-small" />
            <div class="author-details">
              <strong>{{ share.post.author.firstname }} {{ share.post.author.lastname }}</strong>
              <p class="timestamp">
                {{ formatTime(share.post.createdAt) }}
                <span v-if="share.post.audience === 'public'">🌍</span>
                <span v-else-if="share.post.audience === 'friends'">👥</span>
                <span v-else-if="share.post.audience === 'private'">🔒</span>
              </p>
            </div>
          </div>
          
          <!-- Content with recipe support -->
          <div class="post-content">
            <p v-if="share.post.content && !share.post.recipeName">{{ share.post.content }}</p>
            
            <div v-if="share.post.recipeName" class="recipe-preview">
              <div class="recipe-header">📝 {{ share.post.recipeName }}</div>
              <div v-if="share.post.ingredients" class="recipe-item">
                <strong>📋 Ingredients:</strong>
                <span>{{ share.post.ingredients }}</span>
              </div>
              <div v-if="share.post.instructions" class="recipe-item">
                <strong>👨‍🍳 Instructions:</strong>
                <span>{{ share.post.instructions }}</span>
              </div>
            </div>
          </div>

          <div v-if="share.post.media" class="media-preview">
            <img v-if="share.post.mediaType === 'image'" :src="`http://localhost:3000/${share.post.media}`" />
            <video v-else controls :src="`http://localhost:3000/${share.post.media}`"></video>
          </div>
        </div>
      </div>

      <!-- Hành động -->
      <div class="modal-actions">
        <button class="btn cancel" @click="close">Cancel</button>
        <button class="btn save" @click="submit">Save</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    share: Object,
  },
  data() {
    return {
      editedContent: this.share?.content || "",
      audience: this.share?.audience || "public",
    };
  },
  watch: {
    share(newVal) {
      this.editedContent = newVal?.content || "";
      this.audience = newVal?.audience || "public";
    }
  },
  methods: {
    async submit() {
      try {
        await this.$axios.put(`/shares/${this.share._id}`, {
          content: this.editedContent,
          audience: this.audience,
        });
        this.$emit("updated");
        this.close();
      } catch (err) {
        console.error("Edit share failed", err);
        alert("Failed to update shared post.");
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
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
  animation: fadeIn 0.2s ease-out;
}

.modal-box {
  background: white;
  width: 100%;
  max-width: 550px;
  border-radius: 12px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

/* Header */
.modal-header {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px 24px;
  position: relative;
  flex-shrink: 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #1c1e21;
  text-align: center;
}

.close-btn {
  position: absolute;
  right: 16px;
  background: #f0f2f5;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 20px;
  color: #8a8d91;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background: #e4e6ea;
}

/* Content */
.share-content {
  padding: 20px 24px;
  overflow-y: auto;
  flex: 1;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.share-content::-webkit-scrollbar {
  display: none;
}

.user-info {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 12px;
  object-fit: cover;
}

.user-details {
  flex: 1;
}

.user-details strong {
  font-size: 15px;
  font-weight: 600;
  color: #1c1e21;
  display: block;
  margin-bottom: 4px;
}

.audience-inline select {
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid #ccc;
  font-size: 13px;
  background: #f0f2f5;
  cursor: pointer;
  outline: none;
}

.audience-inline select:focus {
  border-color: #1877f2;
}

/* Textarea */
.share-textarea {
  width: 100%;
  min-height: 100px;
  max-height: 200px;
  resize: vertical;
  padding: 12px;
  border: 1px solid #ccc;
  border-radius: 8px;
  margin-bottom: 16px;
  box-sizing: border-box;
  font-family: inherit;
  font-size: 15px;
  line-height: 1.4;
  background: transparent;
  overflow-y: auto;
  outline: none;
}

.share-textarea::placeholder {
  color: #626569;
}

/* Shared box */
.shared-box {
  border: 1px solid #e4e6eb;
  padding: 12px;
  border-radius: 8px;
  background: #f8f9fa;
}

.post-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.avatar-small {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  margin-right: 10px;
  object-fit: cover;
}

.author-details strong {
  font-size: 14px;
  font-weight: 600;
  color: #1c1e21;
  display: block;
}

.timestamp {
  font-size: 12px;
  color: #65676b;
  margin: 2px 0 0 0;
}

/* Post content */
.post-content {
  font-size: 14px;
  line-height: 1.4;
  color: #1c1e21;
  word-wrap: break-word;
  white-space: pre-line;
  margin-bottom: 8px;
}

.post-content p {
  margin: 0;
}

/* Recipe preview */
.recipe-preview {
  background: white;
  border: 1px solid #e4e6eb;
  border-radius: 8px;
  padding: 12px;
  margin-top: 8px;
}

.recipe-header {
  font-size: 14px;
  font-weight: 600;
  color: #1877f2;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e4e6eb;
}

.recipe-item {
  margin-bottom: 8px;
  font-size: 13px;
  line-height: 1.5;
}

.recipe-item:last-child {
  margin-bottom: 0;
}

.recipe-item strong {
  display: block;
  color: #1c1e21;
  margin-bottom: 4px;
}

.recipe-item span {
  color: #65676b;
  white-space: pre-line;
  word-wrap: break-word;
}

/* Media preview */
.media-preview {
  margin-top: 8px;
}

.media-preview img,
.media-preview video {
  width: 100%;
  max-height: 300px;
  object-fit: contain;
  border-radius: 8px;
  background: #000;
}

/* Actions */
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 24px;
  border-top: 1px solid #e4e6eb;
  flex-shrink: 0;
}

.btn {
  padding: 10px 24px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn.save {
  background-color: #1877f2;
  color: white;
}

.btn.save:hover {
  background-color: #166fe5;
}

.btn.cancel {
  background-color: #e4e6eb;
  color: #1c1e21;
}

.btn.cancel:hover {
  background-color: #d8dadf;
}

/* Responsive */
@media (max-width: 768px) {
  .modal-box {
    max-width: 100%;
    margin: 0 10px;
  }
  
  .share-content {
    padding: 16px;
  }
  
  .modal-actions {
    padding: 12px 16px;
  }
}
</style>