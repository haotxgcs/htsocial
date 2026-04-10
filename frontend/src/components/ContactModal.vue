<template>
  <transition name="fade">
    <div v-if="isVisible" class="overlay" @click.self="$emit('close')">
      <div class="modal">

        <div class="modal-header">
          <div class="header-left">
            <span class="header-icon">✉️</span>
            <div>
              <h3 class="modal-title">Contact Admin</h3>
              <p class="modal-sub">We'll get back to you as soon as possible</p>
            </div>
          </div>
          <button class="close-btn" @click="$emit('close')">✕</button>
        </div>

        <!-- Step 1: Form -->
        <div v-if="step === 1" class="modal-body">
          <div class="field">
            <label class="field-label">Your Name <span class="required">*</span></label>
            <input v-model="form.name" class="field-input" placeholder="Enter your name" maxlength="100"/>
          </div>
          <div class="field">
            <label class="field-label">Email Address <span class="required">*</span></label>
            <input v-model="form.email" class="field-input" type="email" placeholder="Enter your email" maxlength="200"/>
          </div>
          <div class="field">
            <label class="field-label">Subject</label>
            <input v-model="form.subject" class="field-input" placeholder="e.g. Account suspended" maxlength="200"/>
          </div>
          <div class="field">
            <label class="field-label">Message <span class="required">*</span></label>
            <textarea v-model="form.message" class="field-textarea" placeholder="Describe your issue in detail..." rows="4" maxlength="1000"></textarea>
            <span class="char-count">{{ form.message.length }}/1000</span>
          </div>
          <p v-if="error" class="error-msg">{{ error }}</p>
        </div>

        <!-- Step 2: Success -->
        <div v-else class="success-state">
          <div class="success-icon">✅</div>
          <h4>Message Sent!</h4>
          <p>We've received your message and will review it shortly. Check your email for our response.</p>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="$emit('close')">
            {{ step === 2 ? 'Close' : 'Cancel' }}
          </button>
          <button v-if="step === 1" class="btn-submit" :disabled="submitting" @click="submit">
            <span v-if="submitting" class="spin"></span>
            {{ submitting ? 'Sending...' : 'Send Message' }}
          </button>
        </div>

      </div>
    </div>
  </transition>
</template>

<script>
const API = process.env.VUE_APP_API_URL || "http://localhost:3000";

export default {
  name: "ContactModal",
  props: {
    isVisible:    { type: Boolean, default: false },
    prefillName:  { type: String,  default: "" },
    prefillEmail: { type: String,  default: "" },
  },
  emits: ["close"],
  data() {
    return {
      step: 1,
      submitting: false,
      error: "",
      form: { name: "", email: "", subject: "Account suspended - Appeal", message: "" }
    };
  },
  watch: {
    isVisible(val) {
      if (val) {
        this.step = 1; this.error = "";
        this.form = {
          name:    this.prefillName  || "",
          email:   this.prefillEmail || "",
          subject: "Account suspended - Appeal",
          message: ""
        };
      }
    }
  },
  methods: {
    async submit() {
      this.error = "";
      if (!this.form.name.trim())    return this.error = "Name is required.";
      if (!this.form.email.trim())   return this.error = "Email is required.";
      if (!this.form.message.trim()) return this.error = "Message is required.";

      this.submitting = true;
      try {
        const res = await fetch(`${API}/contact`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(this.form)
        });
        if (res.ok) {
          this.step = 2;
        } else {
          const d = await res.json();
          this.error = d.msg || "Failed to send. Please try again.";
        }
      } catch (e) {
        this.error = "Network error. Please try again.";
      } finally {
        this.submitting = false;
      }
    }
  }
};
</script>

<style scoped>
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 9000; display: flex; align-items: center; justify-content: center; padding: 16px; backdrop-filter: blur(6px); }
.modal { background: var(--bg-card, #fff); border: 1px solid var(--border-color, #e5e7eb); border-radius: 20px; width: 100%; max-width: 480px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 24px 64px rgba(0,0,0,0.2); animation: popIn 0.28s cubic-bezier(0.175,0.885,0.32,1.275); }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 16px; border-bottom: 1px solid var(--border-color, #e5e7eb); }
.header-left { display: flex; align-items: center; gap: 12px; }
.header-icon { font-size: 28px; }
.modal-title { font-size: 17px; font-weight: 800; color: var(--text-main, #111); margin: 0 0 2px; }
.modal-sub   { font-size: 12px; color: var(--text-sub, #6b7280); margin: 0; }
.close-btn { background: none; border: none; cursor: pointer; color: var(--text-sub, #6b7280); font-size: 18px; padding: 4px 8px; border-radius: 8px; transition: 0.15s; }
.close-btn:hover { background: var(--hover-bg, #f3f4f6); }
.modal-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 14px; }
.field { display: flex; flex-direction: column; gap: 5px; }
.field-label { font-size: 12px; font-weight: 700; color: var(--text-sub, #6b7280); text-transform: uppercase; letter-spacing: 0.4px; }
.required { color: #ef4444; }
.field-input, .field-textarea { padding: 10px 14px; border-radius: 10px; border: 1.5px solid var(--border-color, #e5e7eb); background: var(--bg-input, #f9fafb); color: var(--text-main, #111); font-size: 13px; font-family: inherit; outline: none; transition: border-color 0.15s; }
.field-input:focus, .field-textarea:focus { border-color: #f59e0b; }
.field-textarea { resize: vertical; }
.char-count { font-size: 11px; color: var(--text-sub, #9ca3af); align-self: flex-end; }
.error-msg { font-size: 13px; color: #ef4444; margin: 0; padding: 8px 12px; background: #fef2f2; border-radius: 8px; border: 1px solid #fecaca; }
.success-state { text-align: center; padding: 40px 24px; }
.success-icon { font-size: 52px; margin-bottom: 16px; }
.success-state h4 { font-size: 18px; font-weight: 800; color: var(--text-main, #111); margin: 0 0 8px; }
.success-state p  { font-size: 14px; color: var(--text-sub, #6b7280); margin: 0; line-height: 1.6; }
.modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 24px; border-top: 1px solid var(--border-color, #e5e7eb); }
.btn-cancel { padding: 10px 20px; border-radius: 10px; border: 1.5px solid var(--border-color, #e5e7eb); background: none; color: var(--text-sub, #6b7280); font-size: 13px; font-weight: 600; cursor: pointer; }
.btn-submit { padding: 10px 24px; border-radius: 10px; border: none; background: #f59e0b; color: #fff; font-size: 13px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.15s; }
.btn-submit:hover:not(:disabled) { background: #d97706; }
.btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
.spin { width: 14px; height: 14px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; animation: spin 0.7s linear infinite; }
@keyframes spin   { to { transform: rotate(360deg); } }
@keyframes popIn  { 0% { transform: scale(0.88); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from,  .fade-leave-to      { opacity: 0; }
</style>