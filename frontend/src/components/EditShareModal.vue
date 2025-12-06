<template>
  <div class="modal-backdrop" @click.self="close">
    <div class="modal-box">
      <div class="modal-header">
        <h3>Edit Shared Post</h3>
        <button class="close-btn" @click="close">&times;</button>
      </div>

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

        <div class="share-input-wrapper">
          <textarea
            ref="shareInput"
            v-model="editedContent"
            placeholder="Say something about the shared post..."
            class="share-textarea"
          ></textarea>

          <div class="emoji-trigger">
            <button @click.stop="toggleEmojiPicker($event)" class="emoji-btn">
              <img src="../assets/emoji.png" class="icon-emoji-img"/>
            </button>
            
            <div 
              v-if="showEmojiPicker" 
              class="emoji-popover-fixed" 
              :style="pickerStyle" 
              @click.stop
            >
              <EmojiPicker :native="true" @select="insertEmoji" theme="light" />
            </div>
          </div>
        </div>

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
          
          <div class="post-content">
            <p v-if="share.post.content && !share.post.recipeName">{{ share.post.content }}</p>
            
            <div v-if="share.post.recipeName" class="recipe-preview">
              <div class="recipe-header">📝 {{ share.post.recipeName }}</div>
              <div v-if="share.post.ingredients" class="recipe-item">
                <strong>📋 Ingredients:</strong><span>{{ share.post.ingredients }}</span>
              </div>
              <div v-if="share.post.instructions" class="recipe-item">
                <strong>👨‍🍳 Instructions:</strong><span>{{ share.post.instructions }}</span>
              </div>
            </div>
          </div>

          <div v-if="share.post.media" class="media-preview">
            <img v-if="share.post.mediaType === 'image'" :src="`http://localhost:3000/${share.post.media}`" />
            <video v-else controls :src="`http://localhost:3000/${share.post.media}`"></video>
          </div>
        </div>
      </div>

      <div class="modal-actions">
        <button class="btn cancel" @click="close">Cancel</button>
        <button class="btn save" @click="submit">Save</button>

        <LoadingOverlay v-if="isLoading" />
      </div>
    </div>

    <div class="notification-wrapper">
      <NotificationModal 
        :is-visible="notification.visible"
        :type="notification.type"
        :title="notification.title"
        :message="notification.message"
        @confirm="handleNotificationConfirm"
      />
    </div>

  </div>
</template>

<script>
import EmojiPicker from 'vue3-emoji-picker';
import 'vue3-emoji-picker/css';
import NotificationModal from './NotificationModal.vue'; // 1. Import Component
import LoadingOverlay from './LoadingOverlay.vue';

