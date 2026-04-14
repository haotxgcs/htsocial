<template>
  <transition name="fade">
    <div v-if="isVisible" class="overlay" @click.self="close">
      <div class="modal-card">

        <div class="modal-header">
          <h3>{{ stepTitle }}</h3>
          <button class="close-btn" @click="close">&times;</button>
        </div>

        <div class="modal-body">

          <!-- Step 1: Nhập email -->
          <div v-if="step === 1">
            <p class="instruction">Enter the email address linked to your account. We'll send you a verification code.</p>
            <div class="input-group">
              <label>Email Address</label>
              <input v-model="email" type="email" class="modern-input" placeholder="example@mail.com" @keyup.enter="sendOtp"/>
            </div>
          </div>

          <!-- Step 2: Nhập OTP + mật khẩu mới -->
          <div v-if="step === 2">
            <div class="otp-sent-icon">📩</div>
            <p class="instruction">
              A verification code has been sent to <b>{{ email }}</b>.
              <br><span class="sub-text">Please check your inbox (including Spam).</span>
            </p>

            <!-- Hiển thị thông tin user tìm được -->
            <div v-if="userInfo" class="user-found-card">
              <img 
                :src="userInfo.avatar ? resolveAvatar(userInfo.avatar) : require('../assets/user.png')" 
                class="user-found-av"
                @error="onAvErr"
              />
              <div class="user-found-info">
                <div class="user-found-name">{{ userInfo.firstname }} {{ userInfo.lastname }}</div>
                <div class="user-found-email">{{ email }}</div>
              </div>
            </div>

            <div class="input-group">
              <div class="label-row">
                <label>OTP Code</label>
                <button class="resend-link" :class="{ disabled: countdown > 0 }" @click="resendOtp" :disabled="countdown > 0">
                  {{ countdown > 0 ? `Resend in (${formatTime(countdown)})` : 'Resend Code' }}
                </button>
              </div>
              <input v-model="otp" type="text" class="modern-input otp-input" placeholder="------" maxlength="6"/>
            </div>

            <div class="input-group mt-4">
              <label>New Password</label>
              <div class="password-wrapper">
                <input v-model="newPassword" :type="showPw ? 'text' : 'password'" class="modern-input" placeholder="Enter new password..."/>
                <span class="eye-icon" @click="showPw = !showPw">👁</span>
              </div>
            </div>

            <div class="input-group mt-4">
              <label>Confirm Password</label>
              <div class="password-wrapper">
                <input v-model="confirmPw" :type="showConfirm ? 'text' : 'password'" class="modern-input" placeholder="Re-enter new password..."/>
                <span class="eye-icon" @click="showConfirm = !showConfirm">👁</span>
              </div>
              <p v-if="mismatch" class="error-text">Passwords do not match!</p>
            </div>
          </div>

          <!-- Step 3: Thành công -->
          <div v-if="step === 3" class="success-state">
            <div class="success-icon">✅</div>
            <h4>Password Reset!</h4>
            <p>Your password has been updated successfully. You can now log in.</p>
          </div>

          <p v-if="error" class="error-msg">{{ error }}</p>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" @click="close">{{ step === 3 ? 'Close' : 'Cancel' }}</button>
          <button v-if="step === 1" class="btn-primary" :disabled="loading" @click="sendOtp">
            {{ loading ? 'Sending...' : 'Send Code' }}
          </button>
          <button v-if="step === 2" class="btn-primary" :disabled="loading || mismatch" @click="resetPassword">
            {{ loading ? 'Processing...' : 'Reset Password' }}
          </button>
        </div>

      </div>
    </div>
  </transition>
</template>

<script>
const API = process.env.VUE_APP_API_URL || "http://localhost:3000";

