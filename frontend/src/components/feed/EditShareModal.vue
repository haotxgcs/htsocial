<template>
  <div class="modal-backdrop" @click.self="!isLoading && requestClose()">
    
    <div class="modal-box relative-box">
      <div class="modal-header">
        <h3>Edit Shared Post</h3>
        <button class="close-btn" @click="requestClose" :disabled="isLoading">&times;</button>
      </div>

      <div class="share-content">
        <div class="user-info">
          <img :src="getAvatarUrl(share?.username)" class="avatar" />
          <div class="user-details">
            <strong>{{ share?.username?.firstname }} {{ share?.username?.lastname }}</strong>
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
            v-model="editedContent"
            placeholder="Say something about the shared post..."
            class="share-textarea"
            :disabled="isLoading"
          ></textarea>

          <div class="emoji-trigger">
            <button @click.stop="toggleEmojiPicker($event)" class="emoji-btn" :disabled="isLoading">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" :fill="'#FFFF00'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-smile-icon lucide-smile"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/>
              </svg>
            </button>
            
            <div v-if="showEmojiPicker" class="emoji-popover-fixed" :style="pickerStyle" @click.stop>
              <EmojiPicker :native="true" @select="insertEmoji" theme="light" />
            </div>
          </div>
        </div>

        <div v-if="share?.post" class="shared-box">
          <div class="post-header origin-header">
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
          
          <div class="post-content-wrapper">
             <h4 class="shared-title">{{ share.post.title }}</h4>
             <span class="shared-category">{{ share.post.category }}</span>

              <div class="shared-details">
                <template v-if="!isOriginExpanded">
                  <p class="shared-label">Ingredients:</p>
                  <p class="shared-text">{{ getCollapsedContent(share.post).ingredients }}</p>
                  <template v-if="getCollapsedContent(share.post).showInstructions">
                    <p class="shared-label">Instructions:</p>
                    <p class="shared-text">{{ getCollapsedContent(share.post).instructions }}</p>
                  </template>
                </template>
                <template v-else>
                  <p class="shared-label">Ingredients:</p>
                  <p class="shared-text">{{ share.post.ingredients }}</p>
                  <p class="shared-label">Instructions:</p>
                  <p class="shared-text">{{ share.post.instructions }}</p>
                </template>

                <button
                  v-if="shouldShowReadMore(share.post)"
                  class="read-more-btn"
                  @click="toggleOriginContent"
                >
                  {{ isOriginExpanded ? 'Show less' : 'Show more' }}
                </button>
              </div>

             <div v-if="share.post.media" class="media-preview">
            <img v-if="share.post.mediaType === 'image'" :src="resolveMediaUrl(share.post.media)" class="share-media-img" />
            <video v-else controls :src="resolveMediaUrl(share.post.media)" class="share-media-vid"></video>
          </div>
          </div>

          
        </div>
        
        <div v-else class="restricted-post-warning">
           This post has been deleted.
        </div>

      </div>

      <div class="modal-actions">
        <button class="btn cancel" @click="close" :disabled="isLoading">Cancel</button>
        <button class="btn save" @click="submit" :disabled="isLoading">
          <span v-if="isLoading">Saving...</span>
          <span v-else>Save Changes</span>
        </button>
      </div>

      <LoadingOverlay v-if="isLoading" />
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
<ConfirmDialog
        v-if="confirmVisible"
        :message="confirmMessage"
        @confirm="handleConfirmDiscard"
        @cancel="confirmVisible = false"
      />


  </div>
</template>

<script>
import EmojiPicker from 'vue3-emoji-picker';
import 'vue3-emoji-picker/css';
import NotificationModal from '../notifications/NotificationModal.vue';
import ConfirmDialog from '../common/ConfirmDialog.vue';
import LoadingOverlay from '../layout/LoadingOverlay.vue';

