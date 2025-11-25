<template>
  <div>
    <!-- EDIT PROFILE MODAL -->
    <div v-if="isVisible" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        
        <!-- HEADER -->
        <div class="modal-header-tabs">
          <button :class="['tab-btn', { active: currentTab === 'public' }]" @click="currentTab = 'public'">
            Public Info
          </button>
          <button :class="['tab-btn', { active: currentTab === 'security' }]" @click="currentTab = 'security'">
            Security & Account
          </button>
          <button class="close-btn" @click="closeModal">&times;</button>
        </div>

        <!-- BODY -->
        <div class="modal-body">
          
          <!-- TAB 1: PUBLIC INFO (Thông tin hiển thị - Sửa thoải mái) -->
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

          <!-- TAB 2: SECURITY (Thông tin định danh - Có giới hạn) -->
          <div v-if="currentTab === 'security'" class="tab-content fade-in">
            
            <!-- 1. Name Change -->
            <div class="section-title">Full Name</div>
            <div class="form-group-row">
              <div class="form-group">
                <label>First Name</label>
                <input 
                  v-model="formData.firstname" 
                  type="text" 
                  class="glass-input" 
                  :disabled="!canChangeName" 
                  :class="{ 'disabled-input': !canChangeName }"
                />
              </div>
              <div class="form-group">
                <label>Last Name</label>
                <input 
                  v-model="formData.lastname" 
                  type="text" 
                  class="glass-input" 
                  :disabled="!canChangeName" 
                  :class="{ 'disabled-input': !canChangeName }"
                />
              </div>
            </div>
            <!-- Hiển thị trạng thái cho Tên -->
            <p v-if="!canChangeName" class="warning-text">⚠️ Bạn có thể đổi tên lại sau ngày <strong>{{ nextNameChangeDate }}</strong>.</p>
            <p v-else class="hint-text">✅ Bạn có thể đổi tên ngay bây giờ (Giới hạn 30 ngày/lần).</p>

            <div class="divider"></div>

            <!-- 2. Username Change (MỚI THÊM) -->
            <div class="section-title">Username</div>
            <div class="form-group">
              <label>Username (@)</label>
              <input 
                v-model="formData.username" 
                type="text" 
                class="glass-input"
                :disabled="!canChangeUsername"
                :class="{ 'disabled-input': !canChangeUsername }"
                placeholder="username"
              />
            </div>
            <!-- Hiển thị trạng thái cho Username -->
            <p v-if="!canChangeUsername" class="warning-text">⚠️ Bạn có thể đổi username lại sau ngày <strong>{{ nextUsernameChangeDate }}</strong>.</p>
            <p v-else class="hint-text">✅ Username là định danh duy nhất (Giới hạn 30 ngày/lần).</p>

            <div class="divider"></div>

            <!-- 3. Email Change -->
            <div class="section-title">Email Address</div>
            <div class="form-group">
              <div class="email-wrapper">
                <input :value="user.email" type="text" class="glass-input" disabled style="opacity: 0.7;" />
                <button class="btn-verify" @click="startEmailChangeProcess">Change</button>
              </div>
            </div>

            <div class="divider"></div>

            <!-- 4. Password Change -->
            <div class="section-title">Password</div>
            <div class="form-group">
              <button class="btn-outline-danger full-width" @click="requestPasswordChange">
                🔒 Change Password
              </button>
              <p class="hint-text">We will send an OTP code to your email to verify.</p>
            </div>

          </div>
        </div>

        <!-- FOOTER -->
        <div class="modal-footer">
          <button class="btn-cancel" @click="closeModal">Close</button>
          <!-- Luôn hiện nút Save để lưu các thay đổi (nếu có) -->
          <button class="btn-save" @click="saveProfile">Save Changes</button>
        </div>
      </div>
    </div>

    <!-- SECURITY MODAL -->
    <SecurityModal 
      ref="securityModal"
      :is-visible="securityModalVisible"
      :type="securityType"
      :current-email="user.email"
      @close="securityModalVisible = false"
      @submit-email-request="handleSubmitEmailRequest"
      @submit-email-verify="handleSubmitEmailVerify"
      @submit-password-verify="handleSubmitPasswordVerify"
      @resend-otp="handleResendOtp"
    />

    <!-- NOTIFICATION MODAL -->
    <NotificationModal 
      :is-visible="notificationVisible"
      :type="notificationData.type"
      :title="notificationData.title"
      :message="notificationData.message"
      :sub-message="notificationData.subMessage"
      :button-text="notificationData.buttonText"
      @confirm="handleNotificationConfirm"
    />
  </div>
