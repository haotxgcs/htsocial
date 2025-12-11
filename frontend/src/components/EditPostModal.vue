<template>
  <div v-if="isVisible" class="edit-post-modal-overlay" @click.self="!isLoading && requestClose()">
    
    <div class="edit-post-modal-content relative-box">
      
      <div class="edit-post-modal-header">
        <h3>Edit Post</h3>
        <button class="close-btn" @click="requestClose" :disabled="isLoading">&times;</button>
      </div>

      <div class="post-creator-info">
        <img :src="getAvatarUrl(user)" alt="avatar" class="creator-avatar" />
        <div class="creator-details">
          <strong>{{ user?.firstname }} {{ user?.lastname }}</strong>
          <div class="privacy-selector">
            <select v-model="editPrivacy" :disabled="isLoading">
              <option value="public">🌐 Public</option>
              <option value="friends">👥 Friends</option>
              <option value="private">🔒 Private</option>
            </select>
          </div>
        </div>
      </div>

      <div class="post-content-area">
        
        <div class="recipe-field">
          <label class="field-label">Recipe Name</label>
          <input 
            v-model="title" 
            placeholder="Example: Beef Stew, Chicken Curry..."
            class="recipe-input"
            ref="titleInput"
            @focus="handleFocus('titleInput', 'title')"
            :disabled="isLoading"
          />
        </div>

        <div class="recipe-field">
          <label class="field-label">Category</label>
          <select v-model="selectedCategory" class="category-select" :disabled="isLoading">
            <option value="">Select a category</option>
            <option value="Appetizer">Appetizer</option>
            <option value="Main Course">Main Course</option>
            <option value="Side Dish">Side Dish</option>
            <option value="Soup">Soup</option>
            <option value="Salad">Salad</option>
            <option value="Dessert">Dessert</option>
            <option value="Beverage">Beverage</option>
            <option value="Snack">Snack</option>
            <option value="Breakfast">Breakfast</option>
            <option value="Lunch">Lunch</option>
            <option value="Dinner">Dinner</option>
            <option value="Vegetarian">Vegetarian</option>
            <option value="Vegan">Vegan</option>
            <option value="Seafood">Seafood</option>
            <option value="Pasta">Pasta</option>
            <option value="Rice Dish">Rice Dish</option>
            <option value="Noodles">Noodles</option>
            <option value="Bakery">Bakery</option>
            <option value="Grilled">Grilled</option>
            <option value="Fried">Fried</option>
            <option value="Steamed">Steamed</option>
            <option value="Stir-fry">Stir-fry</option>
            <option value="Slow-cooked">Slow-cooked</option>
            <option value="Quick Meal">Quick Meal</option>
            <option value="Traditional">Traditional</option>
            <option value="Fusion">Fusion</option>
            <option value="Healthy">Healthy</option>
            <option value="Comfort Food">Comfort Food</option>
            <option value="Kid-friendly">Kid-friendly</option>
            <option value="Party Food">Party Food</option>
          </select>
        </div>

        <div class="recipe-field">
          <label class="field-label">Ingredients</label>
          <textarea 
            v-model="ingredients" 
            placeholder="- 500g beef&#10;- 2 onions..."
            class="recipe-textarea ingredients-textarea"
            ref="ingredientsTextarea"
            @input="adjustTextareaHeight($refs.ingredientsTextarea)"
            @focus="handleFocus('ingredientsTextarea', 'ingredients')"
            :disabled="isLoading"
          ></textarea>
        </div>

        <div class="recipe-field">
          <label class="field-label">Instructions</label>
          <textarea 
            v-model="instructions" 
            placeholder="Step 1: Prepare ingredients..."
            class="recipe-textarea instructions-textarea"
            ref="instructionsTextarea"
            @input="adjustTextareaHeight($refs.instructionsTextarea)"
            @focus="handleFocus('instructionsTextarea', 'instructions')"
            :disabled="isLoading"
          ></textarea>
        </div>
        
        <div class="add-options">
          <div class="emoji-action-wrapper">
            <button 
              @click.stop="toggleEmojiPicker" 
              class="add-option"
              :disabled="isLoading"
            >
              <span class="option-icon"><img src="../assets/emoji.png" /></span>
              <span>Icon</span>
            </button>
            
            <div v-if="showEmojiPicker" class="emoji-picker-popover" @click.stop>
              <EmojiPicker 
                :native="true"
                @select="insertEmoji"
                theme="light"
              />
            </div>
          </div>

          <label class="add-option" :class="{ disabled: isLoading }">
            <input type="file" @change="handleMediaSelect" accept="image/*,video/*" style="display: none;" :disabled="isLoading" />
            <span class="option-icon"><img src="../assets/media.png" /></span>
            <span>Media</span>
          </label>
        </div>
      </div>

      <div v-if="selectedMedia || editMediaPreview" class="media-preview">
        <div class="media-preview-container">
          <img v-if="isImageFile()" :src="mediaPreviewUrl" class="preview-image" />
          <video v-else-if="isVideoFile()" :src="mediaPreviewUrl" class="preview-video" controls></video>
          
          <button @click="removeMedia" class="remove-media-btn" :disabled="isLoading">&times;</button>
        </div>
      </div>

      <div class="post-actions-footer">
        <button 
          @click="submitEditPost" 
          :disabled="!canPost || isLoading"
          class="post-submit-btn"
          :class="{ disabled: !canPost || isLoading }"
        >
          <span v-if="isLoading">Saving...</span>
          <span v-else>Save</span>
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
import NotificationModal from './NotificationModal.vue';
import LoadingOverlay from './LoadingOverlay.vue';
import ConfirmDialog from './ConfirmDialog.vue';