export default {
  name: "EditShareModal",
  components: {
    EmojiPicker,
    NotificationModal, // 2. Đăng ký Component
    LoadingOverlay
  },
  props: {
    share: Object,
  },
  data() {
    return {
      editedContent: this.share?.content || "",
      audience: this.share?.audience || "public",
      showEmojiPicker: false,
      pickerStyle: { position: 'fixed', top: '0', left: '0', zIndex: 11001 },
      
      // 3. Data cho thông báo
      notification: {
        visible: false,
        type: 'success',
        title: '',
        message: ''
      },
      isLoading: false
    };
  },
  watch: {
    share(newVal) {
      this.editedContent = newVal?.content || "";
      this.audience = newVal?.audience || "public";
      this.$nextTick(() => {
         if(this.$refs.shareInput) this.$refs.shareInput.focus();
      });
    }
  },
  mounted() {
    document.addEventListener('click', this.closeEmojiPickerOnClickOutside);
    window.addEventListener('scroll', this.handleScroll, true);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.closeEmojiPickerOnClickOutside);
    window.removeEventListener('scroll', this.handleScroll, true);
  },
  methods: {
    // --- HÀM XỬ LÝ THÔNG BÁO ---
    showNotify(type, title, message) {
      this.notification = { visible: true, type, title, message };
    },
    
    handleNotificationConfirm() {
      this.notification.visible = false;
      // Logic quan trọng: Nếu là thông báo thành công thì mới đóng modal Edit và reload list
      if (this.notification.type === 'success') {
        this.$emit("updated");
        this.close();
      }
    },
    // -----------------------------

    async submit() {
      // 1. Bắt đầu Loading
      this.isLoading = true;

      // 2. Tạo độ trễ giả lập (1.5 giây)
      await new Promise(resolve => setTimeout(resolve, 1500));

      try {
        // 3. Gọi API cập nhật
        await this.$axios.put(`/shares/${this.share._id}`, {
          content: this.editedContent,
          audience: this.audience,
        });
        
        // 4. Tắt Loading TRƯỚC KHI hiện thông báo
        this.isLoading = false;

        // 5. Hiện thông báo thành công
        this.showNotify("success", "Thành công", "Bài viết đã được cập nhật!");
        
      } catch (err) {
        console.error("Edit share failed", err);
        
        // Tắt loading nếu có lỗi
        this.isLoading = false;
        
        // Hiện thông báo lỗi
        this.showNotify("error", "Lỗi", "Không thể cập nhật bài viết. Vui lòng thử lại.");
      }
    },

    close() {
      if (this.isLoading) return; 
      this.$emit("close");
      this.showEmojiPicker = false;
    },

    // ... (Các hàm emoji, formatTime, getAvatarUrl giữ nguyên như cũ) ...
    toggleEmojiPicker(event) {
      this.showEmojiPicker = !this.showEmojiPicker;
      if (this.showEmojiPicker) { this.updatePickerPosition(event.currentTarget); }
    },
    updatePickerPosition(targetBtn) {
      if (!targetBtn) return;
      const rect = targetBtn.getBoundingClientRect();
      const pickerWidth = 320; const pickerHeight = 450; const windowHeight = window.innerHeight;
      let top = rect.bottom + 5; let left = rect.right - pickerWidth; 
      const spaceBelow = windowHeight - rect.bottom; const spaceAbove = rect.top;
      if (spaceBelow < pickerHeight && spaceAbove > spaceBelow) { top = rect.top - pickerHeight - 5; }
      if (top < 10) top = 10; 
      if (top + pickerHeight > windowHeight - 10) {
          top = windowHeight - pickerHeight - 10;
          if (top < 10) top = 10;
      }
      if (left < 10) left = 10;
      this.pickerStyle = { position: 'fixed', top: `${top}px`, left: `${left}px`, zIndex: 11001 };
    },
    handleScroll(event) {
      if (!this.showEmojiPicker) return;
      const pickerElement = this.$el.querySelector('.emoji-popover-fixed');
      if (pickerElement && (pickerElement === event.target || pickerElement.contains(event.target))) { return; }
      this.showEmojiPicker = false;
    },
    closeEmojiPickerOnClickOutside(event) {
      if (!event.target.closest('.emoji-trigger')) { this.showEmojiPicker = false; }
    },
    insertEmoji(emoji) {
      const inputRef = this.$refs.shareInput;
      if (!inputRef) return;
      const emojiChar = emoji.i;
      const start = inputRef.selectionStart;
      const end = inputRef.selectionEnd;
      this.editedContent = this.editedContent.substring(0, start) + emojiChar + this.editedContent.substring(end);
      this.$nextTick(() => {
        inputRef.focus();
        inputRef.setSelectionRange(start + emojiChar.length, start + emojiChar.length);
      });
    },
    formatTime(date) { return new Date(date).toLocaleString(); },
    getAvatarUrl(user) {
      return user?.avatar ? `http://localhost:3000/${user.avatar}` : require("@/assets/user.png");
    },
  },
};
</script>

<style scoped>
/* Giữ nguyên các style cũ của Modal */
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
  position:relative;
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

/* [SỬA 6] STYLE CHO WRAPPER VÀ EMOJI BUTTON (Thêm mới) */
.share-input-wrapper {
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
  position: relative; /* Để chứa nút emoji */
  background: white;
  transition: border-color 0.2s;
}

.share-input-wrapper:focus-within {
  border-color: #1877f2;
  box-shadow: 0 0 0 2px rgba(24, 119, 242, 0.1);
}

.share-textarea {
  width: 100%;
  min-height: 80px;
  max-height: 150px;
  resize: none; /* Tắt resize thủ công để đẹp hơn */
  border: none;
  outline: none;
  font-family: inherit;
  font-size: 15px;
  line-height: 1.4;
  background: transparent;
  box-sizing: border-box;
  padding-bottom: 30px; /* Chừa chỗ cho nút emoji */
}

.share-textarea::placeholder {
  color: #626569;
}

.emoji-trigger {
  position: absolute;
  bottom: 8px;
  right: 8px;
}

.emoji-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.emoji-btn:hover {
  background-color: #f0f2f5;
}

.icon-emoji-img {
  width: 22px;
  height: 22px;
  opacity: 0.6;
}
.emoji-btn:hover .icon-emoji-img {
  opacity: 1;
}
/* ---------------------------------------------------- */

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