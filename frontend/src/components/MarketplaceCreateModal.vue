<template>
  <div
    v-if="isVisible"
    class="create-post-modal-overlay"
    @click.self="!loading && requestClose()"
  >
    <div class="create-post-modal-content">

      <!-- HEADER -->
      <div class="create-post-modal-header">
        <h3>Create marketplace listing</h3>
        <button class="close-btn" @click="requestClose" :disabled="loading">
          &times;
        </button>
      </div>

      <!-- USER INFO -->
      <div class="post-creator-info">
        <img
          :src="user?.avatar?.startsWith('http')
            ? user.avatar
            : `http://localhost:3000/${user?.avatar || 'user.png'}`
          "
          class="creator-avatar"
        />

        <div class="creator-details">
          <strong>{{ user?.firstname }} {{ user?.lastname }}</strong>
          <span class="sub-text">Marketplace</span>
        </div>
      </div>

      <!-- BODY -->
      <!-- BODY -->
      <div class="post-content-area">

        <div class="recipe-field">
          <label class="field-label">Item name</label>
          <input
            v-model="form.title"
            class="recipe-input"
            placeholder="Example: Fresh tomatoes"
            :disabled="loading"
          />
        </div>

        <div class="recipe-field">
          <label class="field-label">Type</label>
          <select v-model="form.type" class="category-select">
            <option value="ingredient">Ingredient</option>
            <option value="dish">Dish</option>
            <option value="tool">Cooking Tool</option>
          </select>
        </div>

        <div v-if="form.type === 'tool'" class="recipe-field">
          <label class="field-label">Condition</label>
          <select v-model="form.condition" class="category-select">
            <option value="new">New</option>
            <option value="used">Used</option>
          </select>
        </div>

        <div class="recipe-field">
          <label class="field-label">Price ($)</label>
          <input
            type="text"
            class="recipe-input"
            placeholder="0.00"
            v-model="priceInput"
            @input="onPriceInput"
            @blur="formatPrice"
            :disabled="loading"
          />
        </div>

        <!-- ❗ FIX Ở ĐÂY: bỏ div bọc dư -->
        <div class="recipe-field">
          <label class="field-label">Quantity</label>
          <input
            type="text"
            class="recipe-input"
            v-model="form.quantity"
            @input="onQuantityInput"
            @blur="onQuantityBlur"
            :disabled="loading"
          />
        </div>

        <div class="recipe-field">
          <label class="field-label">Description</label>
          <textarea
            v-model="form.description"
            class="recipe-textarea"
            placeholder="Describe your item..."
            :disabled="loading"
          />
        </div>

        <div class="recipe-field">
          <label class="field-label">Images</label>

          <label class="image-upload-btn">
            <input
              ref="fileInput"
              type="file"
              multiple
              accept="image/*"
              @change="handleFiles"
              hidden
            />
            <span>Upload images</span>
          </label>

          <p class="sub-text">
            Min 1 – Max 5 images (JPG/PNG, max 5MB each)
          </p>
        </div>

        <div v-if="previews.length">
          <div class="image-preview-list">
            <div
              v-for="(img, i) in previews"
              :key="i"
              class="image-preview-item"
            >
              <img :src="img" />
              <button
                class="remove-image-btn"
                type="button"
                @click="removeImage(i)"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

      </div>


      <!-- FOOTER -->
      <div class="post-actions-footer">
        <button
          class="post-submit-btn"
          :disabled="loading || !canSubmit"
          @click="submit"
        >
          {{ loading ? "Posting..." : "Post listing" }}
        </button>
      </div>
    </div>

    <!-- CONFIRM DISCARD -->
    <ConfirmDialog
      v-if="confirmVisible"
      message="Are you sure you want to discard your changes?"
      @confirm="handleConfirmDiscard"
      @cancel="confirmVisible = false"
    />
  </div>
</template>



<script>
import ConfirmDialog from "./ConfirmDialog.vue";

