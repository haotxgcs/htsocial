<template>
  <div>
    <div v-if="isVisible" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        
        <div class="modal-header-tabs">
          <button :class="['tab-btn', { active: currentTab === 'public' }]" @click="currentTab = 'public'">
            Public Info
          </button>
          <button :class="['tab-btn', { active: currentTab === 'security' }]" @click="currentTab = 'security'">
            Security & Account
          </button>
          <button class="close-btn" @click="closeModal">&times;</button>
        </div>

        <div class="modal-body">
          
          <div v-if="currentTab === 'public'" class="tab-content fade-in">
            <div class="form-group">
              <label>Bio</label>
              <textarea v-model="formData.bio" class="glass-input" rows="3"></textarea>
            </div>
            <div class="form-group">
              <label>Location</label>
              <input v-model="formData.location" type="text" class="glass-input" />
            </div>
            <div class="form-group-row">
              <div class="form-group">
                <label>Birthday</label>
                <input v-model="formData.birthday" type="date" class="glass-input" />
              </div>
              <div class="form-group">
                <label>Gender</label>
                <select v-model="formData.gender" class="glass-input">
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>

          <div v-if="currentTab === 'security'" class="tab-content fade-in">
            
            <div class="section-title">Name Change</div>
            <div class="form-group-row">
              <div class="form-group">
                <label>First Name</label>
                <input v-model="formData.firstname" type="text" class="glass-input" :disabled="!canChangeName" :class="{ 'disabled-input': !canChangeName }"/>
              </div>
              <div class="form-group">
                <label>Last Name</label>
                <input v-model="formData.lastname" type="text" class="glass-input" :disabled="!canChangeName" :class="{ 'disabled-input': !canChangeName }"/>
              </div>
            </div>
            <div v-if="!canChangeName" class="warning-text">⚠️ You can change your name again after {{ nextNameChangeDate }}.</div>
            
            <div class="divider"></div>

            <div class="section-title">Email Address</div>
            <div class="form-group">
              <div class="email-wrapper">
                <input :value="user.email" type="text" class="glass-input" disabled style="opacity: 0.7;" />
                <button class="btn-verify" @click="startEmailChangeProcess">Change</button>
              </div>
            </div>

            <div class="divider"></div>

            <div class="section-title">Password</div>
            
            <div class="form-group">
              <button class="btn-outline-danger full-width" @click="requestPasswordChange">
                🔒 Change Password
              </button>
              <p class="hint-text">We will send an OTP code to your email to verify.</p>
            </div>

          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="closeModal">Close</button>
          <button v-if="currentTab === 'public' || canChangeName" class="btn-save" @click="saveProfile">Save Changes</button>
        </div>
      </div>
    </div>

    <SecurityModal 
      ref="securityModal"
      :is-visible="securityModalVisible"
      :type="securityType"
      :current-email="user.email"
      @close="securityModalVisible = false"
      @submit-email-request="handleSubmitEmailRequest"
      @submit-email-verify="handleSubmitEmailVerify"
      @submit-password-verify="handleSubmitPasswordVerify"
    />
  </div>
</template>

<script>
import SecurityModal from './SecurityModal.vue';

