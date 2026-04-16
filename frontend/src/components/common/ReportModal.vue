<template>
  <transition name="fade">
    <div v-if="isVisible" class="report-overlay" @click.self="$emit('close')">
      <div class="report-card">

        <!-- HEADER -->
        <div class="report-header">
          <div class="report-header-left">
            <div class="report-icon">🚩</div>
            <div>
              <h3 class="report-title">Report {{ targetLabel }}</h3>
              <p class="report-sub">Help us keep the community safe</p>
            </div>
          </div>
          <button class="close-btn" @click="$emit('close')">✕</button>
        </div>

        <!-- STEP 1: Chọn lý do -->
        <div v-if="step === 1">
          <p class="step-label">Why are you reporting this?</p>
          <div class="reason-list">
            <button
              v-for="r in reasons"
              :key="r.key"
              class="reason-btn"
              :class="{ selected: selectedReason === r.key }"
              @click="selectedReason = r.key"
            >
              <span class="reason-icon">{{ r.icon }}</span>
              <div class="reason-text">
                <span class="reason-title">{{ r.label }}</span>
                <span class="reason-desc">{{ r.desc }}</span>
              </div>
              <span v-if="selectedReason === r.key" class="check">✓</span>
            </button>
          </div>
        </div>

        <!-- STEP 2: Mô tả thêm -->
        <div v-if="step === 2">
          <p class="step-label">Add more details <span class="optional">(optional)</span></p>
          <div class="selected-reason-recap">
            <span class="recap-icon">{{ selectedReasonObj && selectedReasonObj.icon }}</span>
            <span>{{ selectedReasonObj && selectedReasonObj.label }}</span>
          </div>
          <textarea
            v-model="description"
            class="desc-input"
            placeholder="Describe the issue in more detail... (max 500 characters)"
            maxlength="500"
            rows="4"
            @keydown.shift.enter.exact.prevent="insertNewline"
          ></textarea>
          <div class="char-count">{{ description.length }}/500</div>
        </div>

        <!-- STEP 3: Xác nhận đã gửi -->
        <div v-if="step === 3" class="success-state">
          <div class="success-icon">✅</div>
          <h4>Report Submitted</h4>
          <p>Thank you for helping keep the community safe. Our team will review your report within 24-48 hours.</p>
        </div>

        <!-- FOOTER ACTIONS -->
        <div class="report-footer" v-if="step !== 3">
          <button class="btn-secondary" @click="step === 1 ? $emit('close') : step--">
            {{ step === 1 ? 'Cancel' : '← Back' }}
          </button>
          <button
            v-if="step === 1"
            class="btn-primary"
            :disabled="!selectedReason"
            @click="step = 2"
          >
            Next →
          </button>
          <button
            v-if="step === 2"
            class="btn-primary"
            :class="{ loading: submitting }"
            :disabled="submitting"
            @click="submitReport"
          >
            <span v-if="submitting" class="spin"></span>
            {{ submitting ? 'Submitting...' : 'Submit Report' }}
          </button>
        </div>
        <div class="report-footer" v-else>
          <button class="btn-primary" @click="$emit('close')">Done</button>
        </div>

      </div>
    </div>
  </transition>
</template>

<script>
const API = process.env.VUE_APP_API_URL || "http://localhost:3000";

export default {
  name: "ReportModal",

  props: {
    isVisible:  { type: Boolean, default: false },
    targetType: { type: String, default: "" },   // "user" | "post" | "share" | "item" | "other"
    targetId:   { type: String, default: null },  // ID của đối tượng bị report
  },

  emits: ["close", "submitted"],

  data() {
    return {
      step: 1,
      selectedReason: "",
      description: "",
      submitting: false,

      reasons: [
        { key: "spam",                   icon: "📢", label: "Spam",                      desc: "Repetitive or unwanted content" },
        { key: "harassment",             icon: "😡", label: "Harassment or bullying",    desc: "Targeted attacks or threats" },
        { key: "hate_speech",            icon: "🚫", label: "Hate speech",               desc: "Content promoting discrimination" },
        { key: "misinformation",         icon: "⚠️", label: "Misinformation",            desc: "False or misleading information" },
        { key: "inappropriate_content",  icon: "🔞", label: "Inappropriate content",     desc: "Graphic or explicit material" },
        { key: "fake_account",           icon: "🎭", label: "Fake account",              desc: "Impersonation or fake identity" },
        { key: "scam",                   icon: "💸", label: "Scam or fraud",             desc: "Deceptive or fraudulent activity" },
        { key: "copyright",              icon: "©️",  label: "Copyright violation",       desc: "Unauthorized use of content" },
        { key: "other",                  icon: "💬", label: "Other",                     desc: "Something not listed above" },
      ]
    };
  },

  computed: {
    targetLabel() {
      const labels = { user: "User", post: "Post", share: "Shared Post", item: "Item", other: "" };
      return labels[this.targetType] || "";
    },
    selectedReasonObj() {
      return this.reasons.find(r => r.key === this.selectedReason);
    }
  },

  watch: {
    isVisible(val) {
      if (val) { this.step = 1; this.selectedReason = ""; this.description = ""; }
    }
  },

  methods: {
    async submitReport() {
      if (!this.selectedReason) return;
      this.submitting = true;
      try {
        const token = localStorage.getItem("token");
        const body = {
          targetType:  this.targetType,
          targetId:    this.targetId || null,
          reason:      this.selectedReason,
          description: this.description.trim()
        };

        const res = await fetch(`${API}/reports`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(body)
        });

        if (res.ok) {
          this.step = 3;
          this.$emit("submitted");
        } else {
          const data = await res.json();
          if (res.status === 409) {
            // Đã report rồi
            alert(data.msg || "You have already reported this.");
            this.$emit("close");
          } else {
            alert(data.msg || "Failed to submit report.");
          }
        }
      } catch (e) {
        console.error(e);
        alert("Network error. Please try again.");
      } finally {
        this.submitting = false;
      }
    },

    insertNewline(){
      this.description += "\n";
    }
  }
};
</script>