export default {
  name: "MarketplaceCreateModal",
  components: { ConfirmDialog },
  props: {
    isVisible: Boolean,
    user: Object
  },
  data() {
    return {
      loading: false,
      files: [],
      previews: [],
      confirmVisible: false,
      form: {
        title: "",
        description: "",
        price: null,
        quantity: 1,
        type: "ingredient",
        condition: "new"
      },

      priceInput: "",
    };
  },
  computed: {
    canSubmit() {
    return (
      this.form.title.trim() &&
      this.form.description.trim() &&
      this.priceInput &&
      Number(this.priceInput) > 0 &&
      this.form.quantity >= 1 &&
      this.files.length >= 1 &&
      (this.form.type !== "tool" || this.form.condition)
    );
  }
  },
  watch: {
  "form.type"(val) {
    if (val !== "tool") {
      this.form.condition = null;
    } else if (!this.form.condition) {
      this.form.condition = "new";
    }
  }
},
  methods: {
    handleFiles(e) {
      const files = Array.from(e.target.files);

      if (files.length < 1 || files.length > 5) {
        alert("Please upload 1–5 images");
        return;
      }

      const valid = files.every(
        f => f.type.startsWith("image/") && f.size <= 5 * 1024 * 1024
      );

      if (!valid) {
        alert("Images must be JPG/PNG and ≤ 5MB");
        return;
      }

      this.files = files;
      this.previews = files.map(f => URL.createObjectURL(f));

      // ❌ Không reset ở đây nữa
    },



    hasChanges() {
      return (
        this.form.title.trim() ||
        this.form.description.trim() ||
        this.priceInput ||
        this.files.length
      );
    },

    requestClose() {
      if (!this.hasChanges()) {
        this.$emit("close");
        return;
      }
      this.confirmVisible = true;
    },

    handleConfirmDiscard() {
      this.confirmVisible = false;
      this.resetForm();
      this.$emit("close");
    },

    resetForm() {
      this.form = {
        title: "",
        description: "",
        price: null,
        quantity: 1,
        type: "ingredient",
        condition: null
      };
      this.priceInput = "";
      this.files = [];
      this.previews.forEach(URL.revokeObjectURL);
      this.previews = [];

      if (this.$refs.fileInput) {
        this.$refs.fileInput.value = "";
      }
    },

async submit() {
  const token = localStorage.getItem("token");
  if (!token) return alert("Please login first");

  const formData = new FormData();

  // Append fields (except price)
  Object.entries(this.form).forEach(([k, v]) => {
    if (k !== "price" && v !== null && v !== "") {
      formData.append(k, v);
    }
  });

  // Price + quantity as number
  formData.append("price", Number(this.priceInput));
  formData.append("quantity", Number(this.form.quantity));

  // Images
  this.files.forEach(f => formData.append("images", f));

  this.loading = true;

  const res = await fetch("http://localhost:3000/marketplace/create", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  });

  this.loading = false;

  const data = await res.json();

  if (!res.ok) {
    console.error("Create item error:", data);
    alert(data.msg || "Create item failed");
    return;
  }

  alert("✅ Item created successfully!");
  this.resetForm();
  this.$emit("created");
  this.$emit("close");
},


    onPriceInput(e) {
    let value = e.target.value.replace(/[^0-9.]/g, "");

    const parts = value.split(".");
    if (parts.length > 2) {
      value = parts[0] + "." + parts[1];
    }

    if (parts[1]) {
      value = parts[0] + "." + parts[1].slice(0, 2);
    }

    this.priceInput = value;
  },

  formatPrice() {
    if (!this.priceInput) return;
    this.priceInput = Number(this.priceInput).toFixed(2);
  },

onQuantityInput(e) {
  const value = e.target.value.replace(/[^0-9]/g, "");
  // ❗ cho phép rỗng
  this.form.quantity = value === "" ? "" : Number(value);
},

onQuantityBlur() {
  if (!this.form.quantity || this.form.quantity < 1) {
    this.form.quantity = 1;
  }
},



  removeImage(index) {
  URL.revokeObjectURL(this.previews[index]);
  this.previews.splice(index, 1);
  this.files.splice(index, 1);
}


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
.field-label { display: block; font-size: 16px; font-weight: 600; color: #1c1e21; margin-bottom: 10px; }
.recipe-input, .category-select { width: 100%; padding: 12px; font-size: 15px; font-family: inherit; line-height: 1.2; color: #1c1e21; background: #f8f9fa; border: 1px solid #e4e6ea; border-radius: 8px; box-sizing: border-box; transition: border-color 0.2s, background-color 0.2s; }
.recipe-input { font-size: 18px; }
.category-select { cursor: pointer; appearance: none; background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e"); background-repeat: no-repeat; background-position: right 12px center; background-size: 20px; padding-right: 40px; }
.recipe-input:focus, .category-select:focus { border-color: #FF642F; background: #ffffff; outline: none;  }
.recipe-textarea { width: 100%; min-height: 100px; padding: 12px; font-size: 15px; font-family: inherit; line-height: 1.4; color: #1c1e21; background: #f8f9fa; border: 1px solid #e4e6ea; border-radius: 8px; box-sizing: border-box; resize: vertical; transition: border-color 0.2s, background-color 0.2s; }
.recipe-textarea:focus { border-color: #FF642F; background: #ffffff; outline: none;  }
.recipe-textarea::placeholder { color: #8a8d91; font-style: italic; }
.ingredients-textarea { font-family: monospace; font-size: 14px; }
.instructions-textarea { min-height: 120px; }
.media-preview-container { position: relative; border: 1px solid #e4e6ea; border-radius: 12px; overflow: hidden; background: #f8f9fa; }
.preview-image, .preview-video { width: 100%; max-height: 300px; object-fit: cover; display: block; }
.remove-media-btn { position: absolute; top: 8px; right: 8px; background: rgba(0, 0, 0, 0.6); color: white; border: none; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 18px; transition: background-color 0.2s; }
.remove-media-btn:hover { background: rgba(0, 0, 0, 0.8); }
.add-options { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 16px; width: 100%; box-sizing: border-box; flex:1; }
.emoji-action-wrapper { flex: 1; position: relative; }
.add-option { width: 100%; padding: 10px 12px; display: flex; align-items: center; justify-content: center; gap: 8px; border-radius: 10px; background: #f0f2f5; border: 1px solid #ccc; cursor: pointer; transition: background-color 0.2s; font-size: 14px; white-space: nowrap; box-sizing: border-box; flex:1; }
.add-option:hover { background: #fdf4f0; color: #FF642F; }
.add-option:hover img { filter: invert(53%) sepia(35%) saturate(3000%) hue-rotate(345deg) brightness(100%) contrast(105%);}
.option-icon img { width: 20px; height: 20px; }
.emoji-picker-popover { position: absolute; bottom: 100%; left: 0; z-index: 1001; margin-bottom: 10px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2); border-radius: 8px; background: white; }
.post-actions-footer { padding: 16px 24px; border-top: 1px solid #e4e6ea; }
.post-submit-btn {
  width: 100%;
  padding: 14px;
  background: #FF642F;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.post-submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #e4e6ea; 
  color: #bcc0c4;
}

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
@media (max-width: 768px) { .create-post-modal-content { width: 95%; margin: 20px; max-height: calc(100vh - 40px); } .post-textarea { font-size: 18px; } .add-options { flex-direction: column; align-items: stretch; } .add-option { justify-content: flex-start; } }
.create-post-modal-content::-webkit-scrollbar { width: 6px; }
.create-post-modal-content::-webkit-scrollbar-track { background: #f8f9fa; border-radius: 3px; }
.create-post-modal-content::-webkit-scrollbar-thumb { background: #bcc0c4; border-radius: 3px; }
.create-post-modal-content::-webkit-scrollbar-thumb:hover { background: #8a8d91; }
.sub-text {
  font-size: 13px;
  color: #65676b;
}

.row-2 {
  display: flex;
  gap: 12px;
}

.media-preview-container {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.image-upload-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border-radius: 10px;
  background: #f0f2f5;
  border: 1px dashed #d1d5db;
  cursor: pointer;
  font-weight: 500;
  color: #1c1e21;
  transition: background 0.2s, border-color 0.2s;
}

.image-upload-btn:hover {
  background: #fdf4f0;
  border-color: #FF642F;
  color: #FF642F;
}

.upload-icon {
  font-size: 20px;
}

/* LIST CONTAINER */
.image-preview-list {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 4px;
}

/* EACH IMAGE */
.image-preview-item {
  position: relative;
  width: 90px;
  height: 90px;
  flex-shrink: 0;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #e4e6ea;
  background: #f8f9fa;
}

.image-preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* REMOVE BUTTON */
.remove-image-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-image-btn:hover {
  background: rgba(0, 0, 0, 0.85);
}


</style>

