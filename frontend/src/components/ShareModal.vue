<template>
  <div class="modal-backdrop" @click.self="close">
    <div class="modal-box">
      <!-- Header -->
      <div class="modal-header">
        <h3>Share Post</h3>
        <button class="close-btn" @click="close">&times;</button>
      </div>

      <!-- Thông tin người chia sẻ -->
      <div class="share-content">
        <div class="user-info">
          <img :src="getAvatarUrl(user)" class="avatar" />
          <div class="user-details">
            <strong>{{ user.firstname }} {{ user.lastname }}</strong>
            <div class="audience-inline">
              <select v-model="audience" id="audience">
                <option value="public">🌍 Public</option>
                <option value="friends">👥 Friends</option>
                <option value="private">🔒 Private</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Nội dung chia sẻ -->
        <div class="share-input-wrapper">
          <textarea
            ref="shareInput"
            v-model="content"
            placeholder="Say something about this post..."
            class="share-textarea"
          ></textarea>
          
          <!-- Nút Emoji -->
          <div class="emoji-trigger">
            <!-- QUAN TRỌNG: Truyền $event để lấy toạ độ -->
            <button @click.stop="toggleEmojiPicker($event)" class="emoji-btn">
              <img src="../assets/emoji.png" class="icon-emoji-img"/>
            </button>
            
            <!-- Bảng Emoji (Dùng style động để fix vị trí) -->
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

        <!-- Preview bài viết gốc -->
        <div class="shared-box">
          <div class="post-header">
            <img :src="getAvatarUrl(post.author)" class="avatar-small" />
            <div class="author-details">
              <strong>{{ post.author.firstname }} {{ post.author.lastname }}</strong>
              <p class="timestamp">
                {{ formatTime(post.createdAt) }}
                <span v-if="post.audience === 'public'">🌍</span>
                <span v-else-if="post.audience === 'friends'">👥</span>
                <span v-else-if="post.audience === 'private'">🔒</span>
              </p>
            </div>
          </div>
          
          <div class="post-content">
            <p v-if="post.content && !post.recipeName">{{ post.content }}</p>
            
            <div v-if="post.recipeName" class="recipe-preview">
              <div class="recipe-header">🔍 {{ post.recipeName }}</div>
              <div v-if="post.ingredients" class="recipe-item">
                <strong>📋 Ingredients:</strong>
                <span>{{ post.ingredients }}</span>
              </div>
              <div v-if="post.instructions" class="recipe-item">
                <strong>👨‍🍳 Instructions:</strong>
                <span>{{ post.instructions }}</span>
              </div>
            </div>
          </div>

          <div v-if="post.media" class="media-preview">
            <img v-if="post.mediaType === 'image'" :src="`http://localhost:3000/${post.media}`" />
            <video v-else controls :src="`http://localhost:3000/${post.media}`"></video>
          </div>
        </div>
      </div>

      <!-- Hành động -->
      <div class="modal-actions">
        <button class="btn cancel" @click="close">Cancel</button>
        <button class="btn share" @click="submit">Share</button>
      </div>
    </div>
  </div>
</template>

<script>
import EmojiPicker from 'vue3-emoji-picker';
import 'vue3-emoji-picker/css';

export default {
  name: "ShareModal",
  components: {
    EmojiPicker
  },
  props: {
    post: Object,
    user: Object,
  },
  data() {
    return {
      content: "",
      audience: "public",
      showEmojiPicker: false,
      // Style vị trí động
      pickerStyle: {
        position: 'fixed',
        top: '0',
        left: '0',
        zIndex: 11001
      }
    };
  },
  watch: {
    post() {
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
    toggleEmojiPicker(event) {
      this.showEmojiPicker = !this.showEmojiPicker;
      if (this.showEmojiPicker) {
        this.updatePickerPosition(event.currentTarget);
      }
    },

    // --- LOGIC TÍNH TOÁN VỊ TRÍ THÔNG MINH (ĐÃ SỬA) ---
    updatePickerPosition(targetBtn) {
      if (!targetBtn) return;
      
      const rect = targetBtn.getBoundingClientRect();
      const pickerWidth = 320; 
      const pickerHeight = 450; 
      const windowHeight = window.innerHeight;

      // 1. Mặc định: Hiện bên DƯỚI nút
      let top = rect.bottom + 5;
      let left = rect.right - pickerWidth; 

      // 2. Kiểm tra không gian
      const spaceBelow = windowHeight - rect.bottom;
      const spaceAbove = rect.top;

      // Nếu bên dưới không đủ chỗ VÀ bên trên nhiều chỗ hơn -> Đảo lên trên
      if (spaceBelow < pickerHeight && spaceAbove > spaceBelow) {
         top = rect.top - pickerHeight - 5;
      }

      // 3. KẸP VỊ TRÍ (CLAMP) ĐỂ KHÔNG BỊ TRÀN MÀN HÌNH
      // Không cho tràn lên trên (Top < 10px)
      if (top < 10) {
        top = 10; 
      }
      
      // Không cho tràn xuống dưới
      if (top + pickerHeight > windowHeight - 10) {
          top = windowHeight - pickerHeight - 10;
          // Ưu tiên mép trên nếu màn hình quá nhỏ
          if (top < 10) top = 10;
      }

      // Không cho tràn sang trái
      if (left < 10) left = 10;

      this.pickerStyle = {
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        zIndex: 11001
      };
    },

    handleScroll(event) {
      // 1. Nếu bảng emoji không mở thì không làm gì cả
      if (!this.showEmojiPicker) return;

      // 2. Tìm phần tử bảng emoji trong DOM
      // (Bạn cần chắc chắn class .emoji-popover-fixed bao quanh EmojiPicker)
      const pickerElement = this.$el.querySelector('.emoji-popover-fixed');

      // 3. Kiểm tra: 
      // Nếu sự kiện scroll xuất phát từ bên trong bảng emoji (event.target nằm trong pickerElement)
      // Hoặc event.target CHÍNH LÀ pickerElement
      // => THÌ KHÔNG ĐÓNG (Return)
      if (pickerElement && (pickerElement === event.target || pickerElement.contains(event.target))) {
        return;
      }

      // 4. Nếu scroll ở nơi khác (ví dụ cuộn background) thì mới đóng để tránh bị lệch vị trí
      this.showEmojiPicker = false;
    },

    closeEmojiPickerOnClickOutside(event) {
      if (!event.target.closest('.emoji-trigger')) {
        this.showEmojiPicker = false;
      }
    },

    insertEmoji(emoji) {
      const inputRef = this.$refs.shareInput;
      if (!inputRef) return;

      const emojiChar = emoji.i;
      const start = inputRef.selectionStart;
      const end = inputRef.selectionEnd;
      
      this.content = this.content.substring(0, start) + emojiChar + this.content.substring(end);

      this.$nextTick(() => {
        inputRef.focus();
        inputRef.setSelectionRange(start + emojiChar.length, start + emojiChar.length);
      });
    },

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
      this.content = "";
      this.showEmojiPicker = false;
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

/* --- SHARE INPUT WITH EMOJI STYLE --- */
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

/* Popover Emoji */
.emoji-popover {
  position: absolute;
  bottom: 40px; /* Hiện lên trên nút */
  right: 0;
  z-index: 100;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
  border-radius: 8px;
  background: white;
}
/* ------------------------------------ */

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

.btn.share {
  background-color: #1877f2;
  color: white;
}

.btn.share:hover {
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