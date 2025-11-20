<template>
  <div v-if="isVisible" class="create-post-modal-overlay" @click="closeModal">
    <div class="create-post-modal-content" @click.stop>
      <div class="create-post-modal-header">
        <h3>Create Post</h3>
        <button class="close-btn" @click="closeModal">&times;</button>
      </div>

      <div class="post-creator-info">
        <img :src="`http://localhost:3000/${user?.avatar || 'user.png'}`" alt="avatar" class="creator-avatar" />
        <div class="creator-details">
          <strong>{{ user?.firstname }} {{ user?.lastname }}</strong>
          <div class="privacy-selector">
            <select v-model="postPrivacy">
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
            v-model="recipeName" 
            placeholder="Example: Beef Stew, Chicken Curry, Vegan Salad,..."
            class="recipe-input"
            ref="recipeNameInput"
            @focus="handleFocus('recipeNameInput', 'recipeName')"
          />
        </div>

        <div class="recipe-field">
          <label class="field-label">Category</label>
          <select v-model="selectedCategory" class="category-select">
            <option value="">Select a category</option>
            <option value="appetizer"> Appetizer</option>
            <option value="main-course"> Main Course</option>
            <option value="side-dish"> Side Dish</option>
            <option value="soup"> Soup</option>
            <option value="salad"> Salad</option>
            <option value="dessert"> Dessert</option>
            <option value="beverage"> Beverage</option>
            <option value="snack"> Snack</option>
            <option value="breakfast"> Breakfast</option>
            <option value="lunch"> Lunch</option>
            <option value="dinner"> Dinner</option>
            <option value="vegetarian"> Vegetarian</option>
            <option value="vegan"> Vegan</option>
            <option value="seafood"> Seafood</option>
            <option value="pasta"> Pasta</option>
            <option value="rice"> Rice Dish</option>
            <option value="noodles"> Noodles</option>
            <option value="bakery"> Bakery</option>
            <option value="grilled"> Grilled</option>
            <option value="fried"> Fried</option>
            <option value="steamed"> Steamed</option>
            <option value="stir-fry"> Stir-fry</option>
            <option value="slow-cooked"> Slow-cooked</option>
            <option value="quick-meal"> Quick Meal</option>
            <option value="traditional"> Traditional</option>
            <option value="fusion"> Fusion</option>
            <option value="healthy"> Healthy</option>
            <option value="comfort-food"> Comfort Food</option>
            <option value="kid-friendly"> Kid-friendly</option>
            <option value="party"> Party Food</option>
          </select>
        </div>

        <div class="recipe-field">
          <label class="field-label">Ingredients</label>
          <textarea 
            v-model="ingredients" 
            placeholder="Example:&#10;- 500g beef&#10;- 2 onions&#10;- 3 cloves of garlic&#10;- Spices: salt, pepper, fish sauce"
            class="recipe-textarea ingredients-textarea"
            ref="ingredientsTextarea"
            @input="adjustTextareaHeight($refs.ingredientsTextarea)"
            @focus="handleFocus('ingredientsTextarea', 'ingredients')"
          ></textarea>
        </div>

        <div class="recipe-field">
          <label class="field-label">Instructions</label>
          <textarea 
            v-model="instructions" 
            placeholder="Detailed description of the steps:&#10;Step 1: Prepare ingredients...&#10;Step 2: Marinate meat with spices...&#10;Step 3: Cook in order..."
            class="recipe-textarea instructions-textarea"
            ref="instructionsTextarea"
            @input="adjustTextareaHeight($refs.instructionsTextarea)"
            @focus="handleFocus('instructionsTextarea', 'instructions')"
          ></textarea>
        </div>
        
        <div class="add-options">
          <div class="emoji-action-wrapper">
            <button 
              @click.stop="toggleEmojiPicker" 
              class="add-option"
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

          <label class="add-option">
            <input type="file" @change="handleMediaSelect" accept="image/*,video/*" style="display: none;" />
            <span class="option-icon"><img src="../assets/media.png" /></span>
            <span>Media</span>
          </label>
        </div>
      </div>

      <div v-if="selectedMedia" class="media-preview">
        <div class="media-preview-container">
          <img v-if="isImageFile(selectedMedia)" :src="mediaPreviewUrl" class="preview-image" />
          <video v-else-if="isVideoFile(selectedMedia)" :src="mediaPreviewUrl" class="preview-video" controls></video>
          <button @click="removeMedia" class="remove-media-btn">&times;</button>
        </div>
      </div>

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
// 1. Import thư viện Emoji xịn (Nhớ chạy: npm install vue3-emoji-picker)
import EmojiPicker from 'vue3-emoji-picker';
// Import CSS của thư viện
import 'vue3-emoji-picker/css';

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
      selectedCategory: '',
      ingredients: '',
      instructions: '',
      postPrivacy: 'public',
      selectedMedia: null,
      mediaPreviewUrl: null,
      showEmojiPicker: false,
      // Lưu vết ô input cuối cùng được focus để chèn emoji vào đúng chỗ
      lastFocusedField: {
        refName: 'instructionsTextarea', // Mặc định chèn vào hướng dẫn
        modelKey: 'instructions'
      }
    }
  },
  computed: {
    canPost() {
      return this.recipeName.trim().length > 0 && 
             this.selectedCategory.trim().length > 0 &&
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
      this.selectedCategory = '';
      this.ingredients = '';
      this.instructions = '';
      this.postPrivacy = 'public';
      this.selectedMedia = null;
      this.mediaPreviewUrl = null;
      this.showEmojiPicker = false;
      this.lastFocusedField = { refName: 'instructionsTextarea', modelKey: 'instructions' };
      
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

    // Lưu lại ô input đang được focus
    handleFocus(refName, modelKey) {
      this.lastFocusedField = { refName, modelKey };
    },

    toggleEmojiPicker() {
      this.showEmojiPicker = !this.showEmojiPicker;
    },

    // Chèn Emoji vào đúng vị trí con trỏ
    insertEmoji(emoji) {
      const { refName, modelKey } = this.lastFocusedField;
      const targetField = this.$refs[refName];
      
      // Lấy emoji text (ví dụ: 😂)
      const emojiText = emoji.i;

      if (targetField && this[modelKey] !== undefined) {
        const startPos = targetField.selectionStart || this[modelKey].length;
        const endPos = targetField.selectionEnd || this[modelKey].length;
        
        const originalText = this[modelKey];
        
        // Chèn emoji vào giữa chuỗi
        this[modelKey] = originalText.substring(0, startPos) + 
                         emojiText + 
                         originalText.substring(endPos);
        
        // Focus lại vào ô input và đặt con trỏ ngay sau emoji
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

    // Get category label for display
    getCategoryLabel(category) {
      const categories = {
        'appetizer': ' Appetizer',
        'main-course': ' Main Course',
        'side-dish': ' Side Dish',
        'soup': ' Soup',
        'salad': ' Salad',
        'dessert': ' Dessert',
        'beverage': ' Beverage',
        'snack': ' Snack',
        'breakfast': ' Breakfast',
        'lunch': ' Lunch',
        'dinner': ' Dinner',
        'vegetarian': ' Vegetarian',
        'vegan': ' Vegan',
        'seafood': ' Seafood',
        'pasta': ' Pasta',
        'rice': ' Rice Dish',
        'noodles': ' Noodles',
        'bakery': ' Bakery',
        'grilled': ' Grilled',
        'fried': ' Fried',
        'steamed': ' Steamed',
        'stir-fry': ' Stir-fry',
        'slow-cooked': ' Slow-cooked',
        'quick-meal': ' Quick Meal',
        'traditional': ' Traditional',
        'fusion': ' Fusion',
        'healthy': ' Healthy',
        'comfort-food': ' Comfort Food',
        'kid-friendly': ' Kid-friendly',
        'party': ' Party Food'
      };
      return categories[category] || category;
    },

    // Submit new recipe
    async submitNewPost() {
      if (!this.canPost) return;

      const savedUser = JSON.parse(localStorage.getItem("user"));
      if (!savedUser) return alert("Vui lòng đăng nhập");

      try {
        const formData = new FormData();
        
        const recipeContent = 
        `Recipe Name: ${this.recipeName}

Category: ${this.getCategoryLabel(this.selectedCategory)}

Ingredients:
${this.ingredients}

Instructions:
${this.instructions}`;
        
        formData.append('content', recipeContent);
        formData.append('author', savedUser.username);
        formData.append('audience', this.postPrivacy);
        formData.append('category', this.selectedCategory);
        
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
        // Auto focus vào tên món khi mở modal
        this.$nextTick(() => {
          if (this.$refs.recipeNameInput) {
            this.$refs.recipeNameInput.focus();
          }
        });
        
        // Logic đóng picker khi click ra ngoài
        const handleClickOutside = (e) => {
          // Nếu click không nằm trong wrapper của emoji thì đóng
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
    if (this._clickOutsideHandler) {
      document.removeEventListener('click', this._clickOutsideHandler);
    }
    
    if (this.mediaPreviewUrl) {
      URL.revokeObjectURL(this.mediaPreviewUrl);
    }
  }
};
</script>

<style scoped>
.create-post-modal-overlay {
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

.recipe-input,
.category-select {
  width: 100%;
  padding: 12px;
  font-size: 15px;
  font-family: inherit;
  line-height: 1.2;
  color: #1c1e21;
  background: #f8f9fa;
  border: 1px solid #e4e6ea;
  border-radius: 8px;
  box-sizing: border-box;
  transition: border-color 0.2s, background-color 0.2s;
}

.recipe-input {
  font-size: 18px;
}

.category-select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 20px;
  padding-right: 40px;
}

.recipe-input:focus,
.category-select:focus {
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

/* --- STYLES MỚI CHO EMOJI PICKER --- */
.add-options {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  
  margin-bottom: 16px;
  width: 100%;
  box-sizing: border-box;
  flex:1;
}

.emoji-action-wrapper {
  flex: 1;
  position: relative; /* Quan trọng để định vị popover */
}

.add-option {
  width: 100%;
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
  box-sizing: border-box;
  flex:1;
}

.add-option:hover {
  background: #e4e6ea;
}

.option-icon img {
  width: 20px;
  height: 20px;
}

/* Emoji Popover Style */
.emoji-picker-popover {
  position: absolute;
  bottom: 100%; /* Hiển thị phía trên nút */
  left: 0;
  z-index: 1001;
  margin-bottom: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  background: white;
}
/* ----------------------------------- */

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