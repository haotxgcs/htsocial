<template>
  <div v-if="isVisible" class="create-post-modal-overlay" @click.self="!isLoading && closeModal()">
    
    <div class="create-post-modal-content relative-box">
      
      <div class="create-post-modal-header">
        <h3>Create Post</h3>
        <button class="close-btn" @click="closeModal" :disabled="isLoading">&times;</button>
      </div>

      <div class="post-creator-info">
        <img :src="`http://localhost:3000/${user?.avatar || 'user.png'}`" alt="avatar" class="creator-avatar" />
        <div class="creator-details">
          <strong>{{ user?.firstname }} {{ user?.lastname }}</strong>
          <div class="privacy-selector">
            <select v-model="postPrivacy" :disabled="isLoading">
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
          <select v-model="category" class="category-select" :disabled="isLoading">
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
            placeholder="- 500g beef&#10;- 2 onions&#10;- Spices..."
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
            placeholder="Step 1: Prepare ingredients...&#10;Step 2: Cook..."
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
            <input type="file" @change="handleMediaSelect" accept="image/*,video/*" style="display: none;" :disabled="isLoading"/>
            <span class="option-icon"><img src="../assets/media.png" /></span>
            <span>Media</span>
          </label>
        </div>
      </div>

      <div v-if="selectedMedia" class="media-preview">
        <div class="media-preview-container">
          <img v-if="isImageFile(selectedMedia)" :src="mediaPreviewUrl" class="preview-image" />
          <video v-else-if="isVideoFile(selectedMedia)" :src="mediaPreviewUrl" class="preview-video" controls></video>
          <button @click="removeMedia" class="remove-media-btn" :disabled="isLoading">&times;</button>
        </div>
      </div>

      <div class="post-actions-footer">
        <button 
          @click="submitNewPost" 
          :disabled="!canPost || isLoading"
          class="post-submit-btn"
          :class="{ disabled: !canPost || isLoading }"
        >
          <span v-if="isLoading">Posting...</span>
          <span v-else>Post</span>
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

  </div>
</template>

<script>
import EmojiPicker from 'vue3-emoji-picker';
import 'vue3-emoji-picker/css';
import NotificationModal from './NotificationModal.vue';
import LoadingOverlay from './LoadingOverlay.vue';

