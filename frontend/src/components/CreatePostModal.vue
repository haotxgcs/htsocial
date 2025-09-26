<template>
  <div v-if="isVisible" class="create-post-modal-overlay" @click="closeModal">
    <div class="create-post-modal-content" @click.stop>
      <!-- Header modal -->
      <div class="create-post-modal-header">
        <h3>Create Post</h3>
        <button class="close-btn" @click="closeModal">&times;</button>
      </div>

      <!-- User info -->
      <div class="post-creator-info">
        <img :src="`http://localhost:3000/${user?.avatar || 'user.png'}`" alt="avatar" class="creator-avatar" />
        <div class="creator-details">
          <strong>{{ user?.firstname }} {{ user?.lastname }}</strong>
          <div class="privacy-selector">
            <select v-model="postPrivacy">
              <option value="public">🌍 Public</option>
              <option value="friends">👥 Friends</option>
              <option value="private">🔒 Private</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Recipe content -->
      <div class="post-content-area">
        <!-- Tên món ăn -->
        <div class="recipe-field">
          <label class="field-label">Recipe Name</label>
          <input 
            v-model="recipeName" 
            placeholder="Example: Beef Stew, Chicken Curry, Vegan Salad,..."
            class="recipe-input"
            ref="recipeNameInput"
          />
        </div>

        <!-- Nguyên liệu -->
        <div class="recipe-field">
          <label class="field-label">Ingredients</label>
          <textarea 
            v-model="ingredients" 
            placeholder="Example:&#10;- 500g beef&#10;- 2 onions&#10;- 3 cloves of garlic&#10;- Spices: salt, pepper, fish sauce"
            class="recipe-textarea ingredients-textarea"
            ref="ingredientsTextarea"
            @input="adjustTextareaHeight($refs.ingredientsTextarea)"
          ></textarea>
        </div>

        <!-- Cách làm -->
        <div class="recipe-field">
          <label class="field-label">Instructions</label>
          <textarea 
            v-model="instructions" 
            placeholder="Detailed description of the steps:&#10;Step 1: Prepare ingredients...&#10;Step 2: Marinate meat with spices...&#10;Step 3: Cook in order..."
            class="recipe-textarea instructions-textarea"
            ref="instructionsTextarea"
            @input="adjustTextareaHeight($refs.instructionsTextarea)"
          ></textarea>
        </div>
        
        <div class="add-options">
          <!-- Nút mở Emoji Picker -->
          <button 
            @click="showEmojiPicker = !showEmojiPicker" 
            class="add-option"
          >
            <span class="option-icon"><img src="../assets/emoji.png" /></span>
            <span>Icon</span>
          </button>

          <!-- Nút chọn media -->
          <label class="add-option">
            <input type="file" @change="handleMediaSelect" accept="image/*,video/*" style="display: none;" />
            <span class="option-icon"><img src="../assets/media.png" /></span>
            <span>Media</span>
          </label>
          
          <!-- Emoji Picker component -->
          <EmojiPicker 
            v-if="showEmojiPicker" 
            @select="insertEmoji"
          />
        </div>
      </div>

      <!-- Media preview -->
      <div v-if="selectedMedia" class="media-preview">
        <div class="media-preview-container">
          <img v-if="isImageFile(selectedMedia)" :src="mediaPreviewUrl" class="preview-image" />
          <video v-else-if="isVideoFile(selectedMedia)" :src="mediaPreviewUrl" class="preview-video" controls></video>
          <button @click="removeMedia" class="remove-media-btn">&times;</button>
        </div>
      </div>

      <!-- Post button -->
      <div class="post-actions-footer">
        <button 
          @click="submitNewPost" 
          :disabled="!canPost"
          class="post-submit-btn"
          :class="{ disabled: !canPost }"
        >
          Post
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import EmojiPicker from './Emoji.vue';

