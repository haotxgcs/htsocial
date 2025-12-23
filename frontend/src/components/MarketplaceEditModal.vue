<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal">
      <h2>Edit item</h2>

      <input v-model="form.title" placeholder="Title" />

      <select v-model="form.type">
        <option value="ingredient">Ingredient</option>
        <option value="dish">Dish</option>
        <option value="tool">Tool</option>
      </select>

      <input
        v-model.number="form.price"
        type="number"
        placeholder="Price"
      />

      <textarea
        v-model="form.description"
        placeholder="Description"
      ></textarea>

      <!-- images preview -->
      <div class="image-preview">
        <img
          v-for="(img, i) in previewImages"
          :key="i"
          :src="img"
        />
      </div>

      <input type="file" multiple @change="onFileChange" />

      <div class="actions">
        <button class="cancel" @click="$emit('close')">Cancel</button>
        <button class="save" @click="submit">Save changes</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "MarketplaceEditModal",
  props: {
    item: Object
  },
  data() {
    return {
      form: {
        title: "",
        type: "",
        price: 0,
        description: ""
      },
      files: [],
      previewImages: []
    };
  },
  watch: {
  item: {
    immediate: true,
    handler(newItem) {
      if (!newItem) return;

      this.form = {
        title: newItem.title || "",
        type: newItem.type || "ingredient",
        price: newItem.price || 0,
        description: newItem.description || ""
      };

      this.previewImages =
        newItem.images?.map(i => `http://localhost:3000/${i}`) || [];
    }
  }
}, 

  methods: {
    onFileChange(e) {
      this.files = Array.from(e.target.files);
      this.previewImages = this.files.map(f =>
        URL.createObjectURL(f)
      );
    },

    async submit() {
      const token = localStorage.getItem("token");

      const fd = new FormData();
      Object.entries(this.form).forEach(([k, v]) =>
        fd.append(k, v)
      );
      this.files.forEach(f => fd.append("images", f));

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

      if (!res.ok) {
        alert("Update failed");
        return;
      }

      this.$emit("updated");
      this.$emit("close");
    }
  }
};
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}

.modal {
  width: 420px;
  background: white;
  border-radius: 16px;
  padding: 20px;
}

.modal h2 {
  margin-bottom: 12px;
}

.modal input,
.modal select,
.modal textarea {
  width: 100%;
  margin-bottom: 10px;
  padding: 10px;
  border-radius: 10px;
  border: 1px solid #ddd;
}

.image-preview {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.image-preview img {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 8px;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.cancel {
  background: #eee;
}

.save {
  background: #ff642f;
  color: white;
}
</style>
