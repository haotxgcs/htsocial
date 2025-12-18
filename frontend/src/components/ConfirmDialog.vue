<template>
  <transition name="fade">
    <div v-if="visible" class="modal-overlay" @click.self="cancel">
      <div class="confirm-card">
        
        <div class="icon-wrapper">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h3>Confirm</h3>
        <p class="message">{{ message }}</p>

        <div class="actions">
          <button class="btn-cancel" @click="cancel">Cancel</button>
          <button class="btn-confirm" @click="confirm">Confirm</button>
        </div>

      </div>
    </div>
  </transition>
</template>

<script>
export default {
  props: ['message'],
  emits: ['confirm', 'cancel'],
  data() {
    return {
      visible: true,
      confirmVisible: false,
      confirmMessage: '',
      itemToDeleteId: null, // ID của món cần xóa
      deleteType: null,     // 'post' hoặc 'share'
    };
  },
  methods: {
    confirm() {
      this.visible = false;
      this.$emit('confirm');
    },
    cancel() {
      this.visible = false;
      this.$emit('cancel');
    }
  }
};
</script>

<style scoped>
/* 1. Overlay (Nền tối mờ) */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.6);
  z-index: 12000; /* Cao hơn các modal khác */
  display: flex; justify-content: center; align-items: center;
  backdrop-filter: blur(4px); /* Hiệu ứng làm mờ nền */
}

/* 2. Card chính */
.confirm-card {
  background: white;
  padding: 32px;
  border-radius: 20px;
  width: 90%;
  max-width: 400px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

/* 3. Icon */
.icon-wrapper {
  width: 64px; height: 64px;
  background-color: #fdf4f0; 
  color: #FF642F; 
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 20px;
}
.icon-wrapper svg {
  width: 36px; height: 36px;
}

/* 4. Typography */
.confirm-card h3 {
  font-size: 20px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 10px;
}

.message {
  font-size: 15px;
  color: #6b7280; /* Màu xám chữ */
  margin: 0 0 24px;
  line-height: 1.5;
}

/* 5. Buttons Layout */
.actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

/* Style nút Hủy */
.btn-cancel {
  flex: 1;
  padding: 12px;
  border-radius: 10px;
  border: none;
  background-color: #f3f4f6;
  color: #374151;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-cancel:hover {
  background-color: #e5e7eb;
}

/* Style nút Đồng ý */
.btn-confirm {
  flex: 1;
  padding: 12px;
  border-radius: 10px;
  border: none;
  background-color: #FF642F; /* Màu xanh chủ đạo */
  color: white;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
  transition: all 0.2s;
}
.btn-confirm:hover {
  background-color: #FF642F;
  transform: translateY(-1px);
}

/* Hiệu ứng Animation */
@keyframes popIn {
  0% { transform: scale(0.8); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

/* Vue Transition */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
