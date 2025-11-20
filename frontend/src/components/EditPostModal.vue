<template>
  <div v-if="isVisible" class="edit-post-modal-overlay" @click="closeModal">
    <div class="edit-post-modal-content" @click.stop>
      <div class="edit-post-modal-header">
        <h3>Edit Post</h3>
        <button class="close-btn" @click="closeModal">&times;</button>
      </div>

      <div class="post-creator-info">
        <img :src="getAvatarUrl(user)" alt="avatar" class="creator-avatar" />
        <div class="creator-details">
          <strong>{{ user?.firstname }} {{ user?.lastname }}</strong>
          <div class="privacy-selector">
            <select v-model="editPrivacy">
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

      <div v-if="selectedMedia || editMediaPreview" class="media-preview">
        <div class="media-preview-container">
          <img v-if="isImageFile()" :src="mediaPreviewUrl" class="preview-image" />
          <video v-else-if="isVideoFile()" :src="mediaPreviewUrl" class="preview-video" controls></video>
          <button @click="removeMedia" class="remove-media-btn">&times;</button>
        </div>
      </div>

      <div class="post-actions-footer">
        <button 
          @click="submitEditPost" 
          :disabled="!canPost"
          class="post-submit-btn"
          :class="{ disabled: !canPost }"
        >
          Save
        </button>
      </div>
    </div>
  </div>
</template>

<script>
// Import thư viện Emoji
import EmojiPicker from 'vue3-emoji-picker';
import 'vue3-emoji-picker/css';

