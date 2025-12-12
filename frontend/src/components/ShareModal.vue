<template>
  <div class="modal-backdrop" @click.self="!isLoading && close()">
    
    <div class="modal-box">
      <div class="modal-header">
        <h3>Share Post</h3>
        <button class="close-btn" @click="close" :disabled="isLoading">&times;</button>
      </div>

      <div class="share-content">
        <div class="user-info">
          <img :src="getAvatarUrl(user)" class="avatar" />
          <div class="user-details">
            <strong>{{ user.firstname }} {{ user.lastname }}</strong>
            <div class="audience-inline">
              <select v-model="audience" id="audience" :disabled="isLoading">
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
            v-model="content"
            placeholder="Say something about this post..."
            class="share-textarea"
            :disabled="isLoading"
          ></textarea>
          
          <div class="emoji-trigger">
            <button @click.stop="toggleEmojiPicker($event)" class="emoji-btn" :disabled="isLoading">
              <img src="../assets/emoji.png" class="icon-emoji-img"/>
            </button>
            
            <div v-if="showEmojiPicker" class="emoji-popover-fixed" :style="pickerStyle" @click.stop>
              <EmojiPicker :native="true" @select="insertEmoji" theme="light" />
            </div>
          </div>
        </div>

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
            <h4 class="shared-title">{{ post.title }}</h4>
            <span class="shared-category">{{ post.category }}</span>

            <div class="shared-details">
              <p class="shared-section-label">Ingredients:</p>
              <p class="shared-text">{{ getTruncatedText(post.ingredients, 100) }}</p>
              
              <p class="shared-section-label">Instructions:</p>
              <p class="shared-text">{{ getTruncatedText(post.instructions, 100) }}</p>
            </div>
          </div>

          <div v-if="post.media" class="media-preview">
            <img v-if="post.mediaType === 'image'" :src="`http://localhost:3000/${post.media}`" />
            <video v-else controls :src="`http://localhost:3000/${post.media}`"></video>
          </div>
        </div>
      </div>

      <div class="modal-actions">
        <button class="btn cancel" @click="close" :disabled="isLoading">Cancel</button>
        <button class="btn share" @click="submit" :disabled="isLoading">
          <span v-if="isLoading">Sharing...</span>
          <span v-else>Share Now</span>
        </button>
      </div>

      <LoadingOverlay v-if="isLoading" />

    </div>

    <ConfirmDialog 
      v-if="confirmVisible" 
      :message="confirmMessage" 
      @confirm="handleConfirmDiscard" 
      @cancel="confirmVisible = false" 
    />

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
import NotificationModal from './NotificationModal.vue';
import LoadingOverlay from './LoadingOverlay.vue';
import ConfirmDialog from './ConfirmDialog.vue';