</template>


<script>
import SecurityModal from './SecurityModal.vue';
import NotificationModal from './NotificationModal.vue';

export default {
  name: "EditProfileModal",
  components: { SecurityModal, NotificationModal },
  props: {
    isVisible: { type: Boolean, default: false },
    user: { type: Object, required: true }
  },
  data() {
    return {
      currentTab: 'public',
      
      // Name Check Logic
      canChangeName: false,
      nextNameChangeDate: '',
      
      // Username Check Logic (NEW)
      canChangeUsername: false,
      nextUsernameChangeDate: '',
      
      // Dữ liệu form
      formData: {
        firstname: '', 
        lastname: '', 
        username: '', // Thêm trường này
        bio: '', 
        location: '', 
        birthday: '', 
        gender: ''
      },

      // Security Modal State
      securityModalVisible: false,
      securityType: 'email',

      // Notification Modal State
      notificationVisible: false,
      notificationData: {
        type: 'success',
        title: '',
        message: '',
        subMessage: '',
        buttonText: ''
      },
      onNotificationAction: null,
      
      // Email Change Temp Data
      pendingNewEmail: '',
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
          username: this.user.username || '', // Load username
          bio: this.user.bio || '',
          location: this.user.location || '',
          gender: this.user.gender || 'other',
          birthday: this.formatDateForInput(this.user.birthday)
        };
        
        // 1. Check Name Change Limit (30 days)
        this.checkChangeLimit(this.user.last_name_change, (allowed, dateStr) => {
            this.canChangeName = allowed;
            this.nextNameChangeDate = dateStr;
        });

        // 2. Check Username Change Limit (30 days)
        this.checkChangeLimit(this.user.last_username_change, (allowed, dateStr) => {
            this.canChangeUsername = allowed;
            this.nextUsernameChangeDate = dateStr;
        });
      }
    },

    // Helper function để kiểm tra ngày (dùng chung cho cả Tên và Username)
    checkChangeLimit(lastChangeDate, callback) {
        if (!lastChangeDate) {
            callback(true, ''); // Chưa đổi bao giờ -> Cho phép
            return;
        }
        
        const lastChange = new Date(lastChangeDate);
        const now = new Date();
        const diffDays = Math.ceil(Math.abs(now - lastChange) / (1000 * 60 * 60 * 24));
        
        if (diffDays >= 30) {
            callback(true, '');
        } else {
            const nextDate = new Date(lastChange);
            nextDate.setDate(lastChange.getDate() + 30);
            callback(false, nextDate.toLocaleDateString());
        }
    },

    formatDateForInput(dateString) {
      if (!dateString) return '';
      return new Date(dateString).toISOString().split('T')[0];
    },

    closeModal() {
      this.$emit('close');
    },

    // --- NOTIFICATION HELPER ---
    showSuccess(title, message, subMessage, buttonText, actionCallback) {
      this.notificationData = { type: 'success', title, message, subMessage, buttonText };
      this.onNotificationAction = actionCallback;
      this.notificationVisible = true;
    },

    showError(message) {
      this.notificationData = { 
        type: 'error', 
        title: 'Error', 
        message: message, 
        subMessage: 'Please try again.', 
        buttonText: 'Close' 
      };
      this.onNotificationAction = null;
      this.notificationVisible = true;
    },

    handleNotificationConfirm() {
      this.notificationVisible = false;
      if (this.onNotificationAction) {
        this.onNotificationAction();
      }
    },

    // --- SECURITY FLOWS ---
    
    // 1. Start Email Change
    startEmailChangeProcess() {
      this.securityType = 'email';
      this.pendingNewEmail = '';
      this.securityModalVisible = true;
    },

    // 2. Start Password Change
    async requestPasswordChange() {
      try {
        await this.$axios.post('/users/change-password/request', {
          userId: this.user._id || this.user.id
        });
        this.securityType = 'password';
        this.securityModalVisible = true;
      } catch (err) {
        this.showError(err.response?.data?.msg || "Error sending OTP");
      }
    },

    // --- HANDLE SECURITY MODAL EVENTS ---

    // Email Step 1: Request OTP
    async handleSubmitEmailRequest(newEmail) {
      if (!newEmail) return this.showError("Please enter an email address.");
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newEmail)) return this.showError("Invalid email format.");
      if (newEmail === this.user.email) return this.showError("New email cannot be the same as current email.");
      
      const modal = this.$refs.securityModal;
      if(modal) modal.setLoading(true);

      try {
        await this.$axios.post('/users/change-email/request', {
          userId: this.user._id || this.user.id, newEmail
        });
        
        this.pendingNewEmail = newEmail; 
        if(modal) modal.nextStep();
      } catch (err) {
        this.showError(err.response?.data?.msg || "Error sending request");
      } finally {
        if(modal) modal.setLoading(false);
      }
    },

    // Email Step 2: Verify OTP
    async handleSubmitEmailVerify({ otp, newEmail }) {
      const modal = this.$refs.securityModal;
      if(modal) modal.setLoading(true);

      try {
        await this.$axios.post('/users/change-email/verify', {
           userId: this.user._id || this.user.id, otp, newEmail
        });
        
        this.securityModalVisible = false;
        this.showSuccess(
          "Email Changed!",
          "Your email has been updated successfully.",
          "Please login again with your new email.",
          "Login Again",
          () => {
            localStorage.removeItem("user");
            localStorage.removeItem("token");
            window.location.href = "/login";
          }
        );
      } catch (err) {
        this.showError(err.response?.data?.msg || "Invalid OTP");
      } finally {
        if(modal) modal.setLoading(false);
      }
    },

    // Password Change: Verify OTP & Update
    async handleSubmitPasswordVerify({ otp, newPassword }) {
      const modal = this.$refs.securityModal;
      if (modal) modal.setLoading(true);

      try {
        await this.$axios.post('/users/change-password/verify', {
          userId: this.user._id || this.user.id,
          otp,
          newPassword
        });
        
        this.securityModalVisible = false;
        this.closeModal(); 

        this.showSuccess(
          "Password Updated!",
          "Your password has been changed securely.",
          "All other devices have been logged out.",
          "Re-login Now",
          () => {
            localStorage.removeItem("user");
            localStorage.removeItem("token");
            window.location.href = "/login";
          }
        );
      } catch (err) {
        this.showError(err.response?.data?.msg || "Error changing password");
      } finally {
        if (modal) modal.setLoading(false);
      }
    },

    // Resend OTP Handler
    async handleResendOtp() {
      try {
        if (this.securityType === 'password') {
          await this.$axios.post('/users/change-password/request', {
            userId: this.user._id || this.user.id
          });
          alert("New OTP sent for password change!");
        } else {
          if (!this.pendingNewEmail) return alert("Session expired. Please start over.");
          await this.$axios.post('/users/change-email/request', {
            userId: this.user._id || this.user.id, 
            newEmail: this.pendingNewEmail 
          });
          alert(`New OTP sent to ${this.user.email}!`);
        }
      } catch (err) {
        alert(err.response?.data?.msg || "Error resending OTP");
      }
    },

    // Save Public Profile Info
    async saveProfile() {
      // Gửi tất cả data (bao gồm cả username, firstname...) lên server
      // Backend sẽ tự check logic 30 ngày và quyết định cho sửa hay không
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