export default {
  name: "EditShareModal",
  components: {
    EmojiPicker,
    NotificationModal,
    ConfirmDialog,
    LoadingOverlay
  },
  props: {
    share: Object, // Object chứa thông tin bài share và bài gốc (share.post)
  },
  data() {
    return {
      editedContent: this.share?.content || "",
      audience: this.share?.audience || "public",

      confirmVisible: false,
      confirmMessage: "",

      showEmojiPicker: false,
      pickerStyle: { position: 'fixed', top: '0', left: '0', zIndex: 11001 },
      
      notification: {
        visible: false,
        type: 'success',
        title: '',
        message: ''
      },
      isLoading: false,
      isOriginExpanded: false
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
    // Helper cắt chữ cho bài gốc trong modal (giới hạn 100 ký tự cho gọn)
    getCollapsedContent(post) {
      if (!post) return { ingredients: '', instructions: '', showInstructions: false };
      const MAX_LINES = 3, MAX_CHARS = 150;
      const ingLines = (post.ingredients || '').split('\n');
      let ingredients = post.ingredients || '';
      let truncated = false;
      if (ingLines.length > MAX_LINES) { ingredients = ingLines.slice(0, MAX_LINES).join('\n') + '...'; truncated = true; }
      else if (ingredients.length > MAX_CHARS) { ingredients = ingredients.substring(0, MAX_CHARS) + '...'; truncated = true; }
      const hasInstructions = !!(post.instructions?.trim());
      let instructions = post.instructions || '';
      if (hasInstructions && truncated) {
        const il = instructions.split('\n');
        instructions = il.slice(0, 2).join('\n');
        if (il.length > 2 || instructions.length > 100) instructions = instructions.substring(0, 100) + '...';
      }
      return { ingredients, instructions, showInstructions: hasInstructions };
    },

    getTruncatedText(text) {
      if (!text) return '';
      if (text.length > 100) return text.substring(0, 100) + '...';
      return text;
    },

    showNotify(type, title, message) {
      this.notification = { visible: true, type, title, message };
    },
    
    handleNotificationConfirm() {
      this.notification.visible = false;
      if (this.notification.type === 'success') {
        this.$emit("updated"); // Báo ra ngoài để reload list
        this.close(true);
      }
    },

    async submit() {
      this.isLoading = true;
      // Giả lập delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      try {
        // Gọi API cập nhật Share (chỉ update caption & audience)
        // Lưu ý: Dùng fetch cho đồng bộ
        const res = await fetch(`http://localhost:3000/shares/${this.share._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
             content: this.editedContent,
             audience: this.audience
          })
        });

        if (!res.ok) {
           throw new Error("Update failed");
        }
        
        this.isLoading = false;
        this.showNotify("success", "Success", "Shared post updated successfully!");
        
      } catch (err) {
        console.error(err);
        this.isLoading = false;
        this.showNotify("error", "Error", "Failed to update shared post.");
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
      this.editedContent = this.editedContent.substring(0, start) + emojiChar + this.editedContent.substring(end);
      this.$nextTick(() => {
        inputRef.focus();
        inputRef.setSelectionRange(start + emojiChar.length, start + emojiChar.length);
      });
    },
    formatTime(date) { return new Date(date).toLocaleString(); },
    getAvatarUrl(user) {
      if (!user?.avatar) return require("@/assets/user.png");
      if (user.avatar.startsWith('http')) return user.avatar;
      return `http://localhost:3000/${user.avatar}`;
    },

    resolveMediaUrl(media) {
      if (!media) return '';
      if (media.startsWith('http')) return media;
      return `http://localhost:3000/${media}`;
    },

    requestClose() {
    if (this.isLoading) return;
    this.confirmMessage = "Are you sure you want to discard your changes?";
    this.confirmVisible = true;
  },

  handleConfirmDiscard() {
    this.confirmVisible = false;
    this.close(true);
  },

  close(force = false) {
    if (!force) {
      this.requestClose();
      return;
    }
    this.showEmojiPicker = false;
    this.$emit("close");
  },

  shouldShowReadMore(post) {
    if (!post) return false;
    const text = (post.ingredients || '') + (post.instructions || '');
    const lines = text.split('\n');
    return lines.length > 5 || text.length > 200;
  },

  getDisplayedText(text) {
  if (!text) return '';
  if (this.isOriginExpanded) return text;

  const lines = text.split('\n');
  if (lines.length > 3) {
    return lines.slice(0, 3).join('\n') + '...';
  }
  return text.substring(0, 150) + '';
},

toggleOriginContent() {
  this.isOriginExpanded = !this.isOriginExpanded;
},


  },
};
</script>

<style scoped>
/* Modal Base */
.modal-backdrop {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background-color: rgba(0, 0, 0, 0.45);
  display: flex; justify-content: center; align-items: center;
  z-index: 10000;
  animation: fadeIn 0.2s ease-out;
}

.notification-wrapper :deep(.modal-overlay) { z-index: 11002 !important; }

.modal-box {
  position:relative; 
  background: var(--bg-card); 
  width: 100%; max-width: 550px;
  border-radius: 12px; max-height: 90vh; overflow: hidden;
  display: flex; flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

/* Header */
.modal-header {
  display: flex; justify-content: center; align-items: center;
  padding: 16px 24px; position: relative; flex-shrink: 0;
  
}
.modal-header h3 { 
  margin: 0; 
  font-size: 18px; 
  font-weight: 700; 
  color: var(--text-main); 
}
.close-btn { 
  position: absolute; 
  right: 16px; 
  background: var(--bg-input); 
  border: none; 
  border-radius: 50%; 
  width: 36px; 
  height: 36px; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  cursor: pointer; 
  font-size: 20px; 
  color: var(--text-sub); 
  transition: background-color 0.2s; 
}
.close-btn:hover { background: var(--hover-bg); }

/* Content */
.share-content { padding: 16px 24px; overflow-y: auto; flex: 1; }

.user-info { display: flex; align-items: center; margin-bottom: 16px; }
.avatar { width: 40px; height: 40px; border-radius: 50%; margin-right: 12px; object-fit: cover; border: 1px solid #eee; }
.user-details { flex: 1; }
.user-details strong { font-size: 15px; font-weight: 600; color: var(--text-main); display: block; margin-bottom: 4px; }
.audience-inline select { 
  padding: 4px 8px; 
  border-radius: 6px; 
  border: 1px solid var(--border-color); 
  font-size: 13px; 
   background: var(--bg-input); color: var(--text-sub); cursor: pointer; outline: none; }
.audience-inline select:focus { border-color: #FF642F; }

/* Input Wrapper */
.share-input-wrapper {
 border: 1px solid var(--border-color);  border-radius: 8px; padding: 12px;
  margin-bottom: 16px; position: relative; background: var(--bg-input);
  transition: border-color 0.2s;
}
.share-input-wrapper:focus-within { border-color: #FF642F; box-shadow: 0 0 0 2px rgba(255, 100, 47, 0.1); }
.share-textarea { 
  color: var(--text-main);
  width: 100%; 
  min-height: 80px; 
  resize: none; 
  border: none; 
  outline: none; 
  font-family: inherit; 
  font-size: 15px; 
  line-height: 1.4; background: transparent; padding-bottom: 30px; 
}
.emoji-trigger { position: absolute; bottom: 8px; right: 8px; }
.emoji-btn { background: none; border: none; cursor: pointer; padding: 4px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.emoji-btn:hover { background-color: #f0f2f5; }
.icon-emoji-img { width: 22px; height: 22px; opacity: 0.6; }

/* ⭐ SHARED BOX (Bài gốc) ⭐ */
.shared-box {
   border: 1px solid var(--border-color); border-radius: 12px;
  overflow: hidden; background: var(--bg-card);
}
.origin-header {
  padding: 10px 12px; background-color: var(--bg-card);
  display: flex; align-items: center;
}
.avatar-small { width: 36px; height: 36px; border-radius: 50%; margin-right: 10px; object-fit: cover; border: 1px solid #ccc; }
.author-details strong { font-size: 14px; font-weight: 600; color: var(--text-main); display: block; }
.timestamp { font-size: 12px; color: #777; margin: 0; }

.post-content-wrapper { padding: 4px 16px 12px 16px; }
.shared-title { font-size: 16px; font-weight: 700; color: var(--text-main); margin: 0 0 5px 0; }
.shared-category { 
  display: inline-block;
  font-size: 11px;
 background: var(--hover-primary);
  color: var(--primary);       /* Chữ cam đậm */
  padding: 2px 8px;
  border-radius: 12px;
  
  font-weight: 600; 
}
.shared-details { font-size: 13px; color: #555; background: var(--bg-card); padding: 8px; border-radius: 6px;  }
.shared-label { font-weight: 700;
  margin: 0 0 5px 0;
  font-size: 13px;
  color: var(--text-main);  }
.shared-text { font-size: 15px; line-height: 1.5; color: var(--text-main); margin: 0; white-space: pre-line; }

.share-media-img { width: 100%; max-height: 300px; object-fit: cover; border-radius: 10px; display: block; }
.share-media-vid { width: 100%; max-height: 300px; border-radius: 10px; display: block; background: #000; }
.restricted-post-warning { border: 1px solid var(--border-color); border-radius: 8px; padding: 20px; text-align: center; color: #c00; font-style: italic;  }

/* Footer Actions */
.modal-actions {
  display: flex; justify-content: flex-end; gap: 10px;
  padding: 16px 24px; border-top: 1px solid var(--border-color); flex-shrink: 0;
}
.btn { padding: 10px 20px; border: none; border-radius: 8px; font-weight: 600; font-size: 14px; cursor: pointer; transition: 0.2s; }
.btn.save { background-color: #FF642F; color: white; }
.btn.save:hover { background-color: #e04f1d; }
.btn.cancel { background-color: #f0f2f5; color: #333; }
.btn.cancel:hover { background-color: #e4e6eb; }
.btn:disabled { opacity: 0.6; cursor: not-allowed; }

.read-more-btn {
  background: none;
  border: none;
  color: #FF642F;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  padding: 4px 0;
  margin-top: 6px;
}

.read-more-btn:hover {
  text-decoration: underline;
}


@media (max-width: 768px) { .modal-box { max-width: 100%; margin: 10px; } .share-content { padding: 16px; } }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
</style>