<style scoped>
.report-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.55);
  z-index: 5000;
  display: flex; align-items: center; justify-content: center;
  backdrop-filter: blur(4px);
}

.report-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  width: 90%; max-width: 460px;
  padding: 0;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  overflow: hidden;
  animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

/* Header */
.report-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--border-color);
}
.report-header-left { display: flex; align-items: center; gap: 12px; }
.report-icon { font-size: 28px; }
.report-title { font-size: 17px; font-weight: 800; color: var(--text-main); margin: 0 0 2px; }
.report-sub   { font-size: 12px; color: var(--text-sub); margin: 0; }
.close-btn {
  background: none; border: none; cursor: pointer;
  color: var(--text-sub); font-size: 18px; padding: 4px 8px;
  border-radius: 8px; transition: 0.15s; line-height: 1;
}
.close-btn:hover { background: var(--hover-bg); color: var(--text-main); }

/* Step label */
.step-label {
  font-size: 13px; font-weight: 700; color: var(--text-sub);
  margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.5px;
  padding: 16px 24px 0;
}
.optional { font-weight: 400; text-transform: none; }

/* Reason list */
.reason-list {
  padding: 0 16px 8px;
  display: flex; flex-direction: column; gap: 4px;
  max-height: 340px; overflow-y: auto;
}
.reason-list::-webkit-scrollbar { width: 4px; }
.reason-list::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 4px; }

.reason-btn {
  display: flex; align-items: center; gap: 12px;
  padding: 11px 14px; border-radius: 12px;
  border: 1.5px solid transparent;
  background: none; cursor: pointer; text-align: left;
  transition: all 0.15s; width: 100%;
}
.reason-btn:hover { background: var(--hover-bg); }
.reason-btn.selected {
  background: #FF642F12;
  border-color: #FF642F55;
}
.reason-icon { font-size: 20px; flex-shrink: 0; width: 28px; text-align: center; }
.reason-text { flex: 1; min-width: 0; }
.reason-title { display: block; font-size: 14px; font-weight: 600; color: var(--text-main); }
.reason-desc  { display: block; font-size: 12px; color: var(--text-sub); margin-top: 1px; }
.check { color: #FF642F; font-weight: 700; font-size: 16px; flex-shrink: 0; }

/* Step 2: Description */
.selected-reason-recap {
  display: flex; align-items: center; gap: 8px;
  margin: 0 24px 12px;
  padding: 10px 14px; border-radius: 10px;
  background: #FF642F12; border: 1px solid #FF642F33;
  font-size: 13px; font-weight: 600; color: #FF642F;
}
.recap-icon { font-size: 18px; }

.desc-input {
  width: calc(100% - 48px);
  margin: 0 24px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1.5px solid var(--border-color);
  background: var(--bg-input);
  color: var(--text-main);
  font-size: 14px; font-family: inherit; resize: vertical;
  outline: none; transition: border-color 0.15s;
  box-sizing: border-box;
}
.desc-input:focus { border-color: #FF642F; }
.desc-input::placeholder { color: var(--text-sub); }
.char-count {
  text-align: right; font-size: 11px; color: var(--text-sub);
  margin: 4px 24px 8px; padding-right: 2px;
}

/* Step 3: Success */
.success-state {
  text-align: center; padding: 32px 24px 16px;
}
.success-icon { font-size: 48px; margin-bottom: 12px; }
.success-state h4 { font-size: 18px; font-weight: 800; color: var(--text-main); margin: 0 0 8px; }
.success-state p  { font-size: 14px; color: var(--text-sub); margin: 0; line-height: 1.6; }

/* Footer */
.report-footer {
  display: flex; justify-content: flex-end; gap: 10px;
  padding: 16px 24px;
  border-top: 1px solid var(--border-color);
}
.btn-secondary {
  padding: 10px 20px; border-radius: 10px;
  border: 1.5px solid var(--border-color);
  background: none; color: var(--text-sub);
  font-size: 14px; font-weight: 600; cursor: pointer; transition: 0.15s;
}
.btn-secondary:hover { border-color: var(--text-sub); color: var(--text-main); }

.btn-primary {
  padding: 10px 24px; border-radius: 10px; border: none;
  background: #FF642F; color: #fff;
  font-size: 14px; font-weight: 700; cursor: pointer; transition: 0.15s;
  display: flex; align-items: center; gap: 8px;
}
.btn-primary:hover:not(:disabled) { background: #e05522; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-primary.loading { opacity: 0.8; }

.spin {
  width: 14px; height: 14px; border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes popIn { 0% { transform: scale(0.85); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>