export default {
  name: "ForgotPasswordModal",
  props: { isVisible: { type: Boolean, default: false } },
  emits: ["close"],
  data() {
    return {
      step: 1,
      email: "", otp: "", newPassword: "", confirmPw: "",
      showPw: false, showConfirm: false,
      loading: false, error: "",
      countdown: 0, timerInterval: null,

      userInfo: null,
    };
  },
  computed: {
    stepTitle() {
      return ["", "Forgot Password", "Verify & Reset", "Done!"][this.step];
    },
    mismatch() {
      return this.confirmPw && this.newPassword !== this.confirmPw;
    }
  },
  watch: {
    isVisible(val) {
      if (val) { this.step = 1; this.email = ""; this.otp = ""; this.newPassword = ""; this.confirmPw = ""; this.error = ""; this.stopCountdown(); }
    }
  },
  methods: {
    close() { this.stopCountdown(); this.$emit("close"); },

    async sendOtp() {
      if (!this.email.trim()) return this.error = "Please enter your email.";
      this.error = ""; this.loading = true;
      try {
        const res = await fetch(`${API}/users/reset-password/request`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: this.email })
        });
        const data = await res.json();
        if (!res.ok) return this.error = data.msg || "Email not found.";
        this.userInfo = data.user || null; // Store user info if returned
        this.step = 2;
        this.startCountdown(300);
      } catch { this.error = "Network error. Please try again."; }
      finally { this.loading = false; }
    },

    async resendOtp() {
      if (this.countdown > 0) return;
      await this.sendOtp();
    },

    async resetPassword() {
      if (!this.otp) return this.error = "Please enter the OTP.";
      if (!this.newPassword) return this.error = "Please enter a new password.";
      if (this.mismatch) return;
      this.error = ""; this.loading = true;
      try {
        const res = await fetch(`${API}/users/reset-password/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: this.email, otp: this.otp, newPassword: this.newPassword })
        });
        const data = await res.json();
        if (!res.ok) return this.error = data.msg || "Invalid or expired OTP.";
        this.step = 3;
        this.stopCountdown();
      } catch { this.error = "Network error. Please try again."; }
      finally { this.loading = false; }
    },

    startCountdown(s) {
      this.stopCountdown();
      this.countdown = s;
      this.timerInterval = setInterval(() => { if (this.countdown > 0) this.countdown--; else this.stopCountdown(); }, 1000);
    },
    stopCountdown() { clearInterval(this.timerInterval); },
    formatTime(s) { return `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`; },

    resolveAvatar(avatar) {
      if (!avatar) return require('../assets/user.png');
      return avatar.startsWith('http') ? avatar : `${API}/${avatar}`;
    },
    onAvErr(e) { e.target.src = require('../assets/user.png'); }
  },
  beforeUnmount() { this.stopCountdown(); }
};
</script>

<style scoped>
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 9000; display: flex; justify-content: center; align-items: center; backdrop-filter: blur(4px); animation: fadeIn 0.2s ease; }
.modal-card { background: var(--bg-card, #fff); width: 90%; max-width: 420px; border-radius: 20px; box-shadow: 0 20px 50px rgba(0,0,0,0.3); animation: zoomIn 0.2s ease; overflow: hidden; }
.modal-header { padding: 20px 24px; border-bottom: 1px solid var(--border-color, #e5e7eb); display: flex; justify-content: space-between; align-items: center; }
.modal-header h3 { margin: 0; font-size: 18px; font-weight: 700; color: var(--text-main, #111); }
.close-btn { background: none; border: none; font-size: 24px; color: #65676b; cursor: pointer; }
.modal-body { padding: 24px; }
.instruction { font-size: 14px; color: var(--text-sub, #6b7280); margin-bottom: 20px; line-height: 1.5; }
.sub-text { font-size: 12px; color: var(--text-sub); font-style: italic; }
.input-group { display: flex; flex-direction: column; gap: 6px; }
.input-group label { font-size: 13px; font-weight: 600; color: var(--text-main, #111); }
.modern-input { width: 100%; padding: 12px 16px; border-radius: 12px; border: 1px solid var(--border-color, #e5e7eb); background: var(--bg-input, #f9fafb); color: var(--text-main, #111); font-size: 15px; transition: all 0.2s; box-sizing: border-box; }
.modern-input:focus { border-color: #FF642F; outline: none; box-shadow: 0 0 0 4px rgba(255,100,47,0.1); }
.otp-input { letter-spacing: 4px; text-align: center; font-weight: 700; font-size: 18px; }
.otp-sent-icon { font-size: 40px; text-align: center; margin-bottom: 16px; display: block; }
.mt-4 { margin-top: 16px; }
.label-row { display: flex; justify-content: space-between; align-items: center; }
.resend-link { background: none; border: none; color: #FF642F; font-size: 12px; font-weight: 600; cursor: pointer; }
.resend-link.disabled { color: #9ca3af; cursor: not-allowed; }
.password-wrapper { position: relative; }
.eye-icon { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); cursor: pointer; font-size: 16px; }
.error-text { color: #ef4444; font-size: 12px; font-weight: 500; }
.error-msg { margin-top: 12px; font-size: 13px; color: #ef4444; padding: 8px 12px; background: #fef2f2; border-radius: 8px; border: 1px solid #fecaca; }
.success-state { text-align: center; padding: 16px 0; }
.success-icon { font-size: 52px; margin-bottom: 12px; }
.success-state h4 { font-size: 18px; font-weight: 800; margin: 0 0 8px; color: var(--text-main, #111); }
.success-state p { font-size: 14px; color: var(--text-sub, #6b7280); margin: 0; }
.modal-footer { padding: 16px 24px; border-top: 1px solid var(--border-color, #e5e7eb); display: flex; justify-content: flex-end; gap: 12px; }
.btn-secondary { padding: 10px 20px; border-radius: 10px; background: none; border: 1px solid var(--border-color, #d1d5db); color: var(--text-sub, #374151); font-weight: 600; cursor: pointer; }
.btn-primary { padding: 10px 24px; border-radius: 10px; background: #FF642F; border: none; color: #fff; font-weight: 600; cursor: pointer; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.user-found-card {
  display: flex; align-items: center; gap: 12px;
  background: #fff3ee; border: 1px solid #ffd0c0;
  border-radius: 12px; padding: 12px 16px; margin-bottom: 16px;
}
.user-found-av { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; border: 2px solid #FF642F; flex-shrink: 0; }
.user-found-name { font-size: 14px; font-weight: 700; color: #1a1a1a; }
.user-found-email { font-size: 12px; color: #6b7280; margin-top: 2px; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes zoomIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
</style>