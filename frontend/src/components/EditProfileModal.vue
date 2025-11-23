<template>
  <div v-if="isVisible" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      
      <div class="modal-header-tabs">
        <button 
          :class="['tab-btn', { active: currentTab === 'public' }]" 
          @click="currentTab = 'public'"
        >
          Thông tin cá nhân
        </button>
        <button 
          :class="['tab-btn', { active: currentTab === 'security' }]" 
          @click="currentTab = 'security'"
        >
          Tài khoản & Bảo mật
        </button>
        <button class="close-btn" @click="closeModal">&times;</button>
      </div>

      <div class="modal-body">
        
        <div v-if="currentTab === 'public'" class="tab-content fade-in">
          <div class="form-group">
            <label>Tiểu sử (Bio)</label>
            <textarea v-model="formData.bio" class="glass-input" rows="3" placeholder="Mô tả ngắn về bạn..."></textarea>
          </div>

          <div class="form-group">
            <label>Nơi sống</label>
            <input v-model="formData.location" type="text" class="glass-input" placeholder="Thành phố, Quốc gia" />
          </div>

          <div class="form-group-row">
            <div class="form-group">
              <label>Ngày sinh</label>
              <input v-model="formData.birthday" type="date" class="glass-input" />
            </div>
            <div class="form-group">
              <label>Giới tính</label>
              <select v-model="formData.gender" class="glass-input">
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
              </select>
            </div>
          </div>
        </div>

        <div v-if="currentTab === 'security'" class="tab-content fade-in">
          
          <div class="security-notice">
            <span class="icon">🛡️</span>
            <p>Vì lý do bảo mật, việc thay đổi Tên và Email sẽ bị giới hạn.</p>
          </div>

          <div class="form-group-row">
            <div class="form-group">
              <label>Họ (First Name)</label>
              <input 
                v-model="formData.firstname" 
                type="text" 
                class="glass-input" 
                :disabled="!canChangeName"
                :class="{ 'disabled-input': !canChangeName }"
              />
            </div>
            <div class="form-group">
              <label>Tên (Last Name)</label>
              <input 
                v-model="formData.lastname" 
                type="text" 
                class="glass-input" 
                :disabled="!canChangeName"
                :class="{ 'disabled-input': !canChangeName }"
              />
            </div>
          </div>
          
          <div v-if="!canChangeName" class="warning-text">
            ⚠️ Bạn chỉ có thể đổi tên lại sau ngày <strong>{{ nextNameChangeDate }}</strong>.
          </div>
          <div v-else class="success-text">
            ✅ Bạn có thể đổi tên ngay bây giờ. (Lưu ý: Lần tới sẽ phải đợi 30 ngày).
          </div>

          <div class="divider"></div>

          <div class="form-group">
            <label>Email đăng nhập</label>
            <div class="email-wrapper">
              <input 
                :value="user.email" 
                type="text" 
                class="glass-input" 
                disabled 
                style="opacity: 0.7; cursor: not-allowed;"
              />
              <button class="btn-verify" @click="startEmailChangeProcess">
                Thay đổi
              </button>
            </div>
            <p class="hint-text">Cần xác thực qua email cũ để thay đổi.</p>
          </div>

        </div>

      </div>

      <div class="modal-footer">
        <button class="btn-cancel" @click="closeModal">Đóng</button>
        <button class="btn-save" @click="saveProfile">Lưu thay đổi</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "EditProfileModal",
  props: {
    isVisible: { type: Boolean, default: false },
    user: { type: Object, required: true }
  },
  data() {
    return {
      currentTab: 'public', // 'public' hoặc 'security'
      canChangeName: false, // Biến kiểm soát quyền đổi tên
      nextNameChangeDate: '',
      formData: {
        firstname: '',
        lastname: '',
        bio: '',
        location: '',
        birthday: '',
        gender: ''
      }
    };
  },
  mounted() {
    this.initializeData();
  },
  watch: {
    user: {
      handler() { this.initializeData(); },
      deep: true
    },
    isVisible(val) {
      if(val) this.initializeData();
    }
  },
  methods: {
    initializeData() {
      if (this.user) {
        this.formData = {
          firstname: this.user.firstname || '',
          lastname: this.user.lastname || '',
          bio: this.user.bio || '',
          location: this.user.location || '',
          gender: this.user.gender || 'other',
          birthday: this.formatDateForInput(this.user.birthday)
        };

        // --- GIẢ LẬP LOGIC CHECK NGÀY ĐỔI TÊN ---
        // Trong thực tế, backend sẽ trả về field `last_name_change`
        // Ví dụ logic: Nếu lần đổi cuối > 30 ngày thì cho đổi tiếp
        const lastChange = this.user.last_name_change ? new Date(this.user.last_name_change) : null;
        
        if (!lastChange) {
          // Chưa đổi bao giờ -> Cho phép
          this.canChangeName = true; 
        } else {
          const now = new Date();
          const diffTime = Math.abs(now - lastChange);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
          
          if (diffDays >= 30) {
            this.canChangeName = true;
          } else {
            this.canChangeName = false;
            // Tính ngày được phép đổi tiếp
            const nextDate = new Date(lastChange);
            nextDate.setDate(lastChange.getDate() + 30);
            this.nextNameChangeDate = nextDate.toLocaleDateString();
          }
        }
      }
    },

    formatDateForInput(dateString) {
      if (!dateString) return '';
      return new Date(dateString).toISOString().split('T')[0];
    },

    closeModal() {
      this.$emit('close');
      this.currentTab = 'public'; // Reset về tab đầu
    },

    startEmailChangeProcess() {
      // Logic gửi mail xác thực sẽ nằm ở đây
      alert("Hệ thống đã gửi mã xác thực vào email: " + this.user.email + ". Vui lòng kiểm tra để tiếp tục.");
      // Sau bước này thường sẽ mở 1 Modal nhập mã OTP
    },

    async saveProfile() {
      // Nếu đang ở Tab Security mà User cố tình hack HTML để enable input tên
      if (this.currentTab === 'security' && !this.canChangeName) {
        alert("Bạn chưa đủ điều kiện đổi tên.");
        return;
      }

      try {
        // Tách payload: Nếu ở tab public chỉ gửi public info, tab security gửi security info
        // Ở đây mình gửi chung cho đơn giản, backend sẽ tự lọc
        this.$emit('save', this.formData);
      } catch (error) {
        console.error(error);
      }
    }
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.5); z-index: 1000;
  display: flex; justify-content: center; align-items: center;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white; width: 90%; max-width: 550px;
  border-radius: 20px; 
  box-shadow: 0 20px 40px rgba(0,0,0,0.2);
  animation: slideUp 0.3s ease-out;
  display: flex; flex-direction: column;
  overflow: hidden;
}