export default {
  name: "CreatePostModal",
  components: {
    EmojiPicker
  },
  props: {
    isVisible: {
      type: Boolean,
      default: false
    },
    user: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      recipeName: '',
      ingredients: '',
      instructions: '',
      postPrivacy: 'public',
      selectedMedia: null,
      mediaPreviewUrl: null,
      showEmojiPicker: false,
    }
  },
  computed: {
    canPost() {
      return this.recipeName.trim().length > 0 && 
             this.ingredients.trim().length > 0 && 
             this.instructions.trim().length > 0;
    }
  },
  methods: {
    closeModal() {
      this.resetForm();
      this.$emit('close');
    },

    resetForm() {
      this.recipeName = '';
      this.ingredients = '';
      this.instructions = '';
      this.postPrivacy = 'public';
      this.selectedMedia = null;
      this.mediaPreviewUrl = null;
      this.showEmojiPicker = false;
      
      if (this.mediaPreviewUrl) {
        URL.revokeObjectURL(this.mediaPreviewUrl);
      }
    },

    adjustTextareaHeight(textarea) {
      if (!textarea) return;
      this.$nextTick(() => {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
      });
    },

    // Emoji picker methods
    insertEmoji(emoji) {
      // Determine which field is currently focused
      const activeElement = document.activeElement;
      let targetField = null;
      let targetProperty = null;

      if (activeElement === this.$refs.recipeNameInput) {
        targetField = this.$refs.recipeNameInput;
        targetProperty = 'recipeName';
      } else if (activeElement === this.$refs.ingredientsTextarea) {
        targetField = this.$refs.ingredientsTextarea;
        targetProperty = 'ingredients';
      } else if (activeElement === this.$refs.instructionsTextarea) {
        targetField = this.$refs.instructionsTextarea;
        targetProperty = 'instructions';
      }

      if (targetField && targetProperty) {
        const startPos = targetField.selectionStart;
        const endPos = targetField.selectionEnd;
        
        this[targetProperty] = this[targetProperty].substring(0, startPos) + 
                              emoji + 
                              this[targetProperty].substring(endPos);
        
        this.$nextTick(() => {
          targetField.focus();
          targetField.setSelectionRange(startPos + emoji.length, startPos + emoji.length);
          
          // Auto resize if it's a textarea
          if (targetField.tagName === 'TEXTAREA') {
            this.adjustTextareaHeight(targetField);
          }
        });
      }
    },

    // Media handling methods
    handleMediaSelect(event) {
      const file = event.target.files[0];
      if (!file) return;

      this.selectedMedia = file;
      this.mediaPreviewUrl = URL.createObjectURL(file);
    },

    removeMedia() {
      if (this.mediaPreviewUrl) {
        URL.revokeObjectURL(this.mediaPreviewUrl);
      }
      this.selectedMedia = null;
      this.mediaPreviewUrl = null;
    },

    isImageFile(file) {
      return file && file.type.startsWith('image/');
    },

    isVideoFile(file) {
      return file && file.type.startsWith('video/');
    },

    // Submit new recipe
    async submitNewPost() {
      if (!this.canPost) return;

      const savedUser = JSON.parse(localStorage.getItem("user"));
      if (!savedUser) return alert("Vui lòng đăng nhập");

      try {
        const formData = new FormData();
        
        // Tạo nội dung post dạng text với format đẹp
        const recipeContent = 
        `🍳 Recipe Name: ${this.recipeName}

        📋 Ingredients:
        ${this.ingredients}

        👩‍🍳 Instructions:
        ${this.instructions}`;
        
        formData.append('content', recipeContent);
        formData.append('author', savedUser.username);
        formData.append('audience', this.postPrivacy);
        
        if (this.selectedMedia) {
          formData.append('image', this.selectedMedia);
        }

        const res = await fetch('http://localhost:3000/posts', {
          method: 'POST',
          body: formData
        });

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const newPost = await res.json();
        newPost.createdAt = new Date(newPost.createdAt || Date.now());
        
        this.$emit('posted', newPost);
        this.resetForm();
        alert('Chia sẻ công thức thành công!');
      } catch (err) {
        console.error("Không thể chia sẻ công thức:", err);
        alert("Không thể chia sẻ công thức: " + err.message);
      }
    }
  },

  watch: {
    isVisible(newVal) {
      if (newVal) {
        this.$nextTick(() => {
          if (this.$refs.postTextarea) {
            this.$refs.postTextarea.focus();
          }
        });
        
        // Close emoji picker when clicking outside
        const handleClickOutside = (e) => {
          if (!e.target.closest('.emoji-picker')) {
            this.showEmojiPicker = false;
          }
        };
        document.addEventListener('click', handleClickOutside);
        
        // Store the handler to remove it later
        this._clickOutsideHandler = handleClickOutside;
      } else {
        // Remove event listener when modal is closed
        if (this._clickOutsideHandler) {
          document.removeEventListener('click', this._clickOutsideHandler);
          this._clickOutsideHandler = null;
        }
      }
    }
  },

  beforeUnmount() {
    // Cleanup event listener
    if (this._clickOutsideHandler) {
      document.removeEventListener('click', this._clickOutsideHandler);
    }
    
    // Cleanup media preview URL
    if (this.mediaPreviewUrl) {
      URL.revokeObjectURL(this.mediaPreviewUrl);
    }
  }
};
</script>