export default {
  name: "EditPostModal",
  components: {
    EmojiPicker
  },
  props: {
    isVisible: {
      type: Boolean,
      default: false
    },
    post: {
      type: Object,
      default: null
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
      editPrivacy: 'public',
      selectedMedia: null,
      editMediaPreview: '',
      mediaPreviewUrl: null,
      showEmojiPicker: false,
      // Lưu vết ô input cuối cùng được focus
      lastFocusedField: {
        refName: 'instructionsTextarea',
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
  watch: {
    post: {
      handler(newPost) {
        if (newPost) {
          this.initializeEditData();
        }
      },
      immediate: true
    },
    isVisible(newVal) {
      if (newVal && this.post) {
        this.initializeEditData();
        this.$nextTick(() => {
          if (this.$refs.recipeNameInput) {
            this.$refs.recipeNameInput.focus();
          }
        });
        
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
  methods: {
    initializeEditData() {
      if (!this.post) return;
      
      const content = this.post.content || '';
      
      // Extract recipe name
      const nameMatch = content.match(/Recipe Name:\s*([^\n]+)/i);
      this.recipeName = nameMatch ? nameMatch[1].trim() : '';
      
      // Extract category
      const categoryMatch = content.match(/Category:\s*(?:[\u{1F300}-\u{1F9FF}]\s*)?([^\n]+)/iu);
      if (categoryMatch) {
        const categoryText = categoryMatch[1].trim();
        this.selectedCategory = this.getCategoryValueFromLabel(categoryText);
      } else {
        this.selectedCategory = this.post.category || '';
      }
      
      // Extract ingredients
      const ingredientsMatch = content.match(/Ingredients:\s*([\s\S]*?)(?=Instructions:)/i);
      this.ingredients = ingredientsMatch ? ingredientsMatch[1].trim() : '';
      
      // Extract instructions
      const instructionsMatch = content.match(/Instructions:\s*([\s\S]*?)$/i);
      this.instructions = instructionsMatch ? instructionsMatch[1].trim() : '';
      
      // If no structured content found, treat as plain text
      if (!this.recipeName && !this.ingredients && !this.instructions) {
        this.recipeName = content.trim();
        this.selectedCategory = '';
        this.ingredients = '';
        this.instructions = '';
      }
      
      // Set media if exists
      this.editMediaPreview = this.post.media ? `http://localhost:3000/${this.post.media}` : '';
      this.mediaPreviewUrl = this.editMediaPreview;
      this.selectedMedia = null;
      
      // Set privacy
      this.editPrivacy = this.post.audience || 'public';
      this.showEmojiPicker = false;
      this.lastFocusedField = { refName: 'instructionsTextarea', modelKey: 'instructions' };
    },

    getCategoryValueFromLabel(label) {
      const categories = {
        'Appetizer': 'appetizer',
        'Main Course': 'main-course',
        'Side Dish': 'side-dish',
        'Soup': 'soup',
        'Salad': 'salad',
        'Dessert': 'dessert',
        'Beverage': 'beverage',
        'Snack': 'snack',
        'Breakfast': 'breakfast',
        'Lunch': 'lunch',
        'Dinner': 'dinner',
        'Vegetarian': 'vegetarian',
        'Vegan': 'vegan',
        'Seafood': 'seafood',
        'Pasta': 'pasta',
        'Rice Dish': 'rice',
        'Noodles': 'noodles',
        'Bakery': 'bakery',
        'Grilled': 'grilled',
        'Fried': 'fried',
        'Steamed': 'steamed',
        'Stir-fry': 'stir-fry',
        'Slow-cooked': 'slow-cooked',
        'Quick Meal': 'quick-meal',
        'Traditional': 'traditional',
        'Fusion': 'fusion',
        'Healthy': 'healthy',
        'Comfort Food': 'comfort-food',
        'Kid-friendly': 'kid-friendly',
        'Party Food': 'party'
      };
      return categories[label] || label.toLowerCase().replace(/\s+/g, '-');
    },

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

    getAvatarUrl(author) {
      if (!author || !author.avatar) return 'http://localhost:3000/uploads/user.png';
      return `http://localhost:3000/${author.avatar}`;
    },

    closeModal() {
      this.resetForm();
      this.$emit('close');
    },

    resetForm() {
      this.recipeName = '';
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
    },

    adjustTextareaHeight(textarea) {
      if (!textarea) return;
      this.$nextTick(() => {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
      });
    },

    // Lưu lại ô input đang focus
    handleFocus(refName, modelKey) {
      this.lastFocusedField = { refName, modelKey };
    },

    toggleEmojiPicker() {
      this.showEmojiPicker = !this.showEmojiPicker;
    },

    // Chèn Emoji vào đúng vị trí
    insertEmoji(emoji) {
      const { refName, modelKey } = this.lastFocusedField;
      const targetField = this.$refs[refName];
      
      const emojiText = emoji.i;

      if (targetField && this[modelKey] !== undefined) {
        const startPos = targetField.selectionStart || this[modelKey].length;
        const endPos = targetField.selectionEnd || this[modelKey].length;
        
        const originalText = this[modelKey];
        
        this[modelKey] = originalText.substring(0, startPos) + 
                         emojiText + 
                         originalText.substring(endPos);
        
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
      if (this.selectedMedia) {
        return this.selectedMedia.type.startsWith('image/');
      }
      if (this.editMediaPreview && this.post) {
        return this.post.mediaType === 'image';
      }
      return false;
    },

    isVideoFile() {
      if (this.selectedMedia) {
        return this.selectedMedia.type.startsWith('video/');
      }
      if (this.editMediaPreview && this.post) {
        return this.post.mediaType === 'video';
      }
      return false;
    },

    async submitEditPost() {
      if (!this.canPost || !this.post) return;

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
        formData.append('audience', this.editPrivacy);
        formData.append('category', this.selectedCategory);
        
        if (this.selectedMedia) {
          formData.append('image', this.selectedMedia);
        }

        const res = await fetch(`http://localhost:3000/posts/${this.post._id}`, {
          method: 'PUT',
          body: formData
        });

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        alert('Cập nhật công thức thành công!');
        this.$emit('updated');
        this.resetForm();
      } catch (err) {
        console.error("Không thể cập nhật công thức:", err);
        alert("Không thể cập nhật công thức: " + err.message);
      }
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

.edit-post-modal-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  width: 90%;
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease-out;
}

.edit-post-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  position: relative;
}

.edit-post-modal-header h3 {
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

/* --- Cập nhật phần này để nút Icon và Media đều nhau --- */
.add-options {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 0; /* Bỏ padding để thẳng hàng với input */
  margin-bottom: 16px;
  width: 100%;
  box-sizing: border-box;
}

.emoji-action-wrapper {
  flex: 1; 
  position: relative;
}

.add-option {
  width: 100%; /* Giãn full chiều rộng cha */
  flex: 1; /* Để nút Media (label) tự giãn bằng wrapper */
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
  margin: 0; 
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
  bottom: 100%; 
  left: 0;
  z-index: 1001;
  margin-bottom: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  background: white;
}
/* ---------------------------------------------------- */

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
  .edit-post-modal-content {
    width: 95%;
    margin: 20px;
    max-height: calc(100vh - 40px);
  }
  
  .recipe-textarea {
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

.edit-post-modal-content::-webkit-scrollbar {
  width: 6px;
}

.edit-post-modal-content::-webkit-scrollbar-track {
  background: #f8f9fa;
  border-radius: 3px;
}

.edit-post-modal-content::-webkit-scrollbar-thumb {
  background: #bcc0c4;
  border-radius: 3px;
}

.edit-post-modal-content::-webkit-scrollbar-thumb:hover {
  background: #8a8d91;
}
</style>