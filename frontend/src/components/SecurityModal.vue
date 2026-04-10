<template>
  <div v-if="isVisible" class="modal-overlay" @click="close">
    <div class="modal-card" @click.stop>
      
      <div class="modal-header">
        <h3>{{ title }}</h3>
        <button class="close-btn" @click="close">&times;</button>
      </div>

      <div class="modal-body">
        
        <div v-if="type === 'email' && step === 1" class="step-content">
          <p class="instruction">Please enter the new email address you want to use.</p>
          <div class="input-group">
            <label>New Email</label>
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
            A verification code has been sent to <b>{{ targetEmail }}</b>.
            <br><span class="sub-text">Please check your inbox (including Spam).</span>
          </p>
          
          <div class="input-group">
            <div class="label-row">
              <label>OTP Code</label>
              <button 
                class="resend-link" 
                :class="{ 'disabled': countdown > 0 }"
                @click="handleResendOtp"
                :disabled="countdown > 0"
              >
                {{ countdown > 0 ? `Resend in (${formatTime(countdown)})` : 'Resend Code' }}
              </button>
            </div>
            <input v-model="formData.otp" type="text" class="modern-input otp-input" placeholder="------" maxlength="6" />
          </div>

          <div v-if="type === 'password'" class="password-section">
            
            <div class="input-group mt-4">
              <label>New Password</label>
              <div class="password-wrapper">
                <input 
                  v-model="formData.newPassword" 
                  :type="showPassword ? 'text' : 'password'" 
                  class="modern-input" 
                  placeholder="Enter new password..." 
                />
                <span class="eye-icon" @click="showPassword = !showPassword">
                  <svg v-if="showPassword" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.05 10.05 0 011.555-2.264M6.42 6.42a10.05 10.05 0 015.58-1.42c4.478 0 8.268 2.943 9.542 7a10.05 10.05 0 01-1.555 2.264m-3.1 3.1a3 3 0 11-4.243-4.243m4.243 4.243L2.458 2.458M12 12l2.121 2.121" />
                  </svg>
                </span>
              </div>
            </div>

            <div class="input-group mt-4">
              <label>Confirm Password</label>
              <div class="password-wrapper">
                <input 
                  v-model="confirmPassword" 
                  :type="showConfirmPassword ? 'text' : 'password'" 
                  class="modern-input" 
                  placeholder="Re-enter new password..." 
                />
                <span class="eye-icon" @click="showConfirmPassword = !showConfirmPassword">
                  <svg v-if="showConfirmPassword" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.05 10.05 0 011.555-2.264M6.42 6.42a10.05 10.05 0 015.58-1.42c4.478 0 8.268 2.943 9.542 7a10.05 10.05 0 01-1.555 2.264m-3.1 3.1a3 3 0 11-4.243-4.243m4.243 4.243L2.458 2.458M12 12l2.121 2.121" />
                  </svg>
                </span>
              </div>
              <p v-if="passwordMismatch" class="error-text">Passwords do not match!</p>
            </div>
          </div>
        </div>

      </div>

      <div class="modal-footer">
        <button class="btn-secondary" @click="close">Cancel</button>
        <button class="btn-primary" @click="handleNext" :disabled="isLoading || passwordMismatch">
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
    currentEmail: { type: String, default: '' }
  },
  data() {
    return {
      step: 1,
      isLoading: false,
      formData: { newEmail: '', otp: '', newPassword: '' },
      
      confirmPassword: '',
      showPassword: false,
      showConfirmPassword: false,
      countdown: 0,
      timerInterval: null
    };
  },
  computed: {
    title() {
      if (this.type === 'email') return this.step === 1 ? 'Change Email' : 'Verify Email';
      return 'Change Password';
    },
    targetEmail() { return this.currentEmail; },
    passwordMismatch() {
      return this.type === 'password' && 
             this.confirmPassword && 
             this.formData.newPassword !== this.confirmPassword;
    }
  },
  watch: {
    isVisible(val) {
      if (val) {
        this.resetData();
        if (this.type === 'password') {
          this.startCountdown(300); // 5 minutes
        }
      } else {
        this.stopCountdown();
      }
    }
  },
  methods: {
    resetData() {
      this.step = (this.type === 'password') ? 2 : 1;
      this.formData = { newEmail: '', otp: '', newPassword: '' };
      this.confirmPassword = '';
      this.isLoading = false;
      this.showPassword = false;
      this.showConfirmPassword = false;
    },
    
    close() { this.$emit('close'); },

    startCountdown(seconds) {
      this.stopCountdown();
      this.countdown = seconds;
      this.timerInterval = setInterval(() => {
        if (this.countdown > 0) {
          this.countdown--;
        } else {
          this.stopCountdown();
        }
      }, 1000);
    },

    stopCountdown() {
      if (this.timerInterval) clearInterval(this.timerInterval);
    },

    formatTime(seconds) {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}:${s < 10 ? '0' : ''}${s}`;
    },

    handleResendOtp() {
      if (this.countdown > 0) return;
      this.$emit('resend-otp');
      this.startCountdown(300); 
    },

    handleNext() {
      if (this.type === 'email') {
        if (this.step === 1) {
          if (!this.formData.newEmail) return alert("Please enter an email address");
          this.$emit('submit-email-request', this.formData.newEmail);
        } else {
          if (!this.formData.otp) return alert("Please enter the OTP");
          this.$emit('submit-email-verify', { otp: this.formData.otp, newEmail: this.formData.newEmail });
        }
      } else if (this.type === 'password') {
        if (!this.formData.otp || !this.formData.newPassword) return alert("Please fill in all fields");
        if (this.passwordMismatch) return alert("Passwords do not match!");

        this.$emit('submit-password-verify', { otp: this.formData.otp, newPassword: this.formData.newPassword });
      }
    },
    
    nextStep() {
      this.step = 2;
      this.isLoading = false;
      if (this.type === 'email') this.startCountdown(300);
    },
    setLoading(val) { this.isLoading = val; }
  },
  beforeUnmount() {
    this.stopCountdown();
  }
};
</script>

<style scoped>
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.45); z-index: 2000; display: flex; justify-content: center; align-items: center; backdrop-filter: blur(4px); animation: fadeIn 0.2s ease; }
.modal-card { background: var(--bg-card); width: 90%; max-width: 420px; border-radius: 20px; padding: 0; box-shadow: 0 20px 50px rgba(0,0,0,0.3); animation: zoomIn 0.2s ease; overflow: hidden; }
.modal-header { padding: 20px 24px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; }
.modal-header h3 { margin: 0; font-size: 18px; font-weight: 700; color: var(--text-main); }
.close-btn { background: none; border: none; font-size: 24px; color: #65676b; cursor: pointer; }
.modal-body { padding: 24px; }
.instruction { font-size: 14px; color: var(--text-sub); margin-bottom: 20px; line-height: 1.5; }
.sub-text { font-size: 12px; color: var(--text-sub); font-style: italic; }
.input-group label { display: block; font-size: 13px; font-weight: 600; color: var(--text-main); margin-bottom: 8px; }
.modern-input { width: 100%; padding: 12px 16px; border-radius: 12px; border: 1px solid var(--border-color); background: var(--bg-input); color:var(--text-main); font-size: 15px; transition: all 0.2s; box-sizing: border-box; }
.modern-input:focus { border-color: #FF642F; background: var(--bg-card); color:var(--text-main); outline: none; box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1); }
.otp-input { letter-spacing: 4px; text-align: center; font-weight: 700; font-size: 18px; }
.otp-sent-icon { font-size: 40px; text-align: center; margin-bottom: 16px; display: block; }
.mt-4 { margin-top: 16px; }
.modal-footer { padding: 16px 24px; background: var(--bg-card); border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end; gap: 12px; }
.btn-secondary { padding: 10px 20px; border-radius: 10px; background: white; border: 1px solid #d1d5db; color: #374151; font-weight: 600; cursor: pointer; }
.btn-primary { padding: 10px 24px; border-radius: 10px; background: #FF642F; border: none; color: white; font-weight: 600; cursor: pointer; transition: background 0.2s; }
.btn-primary:disabled { background: #FF642F; cursor: not-allowed; }
.btn-primary:hover:not(:disabled) { background: #FF642F; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes zoomIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }

.label-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.resend-link { background: none; border: none; color: #FF642F; font-size: 12px; font-weight: 600; cursor: pointer; padding: 0; }
.resend-link:hover { text-decoration: underline; }
.resend-link.disabled { color: #9ca3af; cursor: not-allowed; text-decoration: none; }
.password-wrapper { position: relative; }
.error-text { color: #ef4444; font-size: 12px; margin-top: 6px; font-weight: 500; }

/* Eye Icon Style (SVG) */
.eye-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: #9ca3af;
  display: flex;
  align-items: center;
  transition: color 0.2s;
}
.eye-icon svg { width: 20px; height: 20px; }
.eye-icon:hover { color: #FF642F; }
</style>