<style scoped>
/* Create Post Modal Styles */
.create-post-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;
}

.create-post-modal-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  width: 90%;
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease-out;
}

.create-post-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  position: relative;
}

.create-post-modal-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #1c1e21;
  text-align: center;
  flex: 1;
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

.post-creator-info {
  display: flex;
  align-items: center;
  padding: 16px 24px;
  gap: 12px;
}

.creator-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.creator-details {
  flex: 1;
}

.creator-details strong {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: #1c1e21;
  margin-bottom: 4px;
}

.privacy-selector select {
  background: #f0f2f5;
  border: none;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 13px;
  color: #65676b;
  cursor: pointer;
}

.post-content-area {
  padding: 0 24px;
  position: relative;
}

/* Recipe form styling */
.recipe-field {
  margin-bottom: 20px;
}

.field-label {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: #1c1e21;
  margin-bottom: 8px;
}

.recipe-input {
  width: 100%;
  padding: 12px;
  font-size: 18px;
  font-family: inherit;
  line-height: 1.2;
  color: #1c1e21;
  background: #f8f9fa;
  border: 1px solid #e4e6ea;
  border-radius: 8px;
  box-sizing: border-box;
  transition: border-color 0.2s, background-color 0.2s;
}

.recipe-input:focus {
  border-color: #1877f2;
  background: #ffffff;
  outline: none;
  box-shadow: 0 0 0 2px rgba(24, 119, 242, 0.2);
}

.recipe-textarea {
  width: 100%;
  min-height: 100px;
  padding: 12px;
  font-size: 15px;
  font-family: inherit;
  line-height: 1.4;
  color: #1c1e21;
  background: #f8f9fa;
  border: 1px solid #e4e6ea;
  border-radius: 8px;
  box-sizing: border-box;
  resize: vertical;
  transition: border-color 0.2s, background-color 0.2s;
}

.recipe-textarea:focus {
  border-color: #1877f2;
  background: #ffffff;
  outline: none;
  box-shadow: 0 0 0 2px rgba(24, 119, 242, 0.2);
}

.recipe-textarea::placeholder {
  color: #8a8d91;
  font-style: italic;
}

.ingredients-textarea {
  font-family: monospace;
  font-size: 14px;
}

.instructions-textarea {
  min-height: 120px;
}

.media-preview {
  padding: 0 24px 16px;
}

.media-preview-container {
  position: relative;
  border: 1px solid #e4e6ea;
  border-radius: 12px;
  overflow: hidden;
  background: #f8f9fa;
}

.preview-image,
.preview-video {
  width: 100%;
  max-height: 300px;
  object-fit: cover;
  display: block;
}

.remove-media-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 18px;
  transition: background-color 0.2s;
}

.remove-media-btn:hover {
  background: rgba(0, 0, 0, 0.8);
}

.add-options {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 0 24px;
  margin-bottom: 16px;
  width: 100%;
  box-sizing: border-box;
}

.add-option {
  flex: 1;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 10px;
  background: #f0f2f5;
  border: 1px solid #ccc;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 14px;
  white-space: nowrap;
}

.add-option:hover {
  background: #e4e6ea;
}

.option-icon img {
  width: 20px;
  height: 20px;
}

.post-actions-footer {
  padding: 16px 24px;
  border-top: 1px solid #e4e6ea;
}

.post-submit-btn {
  width: 100%;
  padding: 12px;
  background: #1877f2;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.post-submit-btn:hover:not(.disabled) {
  background: #166fe5;
}

.post-submit-btn.disabled {
  background: #e4e6ea;
  color: #bcc0c4;
  cursor: not-allowed;
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .create-post-modal-content {
    width: 95%;
    margin: 20px;
    max-height: calc(100vh - 40px);
  }
  
  .post-textarea {
    font-size: 18px;
  }
  
  .add-options {
    flex-direction: column;
    align-items: stretch;
  }
  
  .add-option {
    justify-content: flex-start;
  }
}

/* Scrollbar Styling */
.create-post-modal-content::-webkit-scrollbar {
  width: 6px;
}

.create-post-modal-content::-webkit-scrollbar-track {
  background: #f8f9fa;
  border-radius: 3px;
}

.create-post-modal-content::-webkit-scrollbar-thumb {
  background: #bcc0c4;
  border-radius: 3px;
}

.create-post-modal-content::-webkit-scrollbar-thumb:hover {
  background: #8a8d91;
}
</style>