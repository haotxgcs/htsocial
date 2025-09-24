<template>
  <div v-if="isVisible" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>

      <!-- Header -->
      <div class="modal-header">
        <h3>Edit Post</h3>
        <button class="close-btn" @click="closeModal">&times;</button>
      </div>

      <!-- Body -->
      <div class="modal-body">
        <!-- Post author -->
        <div class="post-creator-info">
          <img :src="getAvatarUrl(user)" class="creator-avatar" />
          <div class="creator-details">
            <strong>{{ user.firstname }} {{ user.lastname }}</strong>
            <div class="privacy-selector">
              <select v-model="editPrivacy">
                <option value="public">🌍 Public</option>
                <option value="friends">👥 Friends</option>
                <option value="private">🔒 Private</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Content -->
        <textarea
          v-model="editContent"
          class="post-textarea"
          placeholder="What are you thinking?"
          ref="editTextarea"
          @input="adjustTextareaHeight"
        ></textarea>

        <!-- Existing media -->
        <div v-if="editMediaPreview" class="media-preview-container">
          <img
            v-if="editMediaType === 'image'"
            :src="editMediaPreview"
            class="preview-image"
          />
          <video
            v-else-if="editMediaType === 'video'"
            controls
            class="preview-video"
          >
            <source :src="editMediaPreview" type="video/mp4" />
          </video>
          <button class="remove-media-btn" @click="removeEditMedia">&times;</button>
        </div>

        <!-- Add emoji + media -->
        <div class="add-options">
          <!-- Emoji button -->
          <button 
            @click="showEmojiPicker = !showEmojiPicker" 
            class="add-option"
          >
            <span class="option-icon"><img src="../assets/emoji.png" /></span>
            <span>Emoji</span>
          </button>

          <!-- Media button -->
          <label class="add-option">
            <input 
              type="file" 
              @change="handleEditFile" 
              accept="image/*,video/*" 
              style="display: none;" 
            />
            <span class="option-icon"><img src="../assets/media.png" /></span>
            <span>Media</span>
          </label>
        </div>

        <!-- Emoji Picker -->
        <EmojiPicker 
          v-if="showEmojiPicker" 
          @select="insertEditEmoji"
          style="z-index: 9999; position: relative;"
        />
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <button @click="closeModal" class="btn btn-secondary">
          Cancel
        </button>
        <button @click="submitEditPost" class="btn btn-primary">
          Save
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import EmojiPicker from './Emoji.vue';