export default {
  name: "EditProfileModal",
  components: { SecurityModal },
  props: {
    isVisible: { type: Boolean, default: false },
    user: { type: Object, required: true }
  },
  data() {
    return {
      currentTab: 'public',
      canChangeName: false,
      nextNameChangeDate: '',
      
      // Dữ liệu form chỉnh sửa thông tin
      formData: {
        firstname: '', lastname: '', bio: '', location: '', birthday: '', gender: ''
      },

      // State điều khiển Security Modal
      securityModalVisible: false,
      securityType: 'email', // 'email' hoặc 'password'
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
      if (val) {
        this.initializeData();
        this.currentTab = 'public';
      }
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
        
        // Logic kiểm tra ngày đổi tên (30 ngày)
        const lastChange = this.user.last_name_change ? new Date(this.user.last_name_change) : null;
        if (!lastChange) {
          this.canChangeName = true;
        } else {
          const diffDays = Math.ceil(Math.abs(new Date() - lastChange) / (1000 * 60 * 60 * 24));
          if (diffDays >= 30) {
            this.canChangeName = true;
          } else {
            this.canChangeName = false;
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
    },

    // --- 1. KÍCH HOẠT MODAL ĐỔI EMAIL ---
    startEmailChangeProcess() {
      this.securityType = 'email';
      this.securityModalVisible = true;
    },

    // --- 2. KÍCH HOẠT MODAL ĐỔI MẬT KHẨU ---
    async requestPasswordChange() {
      if (!confirm("Gửi mã xác thực (OTP) đến email để đổi mật khẩu?")) return;
      
      try {
        // Gọi API gửi OTP trước
        await this.$axios.post('/users/change-password/request', {
          userId: this.user._id || this.user.id
        });
        
        // Mở modal ở chế độ Password (tự động nhảy vào bước nhập OTP)
        this.securityType = 'password';
        this.securityModalVisible = true;
      } catch (err) {
        alert(err.response?.data?.msg || "Lỗi khi gửi mã OTP");
      }
    },

    // --- CÁC HÀM XỬ LÝ SỰ KIỆN TỪ SECURITY MODAL ---

    // Xử lý: Gửi yêu cầu đổi email (Bước 1 - Nhập mail mới)
    async handleSubmitEmailRequest(newEmail) {
      if (newEmail === this.user.email) return alert("Email mới không được trùng email hiện tại.");
      
      // Gọi loading bên modal con
      const modal = this.$refs.securityModal;
      if(modal) modal.setLoading(true);

      try {
        await this.$axios.post('/users/change-email/request', {
          userId: this.user._id || this.user.id, newEmail
        });
        // Chuyển sang bước 2 (Nhập OTP)
        if(modal) modal.nextStep();
      } catch (err) {
        alert(err.response?.data?.msg || "Lỗi gửi yêu cầu đổi email");
      } finally {
        if(modal) modal.setLoading(false);
      }
    },

    // Xử lý: Xác thực OTP đổi Email (Bước 2)
    async handleSubmitEmailVerify({ otp, newEmail }) {
      const modal = this.$refs.securityModal;
      if(modal) modal.setLoading(true);

      try {
        await this.$axios.post('/users/change-email/verify', {
           userId: this.user._id || this.user.id, otp, newEmail
        });
        
        this.securityModalVisible = false;
        alert("Đổi email thành công! Vui lòng đăng nhập lại.");
        
        // Logout để user đăng nhập bằng email mới
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        window.location.href = "/login";
        
      } catch (err) {
        alert(err.response?.data?.msg || "Mã OTP không đúng hoặc đã hết hạn");
      } finally {
        if(modal) modal.setLoading(false);
      }
    },

    // Xử lý: Xác thực OTP đổi Mật khẩu
    async handleSubmitPasswordVerify({ otp, newPassword }) {
      const modal = this.$refs.securityModal;
      if(modal) modal.setLoading(true);

      try {
        await this.$axios.post('/users/change-password/verify', {
          userId: this.user._id || this.user.id, otp, newPassword
        });
        
        this.securityModalVisible = false;
        this.closeModal(); // Đóng modal chính
        
        alert("Đổi mật khẩu thành công! Hệ thống sẽ đăng xuất các thiết bị khác.");
        // Reload để kích hoạt cơ chế tự động logout (401 Interceptor) nếu cần thiết
        window.location.reload();
        
      } catch (err) {
        alert(err.response?.data?.msg || "Lỗi đổi mật khẩu. Vui lòng kiểm tra OTP.");
      } finally {
        if(modal) modal.setLoading(false);
      }
    },

    // Lưu thông tin cơ bản (Bio, Tên,...)
    async saveProfile() {
      // Nếu đang ở tab Security mà chưa được phép đổi tên thì backend sẽ chặn
      // Nhưng frontend cứ gửi hết formData lên
      this.$emit('save', this.formData);
    }
  }
};
</script>

<style scoped>
/* ... (Giữ nguyên các style cũ của bạn: modal-overlay, modal-content, tabs...) ... */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5); z-index: 1000; display: flex; justify-content: center; align-items: center; backdrop-filter: blur(4px); }
.modal-content { background: white; width: 90%; max-width: 550px; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.2); display: flex; flex-direction: column; overflow: hidden; max-height: 90vh; }
.modal-header-tabs { display: flex; align-items: center; border-bottom: 1px solid #e5e7eb; background: #f9fafb; padding: 0 16px; }
.tab-btn { padding: 16px 20px; background: transparent; border: none; font-size: 14px; font-weight: 600; color: #6b7280; cursor: pointer; position: relative; }
.tab-btn.active { color: #6366f1; }
.tab-btn.active::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 3px; background: #6366f1; border-radius: 3px 3px 0 0; }
.close-btn { margin-left: auto; background: none; border: none; font-size: 24px; cursor: pointer; color: #9ca3af; }

.modal-body { padding: 24px; overflow-y: auto; }
.form-group-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.form-group { margin-bottom: 20px; }
.form-group label { display: block; font-size: 13px; font-weight: 700; color: #374151; margin-bottom: 8px; }
.glass-input { width: 100%; padding: 10px 12px; border: 1px solid #e5e7eb; border-radius: 10px; background: #fff; font-size: 14px; box-sizing: border-box; transition: all 0.2s; }
.glass-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1); outline: none; }
.disabled-input { background-color: #f3f4f6; color: #9ca3af; cursor: not-allowed; }

.section-title { font-size: 12px; font-weight: 800; text-transform: uppercase; color: #9ca3af; margin-bottom: 12px; letter-spacing: 0.5px; }
.divider { height: 1px; background: #e5e7eb; margin: 24px 0; }
.warning-text { font-size: 12px; color: #ef4444; margin-top: -10px; margin-bottom: 10px; }
.hint-text { font-size: 12px; color: #6b7280; margin-top: 6px; font-style: italic; }

.email-wrapper { display: flex; gap: 10px; }
.btn-verify { white-space: nowrap; padding: 0 16px; border-radius: 10px; border: 1px solid #e5e7eb; background: white; color: #6366f1; font-weight: 600; cursor: pointer; }

/* --- Password Section Styles --- */
.btn-outline-danger { width: 100%; padding: 10px; border: 1px solid #fca5a5; background: #fef2f2; color: #ef4444; border-radius: 10px; font-weight: 600; cursor: pointer; transition: all 0.2s; text-align: center; }
.btn-outline-danger:hover { background: #fee2e2; border-color: #ef4444; }

.password-change-form { background: #f9fafb; padding: 16px; border-radius: 12px; border: 1px solid #e5e7eb; animation: fadeIn 0.3s; }
.otp-sent-msg { font-size: 13px; color: #10b981; font-weight: 600; margin-bottom: 12px; }
.form-actions { display: flex; gap: 10px; margin-top: 16px; }
.btn-cancel-small { flex: 1; padding: 8px; border: 1px solid #d1d5db; background: white; border-radius: 8px; cursor: pointer; font-weight: 500; }
.btn-confirm-small { flex: 1; padding: 8px; border: none; background: #6366f1; color: white; border-radius: 8px; cursor: pointer; font-weight: 600; }

.modal-footer { padding: 16px 24px; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end; gap: 12px; background: #f9fafb; }
.btn-cancel { padding: 10px 20px; border-radius: 8px; border: 1px solid #d1d5db; background: white; font-weight: 600; cursor: pointer; }
.btn-save { padding: 10px 20px; border-radius: 8px; border: none; background: #6366f1; color: white; font-weight: 600; cursor: pointer; }
.btn-save:hover { background: #4f46e5; }

@keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
</style>