export default {
  name: "CreatePostModal",
  components: {
    EmojiPicker,
    NotificationModal,
    LoadingOverlay
  },
  props: {
    isVisible: { type: Boolean, default: false },
    user: { type: Object, required: true }
  },
  data() {
    return {
      // 4 trường dữ liệu chính
      title: '',          // Tên món (Thay cho recipeName)
      category: '',       // Danh mục (Thay cho selectedCategory)
      ingredients: '',    // Nguyên liệu
      instructions: '',   // Cách làm
      
      postPrivacy: 'public',
      selectedMedia: null,
      mediaPreviewUrl: null,
      showEmojiPicker: false,
      
      // Theo dõi trường đang focus để chèn emoji
      lastFocusedField: {
        refName: 'instructionsTextarea',
        modelKey: 'instructions'
      },
      
      notification: {
        visible: false,
        type: 'success',
        title: '',
        message: ''
      },
      isLoading: false,
      createdPostData: null
    }
  },
  computed: {
    // Kiểm tra đã nhập đủ 4 trường chưa
    canPost() {
      return this.title.trim().length > 0 && 
             this.category.trim().length > 0 &&
             this.ingredients.trim().length > 0 && 
             this.instructions.trim().length > 0;
    }
  },
  methods: {
    // --- NOTIFICATION HELPERS ---
    showNotify(type, title, message) {
      this.notification = { visible: true, type, title, message };
    },

    handleNotificationConfirm() {
      this.notification.visible = false;
      if (this.notification.type === 'success') {
        this.$emit('posted', this.createdPostData);
        this.resetForm();
        this.$emit('close');
      }
    },

    closeModal() {
      if (this.isLoading) return;
      this.resetForm();
      this.$emit('close');
    },

    // --- ⭐ MAIN SUBMIT FUNCTION (ĐÃ SỬA API) ⭐ ---
    async submitNewPost() {
      if (!this.canPost) return;

      const savedUser = JSON.parse(localStorage.getItem("user"));
      if (!savedUser) return this.showNotify("error", "Lỗi", "Vui lòng đăng nhập lại.");

      this.isLoading = true;

      // Giả lập delay mạng
      await new Promise(resolve => setTimeout(resolve, 1000));

      try {
        const formData = new FormData();
        
        // Gửi từng trường riêng biệt lên Server
        formData.append('title', this.title);
        formData.append('category', this.category);
        formData.append('ingredients', this.ingredients);
        formData.append('instructions', this.instructions);
        
        // Các thông tin khác
        formData.append('author', savedUser.username);
        formData.append('audience', this.postPrivacy);
        
        if (this.selectedMedia) {
          formData.append('image', this.selectedMedia);
        }

        // Gọi API
        const res = await fetch('http://localhost:3000/posts', {
          method: 'POST',
          body: formData
        });

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const newPost = await res.json();
        // Xử lý ngày tháng để hiển thị ngay lập tức
        newPost.createdAt = new Date(newPost.createdAt || Date.now());
        
        this.createdPostData = newPost;

        this.isLoading = false;
        this.showNotify("success", "Thành công", "Công thức của bạn đã được chia sẻ!");

      } catch (err) {
        console.error("Lỗi đăng bài:", err);
        this.isLoading = false;
        this.showNotify("error", "Thất bại", "Lỗi: " + err.message);
      }
    },

    // --- FORM HELPERS ---
    resetForm() {
      this.title = '';
      this.category = '';
      this.ingredients = '';
      this.instructions = '';
      this.postPrivacy = 'public';
      this.selectedMedia = null;
      this.mediaPreviewUrl = null;
      this.showEmojiPicker = false;
      if (this.mediaPreviewUrl) URL.revokeObjectURL(this.mediaPreviewUrl);
    },
    
    adjustTextareaHeight(textarea) {
      if (!textarea) return;
      this.$nextTick(() => {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
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
      
      // Xử lý chèn emoji vào đúng vị trí con trỏ
      if (this[modelKey] !== undefined) {
        const currentVal = this[modelKey];
        // Nếu là input/textarea thì chèn vào giữa, nếu không có ref thì nối đuôi
        if (targetField) {
           const startPos = targetField.selectionStart || currentVal.length;
           const endPos = targetField.selectionEnd || currentVal.length;
           this[modelKey] = currentVal.substring(0, startPos) + emojiText + currentVal.substring(endPos);
           
           this.$nextTick(() => {
             targetField.focus();
             const newCursorPos = startPos + emojiText.length;
             targetField.setSelectionRange(newCursorPos, newCursorPos);
             if (targetField.tagName === 'TEXTAREA') this.adjustTextareaHeight(targetField);
           });
        } else {
           this[modelKey] += emojiText;
        }
      }
    },

    handleMediaSelect(event) {
      const file = event.target.files[0];
      if (!file) return;
      this.selectedMedia = file;
      this.mediaPreviewUrl = URL.createObjectURL(file);
    },
    removeMedia() {
      if (this.mediaPreviewUrl) URL.revokeObjectURL(this.mediaPreviewUrl);
      this.selectedMedia = null;
      this.mediaPreviewUrl = null;
    },
    isImageFile(file) { return file && file.type.startsWith('image/'); },
    isVideoFile(file) { return file && file.type.startsWith('video/'); }
  },

  watch: {
    isVisible(newVal) {
      if (newVal) {
        this.$nextTick(() => {
          // Focus vào Title khi mở modal
          if (this.$refs.titleInput) this.$refs.titleInput.focus();
        });
        
        // Xử lý click outside cho emoji picker
        const handleClickOutside = (e) => {
          if (!e.target.closest('.emoji-action-wrapper')) {
            this.showEmojiPicker = false;
          }
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

  beforeUnmount() {
    if (this._clickOutsideHandler) document.removeEventListener('click', this._clickOutsideHandler);
    if (this.mediaPreviewUrl) URL.revokeObjectURL(this.mediaPreviewUrl);
  }
};
</script>

<style scoped>
/* Thêm relative để LoadingOverlay phủ đúng */
.create-post-modal-content {
  position: relative; 
  /* ... (Các thuộc tính cũ giữ nguyên) ... */
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  width: 90%;
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease-out;
}

/* Đảm bảo Notification đè lên mọi thứ */
.notification-wrapper :deep(.modal-overlay) {
  z-index: 11002 !important;
}

/* Disable style */
.add-option.disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}

/* ... (Copy toàn bộ CSS cũ của bạn vào đây) ... */
.create-post-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(255, 255, 255, 0.8); display: flex; justify-content: center; align-items: center; z-index: 1000; animation: fadeIn 0.2s ease-out; }
.create-post-modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; position: relative; }
.create-post-modal-header h3 { margin: 0; font-size: 20px; font-weight: 700; color: #1c1e21; text-align: center; flex: 1; }
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
.add-options { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 16px; width: 100%; box-sizing: border-box; flex:1; }
.emoji-action-wrapper { flex: 1; position: relative; }
.add-option { width: 100%; padding: 10px 12px; display: flex; align-items: center; justify-content: center; gap: 8px; border-radius: 10px; background: #f0f2f5; border: 1px solid #ccc; cursor: pointer; transition: background-color 0.2s; font-size: 14px; white-space: nowrap; box-sizing: border-box; flex:1; }
.add-option:hover { background: #e4e6ea; }
.option-icon img { width: 20px; height: 20px; }
.emoji-picker-popover { position: absolute; bottom: 100%; left: 0; z-index: 1001; margin-bottom: 10px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2); border-radius: 8px; background: white; }
.post-actions-footer { padding: 16px 24px; border-top: 1px solid #e4e6ea; }
.post-submit-btn { width: 100%; padding: 12px; background: #1877f2; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; transition: background-color 0.2s; }
.post-submit-btn:hover:not(.disabled) { background: #166fe5; }
.post-submit-btn.disabled { background: #e4e6ea; color: #bcc0c4; cursor: not-allowed; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
@media (max-width: 768px) { .create-post-modal-content { width: 95%; margin: 20px; max-height: calc(100vh - 40px); } .post-textarea { font-size: 18px; } .add-options { flex-direction: column; align-items: stretch; } .add-option { justify-content: flex-start; } }
.create-post-modal-content::-webkit-scrollbar { width: 6px; }
.create-post-modal-content::-webkit-scrollbar-track { background: #f8f9fa; border-radius: 3px; }
.create-post-modal-content::-webkit-scrollbar-thumb { background: #bcc0c4; border-radius: 3px; }
.create-post-modal-content::-webkit-scrollbar-thumb:hover { background: #8a8d91; }
</style>