/* HEADER TABS */
.modal-header-tabs {
  display: flex;
  align-items: center;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
  padding: 0 16px;
}

.tab-btn {
  padding: 16px 20px;
  background: transparent;
  border: none;
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  position: relative;
  transition: color 0.2s;
}

.tab-btn.active {
  color: #6366f1;
}

.tab-btn.active::after {
  content: '';
  position: absolute; bottom: 0; left: 0; right: 0;
  height: 3px; background: #6366f1;
  border-radius: 3px 3px 0 0;
}

.close-btn {
  margin-left: auto;
  background: none; border: none; font-size: 24px; cursor: pointer;
  color: #9ca3af;
  padding: 0 8px;
}

/* BODY */
.modal-body {
  padding: 24px;
  min-height: 300px;
}

.form-group-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.form-group { margin-bottom: 20px; }
.form-group label { display: block; font-size: 13px; font-weight: 700; color: #374151; margin-bottom: 8px; }

.glass-input {
  width: 100%; padding: 10px 12px; border: 1px solid #e5e7eb; border-radius: 10px;
  background: #fff; font-size: 14px; color: #111827; box-sizing: border-box;
  transition: all 0.2s;
}
.glass-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1); outline: none; }

/* Security Tab Styles */
.security-notice {
  background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px;
  padding: 12px; margin-bottom: 20px; display: flex; gap: 10px; align-items: center;
}
.security-notice p { margin: 0; font-size: 13px; color: #1e40af; }

.disabled-input {
  background-color: #f3f4f6;
  color: #9ca3af;
  cursor: not-allowed;
}

.warning-text { font-size: 12px; color: #ef4444; margin-top: -10px; margin-bottom: 10px; }
.success-text { font-size: 12px; color: #10b981; margin-top: -10px; margin-bottom: 10px; }

.divider { height: 1px; background: #e5e7eb; margin: 20px 0; }

.email-wrapper { display: flex; gap: 10px; }
.btn-verify {
  white-space: nowrap; padding: 0 16px; border-radius: 10px; border: 1px solid #e5e7eb;
  background: white; color: #6366f1; font-weight: 600; cursor: pointer; transition: all 0.2s;
}
.btn-verify:hover { background: #f3f4f6; }

.hint-text { font-size: 12px; color: #6b7280; margin-top: 6px; font-style: italic; }

/* FOOTER */
.modal-footer {
  padding: 16px 24px; border-top: 1px solid #e5e7eb;
  display: flex; justify-content: flex-end; gap: 12px;
  background: #f9fafb;
}

.btn-cancel { padding: 10px 20px; border-radius: 8px; border: 1px solid #d1d5db; background: white; color: #374151; font-weight: 600; cursor: pointer; }
.btn-save { padding: 10px 20px; border-radius: 8px; border: none; background: #6366f1; color: white; font-weight: 600; cursor: pointer; }
.btn-save:hover { background: #4f46e5; }

/* Animation */
.fade-in { animation: fadeIn 0.3s ease; }
@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
</style>