export default {
  name: "EditPostModal",
  components: {
    EmojiPicker,
    NotificationModal,
    LoadingOverlay,
    ConfirmDialog
  },
  props: {
    isVisible: { type: Boolean, default: false },
    post: { type: Object, default: null },
    user: { type: Object, required: true }
  },
  data() {
    return {
      // 4 trường dữ liệu mới
      title: '', 
      selectedCategory: '',
      ingredients: '',
      instructions: '',
      
      editPrivacy: 'public',
      selectedMedia: null,
      editMediaPreview: '', 
      mediaPreviewUrl: null, 
      showEmojiPicker: false,
      lastFocusedField: { refName: 'instructionsTextarea', modelKey: 'instructions' },
      
      isLoading: false,
      notification: { visible: false, type: 'success', title: '', message: '' },
      confirmVisible: false,
      confirmMessage: '',
    }
  },
  computed: {
    canPost() {
      // Kiểm tra 4 trường không được rỗng
      return this.title.trim().length > 0 && 
             this.selectedCategory.trim().length > 0 &&
             this.ingredients.trim().length > 0 && 
             this.instructions.trim().length > 0;
    }
  },
  watch: {
    post: {
      handler(newPost) {
        if (newPost) { this.initializeEditData(); }
      },
      immediate: true
    },
    isVisible(newVal) {
      if (newVal && this.post) {
        this.initializeEditData();
        this.$nextTick(() => {
          // Focus vào ô Title khi mở modal
          if (this.$refs.titleInput) this.$refs.titleInput.focus();
        });
        
        const handleClickOutside = (e) => {
          if (!e.target.closest('.emoji-action-wrapper')) this.showEmojiPicker = false;
        };
        document.addEventListener('click', handleClickOutside);
        this._clickOutsideHandler = handleClickOutside;
      } else {
        if (this._clickOutsideHandler) {
          document.removeEventListener('click', this._clickOutsideHandler);
          this._clickOutsideHandler = null;
        }
      }
    }
  },
  methods: {
    // --- KHỞI TẠO DỮ LIỆU TỪ POST CŨ (LOGIC MỚI) ---
    initializeEditData() {
      if (!this.post) return;
      
      // Lấy trực tiếp từ các trường riêng biệt
      this.title = this.post.title || '';
      this.selectedCategory = this.post.category || '';
      this.ingredients = this.post.ingredients || '';
      this.instructions = this.post.instructions || '';
      
      this.editPrivacy = this.post.audience || 'public';
      
      // Xử lý Media
      this.editMediaPreview = this.post.media ? `http://localhost:3000/${this.post.media}` : '';
      this.mediaPreviewUrl = this.editMediaPreview;
      this.selectedMedia = null;
      
      this.showEmojiPicker = false;
    },

    // --- GỬI DỮ LIỆU CẬP NHẬT (LOGIC MỚI) ---
    async submitEditPost() {
      if (!this.canPost || !this.post) return;

      this.isLoading = true;
      
      // Delay giả lập
      await new Promise(resolve => setTimeout(resolve, 1000));

      try {
        const formData = new FormData();
        
        // Gửi 4 trường riêng biệt
        formData.append('title', this.title);
        formData.append('category', this.selectedCategory);
        formData.append('ingredients', this.ingredients);
        formData.append('instructions', this.instructions);
        
        // Các thông tin khác
        formData.append('audience', this.editPrivacy);
        
        // Xử lý Media (Giữ nguyên logic cũ rất tốt)
        if (this.selectedMedia) {
          // Case 1: Upload ảnh mới
          formData.append('image', this.selectedMedia);
        } else if (this.post.media && !this.editMediaPreview) {
          // Case 2: Xóa ảnh cũ mà không up ảnh mới
          formData.append('deleteMedia', 'true');
        }
        // Case 3: Giữ nguyên ảnh cũ (backend tự hiểu nếu không gửi gì)

        // Gọi API PUT
        const res = await fetch(`http://localhost:3000/posts/${this.post._id}`, {
          method: 'PUT',
          body: formData
        });

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        this.isLoading = false;
        this.showNotify("success", "Success", "Recipe updated successfully!");

      } catch (err) {
        console.error("Update failed:", err);
        this.isLoading = false;
        this.showNotify("error", "Error", "Failed to update recipe: " + err.message);
      }
    },

    // --- CÁC HÀM HỖ TRỢ KHÁC (GIỮ NGUYÊN) ---
    showNotify(type, title, message) {
      this.notification = { visible: true, type, title, message };
    },
    handleNotificationConfirm() {
      this.notification.visible = false;
      if (this.notification.type === 'success') {
        this.$emit('updated');
        this.closeModal(true);
      }
    },
    requestClose() {
      if (this.isLoading) return;
      this.confirmMessage = "Are you sure you want to discard your changes?";
      this.confirmVisible = true;
    },
    handleConfirmDiscard() {
      this.confirmVisible = false;
      this.closeModal(true);
    },
    closeModal(force = false) {
      if (!force) {
        this.requestClose();
        return;
      }
      this.resetForm();
      this.$emit('close');
    },
    getAvatarUrl(author) {
      if (!author || !author.avatar) return 'http://localhost:3000/uploads/user.png';
      return `http://localhost:3000/${author.avatar}`;
    },
    adjustTextareaHeight(textarea) {
      if (!textarea) return;
      this.$nextTick(() => {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
      });
    },
    handleFocus(refName, modelKey) {
      this.lastFocusedField = { refName, modelKey };
    },
    toggleEmojiPicker() {
      this.showEmojiPicker = !this.showEmojiPicker;
    },
    insertEmoji(emoji) {
      const { refName, modelKey } = this.lastFocusedField;
      const targetField = this.$refs[refName];
      const emojiText = emoji.i;
      if (targetField && this[modelKey] !== undefined) {
        const startPos = targetField.selectionStart || this[modelKey].length;
        const endPos = targetField.selectionEnd || this[modelKey].length;
        const originalText = this[modelKey];
        this[modelKey] = originalText.substring(0, startPos) + emojiText + originalText.substring(endPos);
        this.$nextTick(() => {
          targetField.focus();
          const newCursorPos = startPos + emojiText.length;
          targetField.setSelectionRange(newCursorPos, newCursorPos);
          if (targetField.tagName === 'TEXTAREA') {
            this.adjustTextareaHeight(targetField);
          }
        });
      }
    },
    handleMediaSelect(event) {
      const file = event.target.files[0];
      if (!file) return;
      this.selectedMedia = file;
      if (this.mediaPreviewUrl && this.mediaPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(this.mediaPreviewUrl);
      }
      this.mediaPreviewUrl = URL.createObjectURL(file);
      this.editMediaPreview = ''; 
    },
    removeMedia() {
      if (this.mediaPreviewUrl && this.mediaPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(this.mediaPreviewUrl);
      }
      this.selectedMedia = null;
      this.mediaPreviewUrl = null;
      this.editMediaPreview = '';
    },
    isImageFile() {
      if (this.selectedMedia) return this.selectedMedia.type.startsWith('image/');
      if (this.editMediaPreview && this.post) return this.post.mediaType === 'image';
      return false;
    },
    isVideoFile() {
      if (this.selectedMedia) return this.selectedMedia.type.startsWith('video/');
      if (this.editMediaPreview && this.post) return this.post.mediaType === 'video';
      return false;
    },
    resetForm() {
      this.title = '';
      this.selectedCategory = '';
      this.ingredients = '';
      this.instructions = '';
      this.editPrivacy = 'public';
      this.selectedMedia = null;
      this.editMediaPreview = '';
      this.showEmojiPicker = false;
      if (this.mediaPreviewUrl && this.mediaPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(this.mediaPreviewUrl);
      }
      this.mediaPreviewUrl = null;
    }
  },

  beforeUnmount() {
    if (this._clickOutsideHandler) {
      document.removeEventListener('click', this._clickOutsideHandler);
    }
    if (this.mediaPreviewUrl && this.mediaPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(this.mediaPreviewUrl);
    }
  }
};
</script>

