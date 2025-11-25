<template>
  <div v-if="isVisible" class="modal-overlay" @click="handleClose">
    <div class="status-card" @click.stop>
      
      <div :class="['status-icon', type]">
        <svg v-if="type === 'success'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <svg v-else-if="type === 'error'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      
      <h3>{{ title }}</h3>
      <p class="message">{{ message }}</p>
      <p v-if="subMessage" class="sub-text">{{ subMessage }}</p>
      
      <button :class="['btn-confirm', type]" @click="handleConfirm">
        {{ buttonText }}
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: "NotificationModal", // Đã đổi tên
  props: {
    isVisible: { type: Boolean, default: false },
    type: { type: String, default: 'success' }, // 'success', 'error', 'warning'
    title: { type: String, default: "" },
    message: { type: String, default: "" },
    subMessage: { type: String, default: "" },
    buttonText: { type: String, default: "OK" }
  },
  methods: {
    handleConfirm() {
      this.$emit('confirm');
    },
    handleClose() {
      // this.$emit('close'); // Bỏ comment nếu muốn cho phép click ra ngoài để đóng
    }
  }
};
</script>

<style scoped>
/* Style giữ nguyên như cũ, chỉ đổi tên class cho hợp lý nếu muốn */
.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.6); z-index: 3000;
  display: flex; justify-content: center; align-items: center;
  backdrop-filter: blur(4px);
  animation: fadeIn 0.3s ease;
}

.status-card {
  background: white; padding: 32px; border-radius: 24px;
  width: 90%; max-width: 360px; text-align: center;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.status-icon {
  width: 72px; height: 72px; margin: 0 auto 20px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
}
.status-icon svg { width: 40px; height: 40px; }

.status-icon.success { background: #d1fae5; }
.status-icon.success svg { color: #10b981; }

.status-icon.error { background: #fee2e2; }
.status-icon.error svg { color: #ef4444; }

.status-icon.warning { background: #fef3c7; }
.status-icon.warning svg { color: #f59e0b; }

.status-card h3 { font-size: 22px; font-weight: 800; color: #111827; margin: 0 0 8px; }
.message { font-size: 15px; color: #374151; margin: 0; line-height: 1.5; }
.sub-text { font-size: 13px; color: #6b7280; margin-top: 4px; margin-bottom: 24px; }

.btn-confirm {
  width: 100%; padding: 12px; border-radius: 12px; border: none;
  font-weight: 700; font-size: 15px; cursor: pointer; transition: all 0.2s; color: white;
}

.btn-confirm.success { background: #10b981; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); }
.btn-confirm.success:hover { background: #059669; transform: translateY(-2px); }

.btn-confirm.error { background: #ef4444; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3); }
.btn-confirm.error:hover { background: #dc2626; transform: translateY(-2px); }

.btn-confirm.warning { background: #f59e0b; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3); }
.btn-confirm.warning:hover { background: #d97706; transform: translateY(-2px); }

@keyframes popIn { 0% { transform: scale(0.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
</style>