export default {
  name: 'EditPostModal',
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
      editContent: '',
      editMediaType: '',
      editMediaPreview: '',
      editMediaFile: null,
      editPrivacy: 'public',
      showEmojiPicker: false
    };
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
          if (this.$refs.editTextarea) {
            this.adjustTextareaHeight();
            this.$refs.editTextarea.focus();
          }
        });
      }
    }
  },
  methods: {
    initializeEditData() {
      if (!this.post) return;
      
      this.editContent = this.post.content || '';
      this.editMediaType = this.post.mediaType || '';
      this.editMediaPreview = this.post.media ? `http://localhost:3000/${this.post.media}` : '';
      this.editMediaFile = null;
      this.editPrivacy = this.post.audience || 'public';
      this.showEmojiPicker = false;
    },

    getAvatarUrl(author) {
      if (!author || !author.avatar) return 'http://localhost:3000/uploads/user.png';
      return `http://localhost:3000/${author.avatar}`;
    },

    adjustTextareaHeight() {
      this.$nextTick(() => {
        const textarea = this.$refs.editTextarea;
        if (textarea) {
          textarea.style.height = 'auto';
          textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
        }
      });
    },

    insertEditEmoji(emoji) {
      const textarea = this.$refs.editTextarea;
      if (!textarea) {
        console.warn("Không tìm thấy editTextarea");
        return;
      }

      const startPos = textarea.selectionStart || 0;
      const endPos = textarea.selectionEnd || 0;

      this.editContent =
        this.editContent.substring(0, startPos) +
        emoji +
        this.editContent.substring(endPos);

      this.$nextTick(() => {
        textarea.focus();
        textarea.setSelectionRange(
          startPos + emoji.length,
          startPos + emoji.length
        );
      });

      this.adjustTextareaHeight();
    },

    handleEditFile(e) {
      const file = e.target.files[0];
      if (!file) return;
      
      this.editMediaFile = file;
      this.editMediaType = file.type.startsWith('video') ? 'video' : 'image';
      this.editMediaPreview = URL.createObjectURL(file);
    },

    removeEditMedia() {
      if (this.editMediaPreview && this.editMediaPreview.startsWith('blob:')) {
        URL.revokeObjectURL(this.editMediaPreview);
      }
      this.editMediaPreview = '';
      this.editMediaFile = null;
      this.editMediaType = '';
    },

    async submitEditPost() {
      if (!this.post) return;

      try {
        const formData = new FormData();
        formData.append('content', this.editContent);
        formData.append('audience', this.editPrivacy);
        
        if (this.editMediaFile) {
          formData.append('image', this.editMediaFile);
        }

        const res = await fetch(`http://localhost:3000/posts/${this.post._id}`, {
          method: 'PUT',
          body: formData
        });

        if (!res.ok) throw new Error('Failed to update post');

        alert('Update successfully!');
        this.$emit('updated');
        this.closeModal();
      } catch (err) {
        console.error("Error to update post:", err);
        alert("Unable to update post!");
      }
    },

    closeModal() {
      // Clean up media preview URL if it's a blob
      if (this.editMediaPreview && this.editMediaPreview.startsWith('blob:')) {
        URL.revokeObjectURL(this.editMediaPreview);
      }
      
      this.showEmojiPicker = false;
      this.$emit('close');
    }
  },

  beforeUnmount() {
    // Clean up any blob URLs
    if (this.editMediaPreview && this.editMediaPreview.startsWith('blob:')) {
      URL.revokeObjectURL(this.editMediaPreview);
    }
  }
};
</script>

<style scoped>
/* Edit post modal */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  overflow-y: auto;
}

.modal-content {
  background: white;
  max-width: 500px;
  max-height: 90vh;
  width: 100%;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #ddd;
  position: relative;
  flex-shrink: 0; 
}

.modal-header h3 {
  font-size: 18px;
  font-weight: bold;
  margin: 0;
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

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
  min-height: 0;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid #ddd;
  flex-shrink: 0;
  background: white;
}

.post-creator-info {
  display: flex;
  align-items: center;
  padding: 16px 0;
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

.post-textarea {
  width: 100%;
  min-height: 120px;
  border: none;
  outline: none;
  resize: none;
  font-size: 16px;
  font-family: inherit;
  line-height: 1.4;
  color: #1c1e21;
  background: transparent;
  padding: 8px 0;
  margin-bottom: 16px;
  box-sizing: border-box;
}

.post-textarea::placeholder {
  color: #8a8d91;
  font-weight: 400;
}

.media-preview-container {
  position: relative;
  border: 1px solid #e4e6ea;
  border-radius: 12px;
  overflow: hidden;
  background: #f8f9fa;
  margin-bottom: 16px;
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

.btn-primary {
  background: #1877f2;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
}

.btn-primary:hover {
  background: #166fe5;
}

.btn-secondary {
  background: #e4e6eb;
  color: #050505;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
}

.btn-secondary:hover {
  background: #d8dadf;
}

/* Responsive Design */
@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    margin: 20px;
    max-height: calc(100vh - 40px);
  }
  
  .post-textarea {
    font-size: 16px;
  }
  
  .add-options {
    flex-direction: column;
    align-items: stretch;
  }
  
  .add-option {
    justify-content: flex-start;
  }
}
</style>