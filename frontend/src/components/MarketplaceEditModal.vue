<template>
  <div
    v-if="isVisible"
    class="create-post-modal-overlay"
    @click.stop
    @click.self="!loading && requestClose()"
  >
    <div class="create-post-modal-content" @click.stop>

      <!-- HEADER -->
      <div class="create-post-modal-header">
        <h3>Edit marketplace listing</h3>
        <button class="close-btn" @click="requestClose" :disabled="loading">
          &times;
        </button>
      </div>

      <!-- USER INFO -->
      <div class="post-creator-info">
        <img
          :src="`http://localhost:3000/${user?.avatar || 'user.png'}`"
          class="creator-avatar"
        />
        <div class="creator-details">
          <strong>{{ user?.firstname }} {{ user?.lastname }}</strong>
          <span class="sub-text">Marketplace</span>
        </div>
      </div>

      <!-- BODY -->
      <div class="post-content-area">

        <div class="recipe-field">
          <label class="field-label">Item name</label>
          <input v-model="form.title" class="recipe-input" />
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
            class="recipe-input"
            v-model="priceInput"
            @input="onPriceInput"
            @blur="formatPrice"
          />
        </div>

        <div class="recipe-field">
          <label class="field-label">Quantity</label>
          <input
            class="recipe-input"
            type="number"
            min="0"
            v-model.number="form.quantity"
          />
          <div v-if="form.quantity === 0" style="font-size:12px;color:#e67e22;margin-top:4px;">0 = Out of Stock (item will be marked as sold)</div>

        </div>

        <div class="recipe-field">
          <label class="field-label">Estimated Delivery (days)</label>
          <input
            class="recipe-input"
            type="number"
            min="1"
            max="60"
            v-model.number="form.estimatedDeliveryDays"
          />
          <div style="font-size:12px;color:#999;margin-top:4px;">
            Buyers will see this as estimated shipping time.
          </div>
        </div>

        <div class="recipe-field">
          <label class="field-label">Description</label>
          <textarea
            class="recipe-textarea"
            v-model="form.description"
          />
        </div>

        <div class="recipe-field">
          <label class="field-label">Images</label>

          <label class="image-upload-btn">
            <input
              type="file"
              multiple
              accept="image/*"
              hidden
              @change="handleFiles"
            />
            <span>Upload new images</span>
          </label>

          <p class="sub-text">You can keep old images or upload new ones (Min 1 - Max 5)</p>
        </div>

        <!-- PREVIEW -->
        <div v-if="previews.length">
          <div class="image-preview-list">
            <div
              v-for="(img, i) in previews"
              :key="i"
              class="image-preview-item"
            >
              <img :src="img" />
              <button class="remove-image-btn" @click="removeImage(i)">
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
          {{ loading ? "Saving..." : "Save changes" }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "MarketplaceEditModal",
  props: {
    isVisible: Boolean,
    user: Object,
    item: Object
  },
  data() {
    return {
      loading: false,
      files: [],
      previews: [],
      priceInput: "",
      form: {
        title: "",
        description: "",
        quantity: 0,
        estimatedDeliveryDays: 7,
        type: "ingredient",
        condition: null
      },
      removedImages: []
    };
  },

  computed: {
    canSubmit() {
      return (
        this.form.title.trim() &&
        this.form.description.trim() &&
        Number(this.priceInput) > 0 &&
        this.form.quantity >= 0 &&
        this.totalImagesCount > 0 
      );
    },

    totalImagesCount() {
    return this.previews.length;
  }
  },

watch: {
  item: {
    immediate: true,
    handler(val) {
      if (val) {
        this.initForm();
      }
    }
  }
},


  methods: {
    requestClose() {
      this.$emit("close");
    },

    initForm() {
    this.form.title = this.item.title ?? "";
    this.form.description = this.item.description ?? "";
    this.form.quantity = this.item.quantity ?? 0;
    this.form.type = this.item.type ?? "ingredient";
    this.form.condition = this.item.condition ?? null;
    this.form.estimatedDeliveryDays = this.item.estimatedDeliveryDays ?? 7;

    this.priceInput = Number(this.item.price).toFixed(2);
    this.previews =
      this.item.images?.map(img =>
        img.startsWith("http")
          ? img
          : `http://localhost:3000/${img}`
      ) || [];


    this.files = [];
    this.removedImages = [];
  },


handleFiles(e) {
  const newFiles = Array.from(e.target.files);

  // ❌ Không chọn file
  if (!newFiles.length) return;

  // ❌ Nếu tổng ảnh vượt quá 5
  if (this.previews.length + newFiles.length > 5) {
    alert("You can upload a maximum of 5 images.");
    e.target.value = "";
    return;
  }

  newFiles.forEach(file => {
    // ❌ Chỉ cho phép ảnh
    if (!file.type.startsWith("image/")) return;

    this.files.push(file); // thêm file mới
    this.previews.push(URL.createObjectURL(file)); // thêm preview
  });

  e.target.value = ""; // cho phép upload lại cùng file
},


    removeImage(i) {
      const url = this.previews[i];

      // ✅ ẢNH CŨ (Cloudinary hoặc local)
      if (url.startsWith("http")) {
        const original = this.item.images[i];
        this.removedImages.push(original);
      }

      // ✅ ẢNH MỚI (blob preview)
      else {
        this.files.splice(i - this.getOldImagesCount(), 1);
      }

      this.previews.splice(i, 1);
    },


    getOldImagesCount() {
      return this.item?.images?.length || 0;
    },



    onPriceInput(e) {
      this.priceInput = e.target.value.replace(/[^0-9.]/g, "");
    },

    formatPrice() {
      const n = Number(this.priceInput);
      this.priceInput = isNaN(n) ? "0.00" : n.toFixed(2);
    },



    async submit() {
      const token = localStorage.getItem("token");
      if (!token) return alert("Login required");

      const fd = new FormData();

      fd.append("title", this.form.title);
      fd.append("description", this.form.description);
      fd.append("type", this.form.type);
      fd.append("price", Number(this.priceInput));
      fd.append("quantity", Number(this.form.quantity));
      fd.append("estimatedDeliveryDays", Number(this.form.estimatedDeliveryDays) || 7);

      if (this.form.condition) {
        fd.append("condition", this.form.condition);
      }

      // ✅ 1. GỬI ẢNH BỊ XOÁ TRƯỚC
      this.removedImages.forEach(img => {
        fd.append("removedImages", img);
      });

      // ✅ 2. GỬI ẢNH MỚI
      this.files.forEach(f => fd.append("images", f));

      this.loading = true;

      const res = await fetch(
        `http://localhost:3000/marketplace/${this.item._id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: fd
        }
      );

      this.loading = false;

      if (!res.ok) return alert("Update failed");

      const updatedItem = await res.json();

      this.$emit("updated", updatedItem);
      this.$emit("close");
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
.create-post-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(255, 255, 255, 0.8); display: flex; justify-content: center; align-items: center; z-index: 12000; animation: fadeIn 0.2s ease-out; }
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
.recipe-input:focus, .category-select:focus { border-color: #FF642F; background: #ffffff; outline: none;  }
.recipe-textarea { width: 100%; min-height: 100px; padding: 12px; font-size: 15px; font-family: inherit; line-height: 1.4; color: #1c1e21; background: #f8f9fa; border: 1px solid #e4e6ea; border-radius: 8px; box-sizing: border-box; resize: vertical; transition: border-color 0.2s, background-color 0.2s; }
.recipe-textarea:focus { border-color: #FF642F; background: #ffffff; outline: none;  }
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