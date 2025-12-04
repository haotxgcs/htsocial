<template>
  <transition name="fade">
    <div v-if="isVisible" class="image-modal-overlay" @click="close">
      
      <button class="close-btn" @click="close">&times;</button>
      
      <div class="image-container" @click.stop>
        <img :src="imageUrl" class="preview-image" alt="Preview" />
      </div>

    </div>
  </transition>
</template>

<script>
export default {
  name: "ImagePreviewModal",
  props: {
    isVisible: {
      type: Boolean,
      required: true
    },
    imageUrl: {
      type: String,
      default: ""
    }
  },
  methods: {
    close() {
      this.$emit("close");
    }
  },
  // Lắng nghe phím ESC để đóng modal cho chuyên nghiệp
  mounted() {
    document.addEventListener("keydown", (e) => {
      if (this.isVisible && e.key === "Escape") {
        this.close();
      }
    });
  }
};
</script>

<style scoped>
.image-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.9); /* Nền đen mờ đậm */
  z-index: 9999; /* Đảm bảo nằm trên cùng */
  display: flex;
  justify-content: center;
  align-items: center;
  backdrop-filter: blur(5px); /* Hiệu ứng làm mờ nền phía sau */
}

.image-container {
  max-width: 90%;
  max-height: 90%;
  position: relative;
  animation: zoomIn 0.3s ease-out;
}

.preview-image {
  max-width: 100%;
  max-height: 90vh; /* Chiều cao tối đa 90% màn hình */
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 5px 30px rgba(0,0,0,0.5);
}

.close-btn {
  position: absolute;
  top: 20px;
  right: 30px;
  background: none;
  border: none;
  color: white;
  font-size: 40px;
  cursor: pointer;
  z-index: 10000;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.close-btn:hover {
  opacity: 1;
}

/* Hiệu ứng Zoom khi mở */
@keyframes zoomIn {
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

/* Vue Transition Fade */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>