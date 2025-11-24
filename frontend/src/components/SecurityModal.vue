<template>
  <div v-if="isVisible" class="modal-overlay" @click="close">
    <div class="modal-card" @click.stop>
      
      <div class="modal-header">
        <h3>{{ title }}</h3>
        <button class="close-btn" @click="close">&times;</button>
      </div>

      <div class="modal-body">
        
        <div v-if="type === 'email' && step === 1" class="step-content">
          <p class="instruction">Please enter the new email address you want to associate with your account.</p>
          <div class="input-group">
            <label>New Email Address</label>
            <input 
              v-model="formData.newEmail" 
              type="email" 
              class="modern-input" 
              placeholder="example@mail.com" 
              @keyup.enter="handleNext"
            />
          </div>
        </div>

        <div v-if="step === 2" class="step-content">
          <div class="otp-sent-icon">📩</div>
          <p class="instruction">
            A 6-digit verification code has been sent to <b>{{ targetEmail }}</b>.
            <br><span class="sub-text">Please check your inbox (and Spam folder).</span>
          </p>
          
          <div class="input-group">
            <label>OTP Code</label>
            <input 
              v-model="formData.otp" 
              type="text" 
              class="modern-input otp-input" 
              placeholder="------" 
              maxlength="6"
            />
          </div>

          <div v-if="type === 'password'" class="input-group mt-4">
            <label>New Password</label>
            <input 
              v-model="formData.newPassword" 
              type="password" 
              class="modern-input" 
              placeholder="Enter new password..." 
            />
          </div>
        </div>

      </div>

      <div class="modal-footer">
        <button class="btn-secondary" @click="close">Cancel</button>
        <button class="btn-primary" @click="handleNext" :disabled="isLoading">
          <span v-if="isLoading">Processing...</span>
          <span v-else>{{ step === 1 ? 'Send Code' : 'Confirm' }}</span>
        </button>
      </div>

    </div>
  </div>
</template>

<script>
export default {
  name: "SecurityModal",
  props: {
    isVisible: { type: Boolean, default: false },
    type: { type: String, default: 'email' }, // 'email' or 'password'
    currentEmail: { type: String, default: '' } // To display where OTP was sent
  },
  data() {
    return {
      step: 1, // 1: Input Info, 2: Input OTP
      isLoading: false,
      formData: {
        newEmail: '',
        otp: '',
        newPassword: ''
      }
    };
  },
  computed: {
    title() {
      if (this.type === 'email') return this.step === 1 ? 'Change Email' : 'Verify Email';
      return 'Change Password';
    },
    targetEmail() {
      // If changing email, OTP is sent to OLD email (currentEmail)
      // If changing password, OTP is sent to current email
      return this.currentEmail; 
    }
  },
  watch: {
    isVisible(val) {
      if (val) {
        // Reset state when opening
        // For password change, skip step 1 because OTP is sent via button in parent
        this.step = (this.type === 'password') ? 2 : 1; 
        this.formData = { newEmail: '', otp: '', newPassword: '' };
        this.isLoading = false;
      }
    }
  },
  methods: {
    close() {
      this.$emit('close');
    },
    handleNext() {
      if (this.type === 'email') {
        if (this.step === 1) {
          // Step 1: Request OTP for new email
          if (!this.formData.newEmail) return alert("Please enter an email address");
          this.$emit('submit-email-request', this.formData.newEmail);
        } else {
          // Step 2: Verify OTP
          if (!this.formData.otp) return alert("Please enter OTP");
          this.$emit('submit-email-verify', { otp: this.formData.otp, newEmail: this.formData.newEmail });
        }
      } else if (this.type === 'password') {
        // Password Change: Verify OTP + New Password
        if (!this.formData.otp || !this.formData.newPassword) return alert("Please fill all fields");
        this.$emit('submit-password-verify', { otp: this.formData.otp, newPassword: this.formData.newPassword });
      }
    },
    // Parent calls this method when API request is successful to move to next step
    nextStep() {
      this.step = 2;
      this.isLoading = false;
    },
    setLoading(val) {
      this.isLoading = val;
    }
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.6); z-index: 2000; /* Higher z-index than EditProfileModal */
  display: flex; justify-content: center; align-items: center;
  backdrop-filter: blur(4px);
  animation: fadeIn 0.2s ease;
}

.modal-card {
  background: white; width: 90%; max-width: 420px;
  border-radius: 20px; padding: 0;
  box-shadow: 0 20px 50px rgba(0,0,0,0.3);
  animation: zoomIn 0.2s ease;
  overflow: hidden;
}

.modal-header {
  padding: 20px 24px; border-bottom: 1px solid #f0f2f5;
  display: flex; justify-content: space-between; align-items: center;
}
.modal-header h3 { margin: 0; font-size: 18px; font-weight: 700; color: #1c1e21; }
.close-btn { background: none; border: none; font-size: 24px; color: #65676b; cursor: pointer; }

.modal-body { padding: 24px; }

.instruction { font-size: 14px; color: #4b5563; margin-bottom: 20px; line-height: 1.5; }
.sub-text { font-size: 12px; color: #6b7280; font-style: italic; }

.input-group label { display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 8px; }
.modern-input {
  width: 100%; padding: 12px 16px; border-radius: 12px;
  border: 1px solid #e5e7eb; background: #f9fafb;
  font-size: 15px; transition: all 0.2s; box-sizing: border-box;
}
.modern-input:focus { border-color: #6366f1; background: white; outline: none; box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1); }

.otp-input { letter-spacing: 4px; text-align: center; font-weight: 700; font-size: 18px; }
.otp-sent-icon { font-size: 40px; text-align: center; margin-bottom: 16px; display: block; }

.mt-4 { margin-top: 16px; }

.modal-footer {
  padding: 16px 24px; background: #f9fafb; border-top: 1px solid #f0f2f5;
  display: flex; justify-content: flex-end; gap: 12px;
}

.btn-secondary { padding: 10px 20px; border-radius: 10px; background: white; border: 1px solid #d1d5db; color: #374151; font-weight: 600; cursor: pointer; }
.btn-primary { padding: 10px 24px; border-radius: 10px; background: #6366f1; border: none; color: white; font-weight: 600; cursor: pointer; transition: background 0.2s; }
.btn-primary:disabled { background: #a5b4fc; cursor: not-allowed; }
.btn-primary:hover:not(:disabled) { background: #4f46e5; }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes zoomIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
</style>