<style scoped>
/* Ensure relative positioning for LoadingOverlay */
.edit-post-modal-content {
  position: relative;
  /* ... keep existing styles ... */
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  width: 90%;
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease-out;
}

/* Override z-index for Notification Modal to appear above Edit Modal */
.notification-wrapper :deep(.modal-overlay) {
  z-index: 11002 !important;
}

.edit-post-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;
}

/* ... Keep all your existing CSS styles below ... */
.edit-post-modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; position: relative; }
.edit-post-modal-header h3 { margin: 0; font-size: 20px; font-weight: 700; color: #1c1e21; text-align: center; flex: 1; }
.close-btn { position: absolute; right: 16px; background: #f0f2f5; border: none; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 20px; color: #8a8d91; transition: background-color 0.2s; }
.close-btn:hover { background: #e4e6ea; }
.post-creator-info { display: flex; align-items: center; padding: 16px 24px; gap: 12px; }
.creator-avatar { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; }
.creator-details { flex: 1; }
.creator-details strong { display: block; font-size: 15px; font-weight: 600; color: #1c1e21; margin-bottom: 4px; }
.privacy-selector select { background: #f0f2f5; border: none; border-radius: 6px; padding: 4px 8px; font-size: 13px; color: #65676b; cursor: pointer; }
.post-content-area { padding: 0 24px; position: relative; }
.recipe-field { margin-bottom: 20px; }
.field-label { display: block; font-size: 16px; font-weight: 600; color: #1c1e21; margin-bottom: 8px; }
.recipe-input, .category-select { width: 100%; padding: 12px; font-size: 15px; font-family: inherit; line-height: 1.2; color: #1c1e21; background: #f8f9fa; border: 1px solid #e4e6ea; border-radius: 8px; box-sizing: border-box; transition: border-color 0.2s, background-color 0.2s; }
.recipe-input { font-size: 18px; }
.category-select { cursor: pointer; appearance: none; background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e"); background-repeat: no-repeat; background-position: right 12px center; background-size: 20px; padding-right: 40px; }
.recipe-input:focus, .category-select:focus { border-color: #1877f2; background: #ffffff; outline: none; box-shadow: 0 0 0 2px rgba(24, 119, 242, 0.2); }
.recipe-textarea { width: 100%; min-height: 100px; padding: 12px; font-size: 15px; font-family: inherit; line-height: 1.4; color: #1c1e21; background: #f8f9fa; border: 1px solid #e4e6ea; border-radius: 8px; box-sizing: border-box; resize: vertical; transition: border-color 0.2s, background-color 0.2s; }
.recipe-textarea:focus { border-color: #1877f2; background: #ffffff; outline: none; box-shadow: 0 0 0 2px rgba(24, 119, 242, 0.2); }
.recipe-textarea::placeholder { color: #8a8d91; font-style: italic; }
.ingredients-textarea { font-family: monospace; font-size: 14px; }
.instructions-textarea { min-height: 120px; }
.media-preview { padding: 0 24px 16px; }
.media-preview-container { position: relative; border: 1px solid #e4e6ea; border-radius: 12px; overflow: hidden; background: #f8f9fa; }
.preview-image, .preview-video { width: 100%; max-height: 300px; object-fit: cover; display: block; }
.remove-media-btn { position: absolute; top: 8px; right: 8px; background: rgba(0, 0, 0, 0.6); color: white; border: none; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 18px; transition: background-color 0.2s; }
.remove-media-btn:hover { background: rgba(0, 0, 0, 0.8); }
.add-options { display: flex; justify-content: space-between; gap: 12px; padding: 0; margin-bottom: 16px; width: 100%; box-sizing: border-box; }
.emoji-action-wrapper { flex: 1; position: relative; }
.add-option { width: 100%; flex: 1; padding: 10px 12px; display: flex; align-items: center; justify-content: center; gap: 8px; border-radius: 10px; background: #f0f2f5; border: 1px solid #ccc; cursor: pointer; transition: background-color 0.2s; font-size: 14px; white-space: nowrap; box-sizing: border-box; margin: 0; }
.add-option:hover { background: #e4e6ea; }
.option-icon img { width: 20px; height: 20px; }
.emoji-picker-popover { position: absolute; bottom: 100%; left: 0; z-index: 1001; margin-bottom: 10px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2); border-radius: 8px; background: white; }
.post-actions-footer { padding: 16px 24px; border-top: 1px solid #e4e6ea; }
.post-submit-btn { width: 100%; padding: 12px; background: #1877f2; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; transition: background-color 0.2s; }
.post-submit-btn:hover:not(.disabled) { background: #166fe5; }
.post-submit-btn.disabled { background: #e4e6ea; color: #bcc0c4; cursor: not-allowed; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
@media (max-width: 768px) { .edit-post-modal-content { width: 95%; margin: 20px; max-height: calc(100vh - 40px); } .recipe-textarea { font-size: 18px; } .add-options { flex-direction: column; align-items: stretch; } .add-option { justify-content: flex-start; } }
.edit-post-modal-content::-webkit-scrollbar { width: 6px; }
.edit-post-modal-content::-webkit-scrollbar-track { background: #f8f9fa; border-radius: 3px; }
.edit-post-modal-content::-webkit-scrollbar-thumb { background: #bcc0c4; border-radius: 3px; }
.edit-post-modal-content::-webkit-scrollbar-thumb:hover { background: #8a8d91; }

/* Disabled styles */
.add-option.disabled, input:disabled, select:disabled, textarea:disabled, button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>