export default {
  name: "ShareModal",
  components: {
    EmojiPicker,
    NotificationModal,
    LoadingOverlay,
    ConfirmDialog
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
      pickerStyle: { position: 'fixed', top: '0', left: '0', zIndex: 11001 },

      confirmVisible: false,
      confirmMessage: "",

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
    // Helper cắt chữ cho bài gốc
    getTruncatedText(text, limit = 100) {
      if (!text) return '';
      if (text.length <= limit) return text;
      return text.substring(0, limit) + '...';
    },

    showNotify(type, title, message) {
      this.notification = { visible: true, type, title, message };
    },

    handleNotificationConfirm() {
      this.notification.visible = false;
      if (this.notification.type === 'success') {
        this.$emit("shared");
        this.resetAndClose();
      }
    },

    // --- SUBMIT FUNCTION ---
    async submit() {
      this.isLoading = true;
      // Delay giả lập
      await new Promise(resolve => setTimeout(resolve, 1000));

      try {
        // Dùng fetch để đồng bộ với các file khác
        const res = await fetch(`http://localhost:3000/shares/${this.post._id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: this.user.username,
            content: this.content,
            audience: this.audience,
          })
        });

        if (!res.ok) {
          throw new Error(`Error: ${res.statusText}`);
        }
        
        this.isLoading = false;
        this.showNotify("success", "Success", "Post shared successfully!");

      } catch (err) {
        console.error("Share failed", err);
        this.isLoading = false;
        this.showNotify("error", "Error", "Could not share post.");
      }
    },

    handleConfirmDiscard() {
      this.confirmVisible = false;
      this.resetAndClose();
    },
    resetAndClose() {
      this.$emit("close");
      this.content = "";
      this.showEmojiPicker = false;
    },
    close() {
      if (this.isLoading) return;
      if (this.content && this.content.trim().length > 0) {
        this.confirmMessage = "Discard your share?";
        this.confirmVisible = true;
      } else {
        this.resetAndClose();
      }
    },

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
      if (top + pickerHeight > windowHeight - 10) { top = windowHeight - pickerHeight - 10; if (top < 10) top = 10; }
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
      this.content = this.content.substring(0, start) + emojiChar + this.content.substring(end);
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
/* Style cho modal */
.modal-backdrop {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex; justify-content: center; align-items: center;
  z-index: 10000;
  animation: fadeIn 0.2s ease-out;
}

/* [QUAN TRỌNG] Override Z-index cho Notification Modal */
/* Để thông báo hiện đè lên Share Modal */
.notification-wrapper :deep(.modal-overlay) {
  z-index: 11002 !important;
}

/* Thêm position relative để LoadingOverlay phủ đúng */
.modal-box { position: relative; background: white; width: 100%; max-width: 550px; border-radius: 12px; max-height: 90vh; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3); }

.modal-header { display: flex; justify-content: center; align-items: center; padding: 20px 24px; position: relative; flex-shrink: 0; }
.modal-header h3 { margin: 0; font-size: 20px; font-weight: 700; color: #1c1e21; text-align: center; }
.close-btn { position: absolute; right: 16px; background: #f0f2f5; border: none; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 20px; color: #8a8d91; transition: background-color 0.2s; }
.close-btn:hover { background: #e4e6ea; }
.share-content { padding: 20px 24px; overflow-y: auto; flex: 1; scrollbar-width: none; -ms-overflow-style: none; }
.share-content::-webkit-scrollbar { display: none; }
.user-info { display: flex; align-items: center; margin-bottom: 16px; }
.avatar { width: 40px; height: 40px; border-radius: 50%; margin-right: 12px; object-fit: cover; }
.user-details { flex: 1; }
.user-details strong { font-size: 15px; font-weight: 600; color: #1c1e21; display: block; margin-bottom: 4px; }
.audience-inline select { padding: 4px 8px; border-radius: 6px; border: 1px solid #ccc; font-size: 13px; background: #f0f2f5; cursor: pointer; outline: none; }
.audience-inline select:focus { border-color: #FF642F; }
.share-input-wrapper { border: 1px solid #ccc; border-radius: 8px; padding: 12px; margin-bottom: 16px; position: relative; background: white; transition: border-color 0.2s; }
.share-input-wrapper:focus-within { border-color: #FF642F;  }
.share-textarea { width: 100%; min-height: 80px; max-height: 150px; resize: none; border: none; outline: none; font-family: inherit; font-size: 15px; line-height: 1.4; background: transparent; box-sizing: border-box; padding-bottom: 30px; }
.share-textarea::placeholder { color: #626569; }
.emoji-trigger { position: absolute; bottom: 8px; right: 8px; }
.emoji-btn { background: none; border: none; cursor: pointer; padding: 4px; border-radius: 50%; transition: background 0.2s; display: flex; align-items: center; justify-content: center; }
.emoji-btn:hover { background-color: #f0f2f5; }
.icon-emoji-img { width: 22px; height: 22px; opacity: 0.6; }
.emoji-btn:hover .icon-emoji-img { opacity: 1; }
.shared-box { border: 1px solid #e4e6eb; padding: 12px; border-radius: 8px; background: #f8f9fa; }
.post-header { display: flex; align-items: center; margin-bottom: 12px; }
.avatar-small { width: 36px; height: 36px; border-radius: 50%; margin-right: 10px; object-fit: cover; }
.author-details strong { font-size: 14px; font-weight: 600; color: #1c1e21; display: block; }
.timestamp { font-size: 12px; color: #65676b; margin: 2px 0 0 0; }
.post-content { font-size: 14px; line-height: 1.4; color: #1c1e21; word-wrap: break-word; white-space: pre-line; margin-bottom: 8px; }
.post-content p { margin: 0; }
.recipe-preview { background: white; border: 1px solid #e4e6eb; border-radius: 8px; padding: 12px; margin-top: 8px; }
.recipe-header { font-size: 14px; font-weight: 600; color: #FF642F; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #e4e6eb; }
.recipe-item { margin-bottom: 8px; font-size: 13px; line-height: 1.5; }
.recipe-item:last-child { margin-bottom: 0; }
.recipe-item strong { display: block; color: #1c1e21; margin-bottom: 4px; }
.recipe-item span { color: #65676b; white-space: pre-line; word-wrap: break-word; }
.media-preview { margin-top: 8px; }
.media-preview img, .media-preview video { width: 100%; max-height: 300px; object-fit: contain; border-radius: 8px; background: #000; }
.modal-actions { display: flex; justify-content: flex-end; gap: 8px; padding: 16px 24px; border-top: 1px solid #e4e6eb; flex-shrink: 0; }
.btn { padding: 10px 24px; border: none; border-radius: 6px; font-weight: 600; font-size: 13px; cursor: pointer; transition: all 0.2s ease; }
.btn.share { background-color: #FF642F; color: white; }
.btn.share:hover { background-color: #FF642F; }
.btn.cancel { background-color: #e4e6eb; color: #1c1e21; }
.btn.cancel:hover { background-color: #d8dadf; }

/* Nút bị disable khi loading */
.btn:disabled, select:disabled, textarea:disabled, button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* --- STYLE MỚI CHO BÀI SHARE (4 TRƯỜNG) --- */

/* 1. Tiêu đề bài gốc */
.shared-title {
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 5px 0;
  color: #333;
}

/* 2. Nhãn Danh mục (Tag) */
.shared-category {
  display: inline-block;
  font-size: 11px;
  background: #FFF0E6; /* Nền cam nhạt */
  color: #FF642F;       /* Chữ cam đậm */
  padding: 2px 8px;
  border-radius: 12px;
  margin-bottom: 12px;
  font-weight: 600;
}


/* 4. Tiêu đề nhỏ (Ingredients/Instructions) */
.shared-section-label {
  font-weight: 700;
  margin: 0 0 10px 0;
  font-size: 12px;
  color: #333;
}

/* 5. Nội dung text (Giữ xuống dòng) */
.shared-text {
  margin: 0 0 10px 0;
  white-space: pre-line; /* Quan trọng: Giữ xuống dòng */
  line-height: 1.4;
}

/* Loại bỏ margin cho dòng cuối cùng */
.shared-text:last-child {
  margin-bottom: 0;
}

@media (max-width: 768px) { .modal-box { max-width: 100%; margin: 0 10px; } .share-content { padding: 16px; } .modal-actions { padding: 12px 16px; } }
</style>